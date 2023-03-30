
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
    key: "124",
    title: "124.WEBGL Loader USDZ",
    path: "/list/loader-usdz"
  },
  {
    key: "123",
    title: "123.WEBGL Loader TTF",
    path: "/list/loader-ttf"
  },
  {
    key: "122",
    title: "122.WEBGL Loader Texture Tiff",
    path: "/list/loader-texture-tiff"
  },
  {
    key: "121",
    title: "121.WEBGL Loader Texture Tga",
    path: "/list/loader-texture-tga"
  },
];

export default list;

