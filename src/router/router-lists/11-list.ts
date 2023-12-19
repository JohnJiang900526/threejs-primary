import type { RouteRecordRaw } from "vue-router";
import BuffergeometryAttributesNone from "@/pages/model-list/detail11/301-buffergeometry-attributes-none/index.vue";
import MaterialsTexture2dArray from "@/pages/model-list/detail11/302-materials-texture-2d-array/index.vue";
import MaterialsTexture3d from "@/pages/model-list/detail11/303-materials-texture-3d/index.vue";
import MaterialsTexture3dPartialupdate from "@/pages/model-list/detail11/304-materials-texture-3d-partialupdate/index.vue";
import MultipleRenderTargets from "@/pages/model-list/detail11/305-multiple-rendertargets/index.vue";
import MultiSampledRenderBuffers from "@/pages/model-list/detail11/306-multisampled-render-buffers/index.vue";
import RenderTargetTexture2dArray from "@/pages/model-list/detail11/307-rendertarget-texture-2d-array/index.vue";
import Texture2dArrayCompressed from "@/pages/model-list/detail11/308-texture-2d-array-compressed/index.vue";
import Webgl2Ubo from "@/pages/model-list/detail11/309-webgl2-ubo/index.vue";
import VolumeCloud from "@/pages/model-list/detail11/310-volume-cloud/index.vue";
import VolumeInstancing from "@/pages/model-list/detail11/311-volume-instancing/index.vue";
import VolumePerlin from "@/pages/model-list/detail11/312-volume-perlin/index.vue";
import GpuAudioProcessing from "@/pages/model-list/detail11/313-gpu-audio-processing/index.vue";
import GpuCompute from "@/pages/model-list/detail11/314-gpu-compute/index.vue";
import CubemapAdjustments from "@/pages/model-list/detail11/315-gpu-cubemap-adjustments/index.vue";
import CubemapMix from "@/pages/model-list/detail11/316-gpu-cubemap-mix/index.vue";
import GpuDepthTexture from "@/pages/model-list/detail11/317-gpu-depth-texture/index.vue";
import GpuEquirectangular from "@/pages/model-list/detail11/318-gpu-equirectangular/index.vue";
import GpuInstanceMesh from "@/pages/model-list/detail11/319-gpu-instance-mesh/index.vue";
import GpuInstanceUniform from "@/pages/model-list/detail11/320-gpu-instance-uniform/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-gpu-instance-uniform',
    name: 'GpuInstanceUniform',
    meta: {title: "320.GPU实例化网格"},
    component: GpuInstanceUniform,
  },
  {
    path: '/list/webgl-gpu-instance-mesh',
    name: 'GpuInstanceMesh',
    meta: {title: "319.GPU实例化网格"},
    component: GpuInstanceMesh,
  },
  {
    path: '/list/webgl-gpu-equirectangular',
    name: 'GpuEquirectangular',
    meta: {title: "318.GPU球面投影"},
    component: GpuEquirectangular,
  },
  {
    path: '/list/webgl-gpu-depth-texture',
    name: 'GpuDepthTexture',
    meta: {title: "317.GPU深度纹理"},
    component: GpuDepthTexture,
  },
  {
    path: '/list/webgl-gpu-cubemap-mix',
    name: 'CubemapMix',
    meta: {title: "316.GPU立方体图混合"},
    component: CubemapMix,
  },
  {
    path: '/list/webgl-gpu-cubemap-adjustments',
    name: 'CubemapAdjustments',
    meta: {title: "315.GPU立方体图调整"},
    component: CubemapAdjustments,
  },
  {
    path: '/list/webgl-gpu-compute',
    name: 'GpuCompute',
    meta: {title: "314.GPU计算"},
    component: GpuCompute,
  },
  {
    path: '/list/webgl-gpu-audio-processing',
    name: 'GpuAudioProcessing',
    meta: {title: "313.音频处理"},
    component: GpuAudioProcessing,
  },
  {
    path: '/list/webgl-volume-perlin',
    name: 'VolumePerlin',
    meta: {title: "312.volume 噪声"},
    component: VolumePerlin,
  },
  {
    path: '/list/webgl-volume-instancing',
    name: 'VolumeInstancing',
    meta: {title: "311.volume实例化"},
    component: VolumeInstancing,
  },
  {
    path: '/list/webgl-volume-cloud',
    name: 'VolumeCloud',
    meta: {title: "310.卷云"},
    component: VolumeCloud,
  },
  {
    path: '/list/webgl-webgl2-ubo',
    name: 'Webgl2Ubo',
    meta: {title: "309.webgl2 ubo"},
    component: Webgl2Ubo,
  },
  {
    path: '/list/webgl-texture-2d-array-compressed',
    name: 'Texture2dArrayCompressed',
    meta: {title: "308.纹理2d数组压缩"},
    component: Texture2dArrayCompressed,
  },
  {
    path: '/list/webgl-rendertarget-texture-2d-array',
    name: 'RenderTargetTexture2dArray',
    meta: {title: "307.渲染目标2d纹理数组"},
    component: RenderTargetTexture2dArray,
  },
  {
    path: '/list/webgl-multisampled-render-buffers',
    name: 'MultiSampledRenderBuffers',
    meta: {title: "306.多样本渲染缓冲"},
    component: MultiSampledRenderBuffers,
  },
  {
    path: '/list/webgl-multiple-rendertargets',
    name: 'MultipleRenderTargets',
    meta: {title: "305.多个渲染目标"},
    component: MultipleRenderTargets,
  },
  {
    path: '/list/webgl-materials-texture-3d-partialupdate',
    name: 'MaterialsTexture3dPartialupdate',
    meta: {title: "304.材质纹理 3d部分更新"},
    component: MaterialsTexture3dPartialupdate,
  },
  {
    path: '/list/webgl-materials-texture-3d',
    name: 'MaterialsTexture3d',
    meta: {title: "303.材质贴图 3d"},
    component: MaterialsTexture3d,
  },
  {
    path: '/list/webgl-materials-texture-2d-array',
    name: 'MaterialsTexture2dArray',
    meta: {title: "302.材质贴图 2d数组"},
    component: MaterialsTexture2dArray,
  },
  {
    path: '/list/webgl-buffergeometry-attributes-none',
    name: 'BuffergeometryAttributesNone',
    meta: {title: "301.缓冲集合 属性none"},
    component: BuffergeometryAttributesNone,
  },
];

export default routerList;