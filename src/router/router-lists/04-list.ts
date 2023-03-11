import type { RouteRecordRaw } from "vue-router";

import LoaderGltfVariants from "@/pages/model-list/detail04/091-loader-gltf-variants/index.vue";
import LoaderIfc from "@/pages/model-list/detail04/092-loader-ifc/index.vue";
import LoaderBitmap from "@/pages/model-list/detail04/093-loader-bitmap/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/loader-bitmap',
    name: 'LoaderBitmap',
    meta: {title: "loader-bitmap"},
    component: LoaderBitmap,
  },
  {
    path: '/list/loader-ifc',
    name: 'LoaderIfc',
    meta: {title: "loader-ifc"},
    component: LoaderIfc,
  },
  {
    path: '/list/loader-gltf-variants',
    name: 'LoaderGltfVariants',
    meta: {title: "loader-gltf-variants"},
    component: LoaderGltfVariants,
  },
];

export default routerList;