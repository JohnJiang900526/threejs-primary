import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
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

  private controls: null | OrbitControls
  private gui: GUI
  private gemBackMaterial: THREE.MeshPhysicalMaterial
  private gemFrontMaterial: THREE.MeshPhysicalMaterial
  private objects: THREE.Group[]
  private params: {
    projection: string,
    exposure: number,
    gemColor: string
    autoRotate: boolean,
    background: boolean,
    reflectivity: number,
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

    this.gemBackMaterial = new THREE.MeshPhysicalMaterial();
    this.gemFrontMaterial = new THREE.MeshPhysicalMaterial();
    this.objects = [];
    this.params = {
      projection: 'normal',
      autoRotate: true,
      reflectivity: 1,
      background: false,
      exposure: 1,
      gemColor: 'Blue',
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 1000);
    this.camera.position.set(0.0, -10, 20 * 3.5);

    this.generateMaterial();
    this.generateLight();
    this.loadModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 20;
    this.controls.maxDistance = 200;

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
    this.gui.add(this.params, 'reflectivity', 0, 1).name("反射率");
    this.gui.add(this.params, 'exposure', 0, 2).name("曝光度");
    this.gui.add(this.params, 'autoRotate').name("自动旋转");
    this.gui.add(this.params, 'gemColor', ['Blue', 'Green', 'Red', 'White', 'Black' ]).name("颜色");
  }

  private generateMaterial() {
    this.gemBackMaterial = new THREE.MeshPhysicalMaterial({
      map: null,
      color: 0x0000ff,
      // 材质与金属的相似度
      metalness: 1,
      // 材质的粗糙程度
      roughness: 0,
      opacity: 0.5,
      side: THREE.BackSide,
      transparent: true,
      // 通过乘以环境贴图的颜色来缩放环境贴图的效果
      envMapIntensity: 5,
      // 是否预乘alpha（透明度）值 默认false
      premultipliedAlpha: true
    });

    this.gemFrontMaterial = new THREE.MeshPhysicalMaterial({
      map: null,
      color: 0x0000ff,
      // 材质与金属的相似度
      metalness: 0,
      // 材质的粗糙程度
      roughness: 0,
      opacity: 0.25,
      side: THREE.FrontSide,
      transparent: true,
      // 通过乘以环境贴图的颜色来缩放环境贴图的效果
      envMapIntensity: 10,
      // 是否预乘alpha（透明度）值 默认false
      premultipliedAlpha: true
    });
  }

  private generateLight() {
    const ambient = new THREE.AmbientLight(0x222222);

    const light1 = new THREE.PointLight(0xffffff);
    light1.position.set(150, 10, 0);
    light1.castShadow = false;

    const light2 = new THREE.PointLight(0xffffff);
    light2.position.set(-150, 0, 0);

    const light3 = new THREE.PointLight(0xffffff);
    light3.position.set(0, -10, -150);

    const light4 = new THREE.PointLight(0xffffff);
    light4.position.set(0, 0, 150);

    this.scene.add(ambient, light1, light2, light3, light4);
  }

  private loadModel() {
    // toast
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    {
      const loader = new OBJLoader();
      const url = "/examples/models/obj/emerald.obj";
      loader.load(url, (object) => {
        toast.close();

        const mesh = object.children[0] as THREE.Mesh;
        if (mesh.isMesh) {
          const parent = new THREE.Group();
          const second = mesh.clone();

          mesh.material = this.gemBackMaterial;
          second.material = this.gemFrontMaterial;

          parent.add(second);
          parent.add(mesh);
          this.scene.add(parent);
          this.objects.push(parent);
        }
      }, undefined, () => { toast.close(); });
    }

    {
      const loader = new RGBELoader();
      const url = "/examples/textures/equirectangular/royal_esplanade_1k.hdr";
      loader.load(url, (texture) => {
        toast.close();

        texture.mapping = THREE.EquirectangularReflectionMapping;

        this.gemFrontMaterial.envMap = texture;
        this.gemBackMaterial.envMap = texture;
        this.gemFrontMaterial.needsUpdate = true;
        this.gemBackMaterial.needsUpdate = true;
      }, undefined, () => { toast.close(); });
    }

  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
    window.requestAnimationFrame(() => { this.animate(); });

    // 反射率，由0.0到1.0。默认为0.5, 相当于折射率1.5。
    // 这模拟了非金属材质的反射率。当metalness为1.0时，此属性无效
    this.gemFrontMaterial.reflectivity = this.params.reflectivity;
    this.gemBackMaterial.reflectivity = this.params.reflectivity;
    
    // 颜色设置
    let color = this.gemBackMaterial.color;
    switch (this.params.gemColor) {
      case 'Blue': 
        color = new THREE.Color(0x000088);
        break;
      case 'Red': 
        color = new THREE.Color(0x880000);
        break;
      case 'Green': 
        color = new THREE.Color(0x008800);
        break;
      case 'White': 
        color = new THREE.Color(0x888888);
        break;
      case 'Black': 
        color = new THREE.Color(0x0f0f0f);
        break;
      default:
        color = new THREE.Color(0x000088);
    }
    this.gemBackMaterial.color = color;
    this.gemFrontMaterial.color = color;

    // 自动旋转
    if (this.params.autoRotate) {
      this.objects.forEach((group) => {
        group.rotation.y += 0.005;
      });
    }
    
    this.stats?.update();
    this.controls?.update();
    
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
      this.camera.lookAt(this.scene.position);
      this.renderer.toneMappingExposure = this.params.exposure;
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

