import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { KTXLoader } from 'three/examples/jsm/loaders/KTXLoader';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private meshes: THREE.Mesh[]
  private geometry: THREE.BoxGeometry
  private formats: {
    astc: boolean
    etc1: boolean
    s3tc: boolean
    pvrtc: boolean
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
    
    this.meshes = [];
    this.geometry = new THREE.BoxGeometry(200, 200, 200);
    this.formats = {
      astc: false,
      etc1: false,
      s3tc: false,
      pvrtc: false,
    };
  }

  init() {
    // webgl渲染器
    this.createRenderer();

    this.formats = {
      astc: this.renderer?.extensions?.has('WEBGL_compressed_texture_astc') || false,
			etc1: this.renderer?.extensions?.has('WEBGL_compressed_texture_etc1') || false,
			s3tc: this.renderer?.extensions?.has('WEBGL_compressed_texture_s3tc') || false,
			pvrtc: this.renderer?.extensions?.has('WEBGL_compressed_texture_pvrtc') || false,
    };

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(100, this.aspect, 1, 2000);
    this.camera.position.z = 1000;

    // 创建模型
    this.createModel();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 加载模型
  private createModel() {
    const loader = new KTXLoader();

    let material1: THREE.MeshBasicMaterial;
    let material2: THREE.MeshBasicMaterial;

    if (this.formats.pvrtc) {
			material1 = new THREE.MeshBasicMaterial( {
				map: loader.load('/examples/textures/compressed/disturb_PVR2bpp.ktx', () => {})
			});
			material2 = new THREE.MeshBasicMaterial( {
				map: loader.load('/examples/textures/compressed/lensflare_PVR4bpp.ktx', () => {}),
				depthTest: false,
				transparent: true,
				side: THREE.DoubleSide
			});

			this.meshes.push(new THREE.Mesh(this.geometry, material1));
			this.meshes.push(new THREE.Mesh(this.geometry, material2));
		}

    if (this.formats.s3tc) {
			material1 = new THREE.MeshBasicMaterial( {
				map: loader.load('/examples/textures/compressed/disturb_BC1.ktx', () => {})
			});
			material2 = new THREE.MeshBasicMaterial( {
				map: loader.load('/examples/textures/compressed/lensflare_BC3.ktx', () => {}),
				depthTest: false,
				transparent: true,
				side: THREE.DoubleSide
			});

			this.meshes.push(new THREE.Mesh(this.geometry, material1));
			this.meshes.push(new THREE.Mesh(this.geometry, material2));
		}

    if (this.formats.etc1) {
			material1 = new THREE.MeshBasicMaterial({
				map: loader.load('textures/compressed/disturb_ETC1.ktx', () => {})
			});

			this.meshes.push(new THREE.Mesh(this.geometry, material1));
		}

    if (this.formats.astc) {
			material1 = new THREE.MeshBasicMaterial( {
				map: loader.load('/examples/textures/compressed/disturb_ASTC4x4.ktx', () => {})
			} );
			material2 = new THREE.MeshBasicMaterial( {
				map: loader.load('/examples/textures/compressed/lensflare_ASTC8x8.ktx', () => {}),
				depthTest: false,
				transparent: true,
				side: THREE.DoubleSide
			});

			this.meshes.push(new THREE.Mesh(this.geometry, material1));
			this.meshes.push(new THREE.Mesh(this.geometry, material2));
		}

    this.meshes.forEach((mesh, index, arr) => {
      mesh.position.x = 0;
			mesh.position.y = ((-arr.length/2 * 200) + index * 400);

			this.scene.add(mesh);
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
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

    const timer = Date.now() * 0.001;
    this.meshes.forEach((mesh) => {
      mesh.rotation.x = timer;
      mesh.rotation.y = timer;
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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

