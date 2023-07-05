import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { LUTPass } from 'three/examples/jsm/postprocessing/LUTPass';
import { LUTCubeLoader, type LUTCubeResult } from 'three/examples/jsm/loaders/LUTCubeLoader';
import { LUT3dlLoader, type LUT3dlResult } from 'three/examples/jsm/loaders/LUT3dlLoader';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';
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
  private params: {
    enabled: boolean,
    lut: string,
    intensity: number,
    use2DLut: boolean,
  }
  private lutMap: {
    [key: string]: LUTCubeResult | LUT3dlResult | null
  }
  private gui: GUI;
  composer: null |EffectComposer;
  lutPass: null | LUTPass;
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
    this.params = {
      enabled: true,
      lut: 'Bourbon 64.CUBE',
      intensity: 1,
      use2DLut: false,
    };
    this.lutMap = {
      'Bourbon 64.CUBE': null,
      'Chemical 168.CUBE': null,
      'Clayton 33.CUBE': null,
      'Cubicle 99.CUBE': null,
      'Remy 24.CUBE': null,
      'Presetpro-Cinematic.3dl': null
    };
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
    this.composer = null;
    this.lutPass = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 0.25, 20);
    this.camera.position.set(-1.8, 0.6, 5.7);

    // 渲染器
    this.createRenderer();

    {
      const toast = showLoadingToast({
        message: '加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      this.loadModel().then(() => {
        toast.close();
      }).catch(() => { toast.close(); });
    }

    {
      const toast = showLoadingToast({
        message: '加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      this.loadMap().then(() => {
        toast.close();
      }).catch(() => { toast.close(); });
    }

    this.initComposer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;
    this.controls.target.set(0, 0, -0.2);
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
    this.gui.add(this.params, 'enabled');
    this.gui.add(this.params, 'lut', Object.keys(this.lutMap));
    this.gui.add(this.params, 'intensity').min(0).max(1);

    if (this.renderer && this.renderer.capabilities.isWebGL2) {
      this.gui.add(this.params, 'use2DLut');
    } else {
      this.params.use2DLut = true;
    }
  }

  private initComposer() {
    const target = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      encoding: THREE.sRGBEncoding
    });

    if (this.renderer && this.camera) {
      this.composer = new EffectComposer(this.renderer, target);
      this.composer.setPixelRatio(window.devicePixelRatio);
      this.composer.setSize(this.width, this.height);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.composer.addPass(new ShaderPass(GammaCorrectionShader));
  
      this.lutPass = new LUTPass({});
      this.composer.addPass(this.lutPass);
    }
  }

  private async loadMap() {
    const keys = Object.keys(this.lutMap);
    const cubeLoader = new LUTCubeLoader();
    const dlLoader = new LUT3dlLoader();

    keys.forEach(async (name) => {
      const url = `/examples/luts/${name}`;
      if (/\.CUBE$/i.test(name)) {
        this.lutMap[name] = await cubeLoader.loadAsync(url);
      } else {
        this.lutMap[name] = await dlLoader.loadAsync(url);
      }
    });
  }

  private async loadModel() {
    const loader = new RGBELoader();
    const url = "/examples/textures/equirectangular/royal_esplanade_1k.hdr";

    const texture = await loader.loadAsync(url);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = texture;
    this.scene.environment = texture;

    {
      // model
      const loader = new GLTFLoader();
      const url = "/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf";
      const gltf = await loader.loadAsync(url);

      this.scene.add(gltf.scene);
    }
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
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

    {
      if (this.lutPass) {
        const lut = this.lutMap[this.params.lut];
        this.lutPass.enabled = this.params.enabled && Boolean(lut);
        this.lutPass.intensity = this.params.intensity;

        if (lut) {
          this.lutPass.lut = this.params.use2DLut ? lut.texture : lut.texture3D;
        }
      }
    }

    this.stats?.update();
    this.controls?.update();

    // 执行渲染
    this.composer?.render();
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

      this.renderer?.setSize(this.width, this.height);
      this.composer?.setSize(this.width, this.height);
    };
  }
}

export default THREE;

