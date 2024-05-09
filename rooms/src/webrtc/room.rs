use std::fmt::{Debug, Formatter};
use std::{
    collections::HashMap,
    convert::{From, TryFrom},
    fmt::Display,
    num::{NonZeroU32, NonZeroU8},
    sync::{Arc, Weak},
};

use mediasoup::prelude::*;
use mediasoup::worker::{WorkerLogLevel, WorkerLogTag};
use parking_lot::Mutex;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use uuid::Uuid;

use crate::websocket::SessionId;

#[derive(Debug, Eq, Hash, Copy, Clone, PartialEq)]
pub struct RoomId(pub Uuid);

impl Display for RoomId {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl Serialize for RoomId {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        self.0.serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for RoomId {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        Uuid::deserialize(deserializer).map(RoomId)
    }
}

impl TryFrom<&str> for RoomId {
    type Error = uuid::Error;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match uuid::Uuid::try_parse(value) {
            Ok(uuid) => Ok(Self(uuid)),
            Err(err) => Err(err),
        }
    }
}

/// Internal structure for [`Room`]
struct RoomInner {
    /// The identifier of the room, wraps an [`Uuid`]
    id: RoomId,
    /// The mediasoup [`Router`] associated
    router: Router,
    /// A mapping between sessions connected to the room and their associated [`Producer`]
    clients: Mutex<HashMap<SessionId, Vec<Producer>>>,
}

impl Debug for RoomInner {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("RoomInner")
            .field("id", &self.id)
            .field("clients", &self.clients)
            .finish()
    }
}

impl Drop for RoomInner {
    fn drop(&mut self) {
        // TODO: Remove room from the registry here
    }
}

#[derive(Debug, Clone)]
pub struct Room {
    inner: Arc<RoomInner>,
}

impl Room {
    pub async fn new(worker_manager: &WorkerManager, id: RoomId) -> Result<Self, String> {
        let router = worker_manager
            .create_worker({
                let mut settings = WorkerSettings::default();
                settings.log_level = WorkerLogLevel::Debug;
                settings.log_tags = vec![
                    WorkerLogTag::Info,
                    WorkerLogTag::Ice,
                    WorkerLogTag::Dtls,
                    WorkerLogTag::Rtp,
                    WorkerLogTag::Srtp,
                    WorkerLogTag::Rtcp,
                    WorkerLogTag::Rtx,
                    WorkerLogTag::Bwe,
                    WorkerLogTag::Score,
                    WorkerLogTag::Simulcast,
                    WorkerLogTag::Svc,
                    WorkerLogTag::Sctp,
                    WorkerLogTag::Message,
                ];

                settings
            })
            .await
            .map_err(|error| format!("Unable to create worker: {error:?}"))?
            .create_router(RouterOptions::new(media_codecs()))
            .await
            .map_err(|error| format!("Unable to create router: {error:?}"))?;

        Ok(Self {
            inner: Arc::new(RoomInner {
                id,
                router,
                clients: Mutex::default(),
            }),
        })
    }

    pub fn id(&self) -> RoomId {
        self.inner.id
    }

    pub fn router(&self) -> &Router {
        &self.inner.router
    }

    pub fn all_producers(&self) -> Vec<(SessionId, ProducerId)> {
        self.inner
            .clients
            .lock()
            .iter()
            .flat_map(|(session_id, producers)| {
                producers
                    .iter()
                    .map(move |producer| (*session_id, producer.id()))
            })
            .collect()
    }

    pub fn add_producer(&self, session_id: SessionId, producer: Producer) {
        self.inner
            .clients
            .lock()
            .entry(session_id)
            .or_default()
            .push(producer.clone());
    }

    /// Removes a user's session from the room
    /// returning its producers.
    pub fn remove_session(&self, session_id: SessionId) -> Vec<Producer> {
        match self.inner.clients.lock().remove(&session_id) {
            Some(producers) => producers,
            None => vec![],
        }
    }

    pub fn downgrade(&self) -> WeakRoom {
        WeakRoom {
            inner: Arc::downgrade(&self.inner),
        }
    }
}

#[derive(Debug)]
pub struct WeakRoom {
    inner: Weak<RoomInner>,
}

impl WeakRoom {
    pub fn upgrade(&self) -> Option<Room> {
        self.inner.upgrade().map(|inner| Room { inner })
    }
}

/// List of codecs that SFU will accept from clients
fn media_codecs() -> Vec<RtpCodecCapability> {
    vec![
        RtpCodecCapability::Audio {
            mime_type: MimeTypeAudio::Opus,
            preferred_payload_type: None,
            clock_rate: NonZeroU32::new(48000).unwrap(),
            channels: NonZeroU8::new(2).unwrap(),
            parameters: RtpCodecParametersParameters::from([("useinbandfec", 1_u32.into())]),
            rtcp_feedback: vec![RtcpFeedback::TransportCc],
        },
        RtpCodecCapability::Video {
            mime_type: MimeTypeVideo::Vp8,
            preferred_payload_type: None,
            clock_rate: NonZeroU32::new(90000).unwrap(),
            parameters: RtpCodecParametersParameters::default(),
            rtcp_feedback: vec![
                RtcpFeedback::Nack,
                RtcpFeedback::NackPli,
                RtcpFeedback::CcmFir,
                RtcpFeedback::GoogRemb,
                RtcpFeedback::TransportCc,
            ],
        },
    ]
}
