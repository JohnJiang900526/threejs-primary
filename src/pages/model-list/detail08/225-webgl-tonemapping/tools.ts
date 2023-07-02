import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import GUI, { Controller } from 'lil-gui';

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
  private mesh: THREE.Mesh;
  private gui: GUI
  private guiExposure: null | Controller;
  private params: {
    exposure: 1.0,
    toneMapping: 'None' | "Linear" | "Reinhard" | "Cineon" | "ACESFilmic" | "Custom",
    blurriness: 0.3
  }
  private toneMappingOptions: {
    None: THREE.ToneMapping,
    Linear: THREE.ToneMapping,
    Reinhard: THREE.ToneMapping,
    Cineon: THREE.ToneMapping,
    ACESFilmic: THREE.ToneMapping,
    Custom: THREE.ToneMapping
  }
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
    this.mesh = new THREE.Mesh();
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
    this.guiExposure = null;
    this.params = {
      exposure: 1.0,
      toneMapping: 'ACESFilmic',
      blurriness: 0.3
    };
    this.toneMappingOptions = {
      None: THREE.NoToneMapping,
      Linear: THREE.LinearToneMapping,
      Reinhard: THREE.ReinhardToneMapping,
      Cineon: THREE.CineonToneMapping,
      ACESFilmic: THREE.ACESFilmicToneMapping,
      Custom: THREE.CustomToneMapping
    };
  }

  init() {
    THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
      'vec3 CustomToneMapping( vec3 color ) { return color; }',
      `#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )
      float toneMappingWhitePoint = 1.0;
      vec3 CustomToneMapping( vec3 color ) {
        color *= toneMappingExposure;
        return saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );
      }`
    );
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xc4ceda);
    this.scene.backgroundBlurriness = this.params.blurriness;

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 0.25, 20);
    this.camera.position.set(-1.8, 0.6, 5.7);

    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.target.set(0, 0, -0.2);
    this.controls.update();

    this.createMesh().then(() => {
      this.initStats();
      this.setUpGUI();
      this.resize();
    }).catch((e) => {
      console.log(e);
    });
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private async createMesh() {
    const rgbeLoader = new RGBELoader().setPath("/examples/textures/equirectangular/");
    const gltfLoader = new GLTFLoader().setPath('/examples/models/gltf/DamagedHelmet/glTF/');

    const [texture, gltf] = await Promise.all([
      rgbeLoader.loadAsync('venice_sunset_1k.hdr'),
      gltfLoader.loadAsync('DamagedHelmet.gltf'),
    ]);

    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = texture;
    this.scene.environment = texture;

    this.mesh = gltf.scene.getObjectByName('node_damagedHelmet_-6514') as THREE.Mesh;
    this.scene.add(this.mesh);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.toneMapping = this.toneMappingOptions[this.params.toneMapping];
    this.renderer.toneMappingExposure = this.params.exposure;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setAnimationLoop(() => {this.render();})
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

  private setUpGUI() {
    this.updateGUI();
    this.gui.add(this.params, 'toneMapping', Object.keys(this.toneMappingOptions)).onChange(() => {
      this.updateGUI();
      if (this.renderer) {
        this.renderer.toneMapping = this.toneMappingOptions[this.params.toneMapping];
      }
      this.render();
		});

    this.gui.add(this.params, 'blurriness', 0, 1).onChange((value: number) => {
      this.scene.backgroundBlurriness = value;
      this.render();
    });
  }

  private updateGUI () {
    if (this.guiExposure !== null) {
      this.guiExposure.destroy();
      this.guiExposure = null;
    }

    if (this.params.toneMapping !== 'None') {
      this.guiExposure = this.gui.add( this.params, 'exposure', 0, 2 ).onChange(() => {
        if (this.renderer) {
          this.renderer.toneMappingExposure = this.params.exposure;
        }
        this.render();
      });
    }
  }

  private render() {
    this.stats?.update();
    this.controls?.update();
    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
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
      this.render();
    };
  }
}

export default THREE;

