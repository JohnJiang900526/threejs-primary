import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SimplifyModifier } from 'three/examples/jsm/modifiers/SimplifyModifier';

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
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 25);

    this.loadModel();
    this.generateLight();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enablePan = false;
    this.controls.enableZoom = false;

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
    const url = "/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (gltf) => {
      toast.close();

      const mesh1 = gltf.scene.children[0];
      mesh1.position.x = -3;
      mesh1.rotation.y = (Math.PI / 2);

      // 核心
      const modifier = new SimplifyModifier();
      const mesh2 = mesh1.clone() as THREE.Mesh;
      const material = (mesh2.material as THREE.MeshStandardMaterial).clone();
      material.flatShading = true;
      mesh2.material = material;

      const num = mesh2.geometry.attributes.position.count * 0.875;
      mesh2.geometry = modifier.modify(mesh2.geometry, Math.floor(num));
      mesh2.position.x = 3;
      mesh2.rotation.y = -(Math.PI / 2);

      this.scene.add(mesh1, mesh2);
    }, undefined, () => { toast.close(); });
  }

  private generateLight() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.2);

    const light2 = new THREE.PointLight(0xffffff, 0.7);
    this.camera?.add(light2);

    this.scene.add(light1, this.camera as THREE.PerspectiveCamera);
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

