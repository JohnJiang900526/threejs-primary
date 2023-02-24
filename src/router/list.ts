import type { RouteRecordRaw } from "vue-router";

import Welcome from "@/pages/welcome/index.vue";
import List from "@/pages/model-list/index.vue";

import routerList01 from "@/router/router-lists/01-list";
import routerList02 from "@/router/router-lists/02-list";
import routerList03 from "@/router/router-lists/03-list";

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Welcome',
    meta: {title: "欢迎来到我的首页"},
    component: Welcome
  },
  {
    path: '/list',
    name: 'List',
    meta: {title: "模型列表"},
    component: List,
    children: [
      ...routerList03,
      ...routerList02,
      ...routerList01
    ]
  },
];

export default routes;
