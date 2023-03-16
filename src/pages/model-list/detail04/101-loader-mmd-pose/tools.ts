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
  private clock: THREE.Clock
  private vpds: any[]
  private gui: null | GUI
  private file: string
  private files: string[]
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
    this.clock = new THREE.Clock();
    this.vpds = [];
    this.gui = null;
    this.file = "/examples/models/mmd/miku/miku_v2.pmd";
    this.files = [
      '/examples/models/mmd/vpds/01.vpd',
      '/examples/models/mmd/vpds/02.vpd',
      '/examples/models/mmd/vpds/03.vpd',
      '/examples/models/mmd/vpds/04.vpd',
      '/examples/models/mmd/vpds/05.vpd',
      '/examples/models/mmd/vpds/06.vpd',
      '/examples/models/mmd/vpds/07.vpd',
      '/examples/models/mmd/vpds/08.vpd',
      '/examples/models/mmd/vpds/09.vpd',
      '/examples/models/mmd/vpds/10.vpd',
      '/examples/models/mmd/vpds/11.vpd',
    ];
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
    this.camera.position.z = 25;

    // 加载模型
    this.loadModel();

    // 创建地板
    this.createFloor();
    // 创建光线
    this.createLight();

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
    });

    const dictionary = this.mesh.morphTargetDictionary || {};
    const controls:{[key: string]: number|boolean} = {};
    const keys: string[] = Object.keys(dictionary);

    const poses = this.gui.addFolder('动作变换').close();
    const morphs = this.gui.addFolder('形体变形').close();

    // 分割名称
    const getBaseName = (s: string) => {
      return s.slice(s.lastIndexOf('/') + 1);
    };

    const initControls = () => {
      for (const key in dictionary) {
        controls[key] = 0.0;
      }

      controls.pose = -1;
      this.files.forEach((file) => {
        controls[getBaseName(file)] = false;
      });
    };

    const initPoses = () => {
      const files: {[key: string]: number} = {default: -1};
      this.files.forEach((file, index) => {
        files[getBaseName(file)] = index;
      });
      poses.add(controls, 'pose', files).name("动作").onChange(onChangePose);
    };
    const initMorphs = () => {
      for (const key in dictionary) {
        morphs.add(controls, key, 0.0, 1.0, 0.01).onChange(onChangeMorph);
      }
    };

    // 动作变换
    const onChangePose = () => {
      const index = parseInt(controls.pose.toString());
      if (index === -1) {
        this.mesh.pose();
      } else {
        this.helper.pose(this.mesh, this.vpds[index]);
      }
    };

    // 身体变换
    const onChangeMorph = () => {
      keys.forEach((key, index) => {
        if (this.mesh.morphTargetInfluences) {
          this.mesh.morphTargetInfluences[index as number] = controls[key] as number;
        }
      });
    };

    initControls();
    initPoses();
    initMorphs();

    onChangeMorph();
    onChangePose();
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

  // 加载模型
  private loadModel() {
    const length = this.files.length;
    const loader = new MMDLoader();

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    this.helper = new MMDAnimationHelper();
    loader.load(this.file, (object) => {
      this.mesh = object;
      this.mesh.position.y = -10;
      this.scene.add(this.mesh);
      
      this.files.forEach((file) => {
        loader.loadVPD(file, false, (vpd) => {
          this.vpds.push(vpd);

          if (this.vpds.length === length) {
            toast.close();
            this.initGui();
          }
        }, undefined, () => {
          toast.close();
        });
      });
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

