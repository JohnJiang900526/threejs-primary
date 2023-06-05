
// 列表接口类型
export interface listType {
  key: string,
  title: string,
  path: string,
  [key: string]: any
}

// 列表数据
const list: listType[] = [
  {
    key: "190",
    title: "190.WEBGL 多视图",
    path: "/list/webgl-multiple-views",
  },
  {
    key: "189",
    title: "189.WEBGL 多场景对比",
    path: "/list/webgl-multiple-scenes-comparison",
  },
  {
    key: "188",
    title: "188.WEBGL 多个渲染器",
    path: "/list/webgl-multiple-renderers",
  },
  {
    key: "187",
    title: "187.WEBGL 多个元素",
    path: "/list/webgl-multiple-elements",
  },
  {
    key: "186",
    title: "186.WEBGL 多个表格画布",
    path: "/list/webgl-multiple-canvases-grid",
  },
  {
    key: "185",
    title: "185.WEBGL 多个复杂画布",
    path: "/list/webgl-multiple-canvases-complex",
  },
  {
    key: "184",
    title: "184.WEBGL 多个画布圆圈",
    path: "/list/webgl-multiple-canvases-circle",
  },
  {
    key: "183",
    title: "183.WEBGL 变形目标球形",
    path: "/list/webgl-morph-targets-sphere",
  },
  {
    key: "182",
    title: "182.WEBGL 变形目标马",
    path: "/list/webgl-morph-targets-horse",
  },
  {
    key: "181",
    title: "181.WEBGL 变形目标脸",
    path: "/list/webgl-morph-targets-face",
  },
]

export default list;

