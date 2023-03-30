import type { RouteRecordRaw } from "vue-router";

import LoaderTextureTga from "@/pages/model-list/detail05/121-loader-texture-tga/index.vue";
import LoaderTextureTiff from "@/pages/model-list/detail05/122-loader-texture-tiff/index.vue";
import LoaderTtf from "@/pages/model-list/detail05/123-loader-ttf/index.vue";

const routerList: RouteRecordRaw[] = [
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