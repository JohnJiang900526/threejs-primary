import type { RouteRecordRaw } from "vue-router";

import Welcome from "@/pages/welcome/index.vue";
import List from "@/pages/model-list/index.vue";

import Demo from "@/pages/model-list/details/000-demo/index.vue";
import KeyFrame from "@/pages/model-list/details/001-keyframe/index.vue";
import SkinningBlending from "@/pages/model-list/details/002-skinning-blending/index.vue";
import SkinningAdditiveBlending from "@/pages/model-list/details/003-skinning-additive-blending/index.vue";
import SkinningIk from "@/pages/model-list/details/004-skinning_ik/index.vue";
import SkinningMorph from "@/pages/model-list/details/005-skinning-morph/index.vue";
import AnimationMultiple from "@/pages/model-list/details/006-animation-multiple/index.vue";
import WebglCamera from "@/pages/model-list/details/007-webgl-camera/index.vue";

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Welcome',
    meta: {title: "欢迎来到我的首页"},
    component: Welcome
  },
  {
    path: '/list',
    name: 'List',
    meta: {title: "模型列表"},
    component: List,
    children: [
      {
        path: '/list/demo',
        name: 'Demo',
        meta: {title: "矩形阵列"},
        component: Demo,
      },
      {
        path: '/list/key-frame',
        name: 'KeyFrame',
        meta: {title: "animation-keyframes"},
        component: KeyFrame,
      },
      {
        path: '/list/skinning-blending',
        name: 'SkinningBlending',
        meta: {title: "skinning-blending"},
        component: SkinningBlending,
      },
      {
        path: '/list/skinning-additive-blending',
        name: 'SkinningAdditiveBlending',
        meta: {title: "skinning-additive-blending"},
        component: SkinningAdditiveBlending,
      },
      {
        path: '/list/skinning-ik',
        name: 'SkinningIk',
        meta: {title: "skinning-ik"},
        component: SkinningIk,
      },
      {
        path: '/list/skinning-morph',
        name: 'SkinningMorph',
        meta: {title: "skinning-morph"},
        component: SkinningMorph,
      },
      {
        path: '/list/animation-multiple',
        name: 'AnimationMultiple',
        meta: {title: "animation-multiple"},
        component: AnimationMultiple,
      },
      {
        path: '/list/webgl-camera',
        name: 'WebglCamera',
        meta: {title: "webgl-camera"},
        component: WebglCamera,
      }
    ]
  },
];

export default routes;
