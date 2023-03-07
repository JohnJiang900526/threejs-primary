import * as THREE from 'three';
import { showLoadingToast } from "vant";
import Stats from 'three/examples/jsm/libs/stats.module';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';
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

  private clock: THREE.Clock
  private controls: null | OrbitControls
  private mixer: null | THREE.AnimationMixer
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.clock = new THREE.Clock();
    this.controls = null;
    this.mixer = null;
  }

  // 初始化方法入口
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(30, this.aspect, 1, 1000);
    this.camera.position.set(15, 10, -15);

    this.loadModel();
    this.createFloor();
    this.createLight();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 40;
    this.controls.target.set(0, 2, 0);
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

  private createFloor() {
    const grid = new THREE.GridHelper(20, 40, 0x888888, 0x444444);
		this.scene.add(grid);
  }

  // 创建光源
  private createLight() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambient);

    const point = new THREE.PointLight(0xffffff, 0.8);
    if (this.camera) {
      this.camera.add(point);
      this.scene.add(this.camera);
    }
  }

  // 加载模型
  private loadModel() {
    const loader = new ColladaLoader();
    const url = "/examples/models/collada/stormtrooper/stormtrooper.dae";

    const toast = showLoadingToast({
      message: '模型加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (collada) => {
      toast.close();

      const robot = collada.scene;
      const animations = robot.animations;

      if (!animations[0]) { return false; }
      robot.traverse((node) => {
        const obj = node as THREE.SkinnedMesh;
        if (obj.isSkinnedMesh) {
          // 当设置这个值时，它会在渲染对象之前检查每一帧对象是否在相机的截锥中。
          // 如果设置为false，即使对象不在相机的截锥中，它也会在每一帧中被渲染。默认为true
          obj.frustumCulled = false;
        }
      });
      this.mixer = new THREE.AnimationMixer(robot);
			this.mixer.clipAction(animations[0]).play();
      this.scene.add(robot);
    }, undefined, () => {
      toast.close();
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    if (this.mixer) {
      this.mixer.update(this.clock.getDelta());
    }
    // 执行渲染
    if (this.camera && this.renderer) {
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

