import type { RouteRecordRaw } from "vue-router";

import ModifierMorphTargetsFace from "@/pages/model-list/detail07/181-morph-targets-face/index.vue";
import ModifierMorphTargetsHorse from "@/pages/model-list/detail07/182-morph-targets-horse/index.vue";
import ModifierMorphTargetsSphere from "@/pages/model-list/detail07/183-morph-targets-sphere/index.vue";
import MultipleCanvasesCircle from "@/pages/model-list/detail07/184-multiple-canvases-circle/index.vue";
import MultipleCanvasesComplex from "@/pages/model-list/detail07/185-multiple-canvases-complex/index.vue";
import MultipleCanvasesGrid from "@/pages/model-list/detail07/186-multiple-canvases-grid/index.vue";
import MultipleElements from "@/pages/model-list/detail07/187-multiple-elements/index.vue";
import MultipleRenderers from "@/pages/model-list/detail07/188-multiple-renderers/index.vue";
import MultipleScenesComparison from "@/pages/model-list/detail07/189-multiple-scenes-comparison/index.vue";
import MultipleViews from "@/pages/model-list/detail07/190-multiple-views/index.vue";
import PanoramaCube from "@/pages/model-list/detail07/191-panorama-cube/index.vue";
import PanoramaEquirectAngular from "@/pages/model-list/detail07/192-panorama-equirect-angular/index.vue";
import WebglPerformance from "@/pages/model-list/detail07/193-performance/index.vue";
import PerformanceStatic from "@/pages/model-list/detail07/194-performance-static/index.vue";
import PerformanceShader from "@/pages/model-list/detail07/195-performance-shader/index.vue";
import PointsBillboards from "@/pages/model-list/detail07/196-points-billboards/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-points-billboards',
    name: 'PointsBillboards',
    meta: {title: "webgl-points-billboards"},
    component: PointsBillboards,
  },
  {
    path: '/list/webgl-performance-shader',
    name: 'PerformanceShader',
    meta: {title: "webgl-performance-shader"},
    component: PerformanceShader,
  },
  {
    path: '/list/webgl-performance-static',
    name: 'PerformanceStatic',
    meta: {title: "webgl-performance-static"},
    component: PerformanceStatic,
  },
  {
    path: '/list/webgl-performance',
    name: 'WebglPerformance',
    meta: {title: "webgl-performance"},
    component: WebglPerformance,
  },
  {
    path: '/list/webgl-panorama-equirect-angular',
    name: 'PanoramaEquirectAngular',
    meta: {title: "webgl-panorama-equirect-angular"},
    component: PanoramaEquirectAngular,
  },
  {
    path: '/list/webgl-panorama-cube',
    name: 'PanoramaCube',
    meta: {title: "webgl-panorama-cube"},
    component: PanoramaCube,
  },
  {
    path: '/list/webgl-multiple-views',
    name: 'MultipleViews',
    meta: {title: "webgl-multiple-views"},
    component: MultipleViews,
  },
  {
    path: '/list/webgl-multiple-scenes-comparison',
    name: 'MultipleScenesComparison',
    meta: {title: "webgl-multiple-scenes-comparison"},
    component: MultipleScenesComparison,
  },
  {
    path: '/list/webgl-multiple-renderers',
    name: 'MultipleRenderers',
    meta: {title: "webgl-multiple-renderers"},
    component: MultipleRenderers,
  },
  {
    path: '/list/webgl-multiple-elements',
    name: 'MultipleElements',
    meta: {title: "webgl-multiple-elements"},
    component: MultipleElements,
  },
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