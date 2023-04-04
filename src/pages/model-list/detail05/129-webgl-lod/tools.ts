import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | FlyControls
  private stats: null | Stats;

  private clock: THREE.Clock;
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

    this.clock = new THREE.Clock();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 1, 15000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 15000);
    this.camera.position.z = 1000;

    // 创建光线
    this.createLight();

    // 创建模型
    this.createModel();

    // webgl渲染器
    this.createRenderer();

    // 控制器
    this.controls = new FlyControls(this.camera, this.renderer?.domElement);
    this.controls.movementSpeed = 50;
    this.controls.rollSpeed = Math.PI / 20;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createLight() {
    const light1 = new THREE.PointLight(0xff2200);
    light1.position.set(0, 0, 0);

    const light2 = new THREE.DirectionalLight(0xffffff);
    light2.position.set(0, 0, 1).normalize();

    this.scene.add(light1, light2);
  }

  // 加载模型
  private createModel() {
    // 二十面缓冲几何体（IcosahedronGeometry）一个用于生成二十面体的类
    // IcosahedronGeometry(radius : Float, detail : Integer)
    // radius — 二十面体的半径，默认为1
    // detail — 默认值为0。将这个值设为一个大于0的数将会为它增加一些顶点，
    // 使其不再是一个二十面体。当这个值大于1的时候，实际上它将变成一个球体
    const geometrys: [THREE.IcosahedronGeometry, number][] = [
      [new THREE.IcosahedronGeometry(100, 16), 50],
      [new THREE.IcosahedronGeometry(100, 8), 300],
      [new THREE.IcosahedronGeometry(100, 4), 1000],
      [new THREE.IcosahedronGeometry(100, 2), 2000],
      [new THREE.IcosahedronGeometry(100, 1), 8000]
    ];

    // Lambert网格材质(MeshLambertMaterial)
    // 一种非光泽表面的材质，没有镜面高光
    const material = new THREE.MeshLambertMaterial({ 
      color: 0xffffff, 
      wireframe: true,
    });

    for (let j = 0; j < 1000; j++) {
      // 多细节层次（LOD，Levels of Detail）
      // 多细节层次 —— 在显示网格时，根据摄像机距离物体的距离，
      // 来使用更多或者更少的几何体来对其进行显示
      const lod = new THREE.LOD();

      geometrys.forEach((geometry, ) => {
        const mesh = new THREE.Mesh(geometry[0], material);

        mesh.scale.set(1.5, 1.5, 1.5);
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        // .addLevel ( object : Object3D, distance : Float, hysteresis : Float ) : this
        // object —— 在这个层次中将要显示的Object3D
        // distance —— 将显示这一细节层次的距离
        // hysteresis——用于避免在LOD边界处闪烁的阈值，作为距离的一部分。默认0.0
        lod.addLevel(mesh, geometry[1]);
      });

      lod.position.set(
        10000 * (0.5 - Math.random()),
        7500 * (0.5 - Math.random()),
        10000 * (0.5 - Math.random()),
      );
      lod.updateMatrix();
      lod.matrixAutoUpdate = false;
      this.scene.add(lod);
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

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    const delta = this.clock.getDelta();
    if (this.controls) { this.controls.update(delta); }

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

