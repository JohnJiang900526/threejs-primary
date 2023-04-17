import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

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
  private object: THREE.Group
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.mouse = new THREE.Vector2();
    this.halfX = this.width/2;
    this.halfY = this.height/2;
    this.object = new THREE.Group();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 2000);
    this.camera.position.z = 250;

    this.loadModel();
    this.createLight();

    // 渲染器
    this.createRenderer();

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

  private bind() {
    if (this.isMobile()) {
      this.container.onpointermove = null;
      this.container.ontouchmove = (event) => {
        const e = event.touches[0];
        const x = (e.clientX - this.halfX) / 2;
				const y = (e.clientY  - 45 - this.halfY) / 2;
        this.mouse.set(x, y);
      };
    } else {
      this.container.ontouchmove = null;
      this.container.onpointermove = (e) => {
        const x = (e.clientX - this.halfX) / 2;
				const y = (e.clientY  - 45 - this.halfY) / 2;
        this.mouse.set(x, y);
      };
    }
  }

  // 创建光源
  private createLight() {
    const ambient = new THREE.AmbientLight(0xcccccc, 0.4);
    this.scene.add(ambient);

    const light = new THREE.PointLight(0xffffff, 0.8);
    if (this.camera) {
      this.camera.add(light);
      this.scene.add(this.camera);
    }
  }

  // 加载模型
  private loadModel() {
    const loader = new OBJLoader();
    const mltLoader = new MTLLoader();

    const url = "/examples/models/obj/male02/male02.obj";
    const mtlUrl = "/examples/models/obj/male02/male02.mtl";

    const toast = showLoadingToast({
      duration: 10000,
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    mltLoader.load(mtlUrl, (materials) => {
      materials.preload();
      loader.setMaterials(materials).load(url, (obj) => {
        toast.close();
        this.object = obj;
        this.object.position.y = -95;
        this.scene.add(this.object);
      }, undefined, () => { toast.close(); });
    }, undefined, () => { toast.close(); });
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

