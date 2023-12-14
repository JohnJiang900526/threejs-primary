
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
    key: "310",
    path: "/list/webgl-volume-cloud",
    title: "310.卷云",
  },
  {
    key: "309",
    path: "/list/webgl-webgl2-ubo",
    title: "309.webgl2 ubo",
  },
  {
    key: "308",
    path: "/list/webgl-texture-2d-array-compressed",
    title: "308.纹理2d数组压缩",
  },
  {
    key: "307",
    path: "/list/webgl-rendertarget-texture-2d-array",
    title: "307.渲染目标2d纹理数组",
  },
  {
    key: "306",
    path: "/list/webgl-multisampled-render-buffers",
    title: "306.多样本渲染缓冲",
  },
  {
    key: "305",
    path: "/list/webgl-multiple-rendertargets",
    title: "305.多个渲染目标",
  },
  {
    key: "304",
    path: "/list/webgl-materials-texture-3d-partialupdate",
    title: "304.材质纹理 3d部分更新",
  },
  {
    key: "303",
    path: "/list/webgl-materials-texture-3d",
    title: "303.材质贴图 3d",
  },
  {
    key: "302",
    path: "/list/webgl-materials-texture-2d-array",
    title: "302.材质贴图 2d数组",
  },
  {
    key: "301",
    path: "/list/webgl-buffergeometry-attributes-none",
    title: "301.缓冲集合 属性none",
  },
];

export default list;

