
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

