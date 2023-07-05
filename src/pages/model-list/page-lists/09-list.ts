
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
    key: "245",
    title: "245.WEBGL 后处理backgrounds",
    path: "/list/webgl-post-processing-backgrounds",
  },
  {
    key: "244",
    title: "244.WEBGL 后处理image",
    path: "/list/webgl-post-processing-image",
  },
  {
    key: "243",
    title: "243.WEBGL 后处理advanced",
    path: "/list/webgl-post-processing-advanced",
  },
  {
    key: "242",
    title: "242.WEBGL 后处理3dlut",
    path: "/list/webgl-post-processing-3dlut",
  },
  {
    key: "241",
    title: "241.WEBGL 后处理",
    path: "/list/webgl-post-processing",
  },
];

export default list;

