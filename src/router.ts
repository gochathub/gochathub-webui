import { createRouter, createWebHistory } from "vue-router";
import AccessView from "@src/components/views/AccessView/AccessView.vue";
import HomeView from "@src/components/views/HomeView/HomeView.vue";
import Chat from "@src/components/views/HomeView/Chat/Chat.vue";
import useAuthStore from "@src/store/auth";

const routes = [
  {
    path: "/chat/",
    name: "Home",
    alias: "/",
    component: HomeView,
    children: [
      {
        path: "/chat/",
        alias: "/",
        name: "No-Chat",
        component: Chat,
      },
      {
        path: "/chat/:id/",
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

  const loggedIn = auth.me !== undefined;
  const isAccess = to.name === "Access";

  if (!loggedIn && !isAccess) {
    return { name: "Access", params: { method: "sign-in" } };
  }
  if (loggedIn && isAccess) {
    return { name: "Home" };
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
