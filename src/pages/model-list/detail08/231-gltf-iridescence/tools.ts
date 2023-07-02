import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { NodeMaterial, uv, add, mul, vec2, checker, float, timerLocal } from 'three/examples/jsm/nodes/Nodes';
import { nodeFrame } from 'three/examples/jsm/renderers/webgl/nodes/WebGLNodes';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
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
  private animateNumber: number;

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
    this.animateNumber = 0;

    this.controls = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.25, 20);
    this.camera.position.set(0.35, 0.05, 1.35);


    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    this.loadModel().then(() => {
      toast.close(); 
    }).catch(() => { toast.close(); });

    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
		this.controls.target.set(0, 0.2, 0);
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

  private async loadModel() {
    const rgbeLoader = new RGBELoader().setPath('/examples/textures/equirectangular/');
    const gltfLoader = new GLTFLoader().setPath('/examples/models/gltf/');

    const [texture, gltf] = await Promise.all([
      rgbeLoader.loadAsync('venice_sunset_1k.hdr'),
      gltfLoader.loadAsync('IridescenceLamp.glb'),
    ]);

    // 核心
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const material = mesh.material as (THREE.MeshStandardMaterial | THREE.MeshPhongMaterial);
      // @ts-ignore
      if (material && material.iridescence > 0) {
        const iridescenceFactorNode = checker(mul( add( uv(), vec2( timerLocal( - .05 ), 0 ) ), 20 ));
        const nodeMaterial = NodeMaterial.fromMaterial(material);

        // @ts-ignore
        nodeMaterial.iridescenceNode = iridescenceFactorNode;
        // @ts-ignore
        nodeMaterial.iridescenceIORNode = float(1.3);
        // @ts-ignore
        nodeMaterial.iridescenceThicknessNode = float(400);
        mesh.material = nodeMaterial;
      }
    });
    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = texture;
    this.scene.environment = texture;
    this.scene.add(gltf.scene);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    nodeFrame.update();
    this.stats?.update();
    this.controls?.update();

    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 消除 副作用
  dispose() {
    window.cancelAnimationFrame(this.animateNumber);
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

