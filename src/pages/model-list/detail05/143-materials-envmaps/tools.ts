import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
  private textureEquirec: THREE.Texture
  private textureCube: THREE.CubeTexture
  private sphereMesh: THREE.Mesh
  private sphereMaterial: THREE.MeshBasicMaterial
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
    this.textureEquirec = new THREE.Texture();
    this.textureCube = new THREE.CubeTexture();
    this.sphereMesh = new THREE.Mesh();
    this.sphereMaterial = new THREE.MeshBasicMaterial();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 100000);
    this.camera.position.set(0, 0, 1000)

    this.generateEnvMap();
    this.generateSphere();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 100;
		this.controls.maxDistance = 2500;
    // 将其设置为true以启用阻尼（惯性），这将给控制器带来重量感。默认值为false。
    // 请注意，如果该值被启用，你将必须在你的动画循环里调用.update()
    this.controls.enableDamping = true;
    this.controls.update();

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
    const loader = new THREE.CubeTextureLoader();
    const path = "/examples/textures/cube/Bridge2/";
    const urls = [
      'posx.jpg', 'negx.jpg', 'posy.jpg', 
      'negy.jpg', 'posz.jpg', 'negz.jpg',
    ];
    loader.setPath(path);
    this.textureCube = loader.load(urls);
    this.textureCube.encoding = THREE.sRGBEncoding;

    const textureLoader = new THREE.TextureLoader();
    this.textureEquirec = textureLoader.load('/examples/textures/2294472375_24a3b8ef46_o.jpg');
    this.textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
    this.textureEquirec.encoding = THREE.sRGBEncoding;

    this.scene.background = this.textureCube;
    this.scene.environment = this.textureCube;
  }

  private generateSphere () {
    const geometry = new THREE.IcosahedronGeometry(250, 15);

    this.sphereMaterial = new THREE.MeshBasicMaterial({envMap: this.textureCube});
    this.sphereMesh = new THREE.Mesh(geometry, this.sphereMaterial);
    this.scene.add(this.sphereMesh);
  }

  private setUpGUI() {
    const params = {
      Cube: () => {
        this.scene.background = this.textureCube;
        this.scene.environment = this.textureCube;
        this.sphereMaterial.envMap = this.textureCube;
        this.sphereMaterial.needsUpdate = true;
      },
      Equirectangular: () => {
        this.scene.background = this.textureEquirec;
        this.scene.environment = this.textureEquirec;
        this.sphereMaterial.envMap = this.textureEquirec;
        this.sphereMaterial.needsUpdate = true;
      },
      Refraction: false
    };

    this.gui.add(params, "Cube").name("立方体投影");
    this.gui.add(params, "Equirectangular").name("等量矩形投影");
    this.gui.add(params, "Refraction").name("是否折射").onChange((value: boolean) => {
      if (value) {
        this.textureEquirec.mapping = THREE.EquirectangularRefractionMapping;
        this.textureCube.mapping = THREE.CubeRefractionMapping;
      } else {
        this.textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
        this.textureCube.mapping = THREE.CubeReflectionMapping;
      }
      this.sphereMaterial.needsUpdate = true;
    });
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

