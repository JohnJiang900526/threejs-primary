import type { RouteRecordRaw } from "vue-router";

import ShadersOcean from "@/pages/model-list/detail08/211-shaders-ocean/index.vue";
import ShadersSky from "@/pages/model-list/detail08/212-shaders-sky/index.vue";
import ShadersTonemapping from "@/pages/model-list/detail08/213-shaders-tonemapping/index.vue";

const routerList: RouteRecordRaw[] = [
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