import type { ConsumerId, ProducerId, RoomId, SessionId } from "@/webrtc";
import type {
  DtlsParameters,
  Transport,
  TransportOptions,
} from "mediasoup-client/lib/Transport";
import type {
  ClientMessage,
  ServerConsumed,
  ServerInit,
  ServerMessage,
  ServerNewComer,
  ServerProducerAdded,
  ServerProducerRemoved,
  ServerText,
} from "@/webrtc/messages";
import type {
  MediaKind,
  RtpParameters,
} from "mediasoup-client/lib/RtpParameters";
import EventBus from "@/webrtc/event-bus";
import { Device } from "mediasoup-client";
import { useRoomStore } from "@/stores/room";
import type { Producer } from "mediasoup-client/lib/Producer";
import { notifyError } from "@/utils";

export class Session {
  /**
   * The corresponding media stream
   * @private
   */
  readonly #mediaStream = new MediaStream();

  constructor(public readonly id: SessionId) {}

  get mediaStream() {
    return this.#mediaStream;
  }

  public addTrack(track: MediaStreamTrack) {
    this.#mediaStream.addTrack(track);
  }

  public removeTrack(track: MediaStreamTrack) {
    this.#mediaStream.removeTrack(track);
  }

  public hasTracks() {
    return this.#mediaStream.getTracks().length > 0;
  }
}

export class Room extends EventBus {
  /**
   * Keeps a record of the participants sessions in the room
   * @private
   */
  #participants = new Map<SessionId, Session>();

  /**
   * Maps a producer id to each track available
   * @private
   */
  #tracks = new Map<ProducerId, MediaStreamTrack>();

  /**
   * The websocket connection
   * @private
   */
  #webSocket?: WebSocket;

  /**
   * The MediaSoup device
   * @private
   */
  #device?: Device;

  /**
   * The transports for the current user
   * @property
   */
  #transports?: { producer?: Transport; consumer?: Transport };

  /**
   * Used to ensure initialization is done before processing other events
   * @private
   */
  #handshake = Promise.resolve();

  /**
   * Audio context for audio streams processing
   * @private
   */
  readonly #audioContext: AudioContext;

  #streams: {
    microphone: { stream?: MediaStream; producer?: Producer };
    screen: { stream?: MediaStream; producer?: Producer };
  };

  #store: ReturnType<typeof useRoomStore>;

  constructor(
    public readonly id: RoomId,
    public metadata?: { participantName: string }
  ) {
    super();

    this.#transports = {};
    this.#audioContext = new AudioContext();
    this.#streams = {
      microphone: { stream: undefined, producer: undefined },
      screen: { stream: undefined, producer: undefined },
    };
    this.#store = useRoomStore();
  }

  public get url() {
    const url = new URL(
      `${import.meta.env.STUDX_UI_ROOMS_WS_ENDPOINT}/${this.id}`
    );

    if (this.metadata?.participantName) {
      url.searchParams.set("name", this.metadata.participantName);
    }

    return url.toString();
  }

  public get audioContext() {
    return this.#audioContext;
  }

  public connect() {
    this.#webSocket = new WebSocket(this.url);
    this.#device = new Device();

    this.#webSocket!.onmessage = this.#onMessage.bind(this);

    // Register event handlers
    this.on<ServerProducerAdded>(
      "ProducerAdded",
      this.#producerAdded.bind(this)
    );
    this.on<ServerProducerRemoved>(
      "ProducerRemoved",
      this.#producerRemoved.bind(this)
    );
    this.on<ServerConsumed>("Consumed", this.#onConsumed.bind(this));
    this.on<ServerText>("Text", this.#onText.bind(this));
    this.on<ServerNewComer>("NewComer", this.#onNewComer.bind(this));
  }

  public disconnect() {
    if (this.#webSocket?.OPEN) this.#webSocket.close();
    if (this.#streams.microphone.producer) {
      this.#streams.microphone.producer.close();
      for (const track of this.#streams.microphone.stream?.getTracks() ?? [])
        track.stop();
    }
    if (this.#streams.screen.producer) {
      this.#streams.screen.producer.close();
      for (const track of this.#streams.screen.stream?.getTracks() ?? [])
        track.stop();
    }
  }

  public toggleMicrophone() {
    if (this.#streams.microphone.stream) {
      const track = this.#streams.microphone.stream.getAudioTracks().at(0);
      if (track && track.enabled === true) {
        track.enabled = false;
        this.#store.micOn = false;
      } else if (track && track.enabled === false) {
        track.enabled = true;
        this.#store.micOn = true;
      }
    }
  }

  public stopScreenSharing() {
    const producer = this.#streams.screen.producer;

    if (producer) {
      this.#send({ type: "RemoveProducer", id: producer.id as ProducerId });
      producer.close();
      this.#store.screenStream
        ?.getTracks()
        .map((track) => track.kind == "video" && track.stop());

      this.#store.screenOn = false;
      this.#store.screenStream = undefined;
    }
  }

  public async shareScreen() {
    // FIXME: Firefox can't share screen after it was shared once
    // Error: Answer tried to enable an m-section that was disabled in the offer Firefox60.js:301:8
    if (this.#streams.screen.producer) this.stopScreenSharing();

    try {
      this.#streams.screen.stream =
        await navigator.mediaDevices.getDisplayMedia();
    } catch {
      notifyError();
    }

    this.#streams.screen.producer = (await this.#transports?.producer?.produce({
      // @ts-ignore
      track: this.#streams.screen!.stream.getVideoTracks()[0],
      codec: this.#device?.rtpCapabilities?.codecs?.find(
        (codec) => codec.mimeType.toLowerCase() === "video/vp8"
      ),
      disableTrackOnPause: true,
    })) as Producer;

    this.#store.screenStream = this.#streams.screen?.stream;
    this.#store.screenOn = true;
  }

  public text(text: string) {
    this.#send({ type: "Text", text });
    this.#store.messages = [...this.#store.messages, { text }];
  }

  public addTrack(
    sessionId: SessionId,
    producerId: ProducerId,
    track: MediaStreamTrack
  ) {
    this.#tracks.set(producerId, track);

    const session = this.#getOrCreateSession(sessionId);

    session.addTrack(track);

    if (track.kind == "audio") {
      const output = this.#audioContext.createMediaStreamSource(
        session.mediaStream
      );

      output.connect(this.#audioContext.destination);

      // INFO: Chrome bug workaround: https://stackoverflow.com/a/54781147/15021293
      new Audio().srcObject = session.mediaStream;
    } else {
      // Activate screen sharing if track is a video track
      this.#store.screenStream = session.mediaStream;
      this.emit("screenShareStarted", { sessionId });
    }
  }

  public removeTrack(sessionId: SessionId, producerId: ProducerId) {
    const track = this.#tracks.get(producerId);

    if (track) {
      const participantSession = this.#getOrCreateSession(sessionId);

      if (
        track.kind == "video" &&
        this.#store.screenStream == participantSession.mediaStream
      ) {
        this.#store.screenStream = undefined;
        participantSession.removeTrack(track);
        this.emit("screenShareClosed", { sessionId });
      }
      participantSession.removeTrack(track);

      if (!participantSession.hasTracks()) {
        const participant = this.#store.participants
          .filter((participant) => participant.sessionId === sessionId)
          .at(0);

        this.#participants.delete(sessionId);
        this.#store.participants = this.#store.participants.filter(
          (participant) => participant.sessionId !== sessionId
        );

        this.emit("sessionClosed", { sessionId, ...participant });
      }
    }
  }

  #getOrCreateSession(id: SessionId) {
    let participant = this.#participants.get(id);

    if (!participant) {
      participant = new Session(id);
      this.#participants.set(id, participant);
    }

    return participant;
  }

  #onMessage(message: MessageEvent) {
    const whitelist = [
      "ConnectedConsumerTransport",
      "ConnectedProducerTransport",
      "Produced",
      "Text",
    ];
    const { type, ...payload } = JSON.parse(message.data) as ServerMessage;

    if (type == "Init") {
      this.#handshake = this.#init(
        new CustomEvent<ServerInit>(type, { detail: payload as never })
      );
    } else if (whitelist.includes(type)) {
      this.emit(type, payload);
    } else {
      this.#handshake = this.#handshake.then(
        function (this: Room) {
          this.emit(type, payload);
        }.bind(this)
      );
    }
  }

  #send(message: ClientMessage) {
    this.#webSocket?.send(JSON.stringify(message));
  }

  async #setupMicrophone() {
    const originalStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    const microphoneInput =
      this.#audioContext.createMediaStreamSource(originalStream);

    if (this.#audioContext.state == "suspended") {
      await this.#audioContext.resume();
      console.log(
        "Audio context resumed. State: %s.",
        this.#audioContext.state
      );
    }

    const microphoneOutput = this.#audioContext.createMediaStreamDestination();
    microphoneInput.connect(microphoneOutput);

    this.#streams.microphone!.stream = microphoneOutput.stream;
    return microphoneOutput;
  }

  async #setupProducer(producerTransportOptions: TransportOptions) {
    this.#transports!.producer = this.#device!.createSendTransport(
      producerTransportOptions
    );

    this.#transports!.producer.on(
      "connect",
      function (
        this: Room,
        { dtlsParameters }: { dtlsParameters: DtlsParameters },
        success: () => void
      ) {
        this.#send({ type: "ConnectProducerTransport", dtlsParameters });

        this.once("ConnectedProducerTransport", () => {
          success();
          this.#store.micOn = true;
        });
      }.bind(this)
    );

    this.#transports!.producer.on(
      "produce",
      function (
        this: Room,
        {
          kind,
          rtpParameters,
        }: { kind: MediaKind; rtpParameters: RtpParameters },
        success: (_: { id: string }) => void
      ) {
        this.#send({ type: "Produce", kind, rtpParameters });
        this.once(
          "Produced",
          ({ detail: { id } }: CustomEvent<{ id: string }>) => {
            success({ id });
          }
        );
      }.bind(this)
    );
  }

  async #setupConsumer(consumerTransportOptions: TransportOptions) {
    this.#transports!.consumer = this.#device!.createRecvTransport(
      consumerTransportOptions
    );

    this.#transports!.consumer.on(
      "connect",
      function (
        this: Room,
        { dtlsParameters }: { dtlsParameters: DtlsParameters },
        success: () => void
      ) {
        this.#send({ type: "ConnectConsumerTransport", dtlsParameters });
        this.once("ConnectedConsumerTransport", success);
      }.bind(this)
    );
  }

  // ============================================================
  // Event Handlers
  // ============================================================

  /**
   * Initialize the necessary stuff before for the WebRTC connection to be established
   * It has to be completed before any other event can be processed
   *
   * @async
   * @param {CustomEvent<Exclude<ServerInit, "type">>} event - The custom event with the necessary details
   * @returns {Promise<void>}
   */
  async #init({
    detail: {
      consumerTransportOptions,
      producerTransportOptions,
      routerRtpCapabilities,
    },
  }: CustomEvent<Exclude<ServerInit, "type">>): Promise<void> {
    await this.#device!.load({ routerRtpCapabilities });

    // Send client-side initialization message
    this.#send({
      type: "Init",
      rtpCapabilities: this.#device!.rtpCapabilities,
    });

    await this.#setupProducer(producerTransportOptions);

    const microphoneOutput = await this.#setupMicrophone();

    for (const track of microphoneOutput.stream.getAudioTracks()) {
      // @ts-ignore
      await this.#transports!.producer.produce({ track });
    }

    await this.#setupConsumer(consumerTransportOptions);
  }

  #producerAdded({
    detail: { producerId, sessionId },
  }: CustomEvent<Exclude<ServerProducerAdded, "type">>) {
    this.#send({ type: "Consume", producerId, sessionId });
  }

  #producerRemoved({
    detail: { producerId, sessionId: participantId },
  }: CustomEvent<Exclude<ServerProducerRemoved, "type">>) {
    this.removeTrack(participantId, producerId);
  }

  #onText({
    detail: { text, senderId },
  }: CustomEvent<Exclude<ServerText, "type">>) {
    this.#store.messages = [...this.#store.messages, { senderId, text }];
  }

  async #onConsumed({
    detail: { id, producerId, rtpParameters, sessionId, kind },
  }: CustomEvent<ServerConsumed>) {
    const consumer = await this.#transports?.consumer!.consume({
      id,
      producerId,
      rtpParameters,
      kind,
    });

    this.#send({
      type: "ConsumerResume",
      id: consumer?.id as ConsumerId,
    });

    this.addTrack(sessionId, producerId, consumer!.track);
  }

  // Misc
  #onNewComer({
    detail: { sessionId, name, justJoined },
  }: CustomEvent<ServerNewComer>) {
    this.#store.participants = [
      ...this.#store.participants,
      { sessionId, name },
    ];

    this.emit("newcomer", { name, justJoined });
  }
}
