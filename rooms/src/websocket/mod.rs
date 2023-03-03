use actix::Addr;
use actix_web::{
    error::{ErrorInternalServerError, ErrorUnprocessableEntity},
    get, web, Error, HttpRequest, HttpResponse,
};
use actix_web_actors::ws;
use mediasoup::worker_manager::WorkerManager;
use std::net;

pub use server::Server;
pub use session::{Session, SessionId};

use crate::webrtc::{registry::Registry, room::RoomId};

mod messages;
mod server;
mod session;

#[derive(serde::Serialize, serde::Deserialize)]
pub struct QueryParams {
    name: String,
}

#[get("/rooms/{room_id}")]
pub async fn room(
    room_id: web::Path<String>,
    info: web::Query<QueryParams>,
    req: HttpRequest,
    stream: web::Payload,
    srv: web::Data<Addr<Server>>,
    worker_manager: web::Data<WorkerManager>,
    rooms_registry: web::Data<Registry>,
    transport_ips: web::Data<(net::IpAddr, Option<net::IpAddr>)>,
) -> Result<HttpResponse, Error> {
    let room_id = match RoomId::try_from(room_id.into_inner().as_str()) {
        Ok(id) => id,
        Err(_) => {
            return Err(ErrorUnprocessableEntity("Invalid ID provided"));
        }
    };

    let room = rooms_registry
        .get_or_create_room(&worker_manager, room_id)
        .await;
    let room = match room {
        Ok(room) => room,
        Err(err) => {
            return Err(ErrorInternalServerError(err));
        }
    };

    let session = Session::new(
        srv.get_ref().clone(),
        room,
        info.into_inner().name,
        *transport_ips.into_inner(),
    )
    .await;

    match session {
        Ok(handler) => ws::start(handler, &req, stream),
        Err(err) => Err(ErrorInternalServerError(err)),
    }
}
