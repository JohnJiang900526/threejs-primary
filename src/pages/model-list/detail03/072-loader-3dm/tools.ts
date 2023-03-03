import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader';

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

  private layers: any[]
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

    this.layers = [];
  }

  // 初始化方法入口
  init(fn1?: () => void, fn2?: (e: ErrorEvent) => void) {
    // 默认的物体的up方向，同时也作为DirectionalLight、HemisphereLight和Spotlight
    // （自顶向下创建的灯光）的默认方向。 默认设为( 0, 1, 0 )
    THREE.Object3D.DefaultUp = new THREE.Vector3(0, 0, 1);

    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 1000);
    this.camera.position.set(26, -40, 5);

    // 创建灯光
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(0, 0, 2);
    this.scene.add(light);

    // 加载模型
    this.loadModel(fn1, fn2);

    // 创建渲染器
    this.createRenderer();

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement );


    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }
  // 控制事件
  actionHandle(name: string, visible: boolean) {
    this.layers = this.layers.map((layer) => {
      this.scene.traverse((obj) => {
        if ('layerIndex' in (obj.userData.attributes || {})) {
          const layerName = this.layers[obj.userData.attributes.layerIndex].name;
          if (layerName === name) {
            obj.visible = visible;
            layer.visible = visible;
          }
        }
      });
      return layer;
    });
  }

  // 加载模型
  private loadModel(fn1?: () => void, fn2?: (e: ErrorEvent) => void) {
    const loader = new Rhino3dmLoader();
    const url = "/examples/models/3dm/Rhino_Logo.3dm";

		loader.setLibraryPath('/examples/js/rhino3dm/');
    loader.load(url, (obj) => {
      this.scene.add(obj);
      this.layers = obj.userData.layers;
      fn1 && fn1();
    }, undefined, (e) => {
      fn2 && fn2(e);
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

