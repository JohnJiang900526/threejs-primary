import type { RouteRecordRaw } from "vue-router";

import LoaderGltfVariants from "@/pages/model-list/detail04/091-loader-gltf-variants/index.vue";
import LoaderIfc from "@/pages/model-list/detail04/092-loader-ifc/index.vue";
import LoaderBitmap from "@/pages/model-list/detail04/093-loader-bitmap/index.vue";
import LoaderKmz from "@/pages/model-list/detail04/094-loader-kmz/index.vue";
import LoaderIdraw from "@/pages/model-list/detail04/095-loader-idraw/index.vue";
import LoaderLwo from "@/pages/model-list/detail04/096-loader-lwo/index.vue";
import LoaderMd2 from "@/pages/model-list/detail04/097-loader-md2/index.vue";
import LoaderMd2Control from "@/pages/model-list/detail04/098-loader-md2-control/index.vue";
import LoaderMdd from "@/pages/model-list/detail04/099-loader-mdd/index.vue";
import LoaderMmd from "@/pages/model-list/detail04/100-loader-mmd/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/loader-mmd',
    name: 'LoaderMmd',
    meta: {title: "loader-mmd"},
    component: LoaderMmd,
  },
  {
    path: '/list/loader-mdd',
    name: 'LoaderMdd',
    meta: {title: "loader-mdd"},
    component: LoaderMdd,
  },
  {
    path: '/list/loader-md2-control',
    name: 'LoaderMd2Control',
    meta: {title: "loader-md2-control"},
    component: LoaderMd2Control,
  },
  {
    path: '/list/loader-md2',
    name: 'LoaderMd2',
    meta: {title: "loader-md2"},
    component: LoaderMd2,
  },
  {
    path: '/list/loader-lwo',
    name: 'LoaderLwo',
    meta: {title: "loader-lwo"},
    component: LoaderLwo,
  },
  {
    path: '/list/loader-idraw',
    name: 'LoaderIdraw',
    meta: {title: "loader-idraw"},
    component: LoaderIdraw,
  },
  {
    path: '/list/loader-kmz',
    name: 'LoaderKmz',
    meta: {title: "loader-kmz"},
    component: LoaderKmz,
  },
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