import type { RouteRecordRaw } from "vue-router";

import MaterialsPhysicalClearcoat from "@/pages/model-list/detail06/151-materials-physical-clearcoat/index.vue";
import MaterialsPhysicalReflectivity from "@/pages/model-list/detail06/152-materials-physical-reflectivity/index.vue";
import MaterialsPhysicalTransmission from "@/pages/model-list/detail06/153-materials-physical-transmission/index.vue";
import MaterialsStandard from "@/pages/model-list/detail06/154-materials-standard/index.vue";
import MaterialsSubsurfaceScattering from "@/pages/model-list/detail06/155-materials-subsurface-scattering/index.vue";
import MaterialsTextureAnisotropy from "@/pages/model-list/detail06/156-materials-texture-anisotropy/index.vue";
import MaterialsTextureCanvas from "@/pages/model-list/detail06/157-materials-texture-canvas/index.vue";
import MaterialsTextureFilters from "@/pages/model-list/detail06/158-materials-texture-filters/index.vue";
import MaterialsTextureManualmipmap from "@/pages/model-list/detail06/159-materials-texture-manualmipmap/index.vue";
import MaterialsTexturePartialupdate from "@/pages/model-list/detail06/160-materials-texture-partialupdate/index.vue";
import MaterialsTextureRotation from "@/pages/model-list/detail06/161-materials-texture-rotation/index.vue";
import MaterialsVariationsBasic from "@/pages/model-list/detail06/162-materials-variations-basic/index.vue";
import MaterialsVariationsLambert from "@/pages/model-list/detail06/163-materials-variations-lambert/index.vue";
import MaterialsVariationsPhong from "@/pages/model-list/detail06/164-materials-variations-phong/index.vue";
import MaterialsVariationsStandard from "@/pages/model-list/detail06/165-materials-variations-standard/index.vue";
import MaterialsVariationsPhysical from "@/pages/model-list/detail06/166-materials-variations-physical/index.vue";
import MaterialsVariationsToon from "@/pages/model-list/detail06/167-materials-variations-toon/index.vue";
import MaterialsVideo from "@/pages/model-list/detail06/168-materials-video/index.vue";
import MaterialsVideoWebcam from "@/pages/model-list/detail06/169-materials-video-webcam/index.vue";
import MaterialsWireframe from "@/pages/model-list/detail06/170-materials-wireframe/index.vue";



const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-materials-wireframe',
    name: 'MaterialsWireframe',
    meta: {title: "webgl-materials-wireframe"},
    component: MaterialsWireframe,
  },
  {
    path: '/list/webgl-materials-video-webcam',
    name: 'MaterialsVideoWebcam',
    meta: {title: "webgl-materials-video-webcam"},
    component: MaterialsVideoWebcam,
  },
  {
    path: '/list/webgl-materials-video',
    name: 'MaterialsVideo',
    meta: {title: "webgl-materials-video"},
    component: MaterialsVideo,
  },
  {
    path: '/list/webgl-materials-variations-toon',
    name: 'MaterialsVariationsToon',
    meta: {title: "webgl-materials-variations-toon"},
    component: MaterialsVariationsToon,
  },
  {
    path: '/list/webgl-materials-variations-physical',
    name: 'MaterialsVariationsPhysical',
    meta: {title: "webgl-materials-variations-physical"},
    component: MaterialsVariationsPhysical,
  },
  {
    path: '/list/webgl-materials-variations-standard',
    name: 'MaterialsVariationsStandard',
    meta: {title: "webgl-materials-variations-standard"},
    component: MaterialsVariationsStandard,
  },
  {
    path: '/list/webgl-materials-variations-phong',
    name: 'MaterialsVariationsPhong',
    meta: {title: "webgl-materials-variations-phong"},
    component: MaterialsVariationsPhong,
  },
  {
    path: '/list/webgl-materials-variations-lambert',
    name: 'MaterialsVariationsLambert',
    meta: {title: "webgl-materials-variations-lambert"},
    component: MaterialsVariationsLambert,
  },
  {
    path: '/list/webgl-materials-variations-basic',
    name: 'MaterialsVariationsBasic',
    meta: {title: "webgl-materials-variations-basic"},
    component: MaterialsVariationsBasic,
  },
  {
    path: '/list/webgl-materials-texture-rotation',
    name: 'MaterialsTextureRotation',
    meta: {title: "webgl-materials-texture-rotation"},
    component: MaterialsTextureRotation,
  },
  {
    path: '/list/webgl-materials-texture-partialupdate',
    name: 'MaterialsTexturePartialupdate',
    meta: {title: "webgl-materials-texture-partialupdate"},
    component: MaterialsTexturePartialupdate,
  },
  {
    path: '/list/webgl-materials-texture-manualmipmap',
    name: 'MaterialsTextureManualmipmap',
    meta: {title: "webgl-materials-texture-manualmipmap"},
    component: MaterialsTextureManualmipmap,
  },
  {
    path: '/list/webgl-materials-texture-filters',
    name: 'MaterialsTextureFilters',
    meta: {title: "webgl-materials-texture-filters"},
    component: MaterialsTextureFilters,
  },
  {
    path: '/list/webgl-materials-texture-canvas',
    name: 'MaterialsTextureCanvas',
    meta: {title: "webgl-materials-texture-canvas"},
    component: MaterialsTextureCanvas,
  },
  {
    path: '/list/webgl-materials-texture-anisotropy',
    name: 'MaterialsTextureAnisotropy',
    meta: {title: "webgl-materials-texture-anisotropy"},
    component: MaterialsTextureAnisotropy,
  },
  {
    path: '/list/webgl-materials-subsurface-scattering',
    name: 'MaterialsSubsurfaceScattering',
    meta: {title: "webgl-materials-subsurface-scattering"},
    component: MaterialsSubsurfaceScattering,
  },
  {
    path: '/list/webgl-materials-standard',
    name: 'MaterialsStandard',
    meta: {title: "webgl-materials-standard"},
    component: MaterialsStandard,
  },
  {
    path: '/list/webgl-materials-physical-transmission',
    name: 'MaterialsPhysicalTransmission',
    meta: {title: "webgl-materials-physical-transmission"},
    component: MaterialsPhysicalTransmission,
  },
  {
    path: '/list/webgl-materials-physical-reflectivity',
    name: 'MaterialsPhysicalReflectivity',
    meta: {title: "webgl-materials-physical-reflectivity"},
    component: MaterialsPhysicalReflectivity,
  },
  {
    path: '/list/webgl-materials-physical-clearcoat',
    name: 'MaterialsPhysicalClearcoat',
    meta: {title: "webgl-materials-physical-clearcoat"},
    component: MaterialsPhysicalClearcoat,
  },
]

export default routerList;