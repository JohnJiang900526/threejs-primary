import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader';
import { showLoadingToast } from 'vant';

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

  private gui: GUI
  private params: {
    asset: string
  }
  private assets: string[]
  private vrmlScene: THREE.Scene
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

    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.params = {asset: 'house'};
    this.assets = [
      'house',
      'creaseAngle',
      'crystal',
      'elevationGrid1',
      'elevationGrid2',
      'extrusion1',
      'extrusion2',
      'extrusion3',
      'lines',
      'meshWithLines',
      'meshWithTexture',
      'pixelTexture',
      'points',
    ];
    this.vrmlScene = new THREE.Scene();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 0.1, 1e10);
    this.camera.position.set(-10, 5, 10);
    this.scene.add(this.camera);

    // 创建光线
    this.createLight();

    // 创建模型
    this.loadModel(this.params.asset);

    // webgl渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 1;
    this.controls.maxDistance = 200;
    this.controls.enableDamping = true;

    this.initGUI();
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
    this.gui.add(this.params, "asset", this.assets).name("选择模型").onChange((asset: string) => {
      if (this.vrmlScene) {
        this.vrmlScene.traverse((object) => {
          const mesh = object as THREE.Mesh;
          const material = mesh?.material as THREE.MeshPhongMaterial;

          if (material) { material.dispose(); }
          if (material?.map) { material.map.dispose(); }
          if (mesh?.geometry) { mesh.geometry.dispose(); }
        });

        this.scene.remove(this.vrmlScene);
        this.loadModel(asset);
      } else {
        this.loadModel(asset);
      }
    });
  }

  private createLight() {
    const light1 = new THREE.HemisphereLight(0xffffff, 0x000000, 1);
    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(200, 200, 200);

    this.scene.add(light1, light2);
  }

  // 加载模型
  private loadModel(asset: string) {
    const loader = new VRMLLoader();
    const url = `/examples/models/vrml/${asset}.wrl`;
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (object) => {
      toast.close();
      this.vrmlScene = object;
      this.scene.add(object);
      this.controls && this.controls.reset();
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

