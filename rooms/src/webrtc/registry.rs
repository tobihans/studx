use async_lock::Mutex;
use mediasoup::prelude::*;
use std::collections::hash_map::Entry;
use std::collections::HashMap;
use std::sync::Arc;

use super::room::{Room, RoomId, WeakRoom};

#[derive(Debug, Default, Clone)]
pub struct Registry {
    rooms: Arc<Mutex<HashMap<RoomId, WeakRoom>>>,
}

impl Registry {
    pub async fn get_or_create_room(
        &self,
        worker_manager: &WorkerManager,
        room_id: RoomId,
    ) -> Result<Room, String> {
        let mut rooms = self.rooms.lock().await;

        match rooms.entry(room_id) {
            Entry::Occupied(mut entry) => match entry.get().upgrade() {
                Some(room) => Ok(room),
                None => {
                    let room = Room::new(worker_manager, room_id).await?;
                    entry.insert(room.downgrade());
                    // TODO: Setup event listener for when room is closed
                    Ok(room)
                }
            },
            Entry::Vacant(entry) => {
                let room = Room::new(worker_manager, room_id).await?;
                entry.insert(room.downgrade());
                // TODO: See above
                Ok(room)
            }
        }
    }
}
