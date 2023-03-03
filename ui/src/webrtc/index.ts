type Kind<K, T> = K & { __kind: T };
export type RoomId = Kind<string, "RoomId">;
export type SessionId = Kind<string, "SessionId">;
export type ConsumerId = Kind<string, "ConsumerId">;
export type ProducerId = Kind<string, "ProducerId">;
