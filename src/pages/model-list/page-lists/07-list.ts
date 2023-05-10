
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

