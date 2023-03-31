import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { XYZLoader } from 'three/examples/jsm/loaders/XYZLoader';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private stats: null | Stats;

  private points: THREE.Points;
  private clock: THREE.Clock;
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

    this.points = new THREE.Points();
    this.clock = new THREE.Clock();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.1, 100);
    this.camera.position.set(10, 7, 10);

    // 创建光线
    this.createLight();

    // 创建模型
    this.loadModel();

    // webgl渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createLight() {
    const light1 = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
    light2.position.set(2, 2, 2);

    this.scene.add(light1, light2);
  }

  // 加载模型
  private loadModel() {
    const loader = new XYZLoader();
    const url = "/public/examples/models/xyz/helix_201.xyz";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (geometry) => {
      toast.close();

      geometry.center();
      geometry.computeVertexNormals();

      const vertexColors = (geometry.hasAttribute( 'color' ) === true);
      const material = new THREE.PointsMaterial({ 
        size: 0.1, 
        vertexColors, 
      });

      this.points = new THREE.Points(geometry, material);
      this.scene.add(this.points);
    }, undefined, () => {
      toast.close();
    });
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

    // 自动旋转
    const delta = this.clock.getDelta();
    if (this.points) {
      this.points.rotation.x += delta * 0.05;
      this.points.rotation.y += delta * 0.05;
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    if (this.controls) { this.controls.update(); }

    if (this.renderer && this.scene && this.camera) {
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

