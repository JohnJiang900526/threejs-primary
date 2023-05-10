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

  private mesh: THREE.Mesh;
  private mixer: THREE.AnimationMixer | null;
  private radius: number;
  private theta: number;
  private prevTime: number;
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
    this.mixer = null;
    this.radius = 600;
    this.theta = 0;
    this.prevTime = Date.now();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 10000);
    this.camera.position.y = 300;

    this.generateLight();
    this.loadModel();
    // 渲染器
    this.createRenderer();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private loadModel() {
    const loader = new GLTFLoader();
    const url = "/examples/models/gltf/Horse.glb";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (gltf) => {
      toast.close();

      // 核心
      this.mesh = gltf.scene.children[0] as THREE.Mesh;
      this.mesh.scale.set(1.5, 1.5, 1.5);
      this.scene.add(this.mesh);
      this.mixer = new THREE.AnimationMixer(this.mesh);
      this.mixer.clipAction(gltf.animations[0]).setDuration(1).play();
    }, undefined, () => { toast.close(); })
  }

  private generateLight() {
    const light1 = new THREE.DirectionalLight(0xefefff, 1.5);
    light1.position.set(1, 1, 1).normalize();

    const light2 = new THREE.DirectionalLight(0xffefef, 1.5);
    light2.position.set(-1, -1, -1).normalize();
    
    this.scene.add(light1, light2);
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

    // 核心
    if (this.camera) {
      this.theta += 0.1;
      this.camera.position.x = this.radius * Math.sin(THREE.MathUtils.degToRad(this.theta));
      this.camera.position.z = this.radius * Math.cos(THREE.MathUtils.degToRad(this.theta));
      this.camera.lookAt(0, 150, 0);

      const time = Date.now();
      this.mixer?.update((time - this.prevTime) * 0.001);
      this.prevTime = time;
    }

    this.stats?.update();
    
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

