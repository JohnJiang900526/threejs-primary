import type { RouteRecordRaw } from "vue-router";

import ModifierMorphTargetsFace from "@/pages/model-list/detail07/181-morph-targets-face/index.vue";
import ModifierMorphTargetsHorse from "@/pages/model-list/detail07/182-morph-targets-horse/index.vue";
import ModifierMorphTargetsSphere from "@/pages/model-list/detail07/183-morph-targets-sphere/index.vue";
import MultipleCanvasesCircle from "@/pages/model-list/detail07/184-multiple-canvases-circle/index.vue";
import MultipleCanvasesComplex from "@/pages/model-list/detail07/185-multiple-canvases-complex/index.vue";
import MultipleCanvasesGrid from "@/pages/model-list/detail07/186-multiple-canvases-grid/index.vue";



const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-multiple-canvases-grid',
    name: 'MultipleCanvasesGrid',
    meta: {title: "webgl-multiple-canvases-grid"},
    component: MultipleCanvasesGrid,
  },
  {
    path: '/list/webgl-multiple-canvases-complex',
    name: 'MultipleCanvasesComplex',
    meta: {title: "webgl-multiple-canvases-complex"},
    component: MultipleCanvasesComplex,
  },
  {
    path: '/list/webgl-multiple-canvases-circle',
    name: 'MultipleCanvasesCircle',
    meta: {title: "webgl-multiple-canvases-circle"},
    component: MultipleCanvasesCircle,
  },
  {
    path: '/list/webgl-morph-targets-sphere',
    name: 'ModifierMorphTargetsSphere',
    meta: {title: "webgl-morph-targets-sphere"},
    component: ModifierMorphTargetsSphere,
  },
  {
    path: '/list/webgl-morph-targets-horse',
    name: 'ModifierMorphTargetsHorse',
    meta: {title: "webgl-morph-targets-horse"},
    component: ModifierMorphTargetsHorse,
  },
  {
    path: '/list/webgl-morph-targets-face',
    name: 'ModifierMorphTargetsFace',
    meta: {title: "webgl-morph-targets-face"},
    component: ModifierMorphTargetsFace,
  },
]

export default routerList;