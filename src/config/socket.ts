import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import rooms from "../services/rooms";

class SocketService {
  private io: Server | null = null;
  private paymentSockets = new Map<string, string>();

  public initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket: Socket) => {
      console.log(`[INFO] Socket connected: ${socket.id}`);

      // Existing: payment-related registration
      socket.on("registerPayment", (paymentId: string) => {
        console.log(
          `[INFO] Registering socket ${socket.id} for payment ${paymentId}`
        );
        this.paymentSockets.set(paymentId, socket.id);
      });

      // New: WebRTC signaling for video calls
      socket.on("join", (roomId: string) => {
        if (!roomId) return;
        rooms.join(roomId, socket.id);
        socket.join(roomId);
        const info = rooms.get(roomId);
        socket.emit("room-info", {
          id: roomId,
          occupants: info?.participants.size ?? 0,
        });
        socket.to(roomId).emit("peer-joined", { id: socket.id });
      });

      socket.on(
        "offer",
        ({
          roomId,
          description,
          to,
        }: {
          roomId?: string;
          description: any;
          to?: string;
        }) => {
          if (to) this.io!.to(to).emit("offer", { from: socket.id, description });
          else if (roomId)
            socket.to(roomId).emit("offer", { from: socket.id, description });
        }
      );

      socket.on(
        "answer",
        ({
          roomId,
          description,
          to,
        }: {
          roomId?: string;
          description: any;
          to?: string;
        }) => {
          if (to)
            this.io!.to(to).emit("answer", { from: socket.id, description });
          else if (roomId)
            socket.to(roomId).emit("answer", { from: socket.id, description });
        }
      );

      socket.on(
        "ice-candidate",
        ({
          roomId,
          candidate,
          to,
        }: {
          roomId?: string;
          candidate: any;
          to?: string;
        }) => {
          if (to)
            this.io!.to(to).emit("ice-candidate", {
              from: socket.id,
              candidate,
            });
          else if (roomId)
            socket.to(roomId).emit("ice-candidate", {
              from: socket.id,
              candidate,
            });
        }
      );

      socket.on("disconnect", () => {
        console.log(`[INFO] Socket disconnected: ${socket.id}`);

        // Clean up payment listeners
        for (const [paymentId, socketId] of this.paymentSockets.entries()) {
          if (socketId === socket.id) {
            this.paymentSockets.delete(paymentId);
            break;
          }
        }

        // Leave all joined rooms and notify peers
        const affectedRooms = rooms.leaveAll(socket.id);
        affectedRooms.forEach((roomId) =>
          socket.to(roomId).emit("peer-left", { id: socket.id })
        );
      });
    });

    console.log("🚀 Socket.IO server initialized");
  }

  public notifyPaymentUpdate(
    paymentId: string,
    status: "PAID" | "FAILED"
  ): void {
    if (!this.io) return;

    const socketId = this.paymentSockets.get(paymentId);
    if (socketId) {
      this.io.to(socketId).emit("payment:update", { status });
      console.log(
        `[INFO] Sent WebSocket update for payment ${paymentId} to socket ${socketId}`
      );
      this.paymentSockets.delete(paymentId);
    }
  }
}

export const socketService = new SocketService();
