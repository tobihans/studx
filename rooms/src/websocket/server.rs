use std::collections::HashMap;

use actix::prelude::*;
use redis::Commands;
use uuid::Uuid;

use crate::webrtc::room::RoomId;
use crate::websocket::messages::internals::{
    GlobalMessage, GlobalScopeMessage, InternalMessage, LocalScopeMessage,
};
use crate::websocket::session::SessionId;

pub struct Server {
    sessions: HashMap<SessionId, Recipient<InternalMessage>>,
    redis: redis::Client,
}

impl Server {
    pub fn new(redis: redis::Client) -> Self {
        Self {
            redis,
            sessions: HashMap::default(),
        }
    }

    pub fn room_members(&mut self, room_id: RoomId) -> Vec<SessionId> {
        let key = format!("room:{room_id}:members");
        let mut conn = match self.redis.get_connection() {
            Ok(conn) => conn,
            Err(err) => {
                println!("{:?}", err);
                return vec![];
            }
        };

        match conn.smembers::<String, Vec<String>>(key) {
            Ok(identifiers) => identifiers
                .iter()
                .filter_map(|id| Uuid::parse_str(id).ok())
                .map(SessionId)
                .collect(),
            Err(err) => {
                println!("{:?}", err);
                vec![]
            }
        }
    }

    pub fn room_members_name(&mut self, room_id: RoomId) -> Vec<(String, String)> {
        let mut conn = match self.redis.get_connection() {
            Ok(conn) => conn,
            Err(err) => {
                println!("{:?}", err);
                return vec![];
            }
        };
        let mut members = vec![];

        self.room_members(room_id).iter().for_each(|id| {
            if let Some(_get) = self.sessions.get(id) {
                if let Ok(name) = conn.get(format!("room:{}:members:{}:name", room_id, id)) {
                    members.push((id.to_string(), name))
                }
            }
        });

        members
    }

    pub fn add_session(
        &mut self,
        room_id: RoomId,
        session_id: SessionId,
        addr: Recipient<InternalMessage>,
        name: String,
    ) {
        let mut conn = match self.redis.get_connection() {
            Ok(conn) => conn,
            Err(err) => {
                println!("{:?}", err);
                return;
            }
        };

        let _ = self.sessions.insert(session_id, addr.clone());
        let present_members = self.room_members_name(room_id);

        match conn
            .sadd::<String, String, ()>(format!("room:{}:members", room_id), session_id.to_string())
        {
            Ok(_) => (),
            Err(err) => {
                println!("{:?}", err);
                return;
            }
        }

        match conn.set::<String, String, ()>(
            format!("room:{}:members:{}:name", room_id, session_id),
            name.clone(),
        ) {
            Ok(_) => (),
            Err(err) => {
                println!("{:?}", err);
                return;
            }
        }

        self.room_members(room_id).iter().for_each(|id| {
            if let Some(member_addr) = self.sessions.get(id) {
                member_addr.do_send(InternalMessage::GlobalScope(GlobalScopeMessage {
                    session_id,
                    room_id,
                    message: GlobalMessage::AddSession(addr.clone(), name.clone()),
                }));
            }
        });

        addr.do_send(InternalMessage::LocalScope(
            LocalScopeMessage::PresentMembers(present_members),
        ))
    }

    pub fn remove_session(&mut self, room_id: RoomId, session_id: SessionId) {
        let mut conn = match self.redis.get_connection() {
            Ok(conn) => conn,
            Err(err) => {
                println!("{:?}", err);
                return;
            }
        };

        self.sessions.remove(&session_id);

        match conn
            .srem::<String, String, ()>(format!("room:{}:members", room_id), session_id.to_string())
        {
            Ok(_) => (),
            Err(err) => {
                println!("{:?}", err);
                return;
            }
        }

        let _ = conn.del::<String, ()>(format!("room:{}:members:{}:name", room_id, session_id));

        self.room_members(room_id).iter().for_each(|id| {
            if let Some(addr) = self.sessions.get(id) {
                addr.do_send(InternalMessage::GlobalScope(GlobalScopeMessage {
                    room_id,
                    session_id,
                    message: GlobalMessage::RemoveSession,
                }))
            }
        });
    }

    /// Forward a message as is to websocket actors
    /// The actors should decide to process it or not
    fn forward(&mut self, msg: GlobalScopeMessage) {
        for member_id in self.room_members(msg.room_id).iter() {
            if let Some(addr) = self.sessions.get(member_id) {
                if *member_id != msg.session_id {
                    addr.do_send(InternalMessage::GlobalScope(msg.clone()));
                }
            }
        }
    }
}

impl Actor for Server {
    type Context = Context<Self>;
}

impl Handler<InternalMessage> for Server {
    type Result = ();

    fn handle(&mut self, msg: InternalMessage, _: &mut Self::Context) -> Self::Result {
        match msg {
            InternalMessage::GlobalScope(GlobalScopeMessage {
                session_id,
                room_id,
                message,
            }) => match message {
                GlobalMessage::AddSession(addr, name) => {
                    self.add_session(room_id, session_id, addr, name)
                }
                GlobalMessage::RemoveSession => {
                    self.remove_session(room_id, session_id);
                }
                GlobalMessage::AddProducer(producer) => self.forward(GlobalScopeMessage {
                    session_id,
                    room_id,
                    message: GlobalMessage::AddProducer(producer),
                }),
                GlobalMessage::RemoveProducer(producer_id) => self.forward(GlobalScopeMessage {
                    session_id,
                    room_id,
                    message: GlobalMessage::RemoveProducer(producer_id),
                }),
                GlobalMessage::ForwardMessage(forwarded) => self.forward(GlobalScopeMessage {
                    session_id,
                    room_id,
                    message: GlobalMessage::ForwardMessage(forwarded),
                }),
            },
            InternalMessage::LocalScope(_) => (), // Locally scoped messages are not processed here
        }
    }
}
