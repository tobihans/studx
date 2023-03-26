use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use std::net;
use std::time::{Duration, Instant};

use actix::prelude::*;
use actix_web_actors::ws;
use mediasoup::prelude::*;
use mediasoup::rtp_parameters::RtpCapabilities;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde_json::json;
use tracing::warn;
use uuid::Uuid;

use crate::webrtc::room::Room;
use crate::websocket::messages::internals::{
    Forwarded, GlobalMessage, GlobalScopeMessage, InternalMessage, LocalScopeMessage,
};
use crate::websocket::messages::{ClientMessage, ServerMessage, TransportOptions};

use super::Server;

/// Interval for pings to keep connection alive
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(10);

/// Timeout for closing connection
const CONNECTION_TIMEOUT: Duration = Duration::from_secs(15);

struct Transports {
    consumer: WebRtcTransport,
    producer: WebRtcTransport,
}

#[derive(Debug, Copy, Clone, Eq, PartialEq, Hash)]
pub struct SessionId(pub Uuid);

impl SessionId {
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }
}

impl Display for SessionId {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0.to_string())
    }
}

impl Serialize for SessionId {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.0.serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for SessionId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        Uuid::deserialize(deserializer).map(|uuid| SessionId(uuid))
    }
}

impl TryFrom<&str> for SessionId {
    type Error = uuid::Error;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match Uuid::try_parse(value) {
            Ok(uuid) => Ok(Self(uuid)),
            Err(err) => Err(err),
        }
    }
}

/// Struct that hold the client's details through his lifetime in a room
pub struct Session {
    /// Unique identifier assigned to the user on connection
    id: SessionId,

    /// Room the user belongs to
    room: Room,

    /// Name associated with the user
    name: String,

    /// Timestamp of the last heartbeat
    heartbeat: Instant,

    /// Websocket server address.
    srv: Addr<Server>,

    /// Client RTP capabilities
    rtp_capabilities: Option<RtpCapabilities>,

    consumers: HashMap<ConsumerId, Consumer>,

    producers: Vec<Producer>,

    // Client producer & consumer
    transports: Transports,
}

impl Session {
    /// Creates a new [`Session`].
    pub async fn new(
        srv: Addr<Server>,
        room: Room,
        name: String,
        transport_ips: (net::IpAddr, Option<net::IpAddr>),
    ) -> Result<Self, String> {
        let (producer, consumer) = {
            let (ip, announced_ip) = transport_ips;
            let transport_options =
                WebRtcTransportOptions::new(TransportListenIps::new(ListenIp { ip, announced_ip }));

            let producer = room
                .router()
                .create_webrtc_transport(transport_options.clone())
                .await
                .map_err(|err| format!("Failed to create producer transport: {}", err))?;

            let consumer = room
                .router()
                .create_webrtc_transport(transport_options.clone())
                .await
                .map_err(|err| format!("Failed to create producer transport: {}", err))?;

            (producer, consumer)
        };

        Ok(Self {
            srv,
            room,
            name,
            id: SessionId::new(),
            producers: vec![],
            consumers: HashMap::default(),
            heartbeat: Instant::now(),
            rtp_capabilities: None,
            transports: Transports { producer, consumer },
        })
    }

    fn heartbeat(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.heartbeat) > CONNECTION_TIMEOUT {
                ctx.stop();
            }

            ctx.ping(b"PING");
        });
    }
}

impl Drop for Session {
    fn drop(&mut self) {
        for producer in self.room.remove_session(self.id) {
            let Session { id, room, .. } = self;
            self.srv
                .do_send(InternalMessage::GlobalScope(GlobalScopeMessage {
                    session_id: *id,
                    room_id: room.id(),
                    message: GlobalMessage::RemoveProducer(producer.id()),
                }))
        }
    }
}

impl Actor for Session {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        // start heartbeat mechanism
        self.heartbeat(ctx);

        // Notify all participants in the room
        self.srv
            .send(InternalMessage::GlobalScope(GlobalScopeMessage {
                session_id: self.id,
                room_id: self.room.id(),
                message: GlobalMessage::AddSession(ctx.address().recipient(), self.name.clone()),
            }))
            .into_actor(self)
            .then(|res, _act, ctx| {
                // If the server is not healthy
                if let Err(_error) = res {
                    ctx.stop();
                }

                fut::ready(())
            })
            .wait(ctx);

        let addr = ctx.address();

        // Send essential informations just after Websocket connection is established
        let server_init_msg = ServerMessage::Init {
            room_id: self.room.id(),
            consumer_transport_options: TransportOptions {
                id: self.transports.consumer.id(),
                dtls_parameters: self.transports.consumer.dtls_parameters(),
                ice_candidates: self.transports.consumer.ice_candidates().clone(),
                ice_parameters: self.transports.consumer.ice_parameters().clone(),
            },
            producer_transport_options: TransportOptions {
                id: self.transports.producer.id(),
                dtls_parameters: self.transports.producer.dtls_parameters(),
                ice_candidates: self.transports.producer.ice_candidates().clone(),
                ice_parameters: self.transports.producer.ice_parameters().clone(),
            },
            router_rtp_capabilities: self.room.router().rtp_capabilities().clone(),
        };
        addr.do_send(server_init_msg);
    }

    fn stopping(&mut self, ctx: &mut Self::Context) -> Running {
        // Notify all participants in the room
        self.srv
            .send(InternalMessage::GlobalScope(GlobalScopeMessage {
                session_id: self.id,
                room_id: self.room.id(),
                message: GlobalMessage::RemoveSession,
            }))
            .into_actor(self)
            .then(|res, _act, _ctx| {
                if let Err(err) = res {
                    eprint!("An error occurred while closing connection: {err}");
                }
                fut::ready(())
            })
            .wait(ctx);

        Running::Stop
    }

    fn stopped(&mut self, _: &mut Self::Context) {
        println!("Websocket connection closed for session[{}]", self.id);
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for Session {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        let msg = match msg {
            Ok(msg) => msg,
            Err(_) => {
                ctx.text("FATAL ERROR");
                ctx.stop();
                return;
            }
        };

        match msg {
            ws::Message::Ping(msg) => {
                self.heartbeat = Instant::now();
                ctx.pong(&msg);
            }
            ws::Message::Pong(_) => {
                self.heartbeat = Instant::now();
            }
            ws::Message::Continuation(_) => {
                ctx.stop();
            }
            ws::Message::Close(reason) => {
                ctx.close(reason);
                ctx.stop();
            }
            ws::Message::Binary(bin) => {
                self.srv
                    .do_send(InternalMessage::GlobalScope(GlobalScopeMessage {
                        session_id: self.id,
                        room_id: self.room.id(),
                        message: GlobalMessage::ForwardMessage(Forwarded::Binary(bin.to_vec())),
                    }))
            }
            ws::Message::Text(text) => {
                let addr = ctx.address();

                match serde_json::from_str::<ClientMessage>(&text) {
                    Ok(client_msg) => addr.do_send(client_msg),
                    Err(err) => {
                        warn!(?err, "Failed to parse JSON from client");
                        addr.do_send(ServerMessage::Error {
                            error: "Unable to parse JSON".to_string(),
                        })
                    }
                }
            }
            ws::Message::Nop => (),
        }
    }
}

impl Handler<ServerMessage> for Session {
    type Result = ();

    fn handle(&mut self, msg: ServerMessage, ctx: &mut Self::Context) -> Self::Result {
        match serde_json::to_string(&msg) {
            Ok(json) => ctx.text(json),
            Err(_) => (),
        };
    }
}

impl Handler<ClientMessage> for Session {
    type Result = ();

    fn handle(&mut self, msg: ClientMessage, ctx: &mut Self::Context) -> Self::Result {
        match msg {
            ClientMessage::Init { rtp_capabilities } => {
                let addr = ctx.address();
                self.rtp_capabilities.replace(rtp_capabilities);

                // Notify about existing producers
                for (session_id, producer_id) in self.room.all_producers() {
                    if session_id != self.id {
                        addr.do_send(ServerMessage::ProducerAdded {
                            session_id,
                            producer_id,
                        })
                    }
                }
            }
            ClientMessage::ConnectProducerTransport { dtls_parameters } => {
                let addr = ctx.address();
                let transport = self.transports.producer.clone();

                actix::spawn(async move {
                    match transport
                        .connect(WebRtcTransportRemoteParameters { dtls_parameters })
                        .await
                    {
                        Ok(_) => addr.do_send(ServerMessage::ConnectedProducerTransport),
                        Err(err) => {
                            eprintln!("Error: {err}");
                            addr.do_send(InternalMessage::LocalScope(LocalScopeMessage::Stop));
                        }
                    }
                });
            }
            ClientMessage::Produce {
                kind,
                rtp_parameters,
            } => {
                let session_id = self.id;
                let addr = ctx.address();
                let transport = self.transports.producer.clone();
                let room = self.room.clone();
                let srv = self.srv.clone();

                actix::spawn(async move {
                    match transport
                        .produce(ProducerOptions::new(kind, rtp_parameters))
                        .await
                    {
                        Ok(producer) => {
                            let producer_id = producer.id();
                            addr.do_send(ServerMessage::Produced { id: producer_id });
                            room.add_producer(session_id, producer.clone());
                            // Notify remaining clients about the new producer
                            srv.do_send(InternalMessage::GlobalScope(GlobalScopeMessage {
                                session_id,
                                room_id: room.id(),
                                message: GlobalMessage::AddProducer(producer.clone()),
                            }));
                            addr.do_send(InternalMessage::LocalScope(
                                LocalScopeMessage::SaveProducer(producer),
                            ));
                        }
                        Err(err) => {
                            eprintln!("Error producing producer: {err}");
                            addr.do_send(InternalMessage::LocalScope(LocalScopeMessage::Stop))
                        }
                    }
                });
            }
            ClientMessage::ConnectConsumerTransport { dtls_parameters } => {
                let addr = ctx.address();
                let transport = self.transports.consumer.clone();

                actix::spawn(async move {
                    match transport
                        .connect(WebRtcTransportRemoteParameters { dtls_parameters })
                        .await
                    {
                        Ok(_) => addr.do_send(ServerMessage::ConnectedConsumerTransport),
                        Err(err) => {
                            eprintln!("Error: {err}");
                            addr.do_send(InternalMessage::LocalScope(LocalScopeMessage::Stop));
                        }
                    }
                });
            }
            ClientMessage::Consume {
                producer_id,
                session_id,
            } => {
                let addr = ctx.address();
                let transport = self.transports.consumer.clone();
                let rtp_capabilities = match self.rtp_capabilities.clone() {
                    Some(capabilities) => capabilities,
                    None => {
                        eprintln!("RTP Capabilities should be set before consuming");
                        return;
                    }
                };

                actix::spawn(async move {
                    let mut options = ConsumerOptions::new(producer_id, rtp_capabilities);
                    options.paused = true;

                    match transport.consume(options).await {
                        Ok(consumer) => {
                            let (id, kind) = (consumer.id(), consumer.kind());
                            let rtp_parameters = consumer.rtp_parameters().clone();
                            addr.do_send(ServerMessage::Consumed {
                                id,
                                kind,
                                producer_id,
                                session_id,
                                rtp_parameters,
                            });

                            addr.do_send(InternalMessage::LocalScope(
                                LocalScopeMessage::SaveConsumer(consumer),
                            ));
                        }
                        Err(_) => {
                            addr.do_send(InternalMessage::LocalScope(LocalScopeMessage::Stop));
                        }
                    }
                });
            }
            ClientMessage::ConsumerResume { id } => {
                if let Some(consumer) = self.consumers.get(&id).cloned() {
                    actix::spawn(async move {
                        let _ = consumer.resume().await;
                    });
                }
            }
            ClientMessage::RemoveProducer { id: producer_id } => {
                let Session { id, room, .. } = self;
                let producer = self
                    .producers
                    .iter()
                    .find(|producer| producer.id() == producer_id);

                if producer.is_none() {
                    return;
                }

                self.producers
                    .retain(|producer| producer.id() != producer_id);

                self.srv
                    .do_send(InternalMessage::GlobalScope(GlobalScopeMessage {
                        session_id: *id,
                        room_id: room.id(),
                        message: GlobalMessage::RemoveProducer(producer_id),
                    }))
            }
            ClientMessage::Text { text } => {
                self.srv
                    .do_send(InternalMessage::GlobalScope(GlobalScopeMessage {
                        session_id: self.id,
                        room_id: self.room.id(),
                        message: GlobalMessage::ForwardMessage(Forwarded::Text(text)),
                    }))
            }
        }
    }
}

impl Handler<InternalMessage> for Session {
    type Result = ();

    fn handle(&mut self, msg: InternalMessage, ctx: &mut Self::Context) -> Self::Result {
        let address = ctx.address();

        match msg {
            InternalMessage::GlobalScope(global_message) => address.do_send(global_message),
            InternalMessage::LocalScope(local_message) => address.do_send(local_message),
        }
    }
}

impl Handler<GlobalScopeMessage> for Session {
    type Result = ();

    fn handle(&mut self, msg: GlobalScopeMessage, ctx: &mut Self::Context) -> Self::Result {
        let GlobalScopeMessage {
            session_id,
            message,
            ..
        } = msg;
        let address = ctx.address();

        match message {
            GlobalMessage::AddSession(_, name) => {
                if self.id != session_id {
                    address.do_send(ServerMessage::NewComer {
                        session_id,
                        name,
                        just_joined: true,
                    })
                }
            }
            GlobalMessage::AddProducer(producer) => {
                if self.id != session_id {
                    address.do_send(ServerMessage::ProducerAdded {
                        session_id,
                        producer_id: producer.id(),
                    })
                }
            }
            GlobalMessage::RemoveProducer(producer_id) => {
                if self.id != session_id {
                    address.do_send(ServerMessage::ProducerRemoved {
                        session_id,
                        producer_id,
                    })
                }
            }
            GlobalMessage::ForwardMessage(forwarded_msg) => match forwarded_msg {
                Forwarded::Text(text) => ctx.text(
                    json!(ServerMessage::Text {
                        text,
                        sender_id: session_id
                    })
                    .to_string(),
                ),
                Forwarded::Binary(bin) => ctx.binary(bin),
            },
            _ => (),
        }
    }
}

impl Handler<LocalScopeMessage> for Session {
    type Result = ();

    fn handle(&mut self, msg: LocalScopeMessage, ctx: &mut Self::Context) -> Self::Result {
        match msg {
            LocalScopeMessage::SaveProducer(producer) => self.producers.push(producer),
            LocalScopeMessage::SaveConsumer(consumer) => {
                self.consumers.insert(consumer.id(), consumer);
            }
            LocalScopeMessage::PresentMembers(members) => {
                for (session_id, name) in members {
                    if let Ok(id) = Uuid::parse_str(session_id.as_str()) {
                        let s_id = SessionId(id);
                        if s_id != self.id {
                            ctx.address().do_send(ServerMessage::NewComer {
                                name,
                                session_id: s_id,
                                just_joined: false,
                            })
                        }
                    }
                }
            }
            LocalScopeMessage::Stop => ctx.stop(),
        }
    }
}
