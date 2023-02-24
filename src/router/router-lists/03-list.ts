import type { RouteRecordRaw } from "vue-router";

import LightsPhysical from "@/pages/model-list/detail03/061-lights-physical/index.vue";

const routerList: RouteRecordRaw[] = [
  {
    path: '/list/lights-physical',
    name: 'LightsPhysical',
    meta: {title: "lights-physical"},
    component: LightsPhysical,
  },
];

export default routerList;