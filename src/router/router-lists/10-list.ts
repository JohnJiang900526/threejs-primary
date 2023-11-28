import type { RouteRecordRaw } from "vue-router";

import BuffergeometryIndexed from "@/pages/model-list/detail10/271-buffergeometry-indexed/index.vue";
import BuffergeometryInstancing from "@/pages/model-list/detail10/272-buffergeometry-instancing/index.vue";
import BuffergeometryInstancingBillboards from "@/pages/model-list/detail10/273-buffergeometry-instancing-billboards/index.vue";
import BuffergeometryInstancingInterleaved from "@/pages/model-list/detail10/274-buffergeometry-instancing-interleaved/index.vue";
import BuffergeometryLines from "@/pages/model-list/detail10/275-buffergeometry-lines/index.vue";
import BuffergeometryLinesIndexed from "@/pages/model-list/detail10/276-buffergeometry-lines-indexed/index.vue";
import BuffergeometryPoints from "@/pages/model-list/detail10/277-buffergeometry-points/index.vue";
import BuffergeometryPointsInterleaved from "@/pages/model-list/detail10/278-buffergeometry-points-interleaved/index.vue";
import BuffergeometryRawshader from "@/pages/model-list/detail10/279-buffergeometry-rawshader/index.vue";
import BuffergeometrySelectiveDraw from "@/pages/model-list/detail10/280-buffergeometry-selective-draw/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-buffergeometry-selective-draw',
    name: 'BuffergeometrySelectiveDraw',
    meta: {title: "279.缓冲集合 选择性绘制"},
    component: BuffergeometrySelectiveDraw,
  },
  {
    path: '/list/webgl-buffergeometry-rawshader',
    name: 'BuffergeometryRawshader',
    meta: {title: "279.缓冲集合 原始材质"},
    component: BuffergeometryRawshader,
  },
  {
    path: '/list/webgl-buffergeometry-points-interleaved',
    name: 'BuffergeometryPointsInterleaved',
    meta: {title: "278.缓冲集合 点交叉"},
    component: BuffergeometryPointsInterleaved,
  },
  {
    path: '/list/webgl-buffergeometry-points',
    name: 'BuffergeometryPoints',
    meta: {title: "277.缓冲集合 点"},
    component: BuffergeometryPoints,
  },
  {
    path: '/list/webgl-buffergeometry-lines-indexed',
    name: 'BuffergeometryLinesIndexed',
    meta: {title: "276.缓冲集合 线索引"},
    component: BuffergeometryLinesIndexed,
  },
  {
    path: '/list/webgl-buffergeometry-lines',
    name: 'BuffergeometryLines',
    meta: {title: "275.缓冲集合 线"},
    component: BuffergeometryLines,
  },
  {
    path: '/list/webgl-buffergeometry-instancing-interleaved',
    name: 'BuffergeometryInstancingInterleaved',
    meta: {title: "274.缓冲集合 实例化交叉点"},
    component: BuffergeometryInstancingInterleaved,
  },
  {
    path: '/list/webgl-buffergeometry-instancing-billboards',
    name: 'BuffergeometryInstancingBillboards',
    meta: {title: "273.缓冲集合 实例化广告牌"},
    component: BuffergeometryInstancingBillboards,
  },
  {
    path: '/list/webgl-buffergeometry-instancing',
    name: 'BuffergeometryInstancing',
    meta: {title: "272.缓冲集合 实例化"},
    component: BuffergeometryInstancing,
  },
  {
    path: '/list/webgl-buffergeometry-indexed',
    name: 'BuffergeometryIndexed',
    meta: {title: "271.缓冲集合 索引"},
    component: BuffergeometryIndexed,
  },
];

export default routerList;