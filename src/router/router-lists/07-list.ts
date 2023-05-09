import type { RouteRecordRaw } from "vue-router";

import ModifierMorphTargetsFace from "@/pages/model-list/detail07/181-morph-targets-face/index.vue";
import ModifierMorphTargetsHorse from "@/pages/model-list/detail07/182-morph-targets-horse/index.vue";


const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-morph-targets-horse',
    name: 'ModifierMorphTargetsHorse',
    meta: {title: "webgl-morph-targets-horse"},
    component: ModifierMorphTargetsHorse,
  },
  {
    path: '/list/webgl-morph-targets-face',
    name: 'ModifierMorphTargetsFace',
    meta: {title: "webgl-morph-targets-face"},
    component: ModifierMorphTargetsFace,
  },
]

export default routerList;