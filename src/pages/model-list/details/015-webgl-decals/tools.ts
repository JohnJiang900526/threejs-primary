import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry';

interface IplaneProps {
  constant: number,
  negated: boolean,
  displayHelper: boolean
}

interface Iparams {
  animate: boolean
  planeX: IplaneProps,
  planeY: IplaneProps,
  planeZ: IplaneProps,
}

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private controls: null | OrbitControls;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private line: null | THREE.Line;
  private mesh: null | THREE.Object3D;
  private raycaster: THREE.Raycaster;
  private intersection: {
    intersects: boolean;
    point: THREE.Vector3;
    normal: THREE.Vector3;
  };
  private mouse: THREE.Vector2;
  private intersects: THREE.Intersection[];
  private textureLoader: THREE.TextureLoader;
  private decalMaterial: null | THREE.MeshPhongMaterial;
  private mouseHelper: null | THREE.Mesh;
  private moved: boolean;
  private position: THREE.Vector3
  private orientation: THREE.Euler
  private size: THREE.Vector3
  private params: {
    minScale: number,
    maxScale: number,
    rotate: boolean,
    clear: () => void
  }
  private decals: THREE.Mesh[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.controls = null;
    this.camera = null;
    this.stats = null;
    this.line = null;
    this.mesh = null;
    // 光线投射Raycaster
    // 这个类用于进行raycasting（光线投射）。 光线投射用于进行鼠标拾取（在三维空间中计算出鼠标移过了什么物体）
    this.raycaster = new THREE.Raycaster();
    this.intersection = {
      intersects: false,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(),
    };
    this.mouse = new THREE.Vector2();
    this.intersects = [];
    this.textureLoader = new THREE.TextureLoader();
    this.decalMaterial = null;
    this.mouseHelper = null;
    this.moved = false;
    this.position = new THREE.Vector3();
    this.orientation = new THREE.Euler();
    this.size = new THREE.Vector3();

    this.params = {
      minScale: 10,
      maxScale: 20,
      rotate: true,
      clear: () => {
        this.removeDecals();
      }
    };
    this.decals = [];
  }

  // 初始化方法入口
  init() {
    // 初始化参数
    const decalDiffuseUrl = "/examples/textures/decal/decal-diffuse.png";
    const decalNormalUrl = "/examples/textures/decal/decal-normal.jpg";
    const decalDiffuse = this.textureLoader.load(decalDiffuseUrl);
    const decalNormal = this.textureLoader.load(decalNormalUrl);
    // Phong网格材质(MeshPhongMaterial) 一种用于具有镜面高光的光泽表面的材质
    this.decalMaterial = new THREE.MeshPhongMaterial({
      // .specular : Color 镜面反射的 颜色
      // 材质的高光颜色。默认值为0x111111（深灰色）的颜色Color
      specular: 0x444444,
      // .map : Texture
      // 颜色贴图。可以选择包括一个alpha通道，通常与.transparent 或.alphaTest。默认为null
      // 纹理贴图颜色由漫反射颜色.color调节
      map: decalDiffuse,
      // .normalMap : Texture
      // 用于创建法线贴图的纹理。RGB值会影响每个像素片段的曲面法线，
      // 并更改颜色照亮的方式。法线贴图不会改变曲面的实际形状，只会改变光照
      normalMap: decalNormal,
      // .normalScale : Vector2
      // 法线贴图对材质的影响程度。典型范围是0-1。默认值是Vector2设置为（1,1）
      normalScale: new THREE.Vector2(1, 1),
      // .shininess : Float
      // .specular高亮的程度，越高的值越闪亮。默认值为 30
      shininess: 30,
      // .transparent : Boolean
      // 定义此材质是否透明。这对渲染有影响，因为透明对象需要特殊处理，并在非透明对象之后渲染
      // 设置为true时，通过设置材质的opacity属性来控制材质透明的程度。默认值为false
      transparent: true,
      // .depthTest : Boolean
      // 是否在渲染此材质时启用深度测试。默认为 true
      depthTest: true,
      // .depthWrite : Boolean
      // 渲染此材质是否对深度缓冲区有任何影响。默认为true
      // 在绘制2D叠加时，将多个事物分层在一起而不创建z-index时，禁用深度写入会很有用
      depthWrite: false,
      // .polygonOffset : Boolean
      // 是否使用多边形偏移。默认值为false。这对应于WebGL的GL_POLYGON_OFFSET_FILL功能
      polygonOffset: true,
      // .polygonOffsetFactor : Integer
      // 设置多边形偏移系数。默认值为0
      polygonOffsetFactor: -4,
      // .wireframe : Boolean
      // 将几何体渲染为线框。默认值为false（即渲染为平面多边形）
      wireframe: false,
    });

    // 实例化相机
    this.camera = new THREE.PerspectiveCamera( 50, this.width / this.height, 1, 1000);
    this.camera.position.z = 200;

    // 创建一个场景 and 添加环境光
    this.scene = new THREE.Scene();
    // AmbientLight 环境光会均匀的照亮场景中的所有物体 环境光不能用来投射阴影，因为它没有方向
    // AmbientLight( color : Integer, intensity : Float ) 创建一个环境光对象
    // color - (参数可选）颜色的rgb数值。缺省值为 0xffffff
    // intensity - (参数可选)光照的强度。缺省值为 1
    this.scene.add(new THREE.AmbientLight(0x443333));

    // 创建两束直线光
    const dirLight1 = new THREE.DirectionalLight(0xffddcc, 1);
    const dirLight2 = new THREE.DirectionalLight(0xccccff, 1);
    dirLight1.position.set(1.0, 0.75, 0.5);
    dirLight2.position.set(-1, 0.75, -0.5);
    this.scene.add(dirLight1);
    this.scene.add(dirLight2);

    // BufferGeometry 创建一个线几何体 
    // 是面片、线或点几何体的有效表述
    // 包括顶点位置，面片索引、法相量、颜色值、UV 坐标和自定义缓存属性值
    // 使用 BufferGeometry 可以有效减少向 GPU 传输上述数据所需的开销
    const geometry = new THREE.BufferGeometry();
    // .setFromPoints ( points : Array ) : this
    // 通过点队列设置该 BufferGeometry 的 attribute
    geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    // 线（THREE.Line）一条连续的线
    // 它几乎和LineSegments是一样的，唯一的区别是它在渲染时使用的是gl.LINE_STRIP， 而不是gl.LINES
    // 基础线条材质（LineBasicMaterial）
    // 一种用于绘制线框样式几何体的材质
    this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
    this.scene.add(this.line);

    // 加载模型
    this.loadLeePerrySmith();

    // 鼠标帮助
    // 立方缓冲几何体（BoxGeometry）
    // BoxGeometry是四边形的原始几何类，
    // 它通常使用构造函数所提供的“width”、“height”、“depth”参数来创建立方体或者不规则四边形
    // BoxGeometry(width : Float, height : Float, depth : Float, widthSegments : Integer, heightSegments : Integer, depthSegments : Integer)
    // width — X轴上面的宽度，默认值为1
    // height — Y轴上面的高度，默认值为1
    // depth — Z轴上面的深度，默认值为1
    // widthSegments — （可选）宽度的分段数，默认值是1
    // heightSegments — （可选）高度的分段数，默认值是1
    // depthSegments — （可选）深度的分段数，默认值是1

    // 法线网格材质(MeshNormalMaterial)
    // 一种把法向量映射到RGB颜色的材质
    this.mouseHelper = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 10), new THREE.MeshNormalMaterial());
    this.mouseHelper.visible = false;
    this.scene.add(this.mouseHelper);

    // 创建一个渲染器 WebGL Render 用WebGL渲染出你精心制作的场景
    this.renderer = new THREE.WebGLRenderer();
    // .setPixelRatio ( value : number ) : undefined
    // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // .setSize ( width : Integer, height : Integer, updateStyle : Boolean ) : undefined
    // 将输出canvas的大小调整为(width, height)并考虑设备像素比，且将视口从(0, 0)开始调整到适合大小 
    // 将updateStyle设置为false以阻止对canvas的样式做任何改变
    this.renderer.setSize(this.width, this.height);
    // .domElement : DOMElement
    // 一个canvas，渲染器在其上绘制输出
    // 渲染器的构造函数会自动创建(如果没有传入canvas参数)
    this.container.appendChild(this.renderer.domElement);

    // 创建一个控制器 轨道控制器（OrbitControls）
    // Orbit controls（轨道控制器）可以使得相机围绕目标进行轨道运动
    // OrbitControls( object : Camera, domElement : HTMLDOMElement )
    // object: （必须）将要被控制的相机。该相机不允许是其他任何对象的子级，除非该对象是场景自身
    // domElement: 用于事件监听的HTML元素
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // .minDistance : Float
    // 能够将相机向内移动多少（仅适用于PerspectiveCamera），其默认值为0
    this.controls.minDistance = 50;
    // .maxDistance : Float
    // 能够将相机向外移动多少（仅适用于PerspectiveCamera），其默认值为Infinity
    this.controls.maxDistance = 200;

    // 事件绑定
    this.controls.addEventListener("change", () => { this.moved = true; });
    
    window.onpointerdown = () => { this.moved = false; };
    window.onpointerup = (e) => {
      if (this.moved === false) {
        this.checkIntersection(e.clientX, e.clientY - 50);
        if (this.intersection.intersects) { this.shoot(); }
      }
    };
    window.onpointermove = (e) => {
      if (e.isPrimary) { this.checkIntersection(e.clientX, e.clientY - 50); }
    };

    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
  }

  setMinScale (val: number) {
    this.params.minScale = val;
  }
  setMaxScale (val: number) {
    this.params.maxScale = val;
  }
  setRotate (check: boolean) {
    this.params.rotate = check;
  }
  clear () {
    this.removeDecals();
  }

  // 删除喷射材质
  private removeDecals() {
    this.decals.forEach((d) => {
      (this.scene as THREE.Scene).remove(d);
    });
    this.decals = [];
  }

  // 选择交叉点
  private checkIntersection(x: number, y: number) {
    if (!this.mesh) { return false; }

    this.mouse.x = (x / this.width) * 2 - 1;
    this.mouse.y = -(y / this.height) * 2 + 1;

    // 光线投射Raycaster
    // 这个类用于进行raycasting（光线投射）。 光线投射用于进行鼠标拾取（在三维空间中计算出鼠标移过了什么物体）

    // .setFromCamera ( coords : Vector2, camera : Camera ) : undefined
    // coords —— 在标准化设备坐标中鼠标的二维坐标 —— X分量与Y分量应当在-1到1之间
    // camera —— 射线所来源的摄像机
    this.raycaster.setFromCamera(this.mouse, this.camera as THREE.PerspectiveCamera);
    // .intersectObject ( object : Object3D, recursive : Boolean, optionalTarget : Array ) : Array
    // object —— 检查与射线相交的物体
    // recursive —— 若为true，则同时也会检查所有的后代。否则将只会检查对象本身。默认值为true
    // optionalTarget — （可选）设置结果的目标数组。如果不设置这个值，则一个新的Array会被实例化
    // 如果设置了这个值，则在每次调用之前必须清空这个数组（例如：array.length = 0;）
    this.raycaster.intersectObject(this.mesh, false, this.intersects);

    if (this.intersects.length > 0) {
      const p = this.intersects[0].point;
      // .copy ( v : Vector3 ) : this
      // 将所传入Vector3的x、y和z属性复制给这一Vector3
      (this.mouseHelper as THREE.Mesh).position.copy(p);
      // 将所传入Vector3的x、y和z属性复制给这一Vector3
      this.intersection.point.copy(p);

      // .clone () : Vector3
      // 返回一个新的Vector3，其具有和当前这个向量相同的x、y和z
      const n = (this.intersects[0].face as THREE.Face).normal.clone();
      // .transformDirection ( m : Matrix4 ) : this
      // 通过传入的矩阵（m的左上角3 x 3子矩阵）变换向量的方向， 并将结果进行normalizes（归一化）
      n.transformDirection(this.mesh.matrixWorld);
      // .multiplyScalar ( s : Float ) : this
      // 将该向量与所传入的标量s进行相乘
      n.multiplyScalar(10);
      // .add ( v : Vector3 ) : this
      // 将传入的向量v和这个向量相加
      n.add(this.intersects[0].point);

      this.intersection.normal.copy((this.intersects[0].face as THREE.Face).normal);
      // .lookAt ( vector : Vector3 ) : undefined
      // .lookAt ( x : Float, y : Float, z : Float ) : undefined
      // vector - 一个表示世界空间中位置的向量
      // 也可以使用世界空间中x、y和z的位置分量
      // 旋转物体使其在世界空间中面朝一个点
      // 这一方法不支持其父级被旋转过或者被位移过的物体
      (this.mouseHelper as THREE.Mesh).lookAt(n);

      const positions = (this.line as THREE.Line).geometry.attributes.position;
      // .setXYZ ( index : Integer, x : Float, y : Float, z : Float ) : this
      // 设置给定索引的矢量的第一、二、三维数据（设置 X、Y 和 Z 值）
      positions.setXYZ(0, p.x, p.y, p.z);
      positions.setXYZ(1, n.x, n.y, n.z);
      // .needsUpdate : Boolean
      // 该标志位指明当前 attribute 已经被修改过，且需要再次送入 GPU 处理。
      // 当开发者改变了该队列的值，则标志位需要设置为 true
      positions.needsUpdate = true;
      this.intersection.intersects = true;
      this.intersects = [];
      this.intersects.length = 0;
    } else {
      this.intersection.intersects = false;
    }
  }

  // 喷射
  private shoot() {
    const { minScale, maxScale } = this.params;
    this.position.copy(this.intersection.point);
    // .copy ( euler : Euler ) : this
    // 将 euler 的属性拷贝到当前对象
    this.orientation.copy((this.mouseHelper as THREE.Mesh).rotation);

    if ( this.params.rotate) {
      this.orientation.z = Math.random() * 2 * Math.PI
    }

    const scale = (minScale + Math.random() * (maxScale - minScale));
    // .set ( x : Float, y : Float, z : Float ) : this
    // 设置该向量的x、y 和 z 分量
    this.size.set(scale, scale, scale);

    const material = (this.decalMaterial as THREE.MeshPhongMaterial).clone();
    // .setHex ( hex : Integer, colorSpace : string = SRGBColorSpace ) : this
    // hex — hexadecimal triplet 格式
    // 采用十六进制值设置此颜色
    material.color.setHex(Math.random() * 0xffffff);

    // 贴花几何体（DecalGeometry）
    // DecalGeometry( mesh : Mesh, position : Vector3, orientation : Euler, size : Vector3 )
    // mesh — 一个网格对象
    // position — 贴花投影器的位置
    // orientation — 贴花投影器的朝向
    // size — 贴花投影器的尺寸
    // @ts-ignore
    const m = new THREE.Mesh(new DecalGeometry(this.mesh as THREE.Object3D, this.position, this.orientation, this.size), material);

    this.decals.push(m);
    (this.scene as THREE.Scene).add(m);
  }

  // 加载模型
  private loadLeePerrySmith() {
    const loader = new GLTFLoader();
    loader.load( "/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb", (gltf) => {
        this.mesh = gltf.scene.children[0];
        // @ts-ignore
        this.mesh.material = new THREE.MeshPhongMaterial({
          // .specular : Color
          // 材质的高光颜色。默认值为0x111111（深灰色）的颜色Color
          specular: 0x111111,
          // .map : Texture
          // 颜色贴图。可以选择包括一个alpha通道，通常与.transparent 或.alphaTest。默认为null
          // 纹理贴图颜色由漫反射颜色.color调节
          map: this.textureLoader.load("/examples/models/gltf/LeePerrySmith/Map-COL.jpg"),
          // .specularMap : Texture
          // 镜面反射贴图值会影响镜面高光以及环境贴图对表面的影响程度。默认值为null
          specularMap: this.textureLoader.load("/examples/models/gltf/LeePerrySmith/Map-SPEC.jpg"),
          // .normalMap : Texture
          // 用于创建法线贴图的纹理。
          // RGB值会影响每个像素片段的曲面法线，并更改颜色照亮的方式。
          // 法线贴图不会改变曲面的实际形状，只会改变光照。
          normalMap: this.textureLoader.load("/examples/models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg"),
          // .shininess : Float
          // .specular高亮的程度，越高的值越闪亮。默认值为 30
          shininess: 25,
        });

        (this.scene as THREE.Scene).add(this.mesh);
        this.mesh.scale.set(10, 10, 10);
      }
    );
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);
  }

  // 开启动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) {
      this.stats.update();
    }

    // 控制器更新
    if (this.controls) {
      this.controls.update();
    }

    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

