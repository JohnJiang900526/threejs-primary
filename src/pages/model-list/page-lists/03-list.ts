
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
    key: "076",
    title: "076.WEBGL amf加载器",
    path: "/list/loader-amf"
  },
  {
    key: "075",
    title: "075.WEBGL 3mf加载器材质",
    path: "/list/loader-3mf-materials"
  },
  {
    key: "074",
    title: "074.WEBGL 3mf加载器",
    path: "/list/loader-3mf"
  },
  {
    key: "073",
    title: "073.WEBGL 3ds加载器",
    path: "/list/loader-3ds"
  },
  {
    key: "072",
    title: "072.WEBGL 3dm加载器",
    path: "/list/loader-3dm"
  },
  {
    key: "071",
    title: "071.WEBGL 线球",
    path: "/list/lines-sphere"
  },
  {
    key: "070",
    title: "070.WEBGL 粗线wireframe",
    path: "/list/lines-fat-wireframe"
  },
  {
    key: "069",
    title: "069.WEBGL 粗线Raycasting",
    path: "/list/lines-fat-raycasting"
  },
  {
    key: "068",
    title: "068.WEBGL 粗线",
    path: "/list/lines-fat"
  },
  {
    key: "067",
    title: "067.WEBGL 虚线",
    path: "/list/lines-dashed"
  },
  {
    key: "066",
    title: "066.WEBGL 线的颜色",
    path: "/list/lines-colors"
  },
  {
    key: "065",
    title: "065.WEBGL 矩形灯光",
    path: "/list/lights-rectarea-light"
  },
  {
    key: "064",
    title: "064.WEBGL 光照多个聚光",
    path: "/list/lights-spotlights"
  },
  {
    key: "063",
    title: "063.WEBGL 光照聚光",
    path: "/list/lights-spotlight"
  },
  {
    key: "062",
    title: "062.WEBGL 光照点光",
    path: "/list/lights-pointlights"
  },
  {
    key: "061",
    title: "061.WEBGL 光照物理特性",
    path: "/list/lights-physical"
  },
];

export default list;

