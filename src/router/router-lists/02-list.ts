import type { RouteRecordRaw } from "vue-router";

import GeometryExtrudeShape2 from "@/pages/model-list/detail02/031-geometry-extrude-shape2/index.vue";
import GeometryExtrudeSpline from "@/pages/model-list/detail02/032-geometry-extrude-spline/index.vue";
import GeometryMinecraft from "@/pages/model-list/detail02/033-geometry-minecraft/index.vue";
import GeometryNurbs from "@/pages/model-list/detail02/034-geometry-nurbs/index.vue";
import GeometryShapes from "@/pages/model-list/detail02/035-geometry-shapes/index.vue";
import GeometrySplineEditor from "@/pages/model-list/detail02/036-geometry-spline-editor/index.vue";
import GeometryTeapot from "@/pages/model-list/detail02/037-geometry-teapot/index.vue";
import GeometryTerrain from "@/pages/model-list/detail02/038-geometry-terrain/index.vue";
import GeometryTerrainRaycast from "@/pages/model-list/detail02/039-geometry-terrain-raycast/index.vue";
import GeometryText from "@/pages/model-list/detail02/040-geometry-text/index.vue";
import GeometryTextShape from "@/pages/model-list/detail02/041-geometry-text-shape/index.vue";
import GeometryTextStroke from "@/pages/model-list/detail02/042-geometry-text-stroke/index.vue";
import WebglHelpers from "@/pages/model-list/detail02/043-webgl-helpers/index.vue";
import InstancingDynamic from "@/pages/model-list/detail02/044-instancing-dynamic/index.vue";
import InstancingPerformance from "@/pages/model-list/detail02/045-instancing-performance/index.vue";
import InstancingRaycast from "@/pages/model-list/detail02/046-instancing-raycast/index.vue";
import InstancingScatter from "@/pages/model-list/detail02/047-instancing-scatter/index.vue";
import InstancingBufferGeometry from "@/pages/model-list/detail02/048-instancing-buffer-geometry/index.vue";
import InstancingCubes from "@/pages/model-list/detail02/049-interactive-cubes/index.vue";
import InstancingCubesGpu from "@/pages/model-list/detail02/050-interactive-cubes-gpu/index.vue";
import InstancingCubesOrtho from "@/pages/model-list/detail02/051-interactive-cubes-ortho/index.vue";
import InstancingLines from "@/pages/model-list/detail02/052-interactive-lines/index.vue";
import InstancingPoints from "@/pages/model-list/detail02/053-interactive-points/index.vue";
import InstancingRaycastingPoints from "@/pages/model-list/detail02/054-interactive-raycasting-points/index.vue";
import InstancingVoxelPainter from "@/pages/model-list/detail02/055-interactive-voxel-painter/index.vue";
import WebglLayers from "@/pages/model-list/detail02/056-webgl-layers/index.vue";
import WebglLensflares from "@/pages/model-list/detail02/057-webgl-lensflares/index.vue";
import WebglLightProbe from "@/pages/model-list/detail02/058-webgl-light-probe/index.vue";
import WebglLightProbeCubeCamera from "@/pages/model-list/detail02/059-light-probe-cube-camera/index.vue";
import LightsHemisphere from "@/pages/model-list/detail02/060-lights-hemisphere/index.vue";

const routerList: RouteRecordRaw[] = [
  {
    path: '/list/lights-hemisphere',
    name: 'LightsHemisphere',
    meta: {title: "lights-hemisphere"},
    component: LightsHemisphere,
  },
  {
    path: '/list/light-probe-cube-camera',
    name: 'WebglLightProbeCubeCamera',
    meta: {title: "light-probe-cube-camera"},
    component: WebglLightProbeCubeCamera,
  },
  {
    path: '/list/webgl-light-probe',
    name: 'WebglLightProbe',
    meta: {title: "webgl-light-probe"},
    component: WebglLightProbe,
  },
  {
    path: '/list/webgl-lensflares',
    name: 'WebglLensflares',
    meta: {title: "webgl-lensflares"},
    component: WebglLensflares,
  },
  {
    path: '/list/webgl-layers',
    name: 'WebglLayers',
    meta: {title: "webgl-layers"},
    component: WebglLayers,
  },
  {
    path: '/list/instancing-voxel-painter',
    name: 'InstancingVoxelPainter',
    meta: {title: "instancing-voxel-painter"},
    component: InstancingVoxelPainter,
  },
  {
    path: '/list/instancing-raycasting-points',
    name: 'InstancingRaycastingPoints',
    meta: {title: "instancing-raycasting-points"},
    component: InstancingRaycastingPoints,
  },
  {
    path: '/list/instancing-points',
    name: 'InstancingPoints',
    meta: {title: "instancing-points"},
    component: InstancingPoints,
  },
  {
    path: '/list/instancing-lines',
    name: 'InstancingLines',
    meta: {title: "instancing-lines"},
    component: InstancingLines,
  },
  {
    path: '/list/instancing-cubes-ortho',
    name: 'InstancingCubesOrtho',
    meta: {title: "instancing-cubes-ortho"},
    component: InstancingCubesOrtho,
  },
  {
    path: '/list/instancing-cubes-gpu',
    name: 'InstancingCubesGpu',
    meta: {title: "instancing-cubes-gpu"},
    component: InstancingCubesGpu,
  },
  {
    path: '/list/instancing-cubes',
    name: 'InstancingCubes',
    meta: {title: "instancing-cubes"},
    component: InstancingCubes,
  },
  {
    path: '/list/instancing-buffer-geometry',
    name: 'InstancingBufferGeometry',
    meta: {title: "instancing-buffer-geometry"},
    component: InstancingBufferGeometry,
  },
  {
    path: '/list/instancing-scatter',
    name: 'InstancingScatter',
    meta: {title: "instancing-scatter"},
    component: InstancingScatter,
  },
  {
    path: '/list/instancing-raycast',
    name: 'InstancingRaycast',
    meta: {title: "instancing-raycast"},
    component: InstancingRaycast,
  },
  {
    path: '/list/instancing-performance',
    name: 'InstancingPerformance',
    meta: {title: "instancing-performance"},
    component: InstancingPerformance,
  },
  {
    path: '/list/instancing-dynamic',
    name: 'InstancingDynamic',
    meta: {title: "instancing-dynamic"},
    component: InstancingDynamic,
  },
  {
    path: '/list/webgl-helpers',
    name: 'WebglHelpers',
    meta: {title: "webgl-helpers"},
    component: WebglHelpers,
  },
  {
    path: '/list/geometry-text-shape',
    name: 'GeometryTextShape',
    meta: {title: "geometry-text-shape"},
    component: GeometryTextShape,
  },
  {
    path: '/list/geometry-text-stroke',
    name: 'GeometryTextStroke',
    meta: {title: "geometry-text-stroke"},
    component: GeometryTextStroke,
  },
  {
    path: '/list/geometry-text',
    name: 'GeometryText',
    meta: {title: "geometry-text"},
    component: GeometryText,
  },
  {
    path: '/list/geometry-terrain-raycast',
    name: 'GeometryTerrainRaycast',
    meta: {title: "geometry-terrain-raycast"},
    component: GeometryTerrainRaycast,
  },
  {
    path: '/list/geometry-terrain',
    name: 'GeometryTerrain',
    meta: {title: "geometry-terrain"},
    component: GeometryTerrain,
  },
  {
    path: '/list/geometry-teapot',
    name: 'GeometryTeapot',
    meta: {title: "geometry-teapot"},
    component: GeometryTeapot,
  },
  {
    path: '/list/geometry-spline-editor',
    name: 'GeometrySplineEditor',
    meta: {title: "geometry-spline-editor"},
    component: GeometrySplineEditor,
  },
  {
    path: '/list/geometry-shapes',
    name: 'GeometryShapes',
    meta: {title: "geometry-shapes"},
    component: GeometryShapes,
  },
  {
    path: '/list/geometry-nurbs',
    name: 'GeometryNurbs',
    meta: {title: "geometry-nurbs"},
    component: GeometryNurbs,
  },
  {
    path: '/list/geometry-minecraft',
    name: 'GeometryMinecraft',
    meta: {title: "geometry-minecraft"},
    component: GeometryMinecraft,
  },
  {
    path: '/list/geometry-extrude-spline',
    name: 'GeometryExtrudeSpline',
    meta: {title: "geometry-extrude-spline"},
    component: GeometryExtrudeSpline,
  },
  {
    path: '/list/geometry-extrude-shape2',
    name: 'GeometryExtrudeShape2',
    meta: {title: "geometry-extrude-shape2"},
    component: GeometryExtrudeShape2,
  },
];

export default routerList;