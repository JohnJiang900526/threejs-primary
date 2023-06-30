
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
    key: "224",
    title: "224.WEBGL 测试记忆2",
    path: "/list/webgl-test-memory2",
  },
  {
    key: "223",
    title: "223.WEBGL 测试记忆",
    path: "/list/webgl-test-memory",
  },
  {
    key: "222",
    title: "222.WEBGL 精灵",
    path: "/list/webgl-sprites",
  },
  {
    key: "221",
    title: "221.WEBGL 简单剥皮",
    path: "/list/webgl-skinning-simple",
  },
  {
    key: "220",
    title: "220.WEBGL 阴影 网格",
    path: "/list/webgl-shadow-mesh",
  },
  {
    key: "219",
    title: "219.WEBGL 阴影VSM",
    path: "/list/webgl-shadowmap-vsm",
  },
  {
    key: "218",
    title: "218.WEBGL 阴影关联",
    path: "/list/webgl-shadow-contact",
  },
  {
    key: "217",
    title: "217.WEBGL 阴影查看器",
    path: "/list/webgl-shadowmap-viewer",
  },
  {
    key: "216",
    title: "216.WEBGL 阴影点光",
    path: "/list/webgl-shadowmap-pointlight",
  },
  {
    key: "215",
    title: "215.WEBGL 阴影性能",
    path: "/list/webgl-shadowmap-performance",
  },
  {
    key: "214",
    title: "214.WEBGL 阴影",
    path: "/list/webgl-shadowmap",
  },
  {
    key: "213",
    title: "213.WEBGL 着色器 色调映射",
    path: "/list/webgl-shaders-tonemapping",
  },
  {
    key: "212",
    title: "213.WEBGL 着色器 sky",
    path: "/list/webgl-shaders-sky",
  },
  {
    key: "211",
    title: "211.WEBGL 着色器ocean",
    path: "/list/webgl-shaders-ocean",
  },
];

export default list;

