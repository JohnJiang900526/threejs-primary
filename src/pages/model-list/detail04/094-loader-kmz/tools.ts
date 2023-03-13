import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { KMZLoader } from 'three/examples/jsm/loaders/KMZLoader';
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

  private box: THREE.Scene
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

    this.box = new THREE.Scene();
  }

  // 初始化方法入口
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x999999);

    // 相机
    this.camera = new THREE.PerspectiveCamera(35, this.aspect, 1, 500);
    this.camera.position.set(0, 5, 10);
    this.scene.add(this.camera);

    // 加载模型
    this.loadModel();

    // 光源
    this.createLight();

    // 创建地板
    const grid = new THREE.GridHelper(50, 50, 0xffffff, 0x333333);
    this.scene.add(grid);

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.addEventListener("change", () => { this.render(); });
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

  // 光源
  private createLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(0.5, 1.0, 0.5).normalize();
    this.scene.add(light);

    this.scene.add(new THREE.AmbientLight(0xffffff));
  }

  // 加载模型
  private loadModel() {
    const loader = new KMZLoader();
    const url = "/examples/models/kmz/Box.kmz";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (kmz) => {
      toast.close();

      this.box = kmz.scene;
      this.box.position.y = 1;
      this.scene.add(this.box);
    }, undefined, () => {
      toast.close();
    });
  }


  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

  private render() {
    // 执行渲染
    if (this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    if (this.box) {
      this.box.rotation.y += 0.005;
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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

