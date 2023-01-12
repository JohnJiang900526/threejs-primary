
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
    key: "000",
    title: "000.矩形阵列",
    path: "/list/demo"
  },
  {
    key: "001",
    title: "001.小房子模型",
    path: "/list/key-frame"
  },
  {
    key: "002",
    title: "002.机器人动画模型1",
    path: "/list/skinning-blending"
  },
  {
    key: "003",
    title: "003.机器人动画模型2",
    path: "/list/skinning-additive-blending"
  },
  {
    key: "004",
    title: "004.卡通机器人动作变换",
    path: "/list/skinning-ik"
  },
  {
    key: "005",
    title: "005.卡通机器人变换",
    path: "/list/skinning-morph"
  },
  {
    key: "006",
    title: "006.多个机器人",
    path: "/list/animation-multiple"
  },
  {
    key: "007",
    title: "007.WEBGL相机",
    path: "/list/webgl-camera"
  },
  {
    key: "008",
    title: "008.WEBGL相机数组",
    path: "/list/webgl-camera-array"
  },
  {
    key: "009",
    title: "009.WEBGL相机电影",
    path: "/list/webgl-camera-cinematic"
  },
  {
    key: "010",
    title: "010.WEBGL相机对数微深度缓冲",
    path: "/list/logarithmic-depth-buffer"
  },
  {
    key: "011",
    title: "011.WEBGL裁剪",
    path: "/list/webgl-clipping"
  },
  {
    key: "012",
    title: "012.WEBGL高级剪裁",
    path: "/list/clipping-advanced"
  },
  {
    key: "013",
    title: "013.WEBGL裁剪交点",
    path: "/list/clipping-intersection"
  },
  {
    key: "014",
    title: "014.WEBGL剪裁模板",
    path: "/list/clipping-stencil"
  },
];

export default list.reverse();