import type { RouteRecordRaw } from "vue-router";

import LightsPhysical from "@/pages/model-list/detail03/061-lights-physical/index.vue";
import LightsPointlights from "@/pages/model-list/detail03/062-lights-pointlights/index.vue";
import LightsSpotLight from "@/pages/model-list/detail03/063-lights-spotlight/index.vue";
import LightsSpotLights from "@/pages/model-list/detail03/064-lights-spotlights/index.vue";
import LightsRectareaLight from "@/pages/model-list/detail03/065-lights-rectarea-light/index.vue";
import LinesColors from "@/pages/model-list/detail03/066-lines-colors/index.vue";

const routerList: RouteRecordRaw[] = [
  {
    path: '/list/lines-colors',
    name: 'LinesColors',
    meta: {title: "lines-colors"},
    component: LinesColors,
  },
  {
    path: '/list/lights-rectarea-light',
    name: 'LightsRectareaLight',
    meta: {title: "lights-rectarea-light"},
    component: LightsRectareaLight,
  },
  {
    path: '/list/lights-spotlights',
    name: 'LightsSpotLights',
    meta: {title: "lights-spotlights"},
    component: LightsSpotLights,
  },
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