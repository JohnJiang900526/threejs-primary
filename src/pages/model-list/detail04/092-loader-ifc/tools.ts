import * as THREE from 'three';
import { showLoadingToast } from "vant";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { IFCLoader } from 'three/examples/jsm/loaders/IFCLoader';


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

  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private highlightMaterial: THREE.MeshPhongMaterial
  private ifcLoader: IFCLoader
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

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.highlightMaterial = new THREE.MeshPhongMaterial({
      color: 0x238bfe, 
      opacity: 0.8,
      transparent: true, 
      depthTest: false, 
    });
    this.ifcLoader = new IFCLoader();
  }

  // 初始化方法入口
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8cc7de);

    // 相机
    this.camera = new THREE.PerspectiveCamera(100, this.aspect, 0.1, 1000);
    this.camera.position.set(90, 50, -70);

    // 创建光源
    this.createLight();

    // 加载模型
    this.loadModel();

    // 创建渲染器
    this.createRenderer();

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.addEventListener("change", () => {this.render();});
    
    this.bind();
    this.render();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private bind() {
    this.container.onclick = (e) => {
      this.selectObject(e);
    };
  }

  // 选中对象
  private selectObject(e: Touch | PointerEvent | MouseEvent) {
    const x = (e.clientX / this.width) * 2 - 1;
    const y = -((e.clientY - 45) / this.height) * 2 + 1;

    this.mouse.set(x, y);
    this.raycaster.setFromCamera(this.mouse, this.camera as THREE.PerspectiveCamera);
    
    const intersects = this.raycaster.intersectObjects(this.scene.children, false);
    const intersect = intersects[0];
    if (intersect) {
      const faceIndex = intersect.faceIndex as number;
      // @ts-ignore
      const geometry = intersect.object.geometry;
      const id = this.ifcLoader.ifcManager.getExpressId(geometry, faceIndex) as number;

      // @ts-ignore
      const modelID: number = intersect.object.modelID;
      this.ifcLoader.ifcManager.createSubset({
        modelID, 
        ids: [id], 
        scene: this.scene, 
        removePrevious: true,
        material: this.highlightMaterial 
      });
      this.render();
    }
  }

  // 创建光源
  private createLight() {
    const light1 = new THREE.DirectionalLight(0xffeeff, 0.8);
    light1.position.set(1, 1, 1);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
    light2.position.set(-1, 0.5, -1);
    this.scene.add(light2);

    const ambient = new THREE.AmbientLight(0xffffee, 0.25);
    this.scene.add(ambient);
  }

  // 加载模型
  private async loadModel () {
    this.ifcLoader = new IFCLoader();
    const url = "/examples/models/ifc/rac_advanced_sample_project.ifc";
    this.ifcLoader.ifcManager.setWasmPath('/examples/jsm/loaders/ifc/');

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    this.ifcLoader.load(url, (model) => {
      toast.close();
      this.scene.add(model);
      this.render();
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

