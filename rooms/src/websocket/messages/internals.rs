use crate::webrtc::room::RoomId;
use crate::websocket::SessionId;
use actix::{Message, Recipient};
use mediasoup::consumer::Consumer;
use mediasoup::prelude::{Producer, ProducerId};

#[derive(Debug, Message, Clone)]
#[rtype(result = "()")]
pub enum Forwarded {
    Text(String),
    Binary(Vec<u8>),
}

#[derive(Debug, Message, Clone)]
#[rtype(result = "()")]
pub enum GlobalMessage {
    AddSession(Recipient<InternalMessage>, String),
    ForwardMessage(Forwarded),
    AddProducer(Producer),
    RemoveProducer(ProducerId),
    RemoveSession,
}

#[derive(Debug, Message, Clone)]
#[rtype(result = "()")]
pub struct GlobalScopeMessage {
    pub session_id: SessionId,
    pub room_id: RoomId,
    pub message: GlobalMessage,
}

#[derive(Debug, Message, Clone)]
#[rtype(result = "()")]
pub enum LocalScopeMessage {
    SaveProducer(Producer),
    SaveConsumer(Consumer),
    PresentMembers(Vec<(String, String)>),
    Stop,
}

#[derive(Debug, Message, Clone)]
#[rtype(result = "()")]
pub enum InternalMessage {
    GlobalScope(GlobalScopeMessage),
    LocalScope(LocalScopeMessage),
}
