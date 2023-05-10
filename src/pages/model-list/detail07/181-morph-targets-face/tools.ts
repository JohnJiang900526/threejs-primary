import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
// @ts-ignore
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';
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
  private gui: GUI;
  private mixer: THREE.AnimationMixer | null;
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
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板",
    });
    this.mixer = null;
    this.clock = new THREE.Clock();
  }

  init() {
    // 渲染器
    this.createRenderer();

    // 场景
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer as THREE.WebGLRenderer);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x666666);
    this.scene.environment = pmremGenerator.fromScene(environment).texture;

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 20);
    this.camera.position.set(-1.8, 0.8, 5);

    // 加载模型
    this.loadModel();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 5;
    this.controls.minAzimuthAngle = -Math.PI / 2;
    this.controls.maxAzimuthAngle = Math.PI / 2;
    this.controls.maxPolarAngle = Math.PI / 1.8;
    this.controls.target.set(0, 0.15, -0.2);

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
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("/examples/js/libs/basis/")
    ktx2Loader.detectSupport(this.renderer as THREE.WebGLRenderer);

    const url = "/examples/models/gltf/facecap.glb";
    const loader = new GLTFLoader();
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (gltf) => {
      toast.close();

      const mesh = gltf.scene.children[0] as THREE.Mesh;
      this.scene.add(mesh);
      this.mixer = new THREE.AnimationMixer(mesh);
      this.mixer.clipAction(gltf.animations[0]).play();
      this.setUpGUI(mesh.getObjectByName('mesh_2') as THREE.Mesh);
    }, undefined, () => { toast.close(); });
  }

  private setUpGUI(head: THREE.Mesh) {
    this.gui.close();

    const influences = head.morphTargetInfluences as number[];
    const obj = head.morphTargetDictionary as { [key: string]: number };
    for (const [key, value] of Object.entries(obj)) {
      const name = key.replace('blendShape1.', '');
      
      this.gui.add(influences, value.toString(), 0, 1, 0.01).name(name).listen(true);
    }
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
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

    const delta = this.clock.getDelta();
    this.mixer?.update(delta);

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

