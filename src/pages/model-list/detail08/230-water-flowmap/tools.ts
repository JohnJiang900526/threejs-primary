import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from 'three/examples/jsm/objects/Water2';
import GUI from 'lil-gui';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private water: null | Water;
  private helper: THREE.Mesh;
  private gui: GUI
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.water = null;
    this.helper = new THREE.Mesh();
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 200);
    this.camera.position.set(0, 25, 0);

    this.createGround();
    this.createWater();
    this.createHelper();
    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 5;
		this.controls.maxDistance = 50;
    this.controls.update();

    this.initStats();
    this.setUpGUI();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.helper, 'visible').name('Show Flow Map');
  }

  private createGround() {
    const loader = new THREE.TextureLoader();
    const url = "/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg";

    const groundGeometry = new THREE.PlaneGeometry(20, 20, 10, 10);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);

    ground.rotation.x = Math.PI * -0.5;
    this.scene.add(ground);

    loader.load(url, (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 16;
      map.repeat.set(4, 4);
      groundMaterial.map = map;
      groundMaterial.needsUpdate = true;
    });
  }

  private createWater () {
    const loader = new THREE.TextureLoader();
    const url = "/examples/textures/water/Water_1_M_Flow.jpg";

    const waterGeometry = new THREE.PlaneGeometry(20, 20);
    const flowMap = loader.load(url);

    this.water = new Water(waterGeometry, {
      scale: 2,
      textureWidth: 1024,
      textureHeight: 1024,
      flowMap: flowMap
    });

    this.water.position.y = 1;
    this.water.rotation.x = Math.PI * -0.5;
    this.scene.add(this.water);
  }
  private createHelper () {
    const loader = new THREE.TextureLoader();
    const url = "/examples/textures/water/Water_1_M_Flow.jpg";
    const flowMap = loader.load(url);

    const helperGeometry = new THREE.PlaneGeometry(20, 20);
    const helperMaterial = new THREE.MeshBasicMaterial({ map: flowMap });
    this.helper = new THREE.Mesh(helperGeometry, helperMaterial);
    this.helper.position.y = 1.01;
    this.helper.rotation.x = Math.PI * -0.5;
    this.helper.visible = false;
    this.scene.add(this.helper);
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 消除 副作用
  dispose() {
    window.cancelAnimationFrame(this.animateNumber);
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

