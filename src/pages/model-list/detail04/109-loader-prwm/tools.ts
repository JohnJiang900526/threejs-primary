import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { PRWMLoader } from 'three/examples/jsm/loaders/PRWMLoader';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  
  private mouse: THREE.Vector2
  private halfX: number
  private halfY: number
  private mesh: null | THREE.Mesh
  private urls: {
    "faceted": string,
    "smooth": string,
    "vive": string,
    [key: string]: string
  }
  private params: {
    key: string,
    model: string
  }
  private gui: GUI
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    
    this.mouse = new THREE.Vector2(0, 0);
    this.halfX = this.width/2;
    this.halfY = this.height/2;
    this.mesh = null;
    this.urls = {
      "faceted": "/examples/models/prwm/faceted-nefertiti.*.prwm",
      "smooth": "/examples/models/prwm/smooth-suzanne.*.prwm",
      "vive": "/examples/models/prwm/vive-controller.*.prwm",
    };
    this.params = {
      key: "smooth",
      model: "/examples/models/prwm/smooth-suzanne.*.prwm"
    };
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 2000);
    this.camera.position.z = 350;

    // 创建光线
    this.createLight();

    // 加载模型
    this.loadModel();

    // webgl渲染器
    this.createRenderer();

    // 实例化gui
    this.initGUI();

    this.bind();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private initGUI() {
    this.gui.add(this.params, "model", this.urls).name("选择模型").onChange((url: string) => {
      this.computerKey(url);
      this.loadModel();
    });
  }

  private computerKey(url: string) {
    const arr = Object.keys(this.urls);
    let currentKey = "smooth";

    arr.forEach((key) => {
      if (this.urls[key] === url) {
        currentKey = key;
      }
    });
    this.params.key = currentKey;
  }

  private bind() {
    if (this.isMobile()) {
      this.container.onpointermove = null;
      this.container.ontouchmove = (event) => {
        const e = event.touches[0];

        const x = (e.clientX - this.halfX) / 2;
				const y = (e.clientY - 45 - this.halfY) / 2;

        this.mouse.set(x, y);
      };
    } else {
      this.container.ontouchmove = null;
      this.container.onpointermove = (e) => {
        const x = (e.clientX - this.halfX) / 2;
				const y = (e.clientY - 45 - this.halfY) / 2;

        this.mouse.set(x, y);
      }
    }
  }

  private createLight() {
    const ambient = new THREE.AmbientLight(0x101030);
    const light = new THREE.DirectionalLight(0xffeedd);
    light.position.set(0, 0, 1);

    this.scene.add(ambient, light);
  }

  // 加载模型
  private loadModel() {
    const loader = new PRWMLoader();
    const material = new THREE.MeshPhongMaterial();
    const toast = showLoadingToast({
      duration: 10000,
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    if (this.mesh) { 
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }

    loader.load(this.params.model, (geometry) => {
      toast.close();
      this.mesh = new THREE.Mesh(geometry, material);

      switch(this.params.key) {
        case "faceted":
          this.mesh.scale.set(25, 25, 25);
          this.mesh.position.y = 0;
          break;
        case "smooth":
          this.mesh.scale.set(50, 50, 50);
          this.mesh.position.y = 0;
          break;
          case "vive":
          this.mesh.scale.set(75, 75, 75);
          this.mesh.position.y = 50;
          break;
        default:
          this.mesh.scale.set(50, 50, 50);
      }
      
      this.scene.add(this.mesh);
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

    if (this.camera) {
      const {x, y} = this.mouse;
      this.camera.position.x += (x - this.camera.position.x) * 0.05;
			this.camera.position.y += (-y - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.scene.position);
    }

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
      this.halfX = this.width/2;
      this.halfY = this.height/2;

      this.bind();
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

