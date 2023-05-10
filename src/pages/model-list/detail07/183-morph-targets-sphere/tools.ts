import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { showLoadingToast } from 'vant';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

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
  private mesh: THREE.Mesh;
  private clock: THREE.Clock;
  private sign: number;
  private speed: number;
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
    this.mesh = new THREE.Mesh();
    this.clock = new THREE.Clock();
    this.sign = 1;
    this.speed = 0.5;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.2, 100);
    this.camera.position.set(0, 5, 5);

    this.generateLight();
    this.loadModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 1;
    this.controls.maxDistance = 20;

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
    document.onvisibilitychange = () => {
      if (document.hidden === true) {
        this.clock.stop();
      } else {
        this.clock.start();
      }
    }
  }

  private loadModel() {
    const textureLoader = new THREE.TextureLoader();
    const textureUrl = "/examples/textures/sprites/disc.png";

    const loader = new GLTFLoader();
    const url = "/examples/models/gltf/AnimatedMorphSphere/glTF/AnimatedMorphSphere.gltf";

    const pointsMaterial = new THREE.PointsMaterial({
      size: 10,
      sizeAttenuation: false,
      map: textureLoader.load(textureUrl),
      alphaTest: 0.5
    });

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (gltf) => {
      toast.close();

      this.mesh = gltf.scene.getObjectByName('AnimatedMorphSphere') as THREE.Mesh;
			this.mesh.rotation.z = Math.PI / 2;
      this.scene.add(this.mesh);

      const points = new THREE.Points(this.mesh.geometry, pointsMaterial);
      points.morphTargetInfluences = this.mesh.morphTargetInfluences;
      points.morphTargetDictionary = this.mesh.morphTargetDictionary;
      this.mesh.add(points);
    }, undefined, () => { toast.close(); });
  }

  private generateLight() {
    const light1 = new THREE.PointLight(0xff2200, 0.7);
    light1.position.set(100, 100, 100);

    const light2 = new THREE.PointLight(0x22ff00, 0.7);
    light2.position.set(-100, -100, -100);

    const light3 = new THREE.AmbientLight(0x111111);

    this.scene.add(light1, light2, light3);
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

    // 核心
    if (this.mesh.morphTargetInfluences) {
      const delta = this.clock.getDelta();
      const step = delta * this.speed;
      this.mesh.rotation.y += step;
      this.mesh.morphTargetInfluences[1] += step * this.sign;

      const num = this.mesh.morphTargetInfluences[1];
      if (num <= 0 || num >= 1) { this.sign *= -1; }
    }

    this.stats?.update();
    this.controls?.update();
    
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

