import type { RouteRecordRaw } from "vue-router";

import LoaderTextureTga from "@/pages/model-list/detail05/121-loader-texture-tga/index.vue";
import LoaderTextureTiff from "@/pages/model-list/detail05/122-loader-texture-tiff/index.vue";
import LoaderTtf from "@/pages/model-list/detail05/123-loader-ttf/index.vue";
import LoaderUsdz from "@/pages/model-list/detail05/124-loader-usdz/index.vue";
import LoaderVox from "@/pages/model-list/detail05/125-loader-vox/index.vue";

const routerList: RouteRecordRaw[] = [
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