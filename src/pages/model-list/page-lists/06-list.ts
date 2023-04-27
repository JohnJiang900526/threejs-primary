
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
    key: "170",
    title: "170.WEBGL Materials 线框",
    path: "/list/webgl-materials-wireframe"
  },
  {
    key: "169",
    title: "169.WEBGL Materials 视频网络摄像头",
    path: "/list/webgl-materials-video-webcam"
  },
  {
    key: "168",
    title: "168.WEBGL Materials 视频",
    path: "/list/webgl-materials-video"
  },
  {
    key: "167",
    title: "167.WEBGL Materials 图恩变化",
    path: "/list/webgl-materials-variations-toon"
  },
  {
    key: "166",
    title: "166.WEBGL Materials 物理变化",
    path: "/list/webgl-materials-variations-physical"
  },
  {
    key: "165",
    title: "165.WEBGL Materials 标准变化",
    path: "/list/webgl-materials-variations-standard"
  },
  {
    key: "164",
    title: "164.WEBGL Materials 冯氏变化",
    path: "/list/webgl-materials-variations-phong"
  },
  {
    key: "163",
    title: "163.WEBGL Materials 兰伯特变化",
    path: "/list/webgl-materials-variations-lambert"
  },
  {
    key: "162",
    title: "162.WEBGL Materials 基本变量",
    path: "/list/webgl-materials-variations-basic"
  },
  {
    key: "161",
    title: "161.WEBGL Materials 纹理旋转",
    path: "/list/webgl-materials-texture-rotation"
  },
  {
    key: "160",
    title: "160.WEBGL Materials 纹理局部更新",
    path: "/list/webgl-materials-texture-partialupdate"
  },
  {
    key: "159",
    title: "159.WEBGL Materials 纹理手动mipmap",
    path: "/list/webgl-materials-texture-manualmipmap"
  },
  {
    key: "158",
    title: "158.WEBGL Materials 纹理过滤器",
    path: "/list/webgl-materials-texture-filters"
  },
  {
    key: "157",
    title: "157.WEBGL Materials 纹理绘图",
    path: "/list/webgl-materials-texture-canvas"
  },
  {
    key: "156",
    title: "156.WEBGL Materials 纹理各异性",
    path: "/list/webgl-materials-texture-anisotropy"
  },
  {
    key: "155",
    title: "155.WEBGL Materials 地下散射",
    path: "/list/webgl-materials-subsurface-scattering"
  },
  {
    key: "154",
    title: "154.WEBGL Materials 标准",
    path: "/list/webgl-materials-standard"
  },
  {
    key: "153",
    title: "153.WEBGL Materials 物体变速器",
    path: "/list/webgl-materials-physical-transmission"
  },
  {
    key: "152",
    title: "152.WEBGL Materials 物体反射率",
    path: "/list/webgl-materials-physical-reflectivity"
  },
  {
    key: "151",
    title: "151.WEBGL Materials 物体油漆",
    path: "/list/webgl-materials-physical-clearcoat"
  },
]

export default list;

