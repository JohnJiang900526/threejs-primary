import type { RouteRecordRaw } from "vue-router";

import Welcome from "@/pages/welcome/index.vue";
import List from "@/pages/model-list/index.vue";

import routerList01 from "@/router/router-lists/01-list";
import routerList02 from "@/router/router-lists/02-list";
import routerList03 from "@/router/router-lists/03-list";
import routerList04 from "@/router/router-lists/04-list";
import routerList05 from "@/router/router-lists/05-list";
import routerList06 from "@/router/router-lists/06-list";
import routerList07 from "@/router/router-lists/07-list";
import routerList08 from "@/router/router-lists/08-list";
import routerList09 from "@/router/router-lists/09-list";
import routerList10 from "@/router/router-lists/10-list";
import routerList11 from "@/router/router-lists/11-list";

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
      ...routerList11,
      ...routerList10,
      ...routerList09,
      ...routerList08,
      ...routerList07,
      ...routerList06,
      ...routerList05,
      ...routerList04,
      ...routerList03,
      ...routerList02,
      ...routerList01,
    ]
  },
];

export default routes;
