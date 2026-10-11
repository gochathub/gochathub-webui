// Classic sidebar sort (per device): by last activity or by name.
import { ref, watch } from "vue";

export type RoomSort = "activity" | "name";

const KEY = "roomSort";
const roomSort = ref<RoomSort>(
  localStorage.getItem(KEY) === "name" ? "name" : "activity",
);
watch(roomSort, (v) => localStorage.setItem(KEY, v));

export function useRoomSort() {
  return roomSort;
}
