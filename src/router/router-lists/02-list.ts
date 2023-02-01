import type { RouteRecordRaw } from "vue-router";

import GeometryExtrudeShape2 from "@/pages/model-list/detail02/031-geometry-extrude-shape2/index.vue";

const routerList02: RouteRecordRaw[] = [
  {
    path: '/list/geometry-extrude-shape2',
    name: 'GeometryExtrudeShape2',
    meta: {title: "geometry-extrude-shape2"},
    component: GeometryExtrudeShape2,
  },
];

export default routerList02;