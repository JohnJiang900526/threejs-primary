import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OutlineEffect } from 'three/examples/jsm/effects/OutlineEffect';
import { MMDLoader } from 'three/examples/jsm/loaders/MMDLoader';
import { MMDAnimationHelper } from 'three/examples/jsm/animation/MMDAnimationHelper';

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
  private ready: boolean
  private listener: THREE.AudioListener
  private audio: null | THREE.Audio
  private binder: number
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
    this.ready = false;
    this.listener = new THREE.AudioListener();
    this.audio = null;
    this.binder = 0;
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
    this.camera.position.z = 45;
    this.camera.add(this.listener);
    this.scene.add(this.camera);

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

  // 销毁
  destroy() {
    this.ready = false;
    if (this.audio) {
      this.audio.pause();
    }

    if (this.helper) {
      this.helper.audioManager?.audio?.pause();
    }

    window.cancelAnimationFrame(this.binder);
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
    // MMD加载器（MMDLoader）一个用于加载MMD资源的加载器
    // MMDLoader从MMD资源（例如PMD、PMX、VMD和VPD文件）中创建Three.js物体（对象）
    // 如果你想要MMD资源的原始内容，请使用.loadPMD/PMX/VMD/VPD方法

    // MMDLoader( manager : LoadingManager )
    // manager — 加载器使用的loadingManager（加载管理器），默认值是THREE.DefaultLoadingManager。
    // 创建一个新的MMDLoader
    const loader = new MMDLoader();

    const file = '/examples/models/mmd/miku/miku_v2.pmd';
    const files = ['/examples/models/mmd/vmds/wavefile_v2.vmd'];
    const cameraFiles = '/examples/models/mmd/vmds/wavefile_camera.vmd';
    const audioFile = '/examples/models/mmd/audios/wavefile_short.mp3';
    const audioParams = { delayTime: 160 * 1 / 30 };

    const toast = showLoadingToast({
      duration: 10000,
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    this.helper = new MMDAnimationHelper();
    loader.loadWithAnimation(file, files, (mmd) => {
      this.mesh = mmd.mesh;

      this.helper.add(this.mesh, {
        physics: true,
        animation: mmd.animation,
      });

      // .loadAnimation ( url : String, object : Object3D, onLoad : Function, onProgress : Function, onError : Function ) : undefined
      // url — 一个包含有.vmd文件的路径或URL的字符串或字符串数组。如果两个及以上文件被指定，它们将会合并
      // object — SkinnedMesh 或 Camera。 剪辑及其轨道将会适应到该对象
      // onLoad — 成功加载完成后被调用的函数
      // onProgress — （可选）当加载正在进行时被调用的函数，参数将是XMLHttpRequest实例，其包含了 .total （总的）和 .loaded （已加载的）字节数
      // onError — （可选）如果加载过程中发生错误时被调用的函数，该函数接受一个错误来作为参数
      // 开始从url(s)加载VMD动画文件（可能有多个文件），并使用已解析的AnimatioinClip触发回调函数
      loader.loadAnimation(cameraFiles, this.camera as THREE.PerspectiveCamera, (animation) => {
        this.helper.add(this.camera as THREE.PerspectiveCamera, {
          animation: animation as THREE.AnimationClip
        });

        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(audioFile, (buffer) => {
          toast.close();
          this.audio = new THREE.Audio(this.listener).setBuffer(buffer);
          this.audio.hasPlaybackControl = true;

          this.helper.add(this.audio, audioParams);
          this.scene.add(this.mesh);
          this.ready = true;
        }, undefined, () => { toast.close(); });
      }, undefined, () => { toast.close(); });
    }, undefined, () => { toast.close(); });
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
    this.binder = window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    if (this.controls) { this.controls.update(); }

    this.scene.traverse((child) => {
      if (child.name === "grid") {
        child.rotation.y += 0.005;
      }
    });

    if (this.effect && this.scene && this.camera && this.ready) {
      if (this.helper) {
        this.helper.update(this.clock.getDelta());
      }
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

