import type { RouteRecordRaw } from "vue-router";

import ShadersOcean from "@/pages/model-list/detail08/211-shaders-ocean/index.vue";
import ShadersSky from "@/pages/model-list/detail08/212-shaders-sky/index.vue";
import ShadersTonemapping from "@/pages/model-list/detail08/213-shaders-tonemapping/index.vue";
import Shadowmap from "@/pages/model-list/detail08/214-webgl-shadowmap/index.vue";
import ShadowmapPerformance from "@/pages/model-list/detail08/215-shadowmap-performance/index.vue";
import ShadowmapPointlight from "@/pages/model-list/detail08/216-shadowmap-pointlight/index.vue";
import ShadowmapViewer from "@/pages/model-list/detail08/217-shadowmap-viewer/index.vue";
import ShadowContact from "@/pages/model-list/detail08/218-shadow-contact/index.vue";
import ShadowmapVSM from "@/pages/model-list/detail08/219-shadowmap-vsm/index.vue";
import ShadowMesh from "@/pages/model-list/detail08/220-shadow-mesh/index.vue";
import SkinningSimple from "@/pages/model-list/detail08/221-skinning-simple/index.vue";
import Sprites from "@/pages/model-list/detail08/222-webgl-sprites/index.vue";
import TestMemory from "@/pages/model-list/detail08/223-test-memory/index.vue";
import TestMemory2 from "@/pages/model-list/detail08/224-test-memory2/index.vue";
import Tonemapping from "@/pages/model-list/detail08/225-webgl-tonemapping/index.vue";
import Trails from "@/pages/model-list/detail08/226-webgl-trails/index.vue";
import VideoKinect from "@/pages/model-list/detail08/227-video-kinect/index.vue";
import VideoEquirectangular from "@/pages/model-list/detail08/228-video-panorama-equirectangular/index.vue";
import Water from "@/pages/model-list/detail08/229-webgl-water/index.vue";
import WaterFlowMap from "@/pages/model-list/detail08/230-water-flowmap/index.vue";
import GltfIridescence from "@/pages/model-list/detail08/231-gltf-iridescence/index.vue";
import GltfTransmission from "@/pages/model-list/detail08/232-gltf-transmission/index.vue";
import GltfSheen from "@/pages/model-list/detail08/233-gltf-sheen/index.vue";
import LoaderMaterialx from "@/pages/model-list/detail08/234-loader-materialx/index.vue";
import InstanceUniform from "@/pages/model-list/detail08/235-materials-instance-uniform/index.vue";
import PhysicalClearcoat from "@/pages/model-list/detail08/236-materials-physical-clearcoat/index.vue";
import Standard from "@/pages/model-list/detail08/237-materials-standard/index.vue";
import Noise from "@/pages/model-list/detail08/238-materialx-noise/index.vue";
import Playground from "@/pages/model-list/detail08/239-nodes-playground/index.vue";
import Points from "@/pages/model-list/detail08/240-nodes-points/index.vue";



const routerList: RouteRecordRaw[] = [
  {
    path: '/list/webgl-nodes-points',
    name: 'Points',
    meta: {title: "webgl-nodes-points"},
    component: Points,
  },
  {
    path: '/list/webgl-nodes-playground',
    name: 'Playground',
    meta: {title: "webgl-nodes-playground"},
    component: Playground,
  },
  {
    path: '/list/webgl-materials-noise',
    name: 'Noise',
    meta: {title: "webgl-materials-noise"},
    component: Noise,
  },
  {
    path: '/list/webgl-materials-standard',
    name: 'Standard',
    meta: {title: "webgl-materials-standard"},
    component: Standard,
  },
  {
    path: '/list/webgl-materials-physical-clearcoat',
    name: 'PhysicalClearcoat',
    meta: {title: "webgl-materials-physical-clearcoat"},
    component: PhysicalClearcoat,
  },
  {
    path: '/list/webgl-materials-instance-uniform',
    name: 'InstanceUniform',
    meta: {title: "webgl-materials-instance-uniform"},
    component: InstanceUniform,
  },
  {
    path: '/list/webgl-loader-materialx',
    name: 'LoaderMaterialx',
    meta: {title: "webgl-loader-materialx"},
    component: LoaderMaterialx,
  },
  {
    path: '/list/webgl-gltf-sheen',
    name: 'GltfSheen',
    meta: {title: "webgl-gltf-sheen"},
    component: GltfSheen,
  },
  {
    path: '/list/webgl-gltf-transmission',
    name: 'GltfTransmission',
    meta: {title: "webgl-gltf-transmission"},
    component: GltfTransmission,
  },
  {
    path: '/list/webgl-gltf-iridescence',
    name: 'GltfIridescence',
    meta: {title: "webgl-gltf-iridescence"},
    component: GltfIridescence,
  },
  {
    path: '/list/webgl-water-flowmap',
    name: 'WaterFlowMap',
    meta: {title: "webgl-water-flowmap"},
    component: WaterFlowMap,
  },
  {
    path: '/list/webgl-water',
    name: 'Water',
    meta: {title: "webgl-water"},
    component: Water,
  },
  {
    path: '/list/webgl-video-panorama-equirectangular',
    name: 'VideoEquirectangular',
    meta: {title: "webgl-video-panorama-equirectangular"},
    component: VideoEquirectangular,
  },
  {
    path: '/list/webgl-video-kinect',
    name: 'VideoKinect',
    meta: {title: "webgl-video-kinect"},
    component: VideoKinect,
  },
  {
    path: '/list/webgl-trails',
    name: 'Trails',
    meta: {title: "webgl-trails"},
    component: Trails,
  },
  {
    path: '/list/webgl-tonemapping',
    name: 'Tonemapping',
    meta: {title: "webgl-tonemapping"},
    component: Tonemapping,
  },
  {
    path: '/list/webgl-test-memory2',
    name: 'TestMemory2',
    meta: {title: "webgl-test-memory2"},
    component: TestMemory2,
  },
  {
    path: '/list/webgl-test-memory',
    name: 'TestMemory',
    meta: {title: "webgl-test-memory"},
    component: TestMemory,
  },
  {
    path: '/list/webgl-sprites',
    name: 'Sprites',
    meta: {title: "webgl-sprites"},
    component: Sprites,
  },
  {
    path: '/list/webgl-skinning-simple',
    name: 'SkinningSimple',
    meta: {title: "webgl-skinning-simple"},
    component: SkinningSimple,
  },
  {
    path: '/list/webgl-shadow-mesh',
    name: 'ShadowMesh',
    meta: {title: "webgl-shadow-mesh"},
    component: ShadowMesh,
  },
  {
    path: '/list/webgl-shadowmap-vsm',
    name: 'ShadowmapVSM',
    meta: {title: "webgl-shadowmap-vsm"},
    component: ShadowmapVSM,
  },
  {
    path: '/list/webgl-shadow-contact',
    name: 'ShadowContact',
    meta: {title: "webgl-shadow-contact"},
    component: ShadowContact,
  },
  {
    path: '/list/webgl-shadowmap-viewer',
    name: 'ShadowmapViewer',
    meta: {title: "webgl-shadowmap-viewer"},
    component: ShadowmapViewer,
  },
  {
    path: '/list/webgl-shadowmap-pointlight',
    name: 'ShadowmapPointlight',
    meta: {title: "webgl-shadowmap-pointlight"},
    component: ShadowmapPointlight,
  },
  {
    path: '/list/webgl-shadowmap-performance',
    name: 'ShadowmapPerformance',
    meta: {title: "webgl-shadowmap-performance"},
    component: ShadowmapPerformance,
  },
  {
    path: '/list/webgl-shadowmap',
    name: 'Shadowmap',
    meta: {title: "webgl-shadowmap"},
    component: Shadowmap,
  },
  {
    path: '/list/webgl-shaders-tonemapping',
    name: 'ShadersTonemapping',
    meta: {title: "webgl-shaders-tonemapping"},
    component: ShadersTonemapping,
  },
  {
    path: '/list/webgl-shaders-sky',
    name: 'ShadersSky',
    meta: {title: "webgl-shaders-sky"},
    component: ShadersSky,
  },
  {
    path: '/list/webgl-shaders-ocean',
    name: 'ShadersOcean',
    meta: {title: "webgl-shaders-ocean"},
    component: ShadersOcean,
  },
];

export default routerList;