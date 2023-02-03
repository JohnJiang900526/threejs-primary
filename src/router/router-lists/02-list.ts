import type { RouteRecordRaw } from "vue-router";

import GeometryExtrudeShape2 from "@/pages/model-list/detail02/031-geometry-extrude-shape2/index.vue";
import GeometryExtrudeSpline from "@/pages/model-list/detail02/032-geometry-extrude-spline/index.vue";
import GeometryMinecraft from "@/pages/model-list/detail02/033-geometry-minecraft/index.vue";
import GeometryNurbs from "@/pages/model-list/detail02/034-geometry-nurbs/index.vue";

const routerList02: RouteRecordRaw[] = [
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