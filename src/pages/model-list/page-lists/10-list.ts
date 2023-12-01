
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
    key: "290",
    path: "/list/webgl-gpgpu-protoplanet",
    title: "290.GP GPU 星球",
  },
  {
    key: "289",
    path: "/list/webgl-gpgpu-water",
    title: "289.GP GPU 水波",
  },
  {
    key: "288",
    path: "/list/webgl-gpgpu-birds-gltf",
    title: "288.GP GPU birds动图",
  },
  {
    key: "287",
    path: "/list/webgl-gpgpu-birds",
    title: "287.GP GPU birds",
  },
  {
    key: "286",
    path: "/list/webgl-custom-attributes-points3",
    title: "286.自定义属性 点3",
  },
  {
    key: "285",
    path: "/list/webgl-custom-attributes-points2",
    title: "285.自定义属性 点2",
  },
  {
    key: "284",
    path: "/list/webgl-custom-attributes-points",
    title: "284.自定义属性 点",
  },
  {
    key: "283",
    path: "/list/webgl-custom-attributes-lines",
    title: "283.自定义属性 线",
  },
  {
    key: "282",
    path: "/list/webgl-custom-attributes",
    title: "282.自定义属性",
  },
  {
    key: "281",
    title: "281.缓冲集合 单元",
    path: "/list/webgl-buffergeometry-uint",
  },
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

