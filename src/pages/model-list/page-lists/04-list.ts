
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
    key: "090",
    title: "090.WEBGL Loader GLTF变型模式",
    path: "/list/loader-gltf-variants"
  },
];

export default list;

