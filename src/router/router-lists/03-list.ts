import type { RouteRecordRaw } from "vue-router";

import LightsPhysical from "@/pages/model-list/detail03/061-lights-physical/index.vue";
import LightsPointlights from "@/pages/model-list/detail03/062-lights-pointlights/index.vue";
import LightsSpotLight from "@/pages/model-list/detail03/063-lights-spotlight/index.vue";
import LightsSpotLights from "@/pages/model-list/detail03/064-lights-spotlights/index.vue";
import LightsRectareaLight from "@/pages/model-list/detail03/065-lights-rectarea-light/index.vue";
import LinesColors from "@/pages/model-list/detail03/066-lines-colors/index.vue";
import LinesDashed from "@/pages/model-list/detail03/067-lines-dashed/index.vue";
import LinesFat from "@/pages/model-list/detail03/068-lines-fat/index.vue";
import LinesFatRaycasting from "@/pages/model-list/detail03/069-lines-fat-raycasting/index.vue";
import LinesFatWireframe from "@/pages/model-list/detail03/070-lines-fat-wireframe/index.vue";
import LinesSphere from "@/pages/model-list/detail03/071-lines-sphere/index.vue";
import Loader3dm from "@/pages/model-list/detail03/072-loader-3dm/index.vue";
import Loader3ds from "@/pages/model-list/detail03/073-loader-3ds/index.vue";
import Loader3mf from "@/pages/model-list/detail03/074-loader-3mf/index.vue";
import Loader3mfMaterials from "@/pages/model-list/detail03/075-loader-3mf-materials/index.vue";
import LoaderAmf from "@/pages/model-list/detail03/076-loader-amf/index.vue";
import LoaderBvh from "@/pages/model-list/detail03/077-loader-bvh/index.vue";
import LoaderCollada from "@/pages/model-list/detail03/078-loader-collada/index.vue";
import LoaderColladaKinematics from "@/pages/model-list/detail03/079-loader-collada-kinematics/index.vue";
import LoaderColladaKinning from "@/pages/model-list/detail03/080-loader-collada-skinning/index.vue";
import LoaderDraco from "@/pages/model-list/detail03/081-loader-draco/index.vue";
import LoaderFbx from "@/pages/model-list/detail03/082-loader-fbx/index.vue";
import LoaderFbxNurbs from "@/pages/model-list/detail03/083-loader-fbx-nurbs/index.vue";

const routerList: RouteRecordRaw[] = [
  {
    path: '/list/loader-fbx-nurbs',
    name: 'LoaderFbxNurbs',
    meta: {title: "loader-fbx-nurbs"},
    component: LoaderFbxNurbs,
  },
  {
    path: '/list/loader-fbx',
    name: 'LoaderFbx',
    meta: {title: "loader-fbx"},
    component: LoaderFbx,
  },
  {
    path: '/list/loader-draco',
    name: 'LoaderDraco',
    meta: {title: "loader-draco"},
    component: LoaderDraco,
  },
  {
    path: '/list/loader-collada-skinning',
    name: 'LoaderColladaKinning',
    meta: {title: "loader-collada-skinning"},
    component: LoaderColladaKinning,
  },
  {
    path: '/list/loader-collada-kinematics',
    name: 'LoaderColladaKinematics',
    meta: {title: "loader-collada-kinematics"},
    component: LoaderColladaKinematics,
  },
  {
    path: '/list/loader-collada',
    name: 'LoaderCollada',
    meta: {title: "loader-collada"},
    component: LoaderCollada,
  },
  {
    path: '/list/loader-bvh',
    name: 'LoaderBvh',
    meta: {title: "loader-bvh"},
    component: LoaderBvh,
  },
  {
    path: '/list/loader-amf',
    name: 'LoaderAmf',
    meta: {title: "loader-amf"},
    component: LoaderAmf,
  },
  {
    path: '/list/loader-3mf-materials',
    name: 'Loader3mfMaterials',
    meta: {title: "loader-3mf-materials"},
    component: Loader3mfMaterials,
  },
  {
    path: '/list/loader-3mf',
    name: 'Loader3mf',
    meta: {title: "loader-3mf"},
    component: Loader3mf,
  },
  {
    path: '/list/loader-3ds',
    name: 'Loader3ds',
    meta: {title: "loader-3ds"},
    component: Loader3ds,
  },
  {
    path: '/list/loader-3dm',
    name: 'Loader3dm',
    meta: {title: "loader-3dm"},
    component: Loader3dm,
  },
  {
    path: '/list/lines-sphere',
    name: 'LinesSphere',
    meta: {title: "lines-sphere"},
    component: LinesSphere,
  },
  {
    path: '/list/lines-fat-wireframe',
    name: 'LinesFatWireframe',
    meta: {title: "lines-fat-wireframe"},
    component: LinesFatWireframe,
  },
  {
    path: '/list/lines-fat-raycasting',
    name: 'LinesFatRaycasting',
    meta: {title: "lines-fat-raycasting"},
    component: LinesFatRaycasting,
  },
  {
    path: '/list/lines-fat',
    name: 'LinesFat',
    meta: {title: "lines-fat"},
    component: LinesFat,
  },
  {
    path: '/list/lines-dashed',
    name: 'LinesDashed',
    meta: {title: "lines-dashed"},
    component: LinesDashed,
  },
  {
    path: '/list/lines-colors',
    name: 'LinesColors',
    meta: {title: "lines-colors"},
    component: LinesColors,
  },
  {
    path: '/list/lights-rectarea-light',
    name: 'LightsRectareaLight',
    meta: {title: "lights-rectarea-light"},
    component: LightsRectareaLight,
  },
  {
    path: '/list/lights-spotlights',
    name: 'LightsSpotLights',
    meta: {title: "lights-spotlights"},
    component: LightsSpotLights,
  },
  {
    path: '/list/lights-spotlight',
    name: 'LightsSpotLight',
    meta: {title: "lights-spotlight"},
    component: LightsSpotLight,
  },
  {
    path: '/list/lights-pointlights',
    name: 'LightsPointlights',
    meta: {title: "lights-pointlights"},
    component: LightsPointlights,
  },
  {
    path: '/list/lights-physical',
    name: 'LightsPhysical',
    meta: {title: "lights-physical"},
    component: LightsPhysical,
  },
];

export default routerList;