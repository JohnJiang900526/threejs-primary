import type { RouteRecordRaw } from "vue-router";

import MaterialsPhysicalClearcoat from "@/pages/model-list/detail06/151-materials-physical-clearcoat/index.vue";
import MaterialsPhysicalReflectivity from "@/pages/model-list/detail06/152-materials-physical-reflectivity/index.vue";


const routerList: RouteRecordRaw[] = [
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