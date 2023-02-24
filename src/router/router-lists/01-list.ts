import type { RouteRecordRaw } from "vue-router";

import Demo from "@/pages/model-list/detail01/000-demo/index.vue";
import KeyFrame from "@/pages/model-list/detail01/001-keyframe/index.vue";
import SkinningBlending from "@/pages/model-list/detail01/002-skinning-blending/index.vue";
import SkinningAdditiveBlending from "@/pages/model-list/detail01/003-skinning-additive-blending/index.vue";
import SkinningIk from "@/pages/model-list/detail01/004-skinning_ik/index.vue";
import SkinningMorph from "@/pages/model-list/detail01/005-skinning-morph/index.vue";
import AnimationMultiple from "@/pages/model-list/detail01/006-animation-multiple/index.vue";
import WebglCamera from "@/pages/model-list/detail01/007-webgl-camera/index.vue";
import WebglCameraArray from  "@/pages/model-list/detail01/008-webgl-camera-array/index.vue";
import WebglCameraCinematic from "@/pages/model-list/detail01/009-webgl-camera-cinematic/index.vue";
import LogarithMicdepthBuffer from "@/pages/model-list/detail01/010-logarithmic-depth-buffer/index.vue";
import WebglClipping from "@/pages/model-list/detail01/011-webgl-clipping/index.vue";
import ClippingAdvanced from "@/pages/model-list/detail01/012-clipping-advanced/index.vue";
import ClippingIntersection from "@/pages/model-list/detail01/013-clipping-intersection/index.vue";
import ClippingStencil from "@/pages/model-list/detail01/014-clipping-stencil/index.vue";
import WebglDecals from "@/pages/model-list/detail01/015-webgl-decals/index.vue";
import DepthTexture from "@/pages/model-list/detail01/016-depth-texture/index.vue";
import EffectsAnaglyph from "@/pages/model-list/detail01/017-effects-anaglyph/index.vue";
import EffectsAscii from "@/pages/model-list/detail01/018-effects-ascii/index.vue";
import EffectsParallaxbarrier from "@/pages/model-list/detail01/019-effects-parallaxbarrier/index.vue";
import EffectsPeppersghost from "@/pages/model-list/detail01/020-effects-peppersghost/index.vue";
import EffectsStereo from "@/pages/model-list/detail01/021-effects-stereo/index.vue";
import FramebufferTexture from "@/pages/model-list/detail01/022-framebuffer-texture/index.vue";
import WebglGeometry from "@/pages/model-list/detail01/023-webgl-geometry/index.vue";
import GeometriesParametric from "@/pages/model-list/detail01/024-geometries-parametric/index.vue";
import GeometryColors from "@/pages/model-list/detail01/025-geometry-colors/index.vue";
import GeometryColorLookup from "@/pages/model-list/detail01/026-geometry-color-lookup/index.vue";
import GeometryConvex from "@/pages/model-list/detail01/027-geometry-convex/index.vue";
import GeometryCube from "@/pages/model-list/detail01/028-geometry-cube/index.vue";
import GeometryDynamic from "@/pages/model-list/detail01/029-geometry-dynamic/index.vue";
import GeometryExtrudeShape from "@/pages/model-list/detail01/030-geometry-extrude-shape/index.vue";

const routerList: RouteRecordRaw[] = [
  {
    path: '/list/geometry-extrude-shape',
    name: 'GeometryExtrudeShape',
    meta: {title: "geometry-extrude-shape"},
    component: GeometryExtrudeShape,
  },
  {
    path: '/list/geometry-dynamic',
    name: 'GeometryDynamic',
    meta: {title: "geometry-dynamic"},
    component: GeometryDynamic,
  },
  {
    path: '/list/geometry-cube',
    name: 'GeometryCube',
    meta: {title: "geometry-cube"},
    component: GeometryCube,
  },
  {
    path: '/list/geometry-convex',
    name: 'GeometryConvex',
    meta: {title: "geometry-convex"},
    component: GeometryConvex,
  },
  {
    path: '/list/geometry-color-lookup',
    name: 'GeometryColorLookup',
    meta: {title: "geometry-color-lookup"},
    component: GeometryColorLookup,
  },
  {
    path: '/list/geometry-colors',
    name: 'GeometryColors',
    meta: {title: "geometry-colors"},
    component: GeometryColors,
  },
  {
    path: '/list/geometries-parametric',
    name: 'GeometriesParametric',
    meta: {title: "geometries-parametric"},
    component: GeometriesParametric,
  },
  {
    path: '/list/webgl-geometry',
    name: 'WebglGeometry',
    meta: {title: "webgl-geometry"},
    component: WebglGeometry,
  },
  {
    path: '/list/framebuffer-texture',
    name: 'FramebufferTexture',
    meta: {title: "framebuffer-texture"},
    component: FramebufferTexture,
  },
  {
    path: '/list/effects-stereo',
    name: 'EffectsStereo',
    meta: {title: "effects-stereo"},
    component: EffectsStereo,
  },
  {
    path: '/list/effects-peppersghost',
    name: 'EffectsPeppersghost',
    meta: {title: "effects-peppersghost"},
    component: EffectsPeppersghost,
  },
  {
    path: '/list/effects-parallaxbarrier',
    name: 'EffectsParallaxbarrier',
    meta: {title: "effects-parallaxbarrier"},
    component: EffectsParallaxbarrier,
  },
  {
    path: '/list/effects-ascii',
    name: 'EffectsAscii',
    meta: {title: "effects-ascii"},
    component: EffectsAscii,
  },
  {
    path: '/list/effects-anaglyph',
    name: 'EffectsAnaglyph',
    meta: {title: "effects-anaglyph"},
    component: EffectsAnaglyph,
  },
  {
    path: '/list/depth-texture',
    name: 'DepthTexture',
    meta: {title: "depth-texture"},
    component: DepthTexture,
  },
  {
    path: '/list/webgl-decals',
    name: 'WebglDecals',
    meta: {title: "webgl-decals"},
    component: WebglDecals,
  },
  {
    path: '/list/clipping-stencil',
    name: 'ClippingStencil',
    meta: {title: "clipping-stencil"},
    component: ClippingStencil,
  },
  {
    path: '/list/clipping-intersection',
    name: 'ClippingIntersection',
    meta: {title: "clipping-intersection"},
    component: ClippingIntersection,
  },
  {
    path: '/list/clipping-advanced',
    name: 'ClippingAdvanced',
    meta: {title: "clipping-advanced"},
    component: ClippingAdvanced,
  },
  {
    path: '/list/webgl-clipping',
    name: 'WebglClipping',
    meta: {title: "webgl-clipping"},
    component: WebglClipping,
  },
  {
    path: '/list/logarithmic-depth-buffer',
    name: 'LogarithmicDepthBuffer',
    meta: {title: "logarithmic-depth-buffer"},
    component: LogarithMicdepthBuffer,
  },
  {
    path: '/list/webgl-camera-cinematic',
    name: 'WebglCameraCinematic',
    meta: {title: "webgl-camera-cinematic"},
    component: WebglCameraCinematic,
  },
  {
    path: '/list/webgl-camera-array',
    name: 'WebglCameraArray',
    meta: {title: "webgl-camera-array"},
    component: WebglCameraArray,
  },
  {
    path: '/list/webgl-camera',
    name: 'WebglCamera',
    meta: {title: "webgl-camera"},
    component: WebglCamera,
  },
  {
    path: '/list/animation-multiple',
    name: 'AnimationMultiple',
    meta: {title: "animation-multiple"},
    component: AnimationMultiple,
  },
  {
    path: '/list/skinning-morph',
    name: 'SkinningMorph',
    meta: {title: "skinning-morph"},
    component: SkinningMorph,
  },
  {
    path: '/list/skinning-ik',
    name: 'SkinningIk',
    meta: {title: "skinning-ik"},
    component: SkinningIk,
  },
  {
    path: '/list/skinning-additive-blending',
    name: 'SkinningAdditiveBlending',
    meta: {title: "skinning-additive-blending"},
    component: SkinningAdditiveBlending,
  },
  {
    path: '/list/skinning-blending',
    name: 'SkinningBlending',
    meta: {title: "skinning-blending"},
    component: SkinningBlending,
  },
  {
    path: '/list/key-frame',
    name: 'KeyFrame',
    meta: {title: "animation-keyframes"},
    component: KeyFrame,
  },
  {
    path: '/list/demo',
    name: 'Demo',
    meta: {title: "矩形阵列"},
    component: Demo,
  },
];

export default routerList;