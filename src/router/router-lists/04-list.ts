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
import LoaderMmdPose from "@/pages/model-list/detail04/101-loader-mmd-pose/index.vue";
import LoaderMmdAudio from "@/pages/model-list/detail04/102-loader-mmd-audio/index.vue";
import LoaderNrrd from "@/pages/model-list/detail04/103-loader-nrrd/index.vue";
import LoaderObj from "@/pages/model-list/detail04/104-loader-obj/index.vue";
import LoaderObjMlt from "@/pages/model-list/detail04/105-loader-obj-mlt/index.vue";
import LoaderPcd from "@/pages/model-list/detail04/106-loader-pcd/index.vue";
import LoaderPbd from "@/pages/model-list/detail04/107-loader-pdb/index.vue";
import LoaderPly from "@/pages/model-list/detail04/108-loader-ply/index.vue";
import LoaderPrwn from "@/pages/model-list/detail04/109-loader-prwm/index.vue";
import LoaderStl from "@/pages/model-list/detail04/110-loader-stl/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/loader-stl',
    name: 'LoaderStl',
    meta: {title: "loader-stl"},
    component: LoaderStl,
  },
  {
    path: '/list/loader-prwn',
    name: 'LoaderPrwn',
    meta: {title: "loader-prwn"},
    component: LoaderPrwn,
  },
  {
    path: '/list/loader-ply',
    name: 'LoaderPly',
    meta: {title: "loader-ply"},
    component: LoaderPly,
  },
  {
    path: '/list/loader-pbd',
    name: 'LoaderPbd',
    meta: {title: "loader-pbd"},
    component: LoaderPbd,
  },
  {
    path: '/list/loader-pcd',
    name: 'LoaderPcd',
    meta: {title: "loader-pcd"},
    component: LoaderPcd,
  },
  {
    path: '/list/loader-obj-mlt',
    name: 'LoaderObjMlt',
    meta: {title: "loader-obj-mlt"},
    component: LoaderObjMlt,
  },
  {
    path: '/list/loader-obj',
    name: 'LoaderObj',
    meta: {title: "loader-obj"},
    component: LoaderObj,
  },
  {
    path: '/list/loader-nrrd',
    name: 'LoaderNrrd',
    meta: {title: "loader-nrrd"},
    component: LoaderNrrd,
  },
  {
    path: '/list/loader-mmd-audio',
    name: 'LoaderMmdAudio',
    meta: {title: "loader-mmd-audio"},
    component: LoaderMmdAudio,
  },
  {
    path: '/list/loader-mmd-pose',
    name: 'LoaderMmdPose',
    meta: {title: "loader-mmd-pose"},
    component: LoaderMmdPose,
  },
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