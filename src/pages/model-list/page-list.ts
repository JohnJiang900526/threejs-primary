import list01 from "@/pages/model-list/page-lists/01-list";
import list02 from "@/pages/model-list/page-lists/02-list";
import list03 from "@/pages/model-list/page-lists/03-list";
import list04 from "@/pages/model-list/page-lists/04-list";
import list05 from "@/pages/model-list/page-lists/05-list";
import list06 from "@/pages/model-list/page-lists/06-list";
import list07 from "@/pages/model-list/page-lists/07-list";
import list08 from "@/pages/model-list/page-lists/08-list";
import list09 from "@/pages/model-list/page-lists/09-list";

// 列表接口类型
export interface listType {
  key: string,
  title: string,
  path: string,
  [key: string]: any
}

// 列表数据
const list: listType[] = [
  ...list09,
  ...list08,
  ...list07,
  ...list06,
  ...list05,
  ...list04,
  ...list03,
  ...list02,
  ...list01,
];

export default list;
