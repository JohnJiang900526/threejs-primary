import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader';
import { LDrawUtils } from 'three/examples/jsm/utils/LDrawUtils';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass';

import { 
  PhysicalPathTracingMaterial, 
  PathTracingRenderer, 
  MaterialReducer, 
  BlurredEnvMapGenerator, 
  PathTracingSceneGenerator
  // @ts-ignore
} from 'three-gpu-pathtracer';

import GUI from 'lil-gui';
import { showLoadingToast } from 'vant';
import type { MeshBVH } from 'three-mesh-bvh';

interface IInfoType {
  bvh: MeshBVH,
  lights: THREE.Light[],
  materials: THREE.MeshStandardMaterial[],
  scene: THREE.Group,
  textures: THREE.DataTexture[]
}

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls;
  private gui: GUI;
  private pathTracer: null | PathTracingRenderer;
  private sceneInfo: IInfoType | null;
  private fsQuad: null | FullScreenQuad;
  private floor: THREE.Mesh;
  private delaySamples: number;
  private params: {
    enable: boolean,
    toneMapping: boolean,
    pause: boolean,
    tiles: number,
    transparentBackground: boolean,
    resolutionScale: number,
    roughness: number,
    metalness: number,
    download: () => void
  }
  samplesEl: HTMLDivElement
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = new THREE.PerspectiveCamera();
    this.stats = null;

    this.controls = null;
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
    this.pathTracer = null;
    this.sceneInfo = null;
    this.fsQuad = null;
    this.floor = new THREE.Mesh();
    this.delaySamples = 0;
    this.params = {
      enable: true,
      toneMapping: true,
      pause: false,
      tiles: 3,
      transparentBackground: false,
      resolutionScale: 1,
      download: () => {
        if (this.renderer) {
          const link = document.createElement('a');
          link.download = 'pathtraced-render.png';
          link.href = this.renderer.domElement.toDataURL().replace( 'image/png', 'image/octet-stream' );
          link.click();
        }
      },
      roughness: 0.15,
      metalness: 0.9,
    };
    this.samplesEl = document.createElement("div");
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdddddd);

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 10000);
    this.camera.position.set(150, 200, 250);

    // 渲染器
    this.createRenderer();
    // init 
    this.initPathTracer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.addEventListener("change", () => {
      this.delaySamples = 5;
      this.pathTracer?.reset();
    });

    // load
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    this.loadModel().then(() => {
      toast.close();
    }).catch(() => { toast.close(); });

    this.initStats();
    this.createGUI();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private async loadModel() {
    let model: any = null;
		let envMap: null | THREE.DataTexture = null;

    const ldrawPath = "/examples/models/ldraw/officialLibrary/";
    const ldrawUrl = "models/7140-1-X-wingFighter.mpd_Packed.mpd";
    const ldrawPromise = new LDrawLoader().setPath(ldrawPath).loadAsync(ldrawUrl).then((group) => {
      group = LDrawUtils.mergeObject(group);
      group.rotation.x = Math.PI;

      model = new THREE.Group();
      model.add(group);
      model.updateMatrixWorld();
    });

    const envMapUrl = "/examples/textures/equirectangular/royal_esplanade_1k.hdr";
    const envMapPromise = new RGBELoader().loadAsync(envMapUrl).then((texture) => {
      const envMapGenerator = new BlurredEnvMapGenerator(this.renderer);
      const blurredEnvMap = envMapGenerator.generate(texture, 0);

      this.scene.environment = blurredEnvMap;
      envMap = blurredEnvMap;
    });

    await Promise.all([envMapPromise, ldrawPromise]);

    // Adjust camera
    const bbox = new THREE.Box3().setFromObject(model as THREE.Object3D);
    const size = bbox.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, Math.max(size.y, size.z)) * 0.4;

    if (this.controls) {
      this.controls.target0.copy(bbox.getCenter(new THREE.Vector3()));
      this.controls.position0.set(2.3, 1, 2).multiplyScalar(radius).add(this.controls.target0);
      this.controls.reset();
    }

    // add floor
    const floorGeometry = new THREE.PlaneGeometry();
    const floorMaterial = new THREE.MeshStandardMaterial( {
      side: THREE.DoubleSide,
      roughness: 0.01,
      metalness: 1,
      map: this.createTexture(1024),
      transparent: true,
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.scale.setScalar(2500);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = bbox.min.y;
    model.add(this.floor);
    model.updateMatrixWorld();

    (new MaterialReducer()).process(model);
    const generator = new PathTracingSceneGenerator();
    const result = generator.generate(model) as IInfoType;

    // 添加模型到场景
    this.sceneInfo = result;
    this.sceneInfo.scene.traverse((obj) => {
      const c = obj as THREE.LineSegments;
      if (c.isLineSegments) { c.visible = false; }
    });
    this.scene.add(this.sceneInfo.scene);

    // update the material
    const { bvh, textures, materials } = result;
    const geometry = bvh.geometry;
    const material = this.pathTracer.material;

    material.bvh.updateFrom(bvh);
    material.normalAttribute?.updateFrom(geometry.attributes.normal);
    material.tangentAttribute?.updateFrom(geometry.attributes.tangent);
    material.uvAttribute?.updateFrom(geometry.attributes.uv);
    material.materialIndexAttribute?.updateFrom(geometry.attributes.materialIndex);
    material.textures?.setTextures(this.renderer, 2048, 2048, textures);
    material.materials?.updateFrom(materials, textures);

    this.pathTracer.material = material;
    this.pathTracer.material.envMapInfo?.updateFrom(envMap);

    // 初始化执行
    {
      const scale = this.params.resolutionScale;
      const dpr = window.devicePixelRatio;
      this.pathTracer?.setSize(this.width * scale * dpr, this.height * scale * dpr);
      this.pathTracer?.reset();
    }
  }

  private createTexture(dim: number) {
    const data = new Uint8Array(dim * dim * 4);

    for (let x = 0; x < dim; x++) {
      for (let y = 0; y < dim; y++) {
        const xNorm = x / (dim - 1);
        const yNorm = y / (dim - 1);
        const xCent = 2.0 * (xNorm - 0.5);
        const yCent = 2.0 * (yNorm - 0.5);

        let a = Math.max(Math.min(1.0 - Math.sqrt(xCent ** 2 + yCent ** 2), 1.0), 0.0);
        a = a ** 1.5;
        a = a * 1.5;
        a = Math.min(a, 1.0);

        const i = y * dim + x;
        data[i * 4 + 0] = 255;
        data[i * 4 + 1] = 255;
        data[i * 4 + 2] = 255;
        data[i * 4 + 3] = a * 255;
      }
    }

    const texture = new THREE.DataTexture(data, dim, dim);
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.UnsignedByteType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.needsUpdate = true;

    return texture;
  }

  private createGUI() {
    this.gui.add(this.params, 'enable');
    this.gui.add(this.params, 'pause');
    this.gui.add(this.params, 'toneMapping');
    this.gui.add(this.params, 'transparentBackground').onChange((v: number) => {
      this.pathTracer.material.backgroundAlpha = v ? 0 : 1;
      this.renderer?.setClearAlpha(v ? 0 : 1);
      this.pathTracer.reset();
    });

    this.gui.add(this.params, 'resolutionScale', 0.1, 1.0).onChange(() => {
      this.resize();
    });

    this.gui.add(this.params, 'tiles', 1, 3, 1).onChange((v: number) => {
      this.pathTracer.tiles.set(v, v);
    } );
    this.gui.add(this.params, 'roughness', 0, 1).name('floor roughness').onChange(() => {
      this.pathTracer.reset();
    });
    this.gui.add(this.params, 'metalness', 0, 1).name('floor metalness').onChange(() => {
      this.pathTracer.reset();
    });
    this.gui.add(this.params, 'download').name('下载图片');

    const renderFolder = this.gui.addFolder('Render');
    this.samplesEl.classList.add('gui-render');
    this.samplesEl.innerText = 'samples: 0';
    renderFolder.$children.appendChild(this.samplesEl);
    renderFolder.open();
  }

  // initPathTracer
  private initPathTracer() {
    this.pathTracer = new PathTracingRenderer(this.renderer);
    this.pathTracer.alpha = true;
    this.pathTracer.tiles.set(this.params.tiles, this.params.tiles);
    this.pathTracer.material = new PhysicalPathTracingMaterial();
    this.pathTracer.material.setDefine('FEATURE_GRADIENT_BG', 1);
    this.pathTracer.material.setDefine('FEATURE_MIS', 1);
    this.pathTracer.material?.bgGradientTop?.set(0xeeeeee);
    this.pathTracer.material?.bgGradientBottom?.set(0xeaeaea);
    this.pathTracer.camera = this.camera as THREE.PerspectiveCamera;

    const material = new THREE.MeshBasicMaterial({
      map: this.pathTracer.target.texture,
      blending: THREE.CustomBlending
    });
    this.fsQuad = new FullScreenQuad(material);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true, 
      premultipliedAlpha: false
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setClearColor(0xdddddd);
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

    if (!this.sceneInfo) { return; }
    // 执行渲染
    if (this.renderer && this.camera && this.pathTracer) {
      if (this.params.toneMapping) {
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      } else {
        this.renderer.toneMapping = THREE.NoToneMapping;
      }

      if (this.pathTracer.samples < 1.0 || ! this.params.enable) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    if (this.params.enable && this.delaySamples === 0 && this.pathTracer) {
      const samples = Math.floor(this.pathTracer.samples );
			this.samplesEl.innerText = `samples: ${ samples }`;

      const material = this.floor.material as THREE.MeshStandardMaterial;
      material.roughness = this.params.roughness;
      material.metalness = this.params.metalness;
      this.floor.material = material;

      this.pathTracer.material.materials.updateFrom(this.sceneInfo.materials, this.sceneInfo.textures);
      this.pathTracer.material.filterGlossyFactor = 0.5;
      this.pathTracer.material.physicalCamera.updateFrom(this.camera);

      this.camera.updateMatrixWorld();
      if (!this.params.pause || this.pathTracer.samples < 1) {
        this.pathTracer.update();
      }

      if (this.renderer && this.fsQuad) {
        this.renderer.autoClear = false;
        this.fsQuad.render(this.renderer);
        this.renderer.autoClear = true;
      }
    } else if (this.delaySamples > 0) {
      this.delaySamples--;
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      const scale = this.params.resolutionScale;
      const dpr = window.devicePixelRatio;

      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.pathTracer?.setSize(this.width * scale * dpr, this.height * scale * dpr);
      this.pathTracer?.reset();

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

