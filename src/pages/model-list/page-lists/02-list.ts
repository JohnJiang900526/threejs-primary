
// 列表接口类型
export interface listType {
  key: string,
  title: string,
  path: string,
  [key: string]: any
}

// 列表数据
const list01: listType[] = [
  {
    key: "039",
    title: "039.WEBGL Geometry地形光线投射",
    path: "/list/geometry-terrain-raycast"
  },
  {
    key: "038",
    title: "038.WEBGL Geometry地势",
    path: "/list/geometry-terrain"
  },
  {
    key: "037",
    title: "037.WEBGL Geometry茶壶",
    path: "/list/geometry-teapot"
  },
  {
    key: "036",
    title: "036.WEBGL Geometry样条编辑器",
    path: "/list/geometry-spline-editor"
  },
  {
    key: "035",
    title: "035.WEBGL Geometry形状",
    path: "/list/geometry-shapes"
  },
  {
    key: "034",
    title: "034.WEBGL nurbs几何",
    path: "/list/geometry-nurbs"
  },
  {
    key: "033",
    title: "033.WEBGL Geometry我的世界",
    path: "/list/geometry-minecraft"
  },
  {
    key: "032",
    title: "032.WEBGL Geometry挤压样条",
    path: "/list/geometry-extrude-spline"
  },
  {
    key: "031",
    title: "031.WEBGL Geometry挤压形状2",
    path: "/list/geometry-extrude-shape2"
  },
];

export default list01;

