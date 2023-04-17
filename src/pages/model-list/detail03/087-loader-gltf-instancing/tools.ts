import * as THREE from 'three';
import { showLoadingToast } from "vant";
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
    this.scene.background = new THREE.Color(0x261914);

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 0.25, 20);
    this.camera.position.set(-0.90, 0.41, -0.89);

    // 加载材质
    this.loadTexture();

    // 加载模型
    this.loadModel();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.addEventListener("change", () => { this.render(); });
    this.controls.minDistance = 0.2;
    this.controls.maxDistance = 10;
    this.controls.target.set(0, 0.25, 0);
    this.controls.update();
    
    this.render();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 加载材质
  private loadTexture() {
    const loader = new RGBELoader();
    const url = "/examples/textures/equirectangular/royal_esplanade_1k.hdr";

    const toast = showLoadingToast({
      message: '材质加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (texture) => {
      toast.close();

      // .mapping : number
      // 图像将如何应用到物体（对象）上。默认值是THREE.UVMapping对象类型， 即UV坐标将被用于纹理映射。
      texture.mapping = THREE.EquirectangularReflectionMapping;
      // .background : Object
      // 若不为空，在渲染场景的时候将设置背景，且背景总是首先被渲染的
      //  可以设置一个用于的“clear”的Color（颜色）、一个覆盖canvas的Texture（纹理）
      // 或是 a cubemap as a CubeTexture or an equirectangular as a Texture。默认值为null
      this.scene.background = texture;
      // .environment : Texture
      // 若该值不为null，则该纹理贴图将会被设为场景中所有物理材质的环境贴图
      // 然而，该属性不能够覆盖已存在的、已分配给 MeshStandardMaterial.envMap 的贴图。默认为null
      this.scene.environment = texture;

      this.render();
    }, undefined, () => {
      toast.close();
    });
  }

  // 加载模型
  private loadModel() {
    const loader = new GLTFLoader();
    const path = "/examples/models/gltf/DamagedHelmet/glTF-instancing/";
    const url = "DamagedHelmetGpuInstancing.gltf";
    const toast = showLoadingToast({
      message: '模型加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.setPath(path);
    loader.load(url, (gltf) => {
      toast.close();
      this.scene.add(gltf.scene);
      this.render();
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
    // .toneMappingExposure : Number
    // 色调映射的曝光级别。默认是1
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
    // @ts-ignore
    this.stats = Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
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

