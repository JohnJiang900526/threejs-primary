
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
    key: "092",
    title: "092.WEBGL Loader IFC",
    path: "/list/loader-ifc"
  },
  {
    key: "091",
    title: "091.WEBGL Loader GLTF变型模式",
    path: "/list/loader-gltf-variants"
  },
];

export default list;

