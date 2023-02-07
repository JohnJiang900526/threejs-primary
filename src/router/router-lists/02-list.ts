import type { RouteRecordRaw } from "vue-router";

import GeometryExtrudeShape2 from "@/pages/model-list/detail02/031-geometry-extrude-shape2/index.vue";
import GeometryExtrudeSpline from "@/pages/model-list/detail02/032-geometry-extrude-spline/index.vue";
import GeometryMinecraft from "@/pages/model-list/detail02/033-geometry-minecraft/index.vue";
import GeometryNurbs from "@/pages/model-list/detail02/034-geometry-nurbs/index.vue";
import GeometryShapes from "@/pages/model-list/detail02/035-geometry-shapes/index.vue";
import GeometrySplineEditor from "@/pages/model-list/detail02/036-geometry-spline-editor/index.vue";
import GeometryTeapot from "@/pages/model-list/detail02/037-geometry-teapot/index.vue";
import GeometryTerrain from "@/pages/model-list/detail02/038-geometry-terrain/index.vue";

const routerList02: RouteRecordRaw[] = [
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