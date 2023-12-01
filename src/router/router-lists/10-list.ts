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
import BuffergeometryUint from "@/pages/model-list/detail10/281-buffergeometry-uint/index.vue";
import CustomAttributes from "@/pages/model-list/detail10/282-custom-attributes/index.vue";
import CustomAttributesLines from "@/pages/model-list/detail10/283-custom-attributes-lines/index.vue";
import CustomAttributesPoints from "@/pages/model-list/detail10/284-custom-attributes-points/index.vue";
import CustomAttributesPoints2 from "@/pages/model-list/detail10/285-custom-attributes-points2/index.vue";
import CustomAttributesPoints3 from "@/pages/model-list/detail10/286-custom-attributes-points3/index.vue";
import GpgpuBirds from "@/pages/model-list/detail10/287-gpgpu-birds/index.vue";
import GpgpuBirdsGLTF from "@/pages/model-list/detail10/288-gpgpu-birds-gltf/index.vue";
import GpgpuWater from "@/pages/model-list/detail10/289-gpgpu-water/index.vue";
import GpgpuProtoplanet from "@/pages/model-list/detail10/290-gpgpu-protoplanet/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-gpgpu-protoplanet',
    name: 'GpgpuProtoplanet',
    meta: {title: "290.GP GPU 地球"},
    component: GpgpuProtoplanet,
  },
  {
    path: '/list/webgl-gpgpu-water',
    name: 'GpgpuWater',
    meta: {title: "289.GP GPU 水波"},
    component: GpgpuWater,
  },
  {
    path: '/list/webgl-gpgpu-birds-gltf',
    name: 'GpgpuBirdsGLTF',
    meta: {title: "288.GP GPU birds动图"},
    component: GpgpuBirdsGLTF,
  },
  {
    path: '/list/webgl-gpgpu-birds',
    name: 'GpgpuBirds',
    meta: {title: "287.GP GPU birds"},
    component: GpgpuBirds,
  },
  {
    path: '/list/webgl-custom-attributes-points3',
    name: 'CustomAttributesPoints3',
    meta: {title: "286.自定义属性 点3"},
    component: CustomAttributesPoints3,
  },
  {
    path: '/list/webgl-custom-attributes-points2',
    name: 'CustomAttributesPoints2',
    meta: {title: "285.自定义属性 点2"},
    component: CustomAttributesPoints2,
  },
  {
    path: '/list/webgl-custom-attributes-points',
    name: 'CustomAttributesPoints',
    meta: {title: "284.自定义属性 点"},
    component: CustomAttributesPoints,
  },
  {
    path: '/list/webgl-custom-attributes-lines',
    name: 'CustomAttributesLines',
    meta: {title: "283.自定义属性 线"},
    component: CustomAttributesLines,
  },
  {
    path: '/list/webgl-custom-attributes',
    name: 'CustomAttributes',
    meta: {title: "282.自定义属性"},
    component: CustomAttributes,
  },
  {
    path: '/list/webgl-buffergeometry-uint',
    name: 'BuffergeometryUint',
    meta: {title: "281.缓冲集合 单元"},
    component: BuffergeometryUint,
  },
  {
    path: '/list/webgl-buffergeometry-selective-draw',
    name: 'BuffergeometrySelectiveDraw',
    meta: {title: "280.缓冲集合 选择性绘制"},
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