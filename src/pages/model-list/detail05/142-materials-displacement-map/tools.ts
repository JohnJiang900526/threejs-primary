import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.OrthographicCamera;
  private stats: null | Stats;

  private gui: GUI
  private controls: null | OrbitControls
  private mesh: THREE.Mesh
  private material: THREE.MeshStandardMaterial
  private pointLight: THREE.PointLight
  private ambientLight: THREE.AmbientLight
  private readonly h: number
  private r: number
  private settings: {
    metalness: number,
    roughness: number,
    ambientIntensity:number,
    aoMapIntensity: number,
    envMapIntensity: number,
    displacementScale: number,
    normalScale: number,
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

    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });

    this.controls = null;
    this.mesh = new THREE.Mesh();
    this.material = new THREE.MeshStandardMaterial();
    this.pointLight = new THREE.PointLight();
    this.ambientLight = new THREE.AmbientLight();
    this.h = 500;
    this.r = 0.0;
    this.settings = {
      metalness: 1.0,
      roughness: 0.4,
      ambientIntensity: 0.2,
      aoMapIntensity: 1.0,
      envMapIntensity: 1.0,
      displacementScale: 2.436143,
      normalScale: 1.0,
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.OrthographicCamera(-this.h*this.aspect, this.h*this.aspect, this.h, -this.h, 1, 10000);
    this.camera.position.z = 1500;
    this.scene.add(this.camera);

    this.generateLight();
    this.generateEnvMap();
    // 加载模型
    this.loadModel();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableZoom = false;
    this.controls.enableDamping = true;

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

  private generateEnvMap () {
    const path = '/examples/textures/cube/SwedishRoyalCastle/';
    const format = '.jpg';
    const urls = [
      path + 'px' + format, path + 'nx' + format,
      path + 'py' + format, path + 'ny' + format,
      path + 'pz' + format, path + 'nz' + format
    ];

    const reflectionCube = new THREE.CubeTextureLoader().load(urls);
    reflectionCube.encoding = THREE.sRGBEncoding;
    
    const textureLoader = new THREE.TextureLoader();
    const normalMap = textureLoader.load('/examples/models/obj/ninja/normal.png');
    const aoMap = textureLoader.load('/examples/models/obj/ninja/ao.jpg');
    const displacementMap = textureLoader.load('/examples/models/obj/ninja/displacement.jpg');

    this.material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: this.settings.roughness,
      metalness: this.settings.metalness,
      normalMap: normalMap,
      normalScale: new THREE.Vector2( 1, - 1 ),
      aoMap: aoMap,
      aoMapIntensity: 1,
      displacementMap: displacementMap,
      displacementScale: this.settings.displacementScale,
      displacementBias: -0.428408, // from original model
      envMap: reflectionCube,
      envMapIntensity: this.settings.envMapIntensity,
      side: THREE.DoubleSide
    });
  }

  private generateLight() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, this.settings.ambientIntensity);

    this.pointLight = new THREE.PointLight(0xff0000, 0.5);
    this.pointLight.position.z = 2500;

    const pointLight2 = new THREE.PointLight(0xff6666, 1);
    this.camera?.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x0000ff, 0.5);
    pointLight3.position.x = -1000;
    pointLight3.position.z = 1000;

    this.scene.add(this.ambientLight, this.pointLight,  pointLight3);
  }

  private setUpGUI() {
    this.gui.add(this.settings, "metalness", 0, 1).onChange((metalness: number) => {
      this.material.metalness = metalness;
    });

    this.gui.add(this.settings, "roughness", 0, 1).onChange((roughness: number) => {
      this.material.roughness = roughness;
    });

    this.gui.add(this.settings, "aoMapIntensity", 0, 1).onChange((aoMapIntensity: number) => {
      this.material.aoMapIntensity = aoMapIntensity;
    });

    this.gui.add(this.settings, "ambientIntensity", 0, 1).onChange((intensity: number) => {
      this.ambientLight.intensity = intensity;
    });

    this.gui.add(this.settings, "envMapIntensity", 0, 3).onChange((envMapIntensity: number) => {
      this.material.envMapIntensity = envMapIntensity;
    });

    this.gui.add(this.settings, "displacementScale", 0, 3).onChange((displacementScale: number) => {
      this.material.displacementScale = displacementScale;
    });

    this.gui.add(this.settings, "normalScale", -1, 1).onChange((normalScale: number) => {
      this.material.normalScale.set(1, -1).multiplyScalar(normalScale);
    });
  }

  private loadModel() {
    const loader = new OBJLoader();
    const url = "/examples/models/obj/ninja/ninjaHead_Low.obj";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (group) => {
      toast.close();
      const mesh = group.children[0] as THREE.Mesh;
      const geometry = mesh.geometry;
      
      geometry.attributes.uv2 = geometry.attributes.uv;
      geometry.center();

      this.mesh = new THREE.Mesh(geometry, this.material);
      this.mesh.scale.multiplyScalar(15);
      this.scene.add(this.mesh);
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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
        this.camera.left = -this.h * this.aspect;
        this.camera.right = this.h * this.aspect;
        this.camera.top = this.h;
        this.camera.bottom = -this.h;
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

