import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

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

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202020);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 0.1, 100);
    this.camera.position.set(2, 1.5, 1);
    this.camera.lookAt(this.scene.position);
    this.scene.add(this.camera);

    // 渲染器
    this.createRenderer();

    // 创建模型
    this.createModel();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.autoRotate = true;

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
  private async createModel () {
    const geometry = this.flipY( new THREE.PlaneGeometry() );
    const material = new THREE.MeshBasicMaterial( {
      color: 0xFFFFFF,
      side: THREE.DoubleSide
    });
    
    const toast = showLoadingToast({
      duration: 10000,
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    const loader = new KTX2Loader();
    const url = "/examples/textures/compressed/sample_uastc_zstd.ktx2";
    const path = "/examples/js/libs/basis/";

    loader.setTranscoderPath(path);
    loader.detectSupport(this.renderer as THREE.WebGLRenderer);

    loader.load(url, (texture) => {
      toast.close();
      material.map = texture;
      material.transparent = true;
      material.needsUpdate = true;

      const mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
    }, undefined, () => {
      loader.dispose();
      toast.close();
    });
  }

  // Y方向翻转
  private flipY(geometry: THREE.PlaneGeometry) {
    const uv = geometry.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) {
      uv.setY(i, 1 - uv.getY(i));
    }
    return geometry;
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

