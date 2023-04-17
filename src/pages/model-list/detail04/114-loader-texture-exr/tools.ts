import * as THREE from 'three';
import GUI from "lil-gui";
import Stats from 'three/examples/jsm/libs/stats.module';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.OrthographicCamera;
  private stats: null | Stats;

  private gui: GUI
  private params: {
    exposure: number
  }
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });

    this.params = {
      exposure: 2.0
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.OrthographicCamera(-this.aspect, this.aspect, 1, - 1, 0, 1);

    // 创建模型
    this.createModel();

    // webgl渲染器
    this.createRenderer();

    // gui初始化
    this.gui.add(this.params, 'exposure', 0.1, 20, 0.01).onChange(() => {
      this.render();
    });

    this.render();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 加载模型
  private createModel() {
    const loader = new EXRLoader();
    const url = "/examples/textures/memorial.exr";
    const toast = showLoadingToast({
      duration: 10000,
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (texture, textureData) => {
      toast.close();

      // @ts-ignore
      const {width, height} = textureData;
      const aspect = width / height;
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const plane = new THREE.PlaneGeometry(1.75 * aspect, 2);
      const mesh = new THREE.Mesh(plane, material);
      
      this.scene.add(mesh);
      this.render();
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = this.params.exposure;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

  private render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.toneMappingExposure = this.params.exposure;
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.toneMappingExposure = this.params.exposure;
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
        const frustumHeight = this.camera.top - this.camera.bottom;
				this.camera.left = - frustumHeight * this.aspect / 2;
				this.camera.right = frustumHeight * this.aspect / 2;
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

