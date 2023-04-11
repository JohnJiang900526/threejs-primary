
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
    key: "137",
    title: "137.WEBGL Materials 立方体贴图",
    path: "/list/webgl-materials-cubemap"
  },
  {
    key: "136",
    title: "136.WEBGL Materials 频道",
    path: "/list/webgl-materials-channels"
  },
  {
    key: "135",
    title: "135.WEBGL Materials 汽车",
    path: "/list/webgl-materials-car"
  },
  {
    key: "134",
    title: "134.WEBGL Materials 凸纹贴图",
    path: "/list/webgl-materials-bumpmap"
  },
  {
    key: "133",
    title: "133.WEBGL Materials 混合自定义",
    path: "/list/webgl-materials-blending-custom"
  },
  {
    key: "132",
    title: "132.WEBGL Materials 混合",
    path: "/list/webgl-materials-blending"
  },
  {
    key: "131",
    title: "131.WEBGL Materials",
    path: "/list/webgl-materials"
  },
  {
    key: "130",
    title: "130.WEBGL Marchingcubes",
    path: "/list/webgl-marchingcubes"
  },
  {
    key: "129",
    title: "129.WEBGL LOD",
    path: "/list/webgl-lod"
  },
  {
    key: "128",
    title: "128.WEBGL Loader XYZ",
    path: "/list/loader-xyz"
  },
  {
    key: "127",
    title: "127.WEBGL Loader VTK",
    path: "/list/loader-vtk"
  },
  {
    key: "126",
    title: "126.WEBGL Loader VRML",
    path: "/list/loader-vrml"
  },
  {
    key: "125",
    title: "125.WEBGL Loader VOX",
    path: "/list/loader-vox"
  },
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

