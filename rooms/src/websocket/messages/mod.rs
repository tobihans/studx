use actix::prelude::*;
use mediasoup::prelude::*;
use serde::{Deserialize, Serialize};

pub use internals::InternalMessage;

use crate::webrtc::room::RoomId;
use crate::websocket::SessionId;

pub mod internals;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransportOptions {
    pub id: TransportId,
    pub dtls_parameters: DtlsParameters,
    pub ice_candidates: Vec<IceCandidate>,
    pub ice_parameters: IceParameters,
}

/// Messages sent to clients
#[derive(Debug, Serialize, Message)]
#[serde(tag = "type")]
#[rtype(result = "()")]
#[allow(clippy::large_enum_variant)]
pub enum ServerMessage {
    #[serde(rename_all = "camelCase")]
    Init {
        room_id: RoomId,
        consumer_transport_options: TransportOptions,
        producer_transport_options: TransportOptions,
        router_rtp_capabilities: RtpCapabilitiesFinalized,
    },
    ConnectedProducerTransport,
    Produced {
        id: ProducerId,
    },
    ConnectedConsumerTransport,
    /// Notification that consumer was successfully created server-side, client can resume
    /// the consumer after this
    #[serde(rename_all = "camelCase")]
    Consumed {
        id: ConsumerId,
        producer_id: ProducerId,
        session_id: SessionId,
        kind: MediaKind,
        rtp_parameters: RtpParameters,
    },
    /// Inform client about the presence of people in the meeting
    #[serde(rename_all = "camelCase")]
    NewComer {
        session_id: SessionId,
        name: String,
        just_joined: bool,
    },
    /// Text sent to the global chat
    #[serde(rename_all = "camelCase")]
    Text {
        sender_id: SessionId,
        text: String,
    },

    /// Notification that new producer was added to the room
    #[serde(rename_all = "camelCase")]
    ProducerAdded {
        session_id: SessionId,
        producer_id: ProducerId,
    },
    /// Notification that producer was removed from the room
    #[serde(rename_all = "camelCase")]
    ProducerRemoved {
        session_id: SessionId,
        producer_id: ProducerId,
    },
    /// Notify errors
    #[serde(rename_all = "camelCase")]
    Error {
        error: String,
    },
}

/// Messages received from clients
#[derive(Debug, Deserialize, Message)]
#[serde(tag = "type")]
#[rtype(result = "()")]
pub enum ClientMessage {
    /// Client-side initialization with its RTP capabilities, in this simple case we expect
    /// those to match server Router's RTP capabilities
    #[serde(rename_all = "camelCase")]
    Init { rtp_capabilities: RtpCapabilities },
    /// Request to connect producer transport with client-side DTLS parameters
    #[serde(rename_all = "camelCase")]
    ConnectProducerTransport { dtls_parameters: DtlsParameters },
    /// Request to produce a new audio or video track with specified RTP parameters
    #[serde(rename_all = "camelCase")]
    Produce {
        kind: MediaKind,
        rtp_parameters: RtpParameters,
    },
    /// Request to connect consumer transport with client-side DTLS parameters
    #[serde(rename_all = "camelCase")]
    ConnectConsumerTransport { dtls_parameters: DtlsParameters },
    /// Request to consume specified producer
    #[serde(rename_all = "camelCase")]
    Consume {
        producer_id: ProducerId,
        session_id: SessionId,
    },
    /// Request to resume consumer that was previously created
    #[serde(rename_all = "camelCase")]
    ConsumerResume { id: ConsumerId },
    #[serde(rename_all = "camelCase")]
    RemoveProducer { id: ProducerId },
    /// Text sent to the global chat
    #[serde(rename_all = "camelCase")]
    Text { text: String },
}
