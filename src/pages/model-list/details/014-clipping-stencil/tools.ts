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
    // 实例化时钟
    this.clock = new THREE.Clock();

    // 实例化相机
    this.camera = new THREE.PerspectiveCamera(60, this.width/this.height, 1, 100);
    this.camera.position.set(2, 2, 2);

    // 创建场景
    this.scene = new THREE.Scene();
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

    this.object = new THREE.Group();
    this.scene.add(this.object);

    // geometry
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

    // add the color
    const clippedColorFront = new THREE.Mesh(geometry, material);
    clippedColorFront.castShadow = true;
    clippedColorFront.renderOrder = 6;
    this.object.add(clippedColorFront);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9, 1, 1),
      new THREE.ShadowMaterial({color: 0x000000, opacity: 0.25, side: THREE.DoubleSide})
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x263238);
    this.renderer.localClippingEnabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 控制器
    this.controls = new OrbitControls(this.camera,this.renderer.domElement );
    this.controls.minDistance = 2;
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

    // 基础材质
    const baseMat = new THREE.MeshBasicMaterial();
    baseMat.depthWrite = false;
    baseMat.depthTest = false;
    baseMat.colorWrite = false;
    baseMat.stencilWrite = true;
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
    mat1.clippingPlanes = [ plane ];
    mat1.stencilFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZPass = THREE.DecrementWrapStencilOp;

    const mesh1 = new THREE.Mesh(geometry, mat1);
    mesh1.renderOrder = renderOrder;
    group.add(mesh1);

    return group;
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

