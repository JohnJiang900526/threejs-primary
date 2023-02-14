import type { RouteRecordRaw } from "vue-router";

import GeometryExtrudeShape2 from "@/pages/model-list/detail02/031-geometry-extrude-shape2/index.vue";
import GeometryExtrudeSpline from "@/pages/model-list/detail02/032-geometry-extrude-spline/index.vue";
import GeometryMinecraft from "@/pages/model-list/detail02/033-geometry-minecraft/index.vue";
import GeometryNurbs from "@/pages/model-list/detail02/034-geometry-nurbs/index.vue";
import GeometryShapes from "@/pages/model-list/detail02/035-geometry-shapes/index.vue";
import GeometrySplineEditor from "@/pages/model-list/detail02/036-geometry-spline-editor/index.vue";
import GeometryTeapot from "@/pages/model-list/detail02/037-geometry-teapot/index.vue";
import GeometryTerrain from "@/pages/model-list/detail02/038-geometry-terrain/index.vue";
import GeometryTerrainRaycast from "@/pages/model-list/detail02/039-geometry-terrain-raycast/index.vue";
import GeometryText from "@/pages/model-list/detail02/040-geometry-text/index.vue";
import GeometryTextShape from "@/pages/model-list/detail02/041-geometry-text-shape/index.vue";
import GeometryTextStroke from "@/pages/model-list/detail02/042-geometry-text-stroke/index.vue";
import WebglHelpers from "@/pages/model-list/detail02/043-webgl-helpers/index.vue";
import InstancingDynamic from "@/pages/model-list/detail02/044-instancing-dynamic/index.vue";
import InstancingPerformance from "@/pages/model-list/detail02/045-instancing-performance/index.vue";
import InstancingRaycast from "@/pages/model-list/detail02/046-instancing-raycast/index.vue";
import InstancingScatter from "@/pages/model-list/detail02/047-instancing-scatter/index.vue";

const routerList02: RouteRecordRaw[] = [
  {
    path: '/list/instancing-scatter',
    name: 'InstancingScatter',
    meta: {title: "instancing-scatter"},
    component: InstancingScatter,
  },
  {
    path: '/list/instancing-raycast',
    name: 'InstancingRaycast',
    meta: {title: "instancing-raycast"},
    component: InstancingRaycast,
  },
  {
    path: '/list/instancing-performance',
    name: 'InstancingPerformance',
    meta: {title: "instancing-performance"},
    component: InstancingPerformance,
  },
  {
    path: '/list/instancing-dynamic',
    name: 'InstancingDynamic',
    meta: {title: "instancing-dynamic"},
    component: InstancingDynamic,
  },
  {
    path: '/list/webgl-helpers',
    name: 'WebglHelpers',
    meta: {title: "webgl-helpers"},
    component: WebglHelpers,
  },
  {
    path: '/list/geometry-text-shape',
    name: 'GeometryTextShape',
    meta: {title: "geometry-text-shape"},
    component: GeometryTextShape,
  },
  {
    path: '/list/geometry-text-stroke',
    name: 'GeometryTextStroke',
    meta: {title: "geometry-text-stroke"},
    component: GeometryTextStroke,
  },
  {
    path: '/list/geometry-text',
    name: 'GeometryText',
    meta: {title: "geometry-text"},
    component: GeometryText,
  },
  {
    path: '/list/geometry-terrain-raycast',
    name: 'GeometryTerrainRaycast',
    meta: {title: "geometry-terrain-raycast"},
    component: GeometryTerrainRaycast,
  },
  {
    path: '/list/geometry-terrain',
    name: 'GeometryTerrain',
    meta: {title: "geometry-terrain"},
    component: GeometryTerrain,
  },
  {
    path: '/list/geometry-teapot',
    name: 'GeometryTeapot',
    meta: {title: "geometry-teapot"},
    component: GeometryTeapot,
  },
  {
    path: '/list/geometry-spline-editor',
    name: 'GeometrySplineEditor',
    meta: {title: "geometry-spline-editor"},
    component: GeometrySplineEditor,
  },
  {
    path: '/list/geometry-shapes',
    name: 'GeometryShapes',
    meta: {title: "geometry-shapes"},
    component: GeometryShapes,
  },
  {
    path: '/list/geometry-nurbs',
    name: 'GeometryNurbs',
    meta: {title: "geometry-nurbs"},
    component: GeometryNurbs,
  },
  {
    path: '/list/geometry-minecraft',
    name: 'GeometryMinecraft',
    meta: {title: "geometry-minecraft"},
    component: GeometryMinecraft,
  },
  {
    path: '/list/geometry-extrude-spline',
    name: 'GeometryExtrudeSpline',
    meta: {title: "geometry-extrude-spline"},
    component: GeometryExtrudeSpline,
  },
  {
    path: '/list/geometry-extrude-shape2',
    name: 'GeometryExtrudeShape2',
    meta: {title: "geometry-extrude-shape2"},
    component: GeometryExtrudeShape2,
  },
];

export default routerList02;