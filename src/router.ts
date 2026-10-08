import { createRouter, createWebHistory } from "vue-router";
import AccessView from "@src/components/views/AccessView/AccessView.vue";
import HomeView from "@src/components/views/HomeView/HomeView.vue";
import Chat from "@src/components/views/HomeView/Chat/Chat.vue";
import HelpView from "@src/components/views/HelpView/HelpView.vue";
import useAuthStore from "@src/store/auth";

const routes = [
  {
    path: "/chat/",
    name: "Home",
    alias: "/",
    component: HomeView,
    // relative child paths: an absolute child equal to the parent path gets
    // shadowed by the parent record and never renders the child component
    children: [
      {
        path: "",
        alias: "/",
        name: "No-Chat",
        component: Chat,
      },
      {
        path: ":id/",
        name: "Chat",
        component: Chat,
      },
    ],
  },
  {
    path: "/access/:method/",
    name: "Access",
    component: AccessView,
  },
  {
    path: "/help/:slug?",
    name: "Help",
    component: HelpView,
  },
];

// create the router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// session guard — the cookie is the only credential; bootstrap probes
// GET /users/me once and routes on the result.
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.bootstrap();

  // help is public: locked-out users need it most
  if (to.name === "Help") return true;

  const loggedIn = auth.me !== undefined;
  const isAccess = to.name === "Access";

  if (!loggedIn && !isAccess) {
    return { name: "Access", params: { method: "sign-in" } };
  }
  if (loggedIn && isAccess) {
    return { name: "No-Chat" };
  }
  return true;
});

// (router gaurd) when navigating in mobile screen from chat to chatlist,
// don't navigate to the previous chat navigate to the chatlist.
router.beforeEach((to, from, next) => {
  //console.log(window.innerWidth);
  if (from.name === "Chat" && to.name === "Chat" && window.innerWidth <= 967)
    next({ name: "No-Chat" });
  else next();
});

export default router;
