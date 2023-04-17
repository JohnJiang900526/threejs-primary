import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { GroundProjectedEnv } from 'three/examples/jsm/objects/GroundProjectedEnv';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
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

  private gui: GUI
  private controls: null | OrbitControls
  private params: {
    height: number
    radius: number
  }
  private env: null | GroundProjectedEnv
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });

    this.controls = null;
    this.params = {
      height: 20,
      radius: 440,
    };
    this.env = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdddddd);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 1000);
    this.camera.position.set(-20, 7, 20);
    this.camera.lookAt(0, 4, 0);

    this.generateEnvMap();
    this.generateModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.addEventListener("change", () => { this.render(); });
    this.controls.target.set(0, 2, 0);
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
    this.controls.maxDistance = 80;
    this.controls.minDistance = 20;
    this.controls.enablePan = false;
    this.controls.update();

    this.setUpGUI();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateModel() {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/examples/js/libs/draco/gltf/");

    const loader = new GLTFLoader();
    const shadowUrl = "/examples/models/gltf/ferrari_ao.png";
    const shadow = new THREE.TextureLoader().load(shadowUrl);
    const url = "/examples/models/gltf/ferrari.glb";
    loader.setDRACOLoader(dracoLoader);

    // 车身材质
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x000000, 
      metalness: 1.0, 
      roughness: 0.8,
      clearcoat: 1.0, 
      clearcoatRoughness: 0.2,
    });

    // 车的细节材质
    const detailsMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, 
      metalness: 1.0, 
      roughness: 0.5,
    });

    // 玻璃材质
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, 
      metalness: 0.25, 
      roughness: 0, 
      transmission: 1.0,
    });

    // 阴影
    const material = new THREE.MeshBasicMaterial({
      map: shadow, 
      toneMapped: false, 
      transparent: true,
      blending: THREE.MultiplyBlending,
    });
    const geometry = new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 2;
    
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (gltf) => {
      toast.close();

      const car = gltf.scene.children[0] as THREE.Object3D;
      car.scale.multiplyScalar(3);
      car.rotation.y = Math.PI;

      const body = car.getObjectByName('body') as THREE.Mesh;
      const rim_fl = car.getObjectByName('rim_fl') as THREE.Mesh;
      const rim_fr = car.getObjectByName('rim_fr') as THREE.Mesh;
      const rim_rr = car.getObjectByName('rim_rr') as THREE.Mesh;
      const rim_rl = car.getObjectByName('rim_rl') as THREE.Mesh;
      const trim = car.getObjectByName('trim') as THREE.Mesh;
      const glass = car.getObjectByName('glass') as THREE.Mesh;

      body.material = bodyMaterial;
      rim_fl.material = detailsMaterial;
      rim_fr.material = detailsMaterial;
      rim_rr.material = detailsMaterial;
      rim_rl.material = detailsMaterial;
      trim.material = detailsMaterial;
      glass.material = glassMaterial;

      car.add(mesh);
      this.scene.add(car);
      this.render();
    }, undefined, () => {toast.close();})
  }

  private async generateEnvMap () {
    const loader = new RGBELoader();
    const url = "/examples/textures/equirectangular/blouberg_sunrise_2_1k.hdr";
    const envMap = await loader.loadAsync(url);
    // .mapping : number 
    // 图像将如何应用到物体（对象）上。默认值是THREE.UVMapping对象类型， 即UV坐标将被用于纹理映射。
    envMap.mapping = THREE.EquirectangularReflectionMapping;

    this.env = new GroundProjectedEnv(envMap);
    this.env.scale.setScalar(100);
    this.scene.add(this.env);
    this.scene.environment = envMap;
    this.render();
  }

  private setUpGUI() {
    this.gui.add(this.params, 'height', 20, 50, 0.1).name("高度").onChange(() => {
      this.render();
    });

		this.gui.add(this.params, 'radius', 200, 600, 0.1).name("半径").onChange(() => {
      this.render();
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    //  色调映射 默认是NoToneMapping。查看Renderer constants以获取其它备选项
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  private render() {
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    if (this.env) {
      this.env.radius = this.params.radius;
      this.env.height = this.params.height;
    }
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
      this.render();
    };
  }
}

export default THREE;

