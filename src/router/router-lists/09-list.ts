import type { RouteRecordRaw } from "vue-router";
import PostProcessing from "@/pages/model-list/detail09/241-post-processing/index.vue";
import PostProcessing3dlut from "@/pages/model-list/detail09/242-post-processing-3dlut/index.vue";
import PostProcessingAdvanced from "@/pages/model-list/detail09/243-post-processing-advanced/index.vue";
import PostProcessingImage from "@/pages/model-list/detail09/244-post-processing-image/index.vue";
import PostProcessingBackgrounds from "@/pages/model-list/detail09/245-post-processing-backgrounds/index.vue";


const routerList: RouteRecordRaw[] = [
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