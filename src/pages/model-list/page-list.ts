import list01 from "@/pages/model-list/page-lists/01-list";
import list02 from "@/pages/model-list/page-lists/02-list";

// 列表接口类型
export interface listType {
  key: string,
  title: string,
  path: string,
  [key: string]: any
}

// 列表数据
const list: listType[] = [
  ...list02,
  ...list01
];

export default list;
