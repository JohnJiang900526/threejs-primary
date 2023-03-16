import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import { GUI } from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { MMDAnimationHelper, type MMDAnimationHelperMixer } from 'three/examples/jsm/animation/MMDAnimationHelper';


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

  private mesh: THREE.SkinnedMesh
  private effect: null | OutlineEffect
  private helper: MMDAnimationHelper
  private ikHelper: null | any
  private physicsHelper: null | any
  private clock: THREE.Clock
  private gui: null | GUI
  private api: {
    'animation': boolean,
    'ik': boolean,
    'outline': boolean,
    'physics': boolean,
    'show IK bones': boolean,
    'show rigid bodies': boolean
  }

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

    this.mesh = new THREE.SkinnedMesh();
    this.effect = null;
    this.helper = new MMDAnimationHelper();
    this.ikHelper = null;
    this.physicsHelper = null;
    this.clock = new THREE.Clock();
    this.gui = null;
    this.api = {
      'animation': true,
      'ik': true,
      'outline': true,
      'physics': true,
      'show IK bones': false,
      'show rigid bodies': false
    };
  }

  init() {
    this.importAmmo((Ammo) => {
      Ammo().then((AmmoLib: any) => {
        Ammo = AmmoLib;
        this.initHandle();
      });
    });
  }

  // 初始化方法入口
  initHandle() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(65, this.aspect, 1, 2000);
    this.camera.position.z = 30;

    // 创建地板
    this.createFloor();
    // 创建光线
    this.createLight();
    // 加载模型
    this.loadModel();

    // 创建渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement );
    this.controls.minDistance = 5;
    this.controls.maxDistance = 1000;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private initGui() {
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    }).close();

    this.gui.add(this.api, 'animation').onChange(() => {
      this.helper.enable('animation', this.api['animation']);
    });

    this.gui.add(this.api, 'ik').onChange(() => {
      this.helper.enable('ik', this.api['ik']);
    });

    this.gui.add(this.api, 'outline').onChange(() => {
      if (this.effect) {
        this.effect.enabled = this.api['outline'];
      }
    });

    this.gui.add(this.api, 'physics').onChange(() => {
      this.helper.enable('physics', this.api['physics']);
    });

    this.gui.add(this.api, 'show IK bones').onChange(() => {
      this.ikHelper.visible = this.api['show IK bones'];
    });

    this.gui.add(this.api, 'show rigid bodies').onChange(() => {
      if (this.physicsHelper) {
        this.physicsHelper.visible = this.api['show rigid bodies'];
      }
    });
  }

  private importAmmo(fn?: (ammo: any) => void) {
    const script = document.createElement("script");
    script.src = "./examples/js/libs/ammo.wasm.js";
    script.async = true;
    document.body.appendChild(script);
    script.onload = () => {
      // @ts-ignore
      fn && fn(window.Ammo);
    };
  }

  private createLight() {
    const ambient = new THREE.AmbientLight(0x666666);

    const light = new THREE.DirectionalLight(0x887766);
    light.position.set(-1, 1, 1).normalize();
    this.scene.add(ambient, light);
  }

  private createFloor() {
    const grid = new THREE.PolarGridHelper(30, 10);
    grid.position.y = -10;
    grid.name = "grid";
    this.scene.add(grid);
  }

  // 加载模型
  private loadModel() {
    const loader = new MMDLoader();
    const url = '/examples/models/mmd/miku/miku_v2.pmd';
    const files = ['/examples/models/mmd/vmds/wavefile_v2.vmd'];

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    this.helper = new MMDAnimationHelper({
      // 余辉
      afterglow: 2.0
    });
    loader.loadWithAnimation(url, files, (mmd) => {
      toast.close();
      this.mesh = mmd.mesh;
      this.mesh.position.y = -10;
      this.scene.add(this.mesh);

      this.helper.add(this.mesh, {
        // 开启物理
        physics: true,
        // 动画
        animation: mmd.animation,
      });

      const mixer = this.helper.objects.get(this.mesh) as MMDAnimationHelperMixer;
      this.ikHelper = mixer.ikSolver.createHelper();
      this.ikHelper.visible = false;
      this.scene.add(this.ikHelper);

      if (mixer.physics) {
        this.physicsHelper = mixer.physics.createHelper();
        this.physicsHelper.visible = false;
        this.scene.add(this.physicsHelper);
      }

      this.initGui();
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
    this.effect = new OutlineEffect(this.renderer);
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

    if (this.helper) {
      this.helper.update(this.clock.getDelta());
    }

    this.scene.traverse((child) => {
      if (child.name === "grid") {
        child.rotation.y += 0.005;
      }
    });

    if (this.effect && this.scene && this.camera) {
      this.effect.render(this.scene, this.camera);
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

      if (this.effect) {
        this.effect.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

