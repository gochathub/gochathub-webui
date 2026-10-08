import router from "@src/router";
import "@src/style.css";
import { createPinia } from "pinia";
import { createApp } from "vue";
import vClickOutside from "click-outside-vue3";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";
import flagFont from "country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url";

import App from "@src/App.vue";

// self-hosted font; no-op where the OS already draws flag emoji
polyfillCountryFlagEmojis("Twemoji Country Flags", flagFont);

const pinia = createPinia();

createApp(App).use(pinia).use(router).use(vClickOutside).mount("#app");
