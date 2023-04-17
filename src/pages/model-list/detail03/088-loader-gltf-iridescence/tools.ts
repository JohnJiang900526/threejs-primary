import * as THREE from 'three';
import { showFailToast, showLoadingToast } from "vant";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

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

  private group: null | THREE.Group
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

    this.group = null;
  }

  // 初始化方法入口
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xc1d5e7);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.25, 20);
    this.camera.position.set(0.35, 0.05, 0.35);

    // 加载模型和材质
    this.loadModelAndTexture().catch((e) => {
      showFailToast({ message: e.message});
    });

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(0, 0.2, 0);
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

  // 加载模型&材质
  private async loadModelAndTexture () {
    const rgbeLoader = new RGBELoader();
    const gltfLoader = new GLTFLoader();

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    rgbeLoader.setPath("/examples/textures/equirectangular/");
    gltfLoader.setPath("/examples/models/gltf/");

    const [texture, gltf] = await Promise.all([
      rgbeLoader.loadAsync('venice_sunset_1k.hdr'),
      gltfLoader.loadAsync('IridescenceLamp.glb'),
    ]);

    toast.close();
    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = texture;
    this.scene.environment = texture;

    this.group = gltf.scene;
    this.group.scale.set(0.5, 0.5, 0.5);
    this.group.position.y = 0.1;
    this.scene.add(this.group);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // .toneMapping : Constant
    // 默认是NoToneMapping。查看Renderer constants以获取其它备选项
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    // 如果渲染目标已经使用 .setRenderTarget、之后将直接使用renderTarget.texture.encoding
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

    // 控制物体旋转
    if (this.group) {
      this.group.rotation.y += 0.05;
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

