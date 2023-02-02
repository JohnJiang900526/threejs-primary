
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

