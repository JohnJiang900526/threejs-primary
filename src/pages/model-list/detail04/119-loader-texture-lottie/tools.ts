import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry';
import { LottieLoader } from 'three/examples/jsm/loaders/LottieLoader';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private mesh: THREE.Mesh
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    
    this.mesh = new THREE.Mesh();
  }

  init() {
    // webgl渲染器
    this.createRenderer();

    const environment = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(this.renderer as THREE.WebGLRenderer);

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.scene.environment = generator.fromScene(environment).texture;

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 0.1, 10);
    this.camera.position.z = 5;

    // 创建模型
    this.createModel();

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
  private createModel() {
    const loader = new LottieLoader();
    const url = "/examples/textures/lottie/24017-lottie-logo-animation.json";
    const toast = showLoadingToast({
      duration: 10000,
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.setQuality(2);
    loader.load(url, (texture) => {
      toast.close();

      // @ts-ignore
      const animation = texture.animation;
      const geometry = new RoundedBoxGeometry(1, 1, 1, 7, 0.2);
      const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.1,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);
      animation?.play && animation?.play();
    }, undefined, () => { toast.close(); });
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

    this.mesh.rotation.y -= 0.001;

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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

