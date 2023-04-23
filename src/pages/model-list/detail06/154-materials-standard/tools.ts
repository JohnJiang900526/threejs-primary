import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { showLoadingToast } from 'vant';

type environment = "Venice Sunset" | "Overpass";

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | TrackballControls
  private gui: GUI
  private environments: {
    'Venice Sunset': { 
      filename: string,
      texture?: THREE.DataTexture
    },
    'Overpass': { 
      filename: string,
      texture?: THREE.DataTexture
    },
  }
  private params: {
    environment: environment
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

    this.controls = null;
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.environments = {
      'Venice Sunset': { 
        filename: 'venice_sunset_1k.hdr',
      },
      'Overpass': { 
        filename: 'pedestrian_overpass_1k.hdr' 
      }
    };
    this.params = {
      environment: Object.keys(this.environments)[0] as environment
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.01, 1000);
    this.camera.position.set(0, 0, 2);

    // light 
    const hemisphere = new THREE.HemisphereLight(0x443333, 0x222233, 4)
    this.scene.add(hemisphere);

    this.loadModel();
    this.loadEnvironment(this.params.environment);
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new TrackballControls(this.camera, this.renderer?.domElement);

    this.setUpGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.params, "environment", Object.keys(this.environments)).name("切换环境").onChange(() => {
      this.loadEnvironment(this.params.environment);
    });
  }

  private loadModel() {
    const loader = new OBJLoader();
    const url = "/examples/models/obj/cerberus/Cerberus.obj";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    const material = this.generateMaterial();

    loader.load(url, (group) => {
      toast.close();

      group.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.isMesh) { mesh.material = material; }
      });

      group.position.x = -0.2;
      group.rotation.y = -Math.PI / 2;
      group.scale.set(0.4, 0.4, 0.4);
      this.scene.add(group);
    }, undefined, () => { toast.close(); });
  }

  private loadEnvironment(name: environment) {
    const texture = this.environments[name].texture || null;

    if (texture) {
      this.scene.background = texture;
      this.scene.environment = texture;
      return;
    }

    const url = this.environments[name].filename;
    const loader = (new RGBELoader()).setPath("/examples/textures/equirectangular/");
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (texture) => {
      toast.close();
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture;
      this.environments[name].texture = texture;
    }, undefined, () => { toast.close(); });
  }

  private generateMaterial() {
    const path = "/examples/models/obj/cerberus/";
    const loader = (new THREE.TextureLoader()).setPath(path);
    const material = new THREE.MeshStandardMaterial({
      roughness: 1,
      metalness: 1,
    });

    const map = loader.load('Cerberus_A.jpg');
    map.encoding = THREE.sRGBEncoding;
    material.map = map;
    material.map.wrapS = THREE.RepeatWrapping;


    const rm = loader.load('Cerberus_RM.jpg');
    material.roughnessMap = rm;
    material.metalnessMap = rm;
    material.normalMap = loader.load('Cerberus_N.jpg');

    material.roughnessMap.wrapS = THREE.RepeatWrapping;
    material.metalnessMap.wrapS = THREE.RepeatWrapping;
    material.normalMap.wrapS = THREE.RepeatWrapping;

    return material;
  }


  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 3;
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
    this.controls?.update();
    
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
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

