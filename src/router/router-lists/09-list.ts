import type { RouteRecordRaw } from "vue-router";
import PostProcessing from "@/pages/model-list/detail09/241-post-processing/index.vue";
import PostProcessing3dlut from "@/pages/model-list/detail09/242-post-processing-3dlut/index.vue";
import PostProcessingAdvanced from "@/pages/model-list/detail09/243-post-processing-advanced/index.vue";
import PostProcessingImage from "@/pages/model-list/detail09/244-post-processing-image/index.vue";
import PostProcessingBackgrounds from "@/pages/model-list/detail09/245-post-processing-backgrounds/index.vue";
import PostProcessingCrossfade from "@/pages/model-list/detail09/246-post-processing-crossfade/index.vue";
import PostProcessingDof from "@/pages/model-list/detail09/247-post-processing-dof/index.vue";
import PostProcessingDof2 from "@/pages/model-list/detail09/248-post-processing-dof2/index.vue";
import PostProcessingFxaa from "@/pages/model-list/detail09/249-post-processing-fxaa/index.vue";
import PostProcessingGlitch from "@/pages/model-list/detail09/250-post-processing-glitch/index.vue";
import PostProcessingGodrays from "@/pages/model-list/detail09/251-post-processing-godrays/index.vue";
import PostProcessingRgbHalftone from "@/pages/model-list/detail09/252-post-processing-rgb-halftone/index.vue";
import PostProcessingMasking from "@/pages/model-list/detail09/253-post-processing-masking/index.vue";
import PostProcessingSsaa from "@/pages/model-list/detail09/254-post-processing-ssaa/index.vue";
import PostProcessingOutline from "@/pages/model-list/detail09/255-post-processing-outline/index.vue";
import PostProcessingPixel from "@/pages/model-list/detail09/256-post-processing-pixel/index.vue";
import PostProcessingProcedural from "@/pages/model-list/detail09/257-post-processing-procedural/index.vue";
import PostProcessingSao from "@/pages/model-list/detail09/258-post-processing-sao/index.vue";
import PostProcessingSmaa from "@/pages/model-list/detail09/259-post-processing-smaa/index.vue";
import PostProcessingSobel from "@/pages/model-list/detail09/260-post-processing-sobel/index.vue";
import PostProcessingSsao from "@/pages/model-list/detail09/261-post-processing-ssao/index.vue";
import PostProcessingSsr from "@/pages/model-list/detail09/262-post-processing-ssr/index.vue";
import PostProcessingTaa from "@/pages/model-list/detail09/263-post-processing-taa/index.vue";
import PostProcessingUnrealBloom from "@/pages/model-list/detail09/264-postprocessing-unreal-bloom/index.vue";
import UnrealBloomSelective from "@/pages/model-list/detail09/265-unreal-bloom-selective/index.vue";
import BufferGeometry from "@/pages/model-list/detail09/266-buffer-geometry/index.vue";
import BufferGeometryCompression from "@/pages/model-list/detail09/267-buffer-geometry-compression/index.vue";
import CustomAttributesParticles from "@/pages/model-list/detail09/268-custom-attributes-particles/index.vue";
import BufferGeometryDrawrange from "@/pages/model-list/detail09/269-buffer-geometry-drawrange/index.vue";
import Glbufferattribute from "@/pages/model-list/detail09/270-buffer-geometry-glbufferattribute/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-buffer-geometry-glbufferattribute',
    name: 'Glbufferattribute',
    meta: {title: "270.缓冲几何 Gl缓冲属性"},
    component: Glbufferattribute,
  },
  {
    path: '/list/webgl-buffer-geometry-drawrange',
    name: 'BufferGeometryDrawrange',
    meta: {title: "269.缓冲几何 绘制范围"},
    component: BufferGeometryDrawrange,
  },
  {
    path: '/list/webgl-custom-attributes-particles',
    name: 'CustomAttributesParticles',
    meta: {title: "268.自定义属性粒子"},
    component: CustomAttributesParticles,
  },
  {
    path: '/list/webgl-buffer-geometry-compression',
    name: 'BufferGeometryCompression',
    meta: {title: "267.缓冲几何 压缩"},
    component: BufferGeometryCompression,
  },
  {
    path: '/list/webgl-buffer-geometry',
    name: 'BufferGeometry',
    meta: {title: "266.缓冲几何"},
    component: BufferGeometry,
  },
  {
    path: '/list/webgl-post-processing-unreal-bloom-selective',
    name: 'UnrealBloomSelective',
    meta: {title: "265.后处理 可选择性假血"},
    component: UnrealBloomSelective,
  },
  {
    path: '/list/webgl-post-processing-unreal-bloom',
    name: 'PostProcessingUnrealBloom',
    meta: {title: "264.后处理 假血"},
    component: PostProcessingUnrealBloom,
  },
  {
    path: '/list/webgl-post-processing-taa',
    name: 'PostProcessingTaa',
    meta: {title: "263.后处理taa"},
    component: PostProcessingTaa,
  },
  {
    path: '/list/webgl-post-processing-ssr',
    name: 'PostProcessingSsr',
    meta: {title: "262.后处理ssr"},
    component: PostProcessingSsr,
  },
  {
    path: '/list/webgl-post-processing-ssao',
    name: 'PostProcessingSsao',
    meta: {title: "261.后处理ssao"},
    component: PostProcessingSsao,
  },
  {
    path: '/list/webgl-post-processing-sobel',
    name: 'PostProcessingSobel',
    meta: {title: "260.后处理sobel"},
    component: PostProcessingSobel,
  },
  {
    path: '/list/webgl-post-processing-smaa',
    name: 'PostProcessingSmaa',
    meta: {title: "259.后处理smaa"},
    component: PostProcessingSmaa,
  },
  {
    path: '/list/webgl-post-processing-sao',
    name: 'PostProcessingSao',
    meta: {title: "258.后处理sao"},
    component: PostProcessingSao,
  },
  {
    path: '/list/webgl-post-processing-procedural',
    name: 'PostProcessingProcedural',
    meta: {title: "257.后处理 过程抽象"},
    component: PostProcessingProcedural,
  },
  {
    path: '/list/webgl-post-processing-pixel',
    name: 'PostProcessingPixel',
    meta: {title: "256.后处理像素"},
    component: PostProcessingPixel,
  },
  {
    path: '/list/webgl-post-processing-outline',
    name: 'PostProcessingOutline',
    meta: {title: "255.后处理轮廓"},
    component: PostProcessingOutline,
  },
  {
    path: '/list/webgl-post-processing-ssaa',
    name: 'PostProcessingSsaa',
    meta: {title: "254.后处理ssaa"},
    component: PostProcessingSsaa,
  },
  {
    path: '/list/webgl-post-processing-masking',
    name: 'PostProcessingMasking',
    meta: {title: "253.后处理 屏蔽"},
    component: PostProcessingMasking,
  },
  {
    path: '/list/webgl-post-processing-rgb-halftone',
    name: 'PostProcessingRgbHalftone',
    meta: {title: "252.后处理rgb半色调"},
    component: PostProcessingRgbHalftone,
  },
  {
    path: '/list/webgl-post-processing-godrays',
    name: 'PostProcessingGodrays',
    meta: {title: "webgl-post-processing-godrays"},
    component: PostProcessingGodrays,
  },
  {
    path: '/list/webgl-post-processing-glitch',
    name: 'PostProcessingGlitch',
    meta: {title: "webgl-post-processing-glitch"},
    component: PostProcessingGlitch,
  },
  {
    path: '/list/webgl-post-processing-fxaa',
    name: 'PostProcessingFxaa',
    meta: {title: "webgl-post-processing-fxaa"},
    component: PostProcessingFxaa,
  },
  {
    path: '/list/webgl-post-processing-dof2',
    name: 'PostProcessingDof2',
    meta: {title: "webgl-post-processing-dof2"},
    component: PostProcessingDof2,
  },
  {
    path: '/list/webgl-post-processing-dof',
    name: 'PostProcessingDof',
    meta: {title: "webgl-post-processing-dof"},
    component: PostProcessingDof,
  },
  {
    path: '/list/webgl-post-processing-crossfade',
    name: 'PostProcessingCrossfade',
    meta: {title: "webgl-post-processing-crossfade"},
    component: PostProcessingCrossfade,
  },
  {
    path: '/list/webgl-post-processing-backgrounds',
    name: 'PostProcessingBackgrounds',
    meta: {title: "webgl-post-processing-backgrounds"},
    component: PostProcessingBackgrounds,
  },
  {
    path: '/list/webgl-post-processing-image',
    name: 'PostProcessingImage',
    meta: {title: "webgl-post-processing-image"},
    component: PostProcessingImage,
  },
  {
    path: '/list/webgl-post-processing-advanced',
    name: 'PostProcessingAdvanced',
    meta: {title: "webgl-post-processing-advanced"},
    component: PostProcessingAdvanced,
  },
  {
    path: '/list/webgl-post-processing-3dlut',
    name: 'PostProcessing3dlut',
    meta: {title: "webgl-post-processing-3dlut"},
    component: PostProcessing3dlut,
  },
  {
    path: '/list/webgl-post-processing',
    name: 'PostProcessing',
    meta: {title: "webgl-post-processing"},
    component: PostProcessing,
  },
];

export default routerList;