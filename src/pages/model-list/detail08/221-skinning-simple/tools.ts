import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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

  private controls: null | OrbitControls;
  private mixer: null | THREE.AnimationMixer;
  private clock: THREE.Clock;
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
    this.mixer = null;
    this.clock = new THREE.Clock();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa0a0a0);
    this.scene.fog = new THREE.Fog(0xa0a0a0, 70, 100);

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 1000);
    this.camera.position.set(18, 6, 18);

    this.createGround();
    this.createLight();
    this.loadModel();

    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enablePan = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
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

  private createGround() {
    const geometry = new THREE.PlaneGeometry(500, 500);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x999999, 
      depthWrite: false 
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.position.set(0, -5, 0);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(500, 100, 0x000000, 0x000000);
    grid.position.y = - 5;
    (grid.material as THREE.Material).opacity = 0.2;
    (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);
  }

  private createLight() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 200, 0);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 18;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.camera.left = -12;
    dirLight.shadow.camera.right = 12;
    
    this.scene.add(hemiLight, dirLight);
  }

  private loadModel() {
    const loader = new GLTFLoader();
    const url = "/examples/models/gltf/SimpleSkinning.gltf";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (gltf) => {
      toast.close();
      
      const group = gltf.scene;
      this.scene.add(group);
      group.traverse((child) => {
        const obj = child as THREE.SkinnedMesh;
        if (obj.isSkinnedMesh) { obj.castShadow = true; }
      });
      this.mixer = new THREE.AnimationMixer(group);
      if (gltf.animations[0]) {
        this.mixer.clipAction(gltf.animations[0]).play();
      }
    }, undefined, () => { toast.close(); });
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

    this.stats?.update();
    this.controls?.update();
    this.mixer?.update(this.clock.getDelta());
    
    // 执行渲染
    if (this.renderer && this.camera) {
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

