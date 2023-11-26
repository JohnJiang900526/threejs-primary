import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import GUI from 'lil-gui';
import { showLoadingToast } from 'vant';


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
  private composer: null | EffectComposer;
  private bloomPass: null | UnrealBloomPass;
  private mixer: null | THREE.AnimationMixer;
  private clock: THREE.Clock;
  private params: {
    exposure: number;
    bloomStrength: number;
    bloomThreshold: number;
    bloomRadius: number;
  }
  private gui: GUI;
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
    this.composer = null;
    this.bloomPass = null;
    this.mixer = null;
    this.clock = new THREE.Clock();
    this.params = {
      exposure: 1,
      bloomStrength: 1.5,
      bloomThreshold: 0,
      bloomRadius: 0,
    };
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 100);
    this.camera.position.set(-5, 2.5, -3.5);
    this.scene.add(this.camera);

    // 模型
    this.loadModel();
    // 灯光
    this.generateLight();
    // 渲染器
    this.createRenderer();
    // 效果合成器
    this.initComposer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI * 0.5;
    this.controls.update();

    this.setGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setGUI() {
    this.gui.add( this.params, 'exposure', 0.1, 2 ).onChange((value: string) => {
      this.renderer!.toneMappingExposure = Math.pow(Number(value), 4.0);
    });

    this.gui.add( this.params, 'bloomThreshold', 0.0, 1.0 ).onChange((value: string) => {
      this.bloomPass!.threshold = Number(value);
    });

    this.gui.add( this.params, 'bloomStrength', 0.0, 3.0 ).onChange((value: string) => {
      this.bloomPass!.strength = Number(value);
    });

    this.gui.add( this.params, 'bloomRadius', 0.0, 1.0 ).step( 0.01 ).onChange((value: string) => {
      this.bloomPass!.radius = Number(value);
    });
  }

  private loadModel() {
    const loader = new GLTFLoader();
    const url = '/examples/models/gltf/PrimaryIonDrive.glb';

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (gltf) => {
      toast.close();
      const model = gltf.scene;
      const clip = gltf.animations[0];

      this.scene.add(model);
      this.mixer = new THREE.AnimationMixer(model);
      this.mixer.clipAction(clip.optimize()).play();
    }, undefined, () => {
      toast.close();
    });
  }

  private generateLight() {
    const light1 = new THREE.AmbientLight(0x404040);
    this.scene.add(light1);

    const light2 = new THREE.PointLight(0xffffff, 1);
    this.camera!.add(light2);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }
  // 效果合成器
  private initComposer() {
    const renderPass = new RenderPass(this.scene, this.camera!);

    const v2 = new THREE.Vector2(this.width, this.height);
    this.bloomPass = new UnrealBloomPass(v2, 1.5, 0.4, 0.85);
    this.bloomPass.threshold = this.params.bloomThreshold;
    this.bloomPass.strength = this.params.bloomStrength;
    this.bloomPass.radius = this.params.bloomRadius;

    this.composer = new EffectComposer(this.renderer!);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);
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
    const delta = this.clock.getDelta();
    this.mixer?.update(delta);
    this.composer!.render();
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

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
      this.composer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

