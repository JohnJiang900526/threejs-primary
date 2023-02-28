import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import TWEEN from '@tweenjs/tween.js';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private floor: THREE.Mesh
  private box: THREE.Mesh
  private spotLight1: THREE.SpotLight
  private spotLight2: THREE.SpotLight
  private spotLight3: THREE.SpotLight
  private lightHelper1: THREE.SpotLightHelper
  private lightHelper2: THREE.SpotLightHelper
  private lightHelper3: THREE.SpotLightHelper
  private timer: any
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.floor = new THREE.Mesh();
    this.box = new THREE.Mesh();
    this.spotLight1 = new THREE.SpotLight();
    this.spotLight2 = new THREE.SpotLight();
    this.spotLight3 = new THREE.SpotLight();
    this.lightHelper1 = new THREE.SpotLightHelper(this.spotLight1);
    this.lightHelper2 = new THREE.SpotLightHelper(this.spotLight2);
    this.lightHelper3 = new THREE.SpotLightHelper(this.spotLight3);
    this.timer = null;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x333333);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 2000);
    this.camera.position.set(40, 40, 40);

    // 创建模型 地板和箱体
    this.createFloorAndBox();

    // 创建灯光
    this.createLight();

    // 创建渲染器
    this.createRenderer();

    // 创建控制器
    const controls = new OrbitControls(this.camera, this.renderer?.domElement);
    controls.target.set(0, 7, 0);
    controls.maxPolarAngle = Math.PI / 2;
    controls.update();

    this.initStats();
    this.render();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建floor and box
  private createFloorAndBox() {
    // 箱子
    (() => {
      const material = new THREE.MeshPhongMaterial({color: 0xaaaaaa});
      const geometry = new THREE.BoxGeometry(3, 1, 2);
      this.box = new THREE.Mesh(geometry, material);
      this.box.castShadow = true;
      this.box.receiveShadow = true;
      this.box.position.set(0, 5, 0);
      this.scene.add(this.box);
    })();

    // 地板
    (() => {
      const material = new THREE.MeshPhongMaterial({color: 0x808080});
      const geometry = new THREE.PlaneGeometry(2000, 2000);
      
      this.floor = new THREE.Mesh(geometry, material);
      this.floor.rotation.x = -Math.PI * 0.5;
      this.floor.receiveShadow = true;
      this.floor.position.set(0, -0.05, 0);
      this.scene.add(this.floor);
    })();
  }

  // 创建灯光
  private createLight() {
    // 第1个聚光灯
    this.spotLight1 = this.createSpotlight(0xFF7F00);
    this.spotLight1.position.set(15, 40, 45);

    // 第2个聚光灯
    this.spotLight2 = this.createSpotlight(0x00FF7F);
    this.spotLight2.position.set(0, 40, 35);

    // 第3个聚光灯
    this.spotLight3 = this.createSpotlight(0x7F00FF);
    this.spotLight3.position.set(-15, 40, 45);

    // 漫散射光
    const light = new THREE.AmbientLight(0x111111);

    this.lightHelper1 = new THREE.SpotLightHelper(this.spotLight1);
    this.lightHelper2 = new THREE.SpotLightHelper(this.spotLight2);
    this.lightHelper3 = new THREE.SpotLightHelper(this.spotLight3);

    this.scene.add(this.spotLight1, this.spotLight2, this.spotLight3, light);
    this.scene.add(this.lightHelper1, this.lightHelper2, this.lightHelper3);
  }

  // 创建聚光灯
  private createSpotlight(color: number = 0xffffff) {
    const light = new THREE.SpotLight(color, 2);

    // castShadow -此属性设置为 true 聚光灯将投射阴影
    light.castShadow = true;
    // angle - 光线散射角度，最大为Math.PI/2
    light.angle = 0.3;
    // penumbra - 聚光锥的半影衰减百分比。在0和1之间的值。默认为0
    light.penumbra = 0.2;
    // decay - 沿着光照距离的衰减量
    light.decay = 2;
    // distance - 从光源发出光的最大距离，其强度根据光源的距离线性衰减
    light.distance = 50;

    return light;
  }

  // 执行动画
  private tween(light: THREE.SpotLight) {
    new TWEEN.Tween(light).to({
      // 光线散射角度
      angle: (Math.random() * 0.7) + 0.1,
      // 聚光锥的半影衰减百分比
      penumbra: Math.random() + 1,
    }, Math.random() * 3000 + 2000).easing(TWEEN.Easing.Quadratic.Out).start();

    new TWEEN.Tween(light.position).to({
      x: (Math.random() * 30) - 15,
      y: (Math.random() * 10) + 15,
      z: (Math.random() * 30) - 15,
    }, Math.random() * 3000 + 2000).easing(TWEEN.Easing.Quadratic.Out).start();
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // - enabled: 如果设置开启，允许在场景中使用阴影贴图。默认是 false
    this.renderer.shadowMap.enabled = true;
    // - type: 定义阴影贴图类型 (未过滤, 关闭部分过滤, 关闭部分双线性过滤), 可选值有
    // THREE.BasicShadowMap 能够给出没有经过过滤的阴影映射 —— 速度最快，但质量最差
    // THREE.PCFShadowMap (默认) 使用Percentage-Closer Filtering (PCF)算法来过滤阴影映射
    // THREE.PCFSoftShadowMap 和PCFShadowMap一样使用 Percentage-Closer Filtering (PCF) 算法过滤阴影映射，但在使用低分辨率阴影图时具有更好的软阴影
    // THREE.VSMShadowMap 使用Variance Shadow Map (VSM)算法来过滤阴影映射。当使用VSMShadowMap时，所有阴影接收者也将会投射阴影
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
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

  private render() {
    TWEEN.update();

    this.lightHelper1.update();
    this.lightHelper2.update();
    this.lightHelper3.update();

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }

    window.requestAnimationFrame(() => { this.render(); });
  }

  // 持续动画
  private animate() {
    this.tween(this.spotLight1);
    this.tween(this.spotLight2);
    this.tween(this.spotLight3);

    if (this.timer) { clearTimeout(this.timer); }
    this.timer = setTimeout(() => { this.animate(); }, 5000);
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

