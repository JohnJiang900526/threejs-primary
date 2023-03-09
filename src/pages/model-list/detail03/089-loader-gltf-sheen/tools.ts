import * as THREE from 'three';
import { showFailToast, showLoadingToast } from "vant";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
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
    // 渲染器
    this.createRenderer();

    // 场景
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer as THREE.WebGLRenderer);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbbbbbb);
    this.scene.environment = pmremGenerator.fromScene(environment).texture;

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.25, 20);
    this.camera.position.set(-0.75, 0.7, 1.25);

    // 加载模型和材质
    this.loadModel();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    // .enableDamping : Boolean
    // 将其设置为true以启用阻尼（惯性），这将给控制器带来重量感
    // 默认值为false。请注意，如果该值被启用，你将必须在你的动画循环里调用.update()
    this.controls.enableDamping = true;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 100;
    this.controls.target.set(0, 0.35, 0);
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

  setSheen(sheen: number) {
    if (this.group) {
      const obj = this.group.getObjectByName("SheenChair_fabric") as THREE.Mesh;

      // @ts-ignore
      if (obj) { obj.material.sheen = sheen;}
    }
  }

  // 加载模型&材质
  private loadModel () {
    const loader = new GLTFLoader();
    const url = "/examples/models/gltf/SheenChair.glb";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (gltf) => {
      toast.close();

      this.group = gltf.scene;
      this.group.scale.set(0.7, 0.7, 0.7);
      this.scene.add(this.group);
    }, undefined, () => {
      toast.close();
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // .toneMapping : Constant
    // 默认是NoToneMapping。查看Renderer constants以获取其它备选项
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    // 如果渲染目标已经使用 .setRenderTarget、之后将直接使用renderTarget.texture.encoding
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

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
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

