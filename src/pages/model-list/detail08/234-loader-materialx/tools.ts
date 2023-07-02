import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
import { MaterialXLoader } from 'three/examples/jsm/loaders/MaterialXLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { nodeFrame } from 'three/examples/jsm/renderers/webgl/nodes/WebGLNodes';
import { showLoadingToast } from 'vant';

const SAMPLE_PATH = 'https://raw.githubusercontent.com/materialx/MaterialX/main/resources/Materials/Examples/StandardSurface/';

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
  private samples: string[];
  private prefab: THREE.Group;
  private models: THREE.Group[];
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
    this.samples = [
      'standard_surface_brass_tiled.mtlx',
      //'standard_surface_brick_procedural.mtlx',
      'standard_surface_carpaint.mtlx',
      //'standard_surface_chess_set.mtlx',
      'standard_surface_chrome.mtlx',
      'standard_surface_copper.mtlx',
      //'standard_surface_default.mtlx',
      //'standard_surface_glass.mtlx',
      //'standard_surface_glass_tinted.mtlx',
      'standard_surface_gold.mtlx',
      'standard_surface_greysphere.mtlx',
      //'standard_surface_greysphere_calibration.mtlx',
      'standard_surface_jade.mtlx',
      //'standard_surface_look_brass_tiled.mtlx',
      //'standard_surface_look_wood_tiled.mtlx',
      'standard_surface_marble_solid.mtlx',
      'standard_surface_metal_brushed.mtlx',
      'standard_surface_plastic.mtlx',
      //'standard_surface_thin_film.mtlx',
      'standard_surface_velvet.mtlx',
      'standard_surface_wood_tiled.mtlx',
    ];
    this.prefab = new THREE.Group();
    this.models = [];
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 0.25, 1000);
    this.camera.position.set(0, 3, 50);

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    this.loadModel().then(() => {
      toast.close();
    }).catch(() => { toast.close(); });

    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private async loadModel() {
    const rgbLoader = new RGBELoader().setPath('/examples/textures/equirectangular/');
    const gltfLoader = new GLTFLoader().setPath("/examples/models/gltf/MaterialX/");

    const [texture, gltf] = await Promise.all([
      rgbLoader.loadAsync('san_giuseppe_bridge_2k.hdr'),
      gltfLoader.loadAsync('shaderball.glb'),
    ]);

    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = texture;
    this.scene.environment = texture;

    this.prefab = gltf.scene;
    this.samples.forEach((sample) => {
      this.addSample(sample);
    });
  }

  // 核心
  private async addSample(sample: string) {
    const model = this.prefab.clone();
    const loader = new MaterialXLoader();

    this.models.push(model);
    this.scene.add(model);

    this.updateModelsAlign();

    // @ts-ignore
    const material = await loader.setPath(SAMPLE_PATH).loadAsync(sample).then(({ materials }) => {
      return Object.values(materials).pop();
    });

    const calibrationMesh = model.getObjectByName('Calibration_Mesh') as THREE.Mesh;
    calibrationMesh.material = material;

    const Preview_Mesh = model.getObjectByName('Preview_Mesh') as THREE.Mesh;
    Preview_Mesh.material = material;
  }

  // 核心算法
  private updateModelsAlign() {
    const COLUMN_COUNT = 6;
    const DIST_X = 3;
    const DIST_Y = 4;

    const lineCount = Math.floor(this.models.length / COLUMN_COUNT) - 1.5;
    const offsetX = (DIST_X * ( COLUMN_COUNT - 1)) * -0.5;
    const offsetY = (DIST_Y * lineCount) * 0.5;

    this.models.forEach((model, i) => {
      model.position.x = ((i % COLUMN_COUNT) * DIST_X) + offsetX;
      model.position.y = (Math.floor(i / COLUMN_COUNT) * -DIST_Y) + offsetY;
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 0.5;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

    nodeFrame.update();
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

