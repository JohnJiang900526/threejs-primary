import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private controls: null | OrbitControls
  private camera: null | THREE.PerspectiveCamera
  private stats: null | Stats
  private object: null | THREE.Group
  private planes: THREE.Plane[]
  private planeObjects: THREE.Mesh[]
  private planeHelpers: THREE.PlaneHelper[]
  private clock: THREE.Clock
  private params: Iparams
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.controls = null;
    this.camera = null;
    this.stats = null;
    this.object = null;
    this.planes = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
    ];
    this.planeObjects = [];
    this.planeHelpers = [];
    this.clock = new THREE.Clock();

    // 默认参数
    this.params = {
      animate: true,
      planeX: {
        constant: 0,
        negated: false,
        displayHelper: false
      },
      planeY: {
        constant: 0,
        negated: false,
        displayHelper: false
      },
      planeZ: {
        constant: 0,
        negated: false,
        displayHelper: false
      },
    };
  }

  // 初始化方法入口
  init() {
    // 实例化时钟 Clock( autoStart : Boolean )
    // 该对象用于跟踪时间。如果performance.now可用，
    // 则 Clock 对象通过该方法实现，否则回落到使用略欠精准的Date.now来实现

    // Clock( autoStart : Boolean )
    // autoStart — (可选) 是否要在第一次调用 .getDelta() 时自动开启时钟。默认值是 true
    this.clock = new THREE.Clock();

    // 实例化相机
    this.camera = new THREE.PerspectiveCamera(60, this.width/this.height, 1, 100);
    this.camera.position.set(2, 2, 2);

    // 创建场景
    this.scene = new THREE.Scene();
    // 添加环境光
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // 创建直线光
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    this.planeHelpers = this.planes.map((plane) => new THREE.PlaneHelper(plane, 2, 0xffffff));
    this.planeHelpers.forEach((helper) => {
      helper.visible = false;
      (this.scene as THREE.Scene).add(helper);
    });

    // geometry 创建几何体
    this.object = new THREE.Group();
    this.scene.add(this.object);
    // 圆环缓冲扭结几何体（TorusKnotGeometry）
    // TorusKnotGeometry(radius : Float, tube : Float, tubularSegments : Integer, radialSegments : Integer, p : Integer, q : Integer)
    // radius - 圆环的半径，默认值为1
    // tube — 管道的半径，默认值为0.4
    // tubularSegments — 管道的分段数量，默认值为64
    // radialSegments — 横截面分段数量，默认值为8
    // p — 这个值决定了几何体将绕着其旋转对称轴旋转多少次，默认值是2
    // q — 这个值决定了几何体将绕着其内部圆环旋转多少次，默认值是3
    const geometry = new THREE.TorusKnotGeometry(0.4, 0.10, 220, 60);
    const planeGeometry =  new THREE.PlaneGeometry(4, 4);
    for (let i = 0; i < 3; i++) {
      const planeObjectGroup = new THREE.Group();
      const plane = this.planes[i];
      const stencilGroup = this.createPlaneStencilGroup(geometry, plane, i + 1);

      // plane is clipped by the other clipping planes
      const planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xE91E63,
        metalness: 0.1,
        roughness: 0.75,
        clippingPlanes: this.planes.filter((p) => p !== plane ),
        stencilWrite: true,
        stencilRef: 0,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp,
        stencilZFail: THREE.ReplaceStencilOp,
        stencilZPass: THREE.ReplaceStencilOp,
      });

      const planeObject = new THREE.Mesh(planeGeometry, planeMaterial);
      planeObject.onAfterRender = (renderer) => {renderer.clearStencil();};
      planeObject.renderOrder = (i + 1.1);
      this.object.add(stencilGroup);
      planeObjectGroup.add(planeObject);
      this.planeObjects.push(planeObject);
      this.scene.add(planeObjectGroup);
    }

    // 材质
    const material = new THREE.MeshStandardMaterial({
      color: 0xFFC107,
      metalness: 0.1,
      roughness: 0.75,
      clippingPlanes: this.planes,
      clipShadows: true,
      shadowSide: THREE.DoubleSide,
    });

    //添加颜色
    const clippedColorFront = new THREE.Mesh(geometry, material);
    clippedColorFront.castShadow = true;
    clippedColorFront.renderOrder = 6;
    this.object.add(clippedColorFront);

    // 添加投影板
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9, 1, 1),
      new THREE.ShadowMaterial({color: 0x000000, opacity: 0.25, side: THREE.DoubleSide})
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    // 接收阴影
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // .setClearColor ( color : Color, alpha : Float )
    // 设置渲染器的颜色及其透明度
    this.renderer.setClearColor(0x263238);
    // 定义渲染器是否考虑对象级剪切平面。 默认为false
    this.renderer.localClippingEnabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 控制器
    this.controls = new OrbitControls(this.camera,this.renderer.domElement );
    // 你能够将相机向内移动多少（仅适用于PerspectiveCamera），其默认值为0
    this.controls.minDistance = 2;
    // 你能够将相机向外移动多少（仅适用于PerspectiveCamera），其默认值为Infinity
    this.controls.maxDistance = 20;
    this.controls.update();
    
    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // animate
  setAnimate(isTrue: boolean) {
    this.params.animate = isTrue;
  }

  // displayHelper
  setDisplayHelper(type: "planeX" | "planeY" | "planeZ", show: boolean) {
    switch(type) {
      case "planeX":
        this.planeHelpers[0].visible = show;
        break;
      case "planeY":
        this.planeHelpers[1].visible = show;
        break;
      case "planeZ":
        this.planeHelpers[2].visible = show;
        break;
      default:
        this.planeHelpers[0].visible = show;
    }
  }

  // constant
  setConstant(type: "planeX" | "planeY" | "planeZ", val: number) {
    switch(type) {
      case "planeX":
        this.planes[0].constant = val;
        break;
      case "planeY":
        this.planes[1].constant = val;
        break;
      case "planeZ":
        this.planes[2].constant = val;
        break;
      default:
        this.planes[0].constant = val;
    }
  }

  // negated
  setNegated(type: "planeX" | "planeY" | "planeZ", show?: boolean) {
    switch(type) {
      case "planeX":
        this.planes[0].negate();
				this.params.planeX.constant = this.planes[0].constant;
        break;
      case "planeY":
        this.planes[1].negate();
				this.params.planeY.constant = this.planes[1].constant;
        break;
      case "planeZ":
        this.planes[2].negate();
				this.params.planeZ.constant = this.planes[2].constant;
        break;
      default:
        this.planes[0].negate();
				this.params.planeX.constant = this.planes[0].constant;
    }
  }

  // 创建平面模具组
  private createPlaneStencilGroup(geometry: THREE.TorusKnotGeometry, plane: THREE.Plane, renderOrder: number) {
    const group = new THREE.Group();

    // 基础材质 基础网格材质(MeshBasicMaterial)
    // 一个以简单着色（平面或线框）方式来绘制几何体的材质。这种材质不受光照的影响。
    const baseMat = new THREE.MeshBasicMaterial();
    // 渲染此材质是否对深度缓冲区有任何影响。默认为true
    // 在绘制2D叠加时，将多个事物分层在一起而不创建z-index时，禁用深度写入会很有用
    baseMat.depthWrite = false;
    // 是否在渲染此材质时启用深度测试。默认为 true
    baseMat.depthTest = false;
    // 是否渲染材质的颜色。 这可以与网格的renderOrder属性结合使用，以创建遮挡其他对象的不可见对象。默认值为true。
    baseMat.colorWrite = false;
    // 是否对模板缓冲执行模板操作，如果执行写入或者与模板缓冲进行比较，这个值需要设置为true。默认为false。
    baseMat.stencilWrite = true;
    // 使用模板比较时所用的方法，默认为AlwaysStencilFunc。在模板函数 constants 中查看可用的值
    baseMat.stencilFunc = THREE.AlwaysStencilFunc;

    // back faces
    const mat0 = baseMat.clone();
    mat0.side = THREE.BackSide;
    mat0.clippingPlanes = [plane];
    mat0.stencilFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZPass = THREE.IncrementWrapStencilOp;

    const mesh0 = new THREE.Mesh(geometry, mat0);
    mesh0.renderOrder = renderOrder;
    group.add(mesh0);

    // front faces
    const mat1 = baseMat.clone();
    mat1.side = THREE.FrontSide;
    // 用户定义的剪裁平面，在世界空间中指定为THREE.Plane对象
    mat1.clippingPlanes = [ plane ];
    // 当比较函数没有通过的时候要执行的模板操作，默认为KeepStencilOp，在模板操作 constants 查看可用值。
    mat1.stencilFail = THREE.DecrementWrapStencilOp;
    // 当比较函数通过了但是深度检测没有通过的时候要执行的模板操作， 默认为KeepStencilOp，在模板操作 constants 查看可用值
    mat1.stencilZFail = THREE.DecrementWrapStencilOp;
    // 当比较函数和深度检测都通过时要执行的模板操作，默认为KeepStencilOp，在模板操作constants 中查看可用值
    mat1.stencilZPass = THREE.DecrementWrapStencilOp;

    const mesh1 = new THREE.Mesh(geometry, mat1);
    // 这个值将使得scene graph（场景图）中默认的的渲染顺序被覆盖
    // 即使不透明对象和透明对象保持独立顺序。 渲染顺序是由低到高来排序的，默认值为0
    mesh1.renderOrder = renderOrder;
    group.add(mesh1);

    return group;
  }

  // 性能统计
  private initStats() {
    // @ts-ignore
    this.stats = Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
    this.container.appendChild(this.stats.domElement);
  }

  // 开启动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    const delta = this.clock.getDelta();

    if (this.params.animate) {
      (this.object as THREE.Group).rotation.x += (delta * 0.5);
      (this.object as THREE.Group).rotation.y += (delta * 0.5);
    }

    this.planeObjects.forEach((planeObject, index) => {
      const plane = this.planes[index];
      plane.coplanarPoint(planeObject.position);
      planeObject.lookAt(
        planeObject.position.x - plane.normal.x,
        planeObject.position.y - plane.normal.y,
        planeObject.position.z - plane.normal.z,
      );
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 控制器更新
    if (this.controls) { this.controls.update(); }

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
        this.camera.aspect = this.width/this.height;
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

