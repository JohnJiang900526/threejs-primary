import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Sky } from 'three/examples/jsm/objects/Sky';
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

  private controls: null | OrbitControls;
  private sky: Sky
  private sun: THREE.Vector3
  private effectController: {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2,
    azimuth: 180,
    exposure: number
  };
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

    this.controls = null;
    this.sky = new Sky();
    this.sun = new THREE.Vector3();
    this.effectController = {
      turbidity: 10,
      rayleigh: 3,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.7,
      elevation: 2,
      azimuth: 180,
      exposure: 0.5
    };
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制器"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 100, 2000000);
    this.camera.position.set(0, 100, 2000);

    // 渲染器
    this.createRenderer();
    // help
    this.createHelp();
    // sky
    this.initSky();
    // set value
    this.guiChanged();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;

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
    this.gui.add(this.effectController, 'turbidity', 0.0, 20.0, 0.1).name("浊度").onChange(() => {
      this.guiChanged();
    });
    this.gui.add(this.effectController, 'rayleigh', 0.0, 4, 0.001).name("瑞利").onChange(() => {
      this.guiChanged();
    });
    this.gui.add(this.effectController, 'mieCoefficient', 0.0, 0.1, 0.001).name("mie系数").onChange(() => {
      this.guiChanged();
    });
    this.gui.add(this.effectController, 'mieDirectionalG', 0.0, 1, 0.001).name("mie方向G").onChange(() => {
      this.guiChanged();
    });
    this.gui.add(this.effectController, 'elevation', 0, 30, 0.1).name("高度").onChange(() => {
      this.guiChanged();
    });
    this.gui.add(this.effectController, 'azimuth', -180, 180, 0.1).name("方位角").onChange(() => {
      this.guiChanged();
    });
    this.gui.add(this.effectController, 'exposure', 0, 1, 0.0001).name("亮度").onChange(() => {
      this.guiChanged();
    });
  }

  private guiChanged() {
    const uniforms = this.sky.material.uniforms;
    uniforms['turbidity'].value = this.effectController.turbidity;
    uniforms['rayleigh'].value = this.effectController.rayleigh;
    uniforms['mieCoefficient'].value = this.effectController.mieCoefficient;
    uniforms['mieDirectionalG'].value = this.effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad(90 - this.effectController.elevation);
    const theta = THREE.MathUtils.degToRad(this.effectController.azimuth);

    this.sun.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(this.sun);
    (this.renderer as THREE.WebGLRenderer).toneMappingExposure = this.effectController.exposure;
  }

  private initSky() {
    this.sky.scale.setScalar(450000);
		this.scene.add(this.sky);

    this.effectController.exposure = (this.renderer as THREE.WebGLRenderer).toneMappingExposure;
  }

  private createHelp() {
    const helper = new THREE.GridHelper(10000, 2, 0xffffff, 0xffffff);
    this.scene.add(helper);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.5;
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

    this.stats?.update();
    
    // 执行渲染
    if (this.renderer && this.camera) {
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

