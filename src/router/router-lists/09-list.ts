import type { RouteRecordRaw } from "vue-router";
import PostProcessing from "@/pages/model-list/detail09/241-post-processing/index.vue";
import PostProcessing3dlut from "@/pages/model-list/detail09/242-post-processing-3dlut/index.vue";

const routerList: RouteRecordRaw[] = [
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