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


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-post-processing-masking',
    name: 'PostProcessingMasking',
    meta: {title: "webgl-post-processing-masking"},
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