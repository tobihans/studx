import type {
  MediaKind,
  RtpCapabilities,
  RtpParameters,
} from "mediasoup-client/lib/RtpParameters";
import type {
  DtlsParameters,
  TransportOptions,
} from "mediasoup-client/lib/Transport";
import type { ConsumerId, ProducerId, RoomId, SessionId } from "@/webrtc/index";

export interface ServerInit {
  type: "Init";
  roomId: RoomId;
  consumerTransportOptions: TransportOptions;
  producerTransportOptions: TransportOptions;
  routerRtpCapabilities: RtpCapabilities;
}

export interface ServerProducerAdded {
  type: "ProducerAdded";
  sessionId: SessionId;
  producerId: ProducerId;
}

export interface ServerProducerRemoved {
  type: "ProducerRemoved";
  sessionId: SessionId;
  producerId: ProducerId;
}

export interface ServerConnectedProducerTransport {
  type: "ConnectedProducerTransport";
}

export interface ServerProduced {
  type: "Produced";
  id: ProducerId;
}

export interface ServerConnectedConsumerTransport {
  type: "ConnectedConsumerTransport";
}

export interface ServerConsumed {
  type: "Consumed";
  id: ConsumerId;
  kind: MediaKind;
  producerId: ProducerId;
  sessionId: SessionId;
  rtpParameters: RtpParameters;
}

export interface ServerText {
  type: "Text";
  text: string;
  senderId: string;
}

export interface ServerNewComer {
  type: "NewComer";
  sessionId: string;
  name: string;
  justJoined: boolean;
}

export interface ClientInit {
  type: "Init";
  rtpCapabilities: RtpCapabilities;
}

export interface ClientConnectProducerTransport {
  type: "ConnectProducerTransport";
  dtlsParameters: DtlsParameters;
}

export interface ClientConnectConsumerTransport {
  type: "ConnectConsumerTransport";
  dtlsParameters: DtlsParameters;
}

export interface ClientProduce {
  type: "Produce";
  kind: MediaKind;
  rtpParameters: RtpParameters;
}

export interface ClientConsume {
  type: "Consume";
  producerId: ProducerId;
  sessionId: SessionId;
}

export interface ClientConsumerResume {
  type: "ConsumerResume";
  id: ConsumerId;
}

export interface ClientRemoveProducer {
  type: "RemoveProducer";
  id: ProducerId;
}

export interface ClientText {
  type: "Text";
  text: string;
}

export type ServerMessage =
  | ServerInit
  | ServerProducerAdded
  | ServerProducerRemoved
  | ServerConnectedProducerTransport
  | ServerProduced
  | ServerConnectedConsumerTransport
  | ServerConsumed
  | ServerText
  | ServerNewComer;

export type ClientMessage =
  | ClientInit
  | ClientConnectProducerTransport
  | ClientProduce
  | ClientConnectConsumerTransport
  | ClientConsume
  | ClientConsumerResume
  | ClientRemoveProducer
  | ClientText;
