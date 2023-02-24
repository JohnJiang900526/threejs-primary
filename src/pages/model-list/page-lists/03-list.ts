
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
    key: "061",
    title: "061.WEBGL 光照物理特性",
    path: "/list/lights-physical"
  },
];

export default list;

