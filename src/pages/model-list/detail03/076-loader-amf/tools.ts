import * as THREE from 'three';
import { showLoadingToast } from "vant";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AMFLoader } from 'three/examples/jsm/loaders/AMFLoader';

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
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x999999);
    this.scene.add(new THREE.AmbientLight(0x999999));

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 500);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0, -9, 6);
    this.camera.add(new THREE.PointLight(0xffffff, 0.8));
    this.scene.add(this.camera);

    // 渲染器
    this.createRenderer();

    // 模型
    this.loadModel();

    this.createFlooter();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(0, 1.2, 2);
    this.controls.addEventListener("change", () => { this.render(); });
    this.controls.update();

    this.render();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 加载模型
  private loadModel() {
    const loader = new AMFLoader();
    const url = "/examples/models/amf/rook.amf";
    const toast = showLoadingToast({
      message: '模型加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (obj) => {
      toast.close();
      this.scene.add(obj);
      this.render();
    }, undefined, () => {
      toast.close();
    });
  }

  // 创建地板
  private createFlooter() {
    const helper = new THREE.GridHelper(50, 50, 0xffffff, 0x555555);
    helper.rotateOnAxis(new THREE.Vector3( 1, 0, 0 ), 90 * ( Math.PI/180));
    this.scene.add(helper);
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

  private render() {
     // 执行渲染
     if (this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

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
      this.render();
    };
  }
}

export default THREE;

