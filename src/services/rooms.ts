import { nanoid } from "nanoid";

type RoomInfo = {
  participants: Set<string>;
  createdAt: number;
};

class RoomsService {
  private rooms: Map<string, RoomInfo>;
  private bySocket: Map<string, Set<string>>;

  constructor() {
    this.rooms = new Map(); // roomId -> { participants, createdAt }
    this.bySocket = new Map(); // socketId -> Set<roomId>
  }

  create(customId?: string): string {
    const id = customId || nanoid(8);
    if (!this.rooms.has(id)) {
      this.rooms.set(id, { participants: new Set(), createdAt: Date.now() });
    }
    return id;
  }

  join(roomId: string, socketId: string): RoomInfo {
    this.create(roomId);
    const r = this.rooms.get(roomId)!;
    r.participants.add(socketId);
    if (!this.bySocket.has(socketId)) this.bySocket.set(socketId, new Set());
    this.bySocket.get(socketId)!.add(roomId);
    return r;
  }

  leave(roomId: string, socketId: string): void {
    const r = this.rooms.get(roomId);
    if (!r) return;
    r.participants.delete(socketId);
    if (r.participants.size === 0) this.rooms.delete(roomId);
    const set = this.bySocket.get(socketId);
    if (set) {
      set.delete(roomId);
      if (set.size === 0) this.bySocket.delete(socketId);
    }
  }

  leaveAll(socketId: string): string[] {
    const set = this.bySocket.get(socketId) || new Set<string>();
    [...set].forEach((roomId) => this.leave(roomId, socketId));
    return [...set];
  }

  get(roomId: string): RoomInfo | undefined {
    return this.rooms.get(roomId);
  }
}

const rooms = new RoomsService();
export default rooms;
