import type { RouteRecordRaw } from "vue-router";

import LoaderTextureTga from "@/pages/model-list/detail05/121-loader-texture-tga/index.vue";
import LoaderTextureTiff from "@/pages/model-list/detail05/122-loader-texture-tiff/index.vue";
import LoaderTtf from "@/pages/model-list/detail05/123-loader-ttf/index.vue";
import LoaderUsdz from "@/pages/model-list/detail05/124-loader-usdz/index.vue";
import LoaderVox from "@/pages/model-list/detail05/125-loader-vox/index.vue";
import LoaderVrml from "@/pages/model-list/detail05/126-loader-vrml/index.vue";
import LoaderVtk from "@/pages/model-list/detail05/127-loader-vtk/index.vue";
import LoaderXyz from "@/pages/model-list/detail05/128-loader-xyz/index.vue";
import WebglLod from "@/pages/model-list/detail05/129-webgl-lod/index.vue";
import WebglMarchingcubes from "@/pages/model-list/detail05/130-webgl-marchingcubes/index.vue";
import WebglMaterials from "@/pages/model-list/detail05/131-webgl-materials/index.vue";
import WebglMaterialsBlending from "@/pages/model-list/detail05/132-webgl-materials-blending/index.vue";
import WebglMaterialsBlendingCustom from "@/pages/model-list/detail05/133-materials-blending-custom/index.vue";
import MaterialsMaterialsBumpmap from "@/pages/model-list/detail05/134-materials-bumpmap/index.vue";
import MaterialsMaterialsCar from "@/pages/model-list/detail05/135-materials-car/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-materials-car',
    name: 'MaterialsMaterialsCar',
    meta: {title: "webgl-materials-car"},
    component: MaterialsMaterialsCar,
  },
  {
    path: '/list/webgl-materials-bumpmap',
    name: 'MaterialsMaterialsBumpmap',
    meta: {title: "webgl-materials-bumpmap"},
    component: MaterialsMaterialsBumpmap,
  },
  {
    path: '/list/webgl-materials-blending-custom',
    name: 'WebglMaterialsBlendingCustom',
    meta: {title: "webgl-materials-blending-custom"},
    component: WebglMaterialsBlendingCustom,
  },
  {
    path: '/list/webgl-materials-blending',
    name: 'WebglMaterialsBlending',
    meta: {title: "webgl-materials-blending"},
    component: WebglMaterialsBlending,
  },
  {
    path: '/list/webgl-materials',
    name: 'WebglMaterials',
    meta: {title: "webgl-materials"},
    component: WebglMaterials,
  },
  {
    path: '/list/webgl-marchingcubes',
    name: 'WebglMarchingcubes',
    meta: {title: "webgl-marchingcubes"},
    component: WebglMarchingcubes,
  },
  {
    path: '/list/webgl-lod',
    name: 'WebglLod',
    meta: {title: "webgl-lod"},
    component: WebglLod,
  },
  {
    path: '/list/loader-xyz',
    name: 'LoaderXyz',
    meta: {title: "loader-xyz"},
    component: LoaderXyz,
  },
  {
    path: '/list/loader-vtk',
    name: 'LoaderVtk',
    meta: {title: "loader-vtk"},
    component: LoaderVtk,
  },
  {
    path: '/list/loader-vrml',
    name: 'LoaderVrml',
    meta: {title: "loader-vrml"},
    component: LoaderVrml,
  },
  {
    path: '/list/loader-vox',
    name: 'LoaderVox',
    meta: {title: "loader-vox"},
    component: LoaderVox,
  },
  {
    path: '/list/loader-usdz',
    name: 'LoaderUsdz',
    meta: {title: "loader-usdz"},
    component: LoaderUsdz,
  },
  {
    path: '/list/loader-ttf',
    name: 'LoaderTtf',
    meta: {title: "loader-ttf"},
    component: LoaderTtf,
  },
  {
    path: '/list/loader-texture-tiff',
    name: 'LoaderTextureTiff',
    meta: {title: "loader-texture-tiff"},
    component: LoaderTextureTiff,
  },
  {
    path: '/list/loader-texture-tga',
    name: 'LoaderTextureTga',
    meta: {title: "loader-texture-tga"},
    component: LoaderTextureTga,
  },
];

export default routerList;