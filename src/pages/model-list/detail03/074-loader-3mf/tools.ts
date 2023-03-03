import * as THREE from 'three';
import { showLoadingToast } from "vant";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';

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

  private object: THREE.Group
  private loader: null | ThreeMFLoader
  private asset: string
  private assets: string[]
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

    this.object = new THREE.Group();
    this.loader = null;
    this.asset = "cube_gears";
    this.assets = ['cube_gears', 'facecolors', 'multipletextures', 'vertexcolors'];
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x333333);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 500);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(-100, -250, 100);
    this.scene.add(this.camera);

    // 创建灯光
    const light = new THREE.PointLight(0xffffff, 0.8);
    this.scene.add(light);

    // 创建渲染器
    this.createRenderer();

    // 创建管理器
    this.createManager();

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 10;
    this.controls.maxDistance = 400;
    this.controls.enablePan = false;
    this.controls.update();
    this.controls.addEventListener("change", () => { this.render(); });

    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }
  // 控制事件
  setAsset(asset: string) {
    this.asset = asset;

    this.loadAsset(this.asset);
  }

  // 创建加载管理器
  private createManager() {
    // 其功能是处理并跟踪已加载和待处理的数据。
    // 如果未手动设置加强管理器，则会为加载器创建和使用默认全局实例加载器管理器
    // 一般来说，默认的加载管理器已足够使用了，但有时候也需要设置单独的加载器 
    // - 例如，如果你想为对象和纹理显示单独的加载条。

    // LoadingManager( onLoad : Function, onProgress : Function, onError : Function )
    // onLoad — (可选) 所有加载器加载完成后，将调用此函数
    // onProgress — (可选) 当每个项目完成后，将调用此函数
    // onError — (可选) 当一个加载器遇到错误时，将调用此函数
    // 创建一个新的 LoadingManager
    const manager = new THREE.LoadingManager(() => {
      // 表示三维空间中的一个轴对齐包围盒（axis-aligned bounding box，AABB）
      // .setFromObject ( object : Object3D ) : this
      // object - 用来计算包围盒的3D对象 Object3D
      const obj = new THREE.Box3().setFromObject(this.object);
      // .getCenter ( target : Vector3 ) : Vector3
      // target — 如果指定了target ，结果将会被拷贝到target
      // 返回包围盒的中心点 Vector3
      const center = obj.getCenter(new THREE.Vector3());
  
      this.object.position.x += (this.object.position.x - center.x);
      this.object.position.y += (this.object.position.y - center.y);
      this.object.position.z += (this.object.position.z - center.z);
  
      // .reset () : undefined
      // 将控制器重置为上次调用.saveState时的状态，或者初始状态
      if (this.controls) { this.controls.reset(); }
  
      this.scene.add(this.object);
      this.render();
    });

    this.loader = new ThreeMFLoader(manager);
    this.loadAsset(this.asset);
  }

  // 加载模型
  private loadAsset(asset: string) {
    if (this.loader) {
      const toast = showLoadingToast({
        message: '模型加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      this.loader.load('/examples/models/3mf/' + asset + '.3mf', (group) => {
        toast.close();

        if (this.object) {
          this.object.traverse((child) => {
            const obj = child as THREE.Group;
            // @ts-ignore
            if (obj.material) { obj.material.dispose(); }
            // @ts-ignore
            if (obj.material && obj.material.map) { obj.material.map.dispose(); }
            // @ts-ignore
            if (obj.geometry) { obj.geometry.dispose(); }
          });
          this.scene.remove(this.object);
        }

        this.object = group;
      }, undefined, () => { toast.close(); });
    }
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

