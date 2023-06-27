import type { RouteRecordRaw } from "vue-router";

import ShadersOcean from "@/pages/model-list/detail08/211-shaders-ocean/index.vue";
import ShadersSky from "@/pages/model-list/detail08/212-shaders-sky/index.vue";
import ShadersTonemapping from "@/pages/model-list/detail08/213-shaders-tonemapping/index.vue";
import Shadowmap from "@/pages/model-list/detail08/214-webgl-shadowmap/index.vue";
import ShadowmapPerformance from "@/pages/model-list/detail08/215-shadowmap-performance/index.vue";
import ShadowmapPointlight from "@/pages/model-list/detail08/216-shadowmap-pointlight/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-shadowmap-pointlight',
    name: 'ShadowmapPointlight',
    meta: {title: "webgl-shadowmap-pointlight"},
    component: ShadowmapPointlight,
  },
  {
    path: '/list/webgl-shadowmap-performance',
    name: 'ShadowmapPerformance',
    meta: {title: "webgl-shadowmap-performance"},
    component: ShadowmapPerformance,
  },
  {
    path: '/list/webgl-shadowmap',
    name: 'Shadowmap',
    meta: {title: "webgl-shadowmap"},
    component: Shadowmap,
  },
  {
    path: '/list/webgl-shaders-tonemapping',
    name: 'ShadersTonemapping',
    meta: {title: "webgl-shaders-tonemapping"},
    component: ShadersTonemapping,
  },
  {
    path: '/list/webgl-shaders-sky',
    name: 'ShadersSky',
    meta: {title: "webgl-shaders-sky"},
    component: ShadersSky,
  },
  {
    path: '/list/webgl-shaders-ocean',
    name: 'ShadersOcean',
    meta: {title: "webgl-shaders-ocean"},
    component: ShadersOcean,
  },
];

export default routerList;