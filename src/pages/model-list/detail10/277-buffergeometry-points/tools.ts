import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;
  private points: null | THREE.Points;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.gui.hide();
    this.points = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.Fog(0x050505, 2000, 5000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 5, 5000);
    this.camera.position.z = 2750;

    // 模型
    this.generateModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
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

  // 创建模型
  // 核心逻辑
  private generateModel() {
    const particles = 5000;
    const geometry = new THREE.BufferGeometry();

    const positions: number[] = [];
    const colors: number[] = [];
    const color = new THREE.Color();

    // 粒子在立方体中扩散
    const radius = 1000, half = (radius / 2);
    for (let i = 0; i < particles; i++) {
      // 位置
      const x = Math.random() * radius - half;
      const y = Math.random() * radius - half;
      const z = Math.random() * radius - half;
      positions.push(x, y, z);

      // 颜色
      const r = (x / radius) + 0.5;
      const g = (y / radius) + 0.5;
      const b = (z / radius) + 0.5;
      color.setRGB(r, g, b);
      colors.push(color.r, color.g, color.b);
    }

    const positionAttr = new THREE.Float32BufferAttribute(positions, 3);
    geometry.setAttribute('position', positionAttr);

    const colorAttr = new THREE.Float32BufferAttribute(colors, 3);
    geometry.setAttribute('color', colorAttr);

    // 计算球形边界
    geometry.computeBoundingSphere();

    const material = new THREE.PointsMaterial({ 
      size: 15,
      // 使用顶点着色
      vertexColors: true,
    });
    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
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
    // @ts-ignore
    this.stats = Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      // 控制模型旋转
      const timer = Date.now() * 0.001 / 2;
      this.points!.rotation.x = timer * 0.25;
      this.points!.rotation.y = timer * 0.50;
    }

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
  }

  // 消除 副作用
  dispose() {
    window.cancelAnimationFrame(this.animateNumber);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

