// WS lifecycle: one socket for the session, started after login, stopped on
// logout. REST resync on drop-back (rooms store's resync()).
import ws from "@src/ws/client";
import useAuthStore from "@src/store/auth";
import useRoomsStore from "@src/store/rooms";

let started = false;

// (re)open the socket for the logged-in session; events flow into the rooms
// store. Safe to call repeatedly.
export function startWS() {
  const auth = useAuthStore();
  if (!auth.me) return;
  if (!started) {
    ws.onEvent((env) => {
      useRoomsStore().handleEvent(env);
    });
    started = true;
  }
  if (ws.status.value !== "open" && ws.status.value !== "connecting") {
    ws.connect();
  }
}

export function stopWS() {
  if (!started) return;
  ws.close();
}
