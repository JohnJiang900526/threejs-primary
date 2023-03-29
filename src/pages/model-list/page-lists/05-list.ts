
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
    key: "121",
    title: "121.WEBGL Loader Texture Tga",
    path: "/list/loader-texture-tga"
  },
];

export default list;

