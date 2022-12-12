
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
];

export default list;