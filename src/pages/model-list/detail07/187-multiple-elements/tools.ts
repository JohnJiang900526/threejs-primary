import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private canvas: HTMLCanvasElement;
  private scenes: THREE.Scene[]
  private geometries: (THREE.BoxGeometry | THREE.SphereGeometry | THREE.DodecahedronGeometry | THREE.CylinderGeometry)[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.canvas = document.getElementById("c") as HTMLCanvasElement;
    this.scenes = [];
    this.geometries = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.SphereGeometry(0.5, 12, 8),
      new THREE.DodecahedronGeometry(0.5),
      new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
    ];
  }

  init() {
    // 渲染器
    this.createRenderer();
    this.generateMeshes();

    this.initStats();
    this.animate();
  }

  // 核心
  private generateMeshes() {
    for (let i = 0; i < 40; i++) {
      const scene = new THREE.Scene();

      const element = document.createElement('div');
      element.className = 'list-item';

      const sceneElement = document.createElement('div');
      element.appendChild( sceneElement );

      const descriptionElement = document.createElement('div');
      descriptionElement.innerText = 'Scene ' + (i + 1);
      element.appendChild(descriptionElement);

      scene.userData.element = sceneElement;
      this.container.appendChild(element);

      const camera = new THREE.PerspectiveCamera(50, 1, 1, 10);
      camera.position.z = 2;
      scene.userData.camera = camera;

      const controls = new OrbitControls( scene.userData.camera, scene.userData.element );
      controls.minDistance = 2;
      controls.maxDistance = 5;
      controls.enablePan = false;
      controls.enableZoom = false;
      scene.userData.controls = controls;

      const index = this.geometries.length * Math.random() | 0;
      const geometry = this.geometries[index];
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 1, 0.75 ),
        roughness: 0.5,
        metalness: 0,
        flatShading: true
      });

      scene.add(new THREE.Mesh(geometry, material));
      scene.add(new THREE.HemisphereLight(0xaaaaaa, 0x444444));

      const light = new THREE.DirectionalLight(0xffffff, 0.5);
      light.position.set(1, 1, 1);

      scene.add(light);
      this.scenes.push(scene);
    }
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }
  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setClearColor(0xffffff, 1);
    this.renderer.setPixelRatio(window.devicePixelRatio);
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

  private updateSize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.renderer?.setSize(width, height, false);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });
    this.stats?.update();
    this.updateSize();

    this.canvas.style.transform = `translateY(${window.scrollY}px)`;
    this.renderer?.setClearColor(0xffffff);
    this.renderer?.setScissorTest(false);
    this.renderer?.clear();

    this.renderer?.setClearColor(0xe0e0e0);
    this.renderer?.setScissorTest(true);

    this.scenes.forEach((scene) => {
      scene.children[0].rotation.y = Date.now() * 0.001;
      const element = scene.userData.element as HTMLDivElement;
      // 方法返回元素的大小及其相对于视口的位置
      const rect = element.getBoundingClientRect();

      const domElement = this.renderer?.domElement as HTMLCanvasElement;
      const can = (
        rect.bottom < 0 || rect.top > domElement.clientHeight ||
        rect.right < 0 || rect.left > domElement.clientWidth
      );
      if (can) { return; }

      const width = rect.right - rect.left;
      const height = rect.bottom - rect.top;
      const left = rect.left;
      const bottom = (domElement.clientHeight + 45) - rect.bottom;

      this.renderer?.setViewport(left, bottom, width, height);
      // .setScissor ( x : Integer, y : Integer, width : Integer, height : Integer ) : undefined
      // 将剪裁区域设为(x, y)到(x + width, y + height) Sets the scissor area from
      this.renderer?.setScissor(left, bottom, width, height);

      const camera = scene.userData.camera;
      this.renderer?.render(scene, camera);
    });
  }
}

export default THREE;