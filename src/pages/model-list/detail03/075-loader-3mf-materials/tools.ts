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
    this.scene.background = new THREE.Color(0xa0a0a0);
    // 雾（Fog）这个类中的参数定义了线性雾。也就是说，雾的密度是随着距离线性增大的
    // Fog( color : Integer, near : Float, far : Float )
    // 颜色参数传入Color构造函数中，来设置颜色属性。颜色可以是一个十六进制的整型数，或者是CSS风格的字符串。
    // .isFog : Boolean 只读属性 是否是雾类型
    // .name : String 对象的名称，可选、不必唯一。默认值是一个空字符串
    // .color : Color 雾的颜色。比如说，如果将其设置为黑色，远处的物体将被渲染成黑色
    // .near : Float 开始应用雾的最小距离。距离小于活动摄像机“near”个单位的物体将不会被雾所影响 默认值是1
    // .far : Float 结束计算、应用雾的最大距离，距离大于活动摄像机“far”个单位的物体将不会被雾所影响。默认值是1000
    this.scene.fog = new THREE.Fog(0xa0a0a0, 10, 500);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 5000);
    this.camera.position.set(-60, 60, 60);
    this.scene.add(this.camera);

    // 光照
    this.createLight();

    // 加载模型
    this.loadModel();

    // 创建地板
    this.createFloor();

    // 渲染器
    this.createRenderer();

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 50;
    this.controls.maxDistance = 200;
    this.controls.enablePan = false;
    this.controls.target.set(0, 20, 0);
    this.controls.addEventListener('change', () => { this.render(); });
    this.controls.update();

    this.render();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createLight() {
    // 半球光 半球光（HemisphereLight）半球光不能投射阴影
    // 光源直接放置于场景之上，光照颜色从天空光线颜色渐变到地面光线颜色 
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 100, 0);
    this.scene.add(hemiLight);

    // 直线光
    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(-0, 50, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.set(1024, 1024);
    this.scene.add(dirLight);
  }

  private createFloor() {
    const geometry = new THREE.PlaneGeometry(1000, 1000);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x999999,
      // 渲染此材质是否对深度缓冲区有任何影响。默认为true
      depthWrite: false
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 11;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private loadModel() {
    const manager = new THREE.LoadingManager(() => {
      this.render();
    });

    const loader = new ThreeMFLoader(manager);
    const url = '/examples/models/3mf/truck.3mf';
    const toast = showLoadingToast({
      message: '模型加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (obj) => {
      toast.close();
      // z-up conversion .setFromEuler ( euler : Euler ) : this
      // 从由 Euler 角所给定的旋转来设置该四元数
      obj.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
      // 设置不产生阴影
      obj.traverse((child) => { child.castShadow = false; });
      this.scene.add(obj);
    }, undefined, () => {
      toast.close();
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    // PCFSoftShadowMap 和PCFShadowMap一样使用 Percentage-Closer Filtering (PCF) 算法过滤阴影映射，
    // 但在使用低分辨率阴影图时具有更好的软阴影
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

