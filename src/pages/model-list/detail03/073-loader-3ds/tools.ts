import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { TDSLoader } from 'three/examples/jsm/loaders/TDSLoader';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | TrackballControls
  private stats: null | Stats;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
  }

  // 初始化方法入口
  init(fn1?: () => void, fn2?: (e: ErrorEvent) => void) {

    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.add(new THREE.HemisphereLight());

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 0.1, 10);
    this.camera.position.z = 5;

    // 创建灯光
    const light = new THREE.DirectionalLight(0xffeedd);
    light.position.set(0, 0, 5);
    this.scene.add(light);

    // 加载模型
    this.loadModel(fn1, fn2);

    // 创建渲染器
    this.createRenderer();

    // 创建控制器 轨迹球控制器（TrackballControls）
    // TrackballControls 与 OrbitControls 相类似。然而，它不能恒定保持摄像机的up向量。 
    // 这意味着，如果摄像机绕过“北极”和“南极”，则不会翻转以保持“右侧朝上”
    this.controls = new TrackballControls(this.camera, this.renderer?.domElement);
    this.controls.update();


    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 加载模型
  private loadModel(fn1?: () => void, fn2?: (e: ErrorEvent) => void) {
    const normal = new THREE.TextureLoader().load('/examples/models/3ds/portalgun/textures/normal.jpg');

    const loader = new TDSLoader();
    const url = "/examples/models/3ds/portalgun/portalgun.3ds";

    loader.setResourcePath('/examples/models/3ds/portalgun/textures/');
    loader.load(url, (object) => {
      object.traverse((child) => {
        const obj = child as THREE.Mesh;
        if (obj.isMesh) {
          // @ts-ignore
          obj.material.specular.setScalar(0.1);
          // @ts-ignore
          obj.material.normalMap = normal;
        }
      });
      this.scene.add(object);
      fn1 && fn1();
    }, undefined, (e) => {
      fn2 && fn2(e);
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);
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

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    // 控制器更新
    if (this.controls) { this.controls.update(); }

    // 执行渲染
    if (this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      if (this.camera) {
        this.camera.aspect = this.aspect;
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

