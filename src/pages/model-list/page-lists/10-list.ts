
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
    key: "280",
    title: "280.缓冲集合 选择绘制",
    path: "/list/webgl-buffergeometry-selective-draw",
  },
  {
    key: "279",
    title: "279.缓冲集合 原始材质",
    path: "/list/webgl-buffergeometry-rawshader",
  },
  {
    key: "278",
    title: "278.缓冲集合 点交叉",
    path: "/list/webgl-buffergeometry-points-interleaved",
  },
  {
    key: "277",
    title: "277.缓冲集合 点",
    path: "/list/webgl-buffergeometry-points",
  },
  {
    key: "276",
    title: "276.缓冲集合 线索引",
    path: "/list/webgl-buffergeometry-lines-indexed",
  },
  {
    key: "275",
    title: "275.缓冲集合 线",
    path: "/list/webgl-buffergeometry-lines",
  },
  {
    key: "274",
    title: "274.缓冲集合 实例化交叉",
    path: "/list/webgl-buffergeometry-instancing-interleaved",
  },
  {
    key: "273",
    title: "273.缓冲集合 实例化广告牌",
    path: "/list/webgl-buffergeometry-instancing-billboards",
  },
  {
    key: "272",
    title: "272.缓冲集合 实例化",
    path: "/list/webgl-buffergeometry-instancing",
  },
  {
    key: "271",
    title: "271.缓冲集合 索引",
    path: "/list/webgl-buffergeometry-indexed",
  },
];

export default list;

