
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
    key: "107",
    title: "107.WEBGL Loader PBD",
    path: "/list/loader-pbd"
  },
  {
    key: "106",
    title: "106.WEBGL Loader PCD",
    path: "/list/loader-pcd"
  },
  {
    key: "105",
    title: "105.WEBGL Loader OBJ MLT",
    path: "/list/loader-obj-mlt"
  },
  {
    key: "104",
    title: "104.WEBGL Loader OBJ",
    path: "/list/loader-obj"
  },
  {
    key: "103",
    title: "103.WEBGL Loader NRRD",
    path: "/list/loader-nrrd"
  },
  {
    key: "102",
    title: "102.WEBGL Loader MMD audio",
    path: "/list/loader-mmd-audio"
  },
  {
    key: "101",
    title: "101.WEBGL Loader MMD pose",
    path: "/list/loader-mmd-pose"
  },
  {
    key: "100",
    title: "100.WEBGL Loader MMD",
    path: "/list/loader-mmd"
  },
  {
    key: "099",
    title: "099.WEBGL Loader MDD",
    path: "/list/loader-mdd"
  },
  {
    key: "098",
    title: "098.WEBGL Loader MD2 Control",
    path: "/list/loader-md2-control"
  },
  {
    key: "097",
    title: "097.WEBGL Loader MD2",
    path: "/list/loader-md2"
  },
  {
    key: "096",
    title: "096.WEBGL Loader lwo",
    path: "/list/loader-lwo"
  },
  {
    key: "095",
    title: "095.WEBGL Loader Idraw",
    path: "/list/loader-idraw"
  },
  {
    key: "094",
    title: "094.WEBGL Loader KMZ",
    path: "/list/loader-kmz"
  },
  {
    key: "093",
    title: "093.WEBGL Loader BITMAP",
    path: "/list/loader-bitmap"
  },
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

