// Local UI defaults. Server data comes from the API stores; this file holds
// only client-side constants and placeholder data for components not yet
// wired to the backend.
// ponytail: attachments mock keeps SharedMedia UI alive until stage 4 wiring.

export const defaultSettings = {
  lastSeen: false,
  readReceipt: false,
  joiningGroups: false,
  privateMessages: false,
  darkMode: false,
  allowNotifications: false,
  keepNotifications: false,
};

export const attachments = [
  {
    id: "6",
    type: "image",
    name: "forest.jpg",
    size: "21 MB",
    url: "https://images.unsplash.com/photo-1664021975758-78d83898225d",
  },
  {
    id: "7",
    type: "image",
    name: "pumkins.jpg",
    size: "22 MB",
    url: "https://images.unsplash.com/photo-1664031315855-955dbca83172",
  },
  {
    id: "8",
    type: "image",
    name: "mountain.jpg",
    size: "23 MB",
    url: "https://images.unsplash.com/photo-1664091729644-07a158d7c4ca",
  },
  {
    id: "9",
    type: "file",
    name: "lecture-10.pdf",
    size: "52.4 MB",
    url: "https://images.unsplash.com/photo-1664091729644-07a158d7c4ca",
  },
  {
    id: "10",
    type: "video",
    name: "fun-video.mp4",
    size: "11.4 MB",
    url: "https://images.unsplash.com/photo-1559705421-4ae9bf6fabb5",
  },
];

export default {
  defaultSettings,
  attachments,
} as const;
