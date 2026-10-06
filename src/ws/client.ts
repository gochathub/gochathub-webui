// WebSocket client for GET /api/v1/ws. The session cookie authorizes the
// upgrade (ADR-015). Frames: subscribe/unsubscribe/ack/read/typing.*.
// Reliability model (WEBSOCKETS.md): reconnect + REST resync, no replay.
import { ref } from "vue";

export interface WSEnvelope {
  type: string;
  id?: string;
  timestamp?: string;
  room_id?: string;
  data?: Record<string, unknown>;
}

type EventHandler = (env: WSEnvelope) => void;

export class WSClient {
  private socket: WebSocket | null = null;
  private url: string;
  private events = new Set<EventHandler>();
  private subscribedRooms = new Set<string>();
  private backoffMs = 1000;
  private shouldRun = false;

  // reactive status for UI (reconnect banner, resync triggers)
  status = ref<"idle" | "connecting" | "open" | "offline">("idle");

  constructor(
    url: string = `${location.origin.replace(/^http/, "ws")}/api/v1/ws`,
  ) {
    this.url = url;
    // ponytail: plain ws:// vs wss:// follows page origin; mixed content is
    // the deployment's (reverse proxy) concern, not the client's.
  }

  onEvent(handler: EventHandler) {
    this.events.add(handler);
  }

  private emit(env: WSEnvelope) {
    for (const handler of this.events) handler(env);
  }

  connect() {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    this.shouldRun = true;
    this.status.value = "connecting";
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.status.value = "open";
      this.backoffMs = 1000;
      // re-subscribe to the rooms we had before the drop
      for (const roomId of this.subscribedRooms) {
        this.sendFrame({ type: "subscribe", room_id: roomId });
      }
    };

    this.socket.onmessage = (ev) => {
      try {
        this.emit(JSON.parse(ev.data as string) as WSEnvelope);
      } catch {
        // malformed frame — server bug, ignore
      }
    };

    this.socket.onclose = () => {
      this.status.value = this.shouldRun ? "offline" : "idle";
      if (this.shouldRun) {
        const delay = this.backoffMs;
        this.backoffMs = Math.min(this.backoffMs * 2, 15000);
        window.setTimeout(() => {
          if (this.shouldRun) this.connect();
        }, delay);
      }
    };
  }

  close() {
    this.shouldRun = false;
    this.socket?.close();
    this.socket = null;
    this.subscribedRooms.clear();
    this.status.value = "idle";
  }

  subscribe(roomId: string) {
    this.subscribedRooms.add(roomId);
    this.sendFrame({ type: "subscribe", room_id: roomId });
  }

  unsubscribeAll() {
    for (const roomId of this.subscribedRooms) {
      this.sendFrame({ type: "unsubscribe", room_id: roomId });
    }
    this.subscribedRooms.clear();
  }

  // delivered receipts (ADR-009)
  ack(messageIds: string[]) {
    if (messageIds.length > 0)
      this.sendFrame({ type: "ack", message_ids: messageIds });
  }

  read(roomId: string, messageId: string) {
    this.sendFrame({ type: "read", room_id: roomId, message_id: messageId });
  }

  typing(roomId: string, started: boolean) {
    this.sendFrame({
      type: started ? "typing.started" : "typing.stopped",
      room_id: roomId,
    });
  }

  private sendFrame(frame: Record<string, unknown>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(frame));
    }
  }
}

export const ws = new WSClient();
export default ws;
