import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private controls: null | OrbitControls
  private camera: null | THREE.PerspectiveCamera
  private stats: null | Stats
  private params: {
    clipIntersection: boolean,
    planeConstant: number,
    showHelpers: boolean
  }
  private clipPlanes: THREE.Plane[]
  private helpers: null | THREE.Group
  private group: null | THREE.Group
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.controls = null;
    this.camera = null;
    this.stats = null;

    this.params = {
      clipIntersection: true,
      planeConstant: 0,
      showHelpers: false
    };

    this.clipPlanes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
    ];

    this.helpers = null;
    this.group = null;
  }

  // 初始化方法入口
  init() {
    // 初始化相机
    this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 1, 200);
    this.camera.position.set(-1.5, 2.5, 3.0);

    // 初始化一个场景
    this.scene = new THREE.Scene();

    // 创建一束光
    const light = new THREE.HemisphereLight(0xffffff, 0x080808, 1.5);
    light.position.set(-1.25, 1, 1.25);
    this.scene.add(light);

    // 创建几何分组
    this.group = new THREE.Group();
    for (let i = 1; i <= 30; i += 2) {
      const geometry = new THREE.SphereGeometry(i / 30, 48, 24);
      const material = new THREE.MeshLambertMaterial( {
        color: new THREE.Color().setHSL(Math.random(), 0.5, 0.5),
        side: THREE.DoubleSide,
        clippingPlanes: this.clipPlanes,
        clipIntersection: this.params.clipIntersection
      });
      this.group.add(new THREE.Mesh(geometry, material));
    }
    this.scene.add(this.group);

    // 创建helpers
    this.helpers = new THREE.Group();
    this.helpers.add(new THREE.PlaneHelper(this.clipPlanes[0], 2, 0xff0000));
    this.helpers.add(new THREE.PlaneHelper(this.clipPlanes[1], 2, 0x00ff00));
    this.helpers.add(new THREE.PlaneHelper(this.clipPlanes[2], 2, 0x0000ff));
    this.helpers.visible = false;
    this.scene.add(this.helpers);

    // 实例化一个渲染器
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.localClippingEnabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 实例化一个轨道控制器
    this.controls = new OrbitControls( this.camera, this.renderer.domElement);
    this.controls.update();
    // 禁止相机平移
    this.controls.enablePan = false;
    // 启用阻尼（惯性）
    this.controls.enableDamping = true;
    // 启用自动旋转
    this.controls.autoRotate = true;
    
    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 设置交叉点 Intersection
  setIntersection(isTrue: boolean) {
    const children: THREE.Object3D[] = (this.group as THREE.Group).children;
    for ( let i = 0; i < children.length; i ++ ) {
      // @ts-ignore
      children[i].material.clipIntersection = isTrue;
    }
  }
  // 设置变量 Constant
  setConstant(val: number) {
    for ( let i = 0; i < this.clipPlanes.length; i ++ ) {
      this.clipPlanes[i].constant = val;
    }
  }
  // Helpers
  showHelpers(isShow: boolean) {
    (this.helpers as THREE.Group).visible = isShow;
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

