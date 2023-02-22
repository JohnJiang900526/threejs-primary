import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private controls: null | FlyControls
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private clock: THREE.Clock
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.controls = null;
    this.camera = null;
    this.stats = null;
    this.clock = new THREE.Clock();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color().setHSL(0.51, 0.4, 0.01);
    this.scene.fog = new THREE.Fog(this.scene.background, 3500, 15000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(50, this.width/this.height, 1, 15000);
    this.camera.position.z = 250;

    // 添加光线
    const light = new THREE.DirectionalLight(0xffffff, 0.05);
    light.position.set(0, -1, 0).normalize();
    light.color.setHSL(0.1, 0.7, 0.5);
    this.scene.add(light);

    // 创建几何
    this.createGeometry();

    // 创建渲染器
    this.createRenderer();

    // 创建控制器
    this.controls = new FlyControls(this.camera, this.renderer?.domElement);
    this.controls.movementSpeed = 500;
    this.controls.domElement = this.container;
    this.controls.rollSpeed = Math.PI / 6;
    this.controls.autoForward = false;
    this.controls.dragToLook = false;
    
    // 性能统计
    this.initStats();
    // 动画
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建几何体
  private createGeometry() {

  }

  // 添加光线
  private addLight(h: number = 0, s: number = 0, l: number = 0, x: number = 0, y: number = 0, z: number = 0) {
    
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    // 控制器更新
    if (this.controls) { this.controls.update(this.clock.getDelta()); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
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

