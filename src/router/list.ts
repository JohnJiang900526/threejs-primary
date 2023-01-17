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
import WebglCameraArray from  "@/pages/model-list/details/008-webgl-camera-array/index.vue";
import WebglCameraCinematic from "@/pages/model-list/details/009-webgl-camera-cinematic/index.vue";
import LogarithMicdepthBuffer from "@/pages/model-list/details/010-logarithmic-depth-buffer/index.vue";
import WebglClipping from "@/pages/model-list/details/011-webgl-clipping/index.vue";
import ClippingAdvanced from "@/pages/model-list/details/012-clipping-advanced/index.vue";
import ClippingIntersection from "@/pages/model-list/details/013-clipping-intersection/index.vue";
import ClippingStencil from "@/pages/model-list/details/014-clipping-stencil/index.vue";
import WebglDecals from "@/pages/model-list/details/015-webgl-decals/index.vue";
import DepthTexture from "@/pages/model-list/details/016-depth-texture/index.vue";
import EffectsAnaglyph from "@/pages/model-list/details/017-effects-anaglyph/index.vue";
import EffectsAscii from "@/pages/model-list/details/018-effects-ascii/index.vue";
import EffectsParallaxbarrier from "@/pages/model-list/details/019-effects-parallaxbarrier/index.vue";

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
      },
      {
        path: '/list/webgl-camera-array',
        name: 'WebglCameraArray',
        meta: {title: "webgl-camera-array"},
        component: WebglCameraArray,
      },
      {
        path: '/list/webgl-camera-cinematic',
        name: 'WebglCameraCinematic',
        meta: {title: "webgl-camera-cinematic"},
        component: WebglCameraCinematic,
      },
      {
        path: '/list/logarithmic-depth-buffer',
        name: 'LogarithmicDepthBuffer',
        meta: {title: "logarithmic-depth-buffer"},
        component: LogarithMicdepthBuffer,
      },
      {
        path: '/list/webgl-clipping',
        name: 'WebglClipping',
        meta: {title: "webgl-clipping"},
        component: WebglClipping,
      },
      {
        path: '/list/clipping-advanced',
        name: 'ClippingAdvanced',
        meta: {title: "clipping-advanced"},
        component: ClippingAdvanced,
      },
      {
        path: '/list/clipping-intersection',
        name: 'ClippingIntersection',
        meta: {title: "clipping-intersection"},
        component: ClippingIntersection,
      },
      {
        path: '/list/clipping-stencil',
        name: 'ClippingStencil',
        meta: {title: "clipping-stencil"},
        component: ClippingStencil,
      },
      {
        path: '/list/webgl-decals',
        name: 'WebglDecals',
        meta: {title: "webgl-decals"},
        component: WebglDecals,
      },
      {
        path: '/list/depth-texture',
        name: 'DepthTexture',
        meta: {title: "depth-texture"},
        component: DepthTexture,
      },
      {
        path: '/list/effects-anaglyph',
        name: 'EffectsAnaglyph',
        meta: {title: "effects-anaglyph"},
        component: EffectsAnaglyph,
      },
      {
        path: '/list/effects-ascii',
        name: 'EffectsAscii',
        meta: {title: "effects-ascii"},
        component: EffectsAscii,
      },
      {
        path: '/list/effects-parallaxbarrier',
        name: 'EffectsParallaxbarrier',
        meta: {title: "effects-parallaxbarrier"},
        component: EffectsParallaxbarrier,
      },
    ]
  },
];

export default routes;
