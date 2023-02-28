
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

