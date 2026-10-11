import { createRouter, createWebHistory } from "vue-router";
import AccessView from "@src/components/views/AccessView/AccessView.vue";
import HomeView from "@src/components/views/HomeView/HomeView.vue";
import Chat from "@src/components/views/HomeView/Chat/Chat.vue";
import AdminView from "@src/components/views/AdminView/AdminView.vue";
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
    // reachable only through an emailed invite link (#token=…); no UI links here
    path: "/signup",
    name: "Signup",
    component: AccessView,
  },
  {
    path: "/admin/:section?",
    name: "Admin",
    component: AdminView,
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
  // signup is public too: the invite token is the credential
  if (to.name === "Help" || to.name === "Signup") return true;

  const loggedIn = auth.me !== undefined;
  const isAccess = to.name === "Access";

  if (!loggedIn && !isAccess) {
    return { name: "Access", params: { method: "sign-in" } };
  }
  // admin pages are server-enforced; this only hides the dead end
  if (to.name === "Admin" && auth.me?.role !== "admin") {
    return { name: "No-Chat" };
  }
  // ?mobile=1: the Android Custom Tab hand-off runs from the sign-in page
  if (loggedIn && isAccess && to.query.mobile !== "1") {
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
