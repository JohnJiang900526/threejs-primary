
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
    key: "029",
    title: "029.WEBGL Geometry动态",
    path: "/list/geometry-dynamic"
  },
  {
    key: "028",
    title: "028.WEBGL Geometry立方体",
    path: "/list/geometry-cube"
  },
  {
    key: "027",
    title: "027.WEBGL Geometry凸多边形",
    path: "/list/geometry-convex"
  },
  {
    key: "026",
    title: "026.WEBGL Geometry颜色查询",
    path: "/list/geometry-color-lookup"
  },
  {
    key: "025",
    title: "025.WEBGL Geometry颜色",
    path: "/list/geometry-colors"
  },
  {
    key: "024",
    title: "024.WEBGL Geometry参数",
    path: "/list/geometries-parametric"
  },
  {
    key: "023",
    title: "023.WEBGL Geometry几何体",
    path: "/list/webgl-geometry"
  },
  {
    key: "022",
    title: "022.WEBGL FrameBuffer纹理",
    path: "/list/framebuffer-texture"
  },
  {
    key: "021",
    title: "021.WEBGL 立体效果",
    path: "/list/effects-stereo"
  },
  {
    key: "020",
    title: "020.WEBGL 辣椒鬼效应(佩珀幽灵)",
    path: "/list/effects-peppersghost"
  },
  {
    key: "019",
    title: "019.WEBGL 影响视差",
    path: "/list/effects-parallaxbarrier"
  },
  {
    key: "018",
    title: "018.WEBGL Ascii效果",
    path: "/list/effects-ascii"
  },
  {
    key: "017",
    title: "017.WEBGL补色效果",
    path: "/list/effects-anaglyph"
  },
  {
    key: "016",
    title: "016.WEBGL深度纹理",
    path: "/list/depth-texture"
  },
  {
    key: "015",
    title: "015.WEBGL贴花印图案",
    path: "/list/webgl-decals"
  },
  {
    key: "014",
    title: "014.WEBGL剪裁模板",
    path: "/list/clipping-stencil"
  },
  {
    key: "013",
    title: "013.WEBGL裁剪交点",
    path: "/list/clipping-intersection"
  },
  {
    key: "012",
    title: "012.WEBGL高级剪裁",
    path: "/list/clipping-advanced"
  },
  {
    key: "011",
    title: "011.WEBGL裁剪",
    path: "/list/webgl-clipping"
  },
  {
    key: "010",
    title: "010.WEBGL相机对数微深度缓冲",
    path: "/list/logarithmic-depth-buffer"
  },
  {
    key: "009",
    title: "009.WEBGL相机电影",
    path: "/list/webgl-camera-cinematic"
  },
  {
    key: "008",
    title: "008.WEBGL相机数组",
    path: "/list/webgl-camera-array"
  },
  {
    key: "007",
    title: "007.WEBGL相机",
    path: "/list/webgl-camera"
  },
  {
    key: "006",
    title: "006.多个机器人",
    path: "/list/animation-multiple"
  },
  {
    key: "005",
    title: "005.卡通机器人变换",
    path: "/list/skinning-morph"
  },
  {
    key: "004",
    title: "004.卡通机器人动作变换",
    path: "/list/skinning-ik"
  },
  {
    key: "003",
    title: "003.机器人动画模型2",
    path: "/list/skinning-additive-blending"
  },
  {
    key: "002",
    title: "002.机器人动画模型1",
    path: "/list/skinning-blending"
  },
  {
    key: "001",
    title: "001.小房子模型",
    path: "/list/key-frame"
  },
  {
    key: "000",
    title: "000.矩形阵列",
    path: "/list/demo"
  },
];

export default list;
