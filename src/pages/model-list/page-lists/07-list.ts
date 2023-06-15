
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
    key: "202",
    title: "202.WEBGL 光线投射器sprite",
    path: "/list/webgl-raycaster-sprite",
  },
  {
    key: "201",
    title: "201.WEBGL 光线投射器bvh",
    path: "/list/webgl-raycaster-bvh",
  },
  {
    key: "200",
    title: "200.WEBGL 门户",
    path: "/list/webgl-portal",
  },
  {
    key: "199",
    title: "199.WEBGL 点波浪",
    path: "/list/webgl-points-waves",
  },
  {
    key: "198",
    title: "198.WEBGL 点精灵 雪花",
    path: "/list/webgl-points-sprites",
  },
  {
    key: "197",
    title: "197.WEBGL 点动态",
    path: "/list/webgl-points-dynamic",
  },
  {
    key: "196",
    title: "196.WEBGL 点看板",
    path: "/list/webgl-points-billboards",
  },
  {
    key: "195",
    title: "195.WEBGL 表现材质",
    path: "/list/webgl-performance-shader",
  },
  {
    key: "194",
    title: "194.WEBGL 表现统计",
    path: "/list/webgl-performance-static",
  },
  {
    key: "193",
    title: "193.WEBGL 表现",
    path: "/list/webgl-performance",
  },
  {
    key: "192",
    title: "192.WEBGL 全景等角",
    path: "/list/webgl-panorama-equirect-angular",
  },
  {
    key: "191",
    title: "191.WEBGL 立方体全景",
    path: "/list/webgl-panorama-cube",
  },
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

