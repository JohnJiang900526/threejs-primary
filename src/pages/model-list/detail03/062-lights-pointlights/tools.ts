import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
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
  private light1: THREE.PointLight
  private light2: THREE.PointLight
  private light3: THREE.PointLight
  private light4: THREE.PointLight
  private object: THREE.Group
  private clock: THREE.Clock
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.light1 = new THREE.PointLight();
    this.light2 = new THREE.PointLight();
    this.light3 = new THREE.PointLight();
    this.light4 = new THREE.PointLight();
    this.object = new THREE.Group();
    this.clock = new THREE.Clock();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(65, this.aspect, 1, 1000);
    this.camera.position.z = 100;

    // 加载模型
    this.loadModel();
    // 创建光源
    this.makeLights();

    // 创建渲染器
    this.createRenderer();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 加载模型
  private loadModel() {
    const loader = new OBJLoader();
    const url = '/examples/models/obj/walt/WaltHead.obj';

    loader.load(url, (obj) => {
      this.object = obj;
      this.object.scale.multiplyScalar(0.8);
      this.object.position.y = -20;
      this.scene.add(this.object);
    });
  }

  // 创建光线
  private makeLights() {
    const sphere = new THREE.SphereGeometry(1, 16, 8);

    this.light1 = new THREE.PointLight(0xff0040, 5, 50);
    this.light1.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0xff0040})));
    this.scene.add(this.light1);

    this.light2 = new THREE.PointLight(0x0040ff, 5, 50);
    this.light2.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0x0040ff})));
    this.scene.add(this.light2);

    this.light3 = new THREE.PointLight(0x80ff80, 5, 50);
    this.light3.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0x80ff80})));
    this.scene.add(this.light3);

    this.light4 = new THREE.PointLight(0xffaa00, 5, 50);
    this.light4.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({color: 0xffaa00})));
    this.scene.add(this.light4);
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

    if (this.object) {
      const time = Date.now() * 0.0005;
      const delta = this.clock.getDelta();

      this.object.rotation.y += 0.5 * delta;

      this.light1.position.set(
        Math.sin( time * 0.7 ) * 30,
        Math.cos( time * 0.5 ) * 40,
        Math.cos( time * 0.3 ) * 30,
      );

      this.light2.position.set(
        Math.cos( time * 0.3 ) * 30,
        Math.sin( time * 0.5 ) * 40,
        Math.sin( time * 0.7 ) * 30,
      );

      this.light3.position.set(
        Math.sin( time * 0.7 ) * 30,
        Math.cos( time * 0.3 ) * 40,
        Math.sin( time * 0.5 ) * 30,
      );

      this.light4.position.set(
        Math.sin( time * 0.3 ) * 30,
        Math.cos( time * 0.7 ) * 40,
        Math.sin( time * 0.5 ) * 30,
      );
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
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

