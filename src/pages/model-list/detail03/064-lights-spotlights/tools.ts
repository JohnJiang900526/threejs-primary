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
  private matFloor: THREE.MeshPhongMaterial
  private matBox: THREE.MeshPhongMaterial
  private geoFloor: THREE.PlaneGeometry
  private geoBox: THREE.BoxGeometry
  private mshFloor: THREE.Mesh
  private mshBox: THREE.Mesh
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

    this.matFloor = new THREE.MeshPhongMaterial();
    this.matBox = new THREE.MeshPhongMaterial();
    this.geoFloor = new THREE.PlaneGeometry();
    this.geoBox = new THREE.BoxGeometry();
    this.mshFloor = new THREE.Mesh();
    this.mshBox = new THREE.Mesh();

    this.spotLight1 = new THREE.SpotLight(0xFF7F00);
    this.spotLight2 = new THREE.SpotLight(0x00FF7F);
    this.spotLight3 = new THREE.SpotLight(0x7F00FF);
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
    this.matBox = new THREE.MeshPhongMaterial({color: 0xaaaaaa});
    this.geoBox = new THREE.BoxGeometry(3, 1, 2);
    this.mshBox = new THREE.Mesh(this.geoBox, this.matBox);
    this.mshBox.castShadow = true;
    this.mshBox.receiveShadow = true;
    this.mshBox.position.set(0, 5, 0);
    this.scene.add(this.mshBox);

    // 地板
    this.matFloor = new THREE.MeshPhongMaterial({color: 0x808080});
    this.geoFloor = new THREE.PlaneGeometry(2000, 2000);
    
    this.mshFloor = new THREE.Mesh(this.geoFloor, this.matFloor);
    this.mshFloor.rotation.x = -Math.PI * 0.5;
    this.mshFloor.receiveShadow = true;
    this.mshFloor.position.set(0, -0.05, 0);
    this.scene.add(this.mshFloor);
  }

  // 创建灯光
  private createLight() {
    this.spotLight1 = this.createSpotlight(0xFF7F00);
    this.spotLight1.position.set(15, 40, 45);

    this.spotLight2 = this.createSpotlight(0x00FF7F);
    this.spotLight2.position.set(0, 40, 35);

    this.spotLight3 = this.createSpotlight(0x7F00FF);
    this.spotLight3.position.set(-15, 40, 45);

    this.lightHelper1 = new THREE.SpotLightHelper(this.spotLight1);
    this.lightHelper2 = new THREE.SpotLightHelper(this.spotLight2);
    this.lightHelper3 = new THREE.SpotLightHelper(this.spotLight3);

    this.scene.add(this.spotLight1, this.spotLight2, this.spotLight3);
    this.scene.add(this.lightHelper1, this.lightHelper2, this.lightHelper3);
    this.scene.add(new THREE.AmbientLight(0x111111));
  }

  private createSpotlight(color: number) {
    const light = new THREE.SpotLight(color, 2);
    light.castShadow = true;
    light.angle = 0.3;
    light.penumbra = 0.2;
    light.decay = 2;
    light.distance = 50;

    return light;
  }

  // 执行动画
  private tween(light: THREE.SpotLight) {
    new TWEEN.Tween(light).to({
      angle: (Math.random() * 0.7) + 0.1,
      penumbra: Math.random() + 1
    }, Math.random() * 3000 + 2000).easing(TWEEN.Easing.Quadratic.Out).start();

    new TWEEN.Tween(light.position ).to({
      x: (Math.random() * 30) - 15,
      y: (Math.random() * 10) + 15,
      z: (Math.random() * 30) - 15,
    }, Math.random() * 3000 + 2000).easing(TWEEN.Easing.Quadratic.Out).start();
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

