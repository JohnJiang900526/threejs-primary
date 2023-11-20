
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
    key: "254",
    title: "254.WEBGL 后处理ssaa",
    path: "/list/webgl-post-processing-ssaa",
  },
  {
    key: "253",
    title: "253.WEBGL 后处理屏蔽",
    path: "/list/webgl-post-processing-masking",
  },
  {
    key: "252",
    title: "252.WEBGL 后处理rgb半色调",
    path: "/list/webgl-post-processing-rgb-halftone",
  },
  {
    key: "251",
    title: "251.WEBGL 后处理神的光辉",
    path: "/list/webgl-post-processing-godrays",
  },
  {
    key: "250",
    title: "250.WEBGL 后处理glitch",
    path: "/list/webgl-post-processing-glitch",
  },
  {
    key: "249",
    title: "249.WEBGL 后处理fxaa",
    path: "/list/webgl-post-processing-fxaa",
  },
  {
    key: "248",
    title: "248.WEBGL 后处理dof2",
    path: "/list/webgl-post-processing-dof2",
  },
  {
    key: "247",
    title: "247.WEBGL 后处理dof",
    path: "/list/webgl-post-processing-dof",
  },
  {
    key: "246",
    title: "246.WEBGL 后处理crossfade",
    path: "/list/webgl-post-processing-crossfade",
  },
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

