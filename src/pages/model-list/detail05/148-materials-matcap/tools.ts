import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls
  private gui: GUI
  private mesh: THREE.Mesh
  private params: {
    color: number,
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

    this.controls = null;
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.mesh = new THREE.Mesh();
    this.params = {
      exposure: 1.0,
      color: 0xffffff,
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 1000);
    this.camera.position.set(0, 0, 13);

    this.loadModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.addEventListener("change", () => { this.render(); });

    this.initDragAndDrop();
    this.setUpGUI();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 初始化拖拽事件
  private initDragAndDrop() {
    window.ondragover = (e) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    window.ondrop = (e) => {
      e.preventDefault();

      if (e.dataTransfer && e.dataTransfer.files[0]) {
        this.loadFile(e.dataTransfer.files[0] as File);
      }
    };
  }

  // 加载图片
  private loadFile(file: File) {
    const filename = file.name;
    const extension = filename.split('.')[1].toLowerCase();

    const reader = new FileReader();
    if (extension === 'exr') {
      reader.onload = (e) => {
        this.handleEXR(e);
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        this.handleJPG(e);
      };
      reader.readAsDataURL(file);
    }
  }

  // 处理exr文件
  private handleEXR(e: ProgressEvent<FileReader>) {
    const target = e.target as FileReader ;
    const contents = target.result as ArrayBuffer;
    const loader = (new EXRLoader()).setDataType(THREE.HalfFloatType);
    const data = loader.parse(contents);
    const texture = new THREE.DataTexture();

    // @ts-ignore
    texture.image.width = data.width;
    // @ts-ignore
    texture.image.height = data.height;
    // @ts-ignore
    texture.image.data = data.data;

    texture.format = data.format;
    texture.type = data.type;
    texture.encoding = THREE.LinearEncoding;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    // 是否生成纹理
    texture.generateMipmaps = false;
    // 如果设置为true，纹理在上传到GPU时沿垂直轴翻转。默认为false
    texture.flipY = false;

    this.updateMatcap(texture);
  }
  // 处理图片文件
  private handleJPG(e: ProgressEvent<FileReader>) {
    const target = e.target as FileReader;
    const result = target.result as string;
    const img = new Image();

    img.src = result;
    img.onload = (e) => {
      // @ts-ignore
      const texture = new THREE.Texture(e.target);
      texture.encoding = THREE.sRGBEncoding;
      this.updateMatcap(texture);
    };
  }

  // 更新材质
  private updateMatcap(texture: THREE.DataTexture | THREE.Texture) {
    const material = this.mesh.material as THREE.MeshMatcapMaterial;

    if (material.matcap) { material.matcap.dispose(); }
    material.matcap = texture;
    texture.needsUpdate = true;
    material.needsUpdate = true;
    this.mesh.material = material;
    this.render();
  }

  private setUpGUI() {
    this.gui.addColor(this.params, "color").name("颜色").listen().onChange(() => {
      const material = this.mesh.material as THREE.MeshMatcapMaterial;
      material.color.set(this.params.color ).convertSRGBToLinear();
      this.render();
    });

    this.gui.add(this.params, "exposure", 0, 2).onChange(() => {
      if (this.renderer) {
        this.renderer.toneMappingExposure = this.params.exposure;
      }
      this.render();
    });
  }

  private loadModel() {
    // toast
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    // manager
    const manager = new THREE.LoadingManager(() => { this.render(); });
    // matcap
    const loaderEXR = new EXRLoader(manager);
    const matcapUrl = "/examples/textures/matcaps/040full.exr";
    const matcap = loaderEXR.load(matcapUrl);

    // normalmap
    const loader = new THREE.TextureLoader(manager);
    const normalmapUrl = "/examples/models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg";
    const normalMap = loader.load(normalmapUrl);


    const gltfLoader = new GLTFLoader(manager);
    const modelUrl = "/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb";

    gltfLoader.load(modelUrl, (gltf) => {
    toast.close();

    this.mesh = gltf.scene.children[0] as THREE.Mesh;
    this.mesh.position.y = -0.25;
    this.mesh.material = new THREE.MeshMatcapMaterial({
      color: (new THREE.Color()).setHex(this.params.color).convertSRGBToLinear(),
      matcap,
      normalMap
    });

    this.scene.add(this.mesh);
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    // 执行渲染
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
      this.render();
    };
  }
}

export default THREE;

