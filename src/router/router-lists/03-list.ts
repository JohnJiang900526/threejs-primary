import type { RouteRecordRaw } from "vue-router";

import LightsPhysical from "@/pages/model-list/detail03/061-lights-physical/index.vue";
import LightsPointlights from "@/pages/model-list/detail03/062-lights-pointlights/index.vue";
import LightsSpotLight from "@/pages/model-list/detail03/063-lights-spotlight/index.vue";

const routerList: RouteRecordRaw[] = [
  {
    path: '/list/lights-spotlight',
    name: 'LightsSpotLight',
    meta: {title: "lights-spotlight"},
    component: LightsSpotLight,
  },
  {
    path: '/list/lights-pointlights',
    name: 'LightsPointlights',
    meta: {title: "lights-pointlights"},
    component: LightsPointlights,
  },
  {
    path: '/list/lights-physical',
    name: 'LightsPhysical',
    meta: {title: "lights-physical"},
    component: LightsPhysical,
  },
];

export default routerList;