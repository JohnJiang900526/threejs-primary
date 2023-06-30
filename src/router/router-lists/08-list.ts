import type { RouteRecordRaw } from "vue-router";

import ShadersOcean from "@/pages/model-list/detail08/211-shaders-ocean/index.vue";
import ShadersSky from "@/pages/model-list/detail08/212-shaders-sky/index.vue";
import ShadersTonemapping from "@/pages/model-list/detail08/213-shaders-tonemapping/index.vue";
import Shadowmap from "@/pages/model-list/detail08/214-webgl-shadowmap/index.vue";
import ShadowmapPerformance from "@/pages/model-list/detail08/215-shadowmap-performance/index.vue";
import ShadowmapPointlight from "@/pages/model-list/detail08/216-shadowmap-pointlight/index.vue";
import ShadowmapViewer from "@/pages/model-list/detail08/217-shadowmap-viewer/index.vue";
import ShadowContact from "@/pages/model-list/detail08/218-shadow-contact/index.vue";
import ShadowmapVSM from "@/pages/model-list/detail08/219-shadowmap-vsm/index.vue";
import ShadowMesh from "@/pages/model-list/detail08/220-shadow-mesh/index.vue";
import SkinningSimple from "@/pages/model-list/detail08/221-skinning-simple/index.vue";
import Sprites from "@/pages/model-list/detail08/222-webgl-sprites/index.vue";
import TestMemory from "@/pages/model-list/detail08/223-test-memory/index.vue";
import TestMemory2 from "@/pages/model-list/detail08/224-test-memory2/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-test-memory2',
    name: 'TestMemory2',
    meta: {title: "webgl-test-memory2"},
    component: TestMemory2,
  },
  {
    path: '/list/webgl-test-memory',
    name: 'TestMemory',
    meta: {title: "webgl-test-memory"},
    component: TestMemory,
  },
  {
    path: '/list/webgl-sprites',
    name: 'Sprites',
    meta: {title: "webgl-sprites"},
    component: Sprites,
  },
  {
    path: '/list/webgl-skinning-simple',
    name: 'SkinningSimple',
    meta: {title: "webgl-skinning-simple"},
    component: SkinningSimple,
  },
  {
    path: '/list/webgl-shadow-mesh',
    name: 'ShadowMesh',
    meta: {title: "webgl-shadow-mesh"},
    component: ShadowMesh,
  },
  {
    path: '/list/webgl-shadowmap-vsm',
    name: 'ShadowmapVSM',
    meta: {title: "webgl-shadowmap-vsm"},
    component: ShadowmapVSM,
  },
  {
    path: '/list/webgl-shadow-contact',
    name: 'ShadowContact',
    meta: {title: "webgl-shadow-contact"},
    component: ShadowContact,
  },
  {
    path: '/list/webgl-shadowmap-viewer',
    name: 'ShadowmapViewer',
    meta: {title: "webgl-shadowmap-viewer"},
    component: ShadowmapViewer,
  },
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