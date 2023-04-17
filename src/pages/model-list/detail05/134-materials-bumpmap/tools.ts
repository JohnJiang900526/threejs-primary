import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
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

  private mesh: THREE.Mesh
  private spotLight: THREE.PointLight
  private mouse: THREE.Vector2
  private target: THREE.Vector2
  private halfX: number
  private halfY: number
  private loader: GLTFLoader
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.mesh = new THREE.Mesh();
    this.spotLight = new THREE.SpotLight();
    this.mouse = new THREE.Vector2();
    this.target = new THREE.Vector2();
    this.halfX = this.width/2;
    this.halfY = this.height/2;
    this.loader = new GLTFLoader();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060708);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 10000);
    this.camera.position.z = 1000;

    // 创建灯光
    this.createLight();

    // 创建对象
    this.loadModel();

    // webgl渲染器
    this.createRenderer();

    this.bind();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private bind() {
    if (this.isMobile()) {
      window.onmousemove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];
        const x = (e.clientX - this.halfX);
				const y = (e.clientY - 45 - this.halfY);
        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onmousemove = (e) => {
        const x = (e.clientX - this.halfX);
				const y = (e.clientY - 45 - this.halfY);
        this.mouse.set(x, y);
      };
    }
  }

  private createLight() {
    const light1 = new THREE.HemisphereLight(0x443333, 0x111122); 

    this.spotLight = new THREE.SpotLight(0xffffbb, 2);
    this.spotLight.position.set(0.5, 0, 1);
    this.spotLight.position.multiplyScalar(700);

    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 2048;
    this.spotLight.shadow.mapSize.height = 2048;
    this.spotLight.shadow.camera.near = 200;
    this.spotLight.shadow.camera.far = 1500;
    this.spotLight.shadow.camera.fov = 40;
    this.spotLight.shadow.bias = -0.005;
    this.scene.add(light1, this.spotLight);
  }

  // 加载模型
  private loadModel() {
    const textureLoader = new THREE.TextureLoader();
    const url1 = "/examples/models/gltf/LeePerrySmith/Infinite-Level_02_Disp_NoSmoothUV-4096.jpg";
    const url2 = "/public/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb";

    const mapHeight = textureLoader.load(url1);
    const material = new THREE.MeshPhongMaterial({
      color: 0x552811,
      specular: 0x222222,
      shininess: 25,
      bumpMap: mapHeight,
      bumpScale: 12
    });
    
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    this.loader.load(url2, (gltf) => {
      toast.close();
      const mesh = gltf.scene.children[0] as THREE.Mesh;
      const geometry = mesh.geometry;

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.y = -50;
      this.mesh.scale.set(70, 70, 70);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      
      this.scene.add(this.mesh);
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
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

    if (this.mesh) {
      this.target.set(this.mouse.x * 0.001, this.mouse.y * 0.001);

      const {x, y} = this.target;
      this.mesh.rotation.y += 0.05 * (x - this.mesh.rotation.y);
			this.mesh.rotation.x += 0.05 * (y - this.mesh.rotation.x);
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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
      this.halfX = this.width/2;
      this.halfY = this.height/2;
      this.aspect = this.width/this.height;

      this.bind();
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

