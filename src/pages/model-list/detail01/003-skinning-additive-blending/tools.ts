import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.PerspectiveCamera
  private model: null | THREE.Group
  private skeleton: null | THREE.SkeletonHelper
  private orbitControls: null | OrbitControls
  private stats: null | Stats
  private mixer: null | THREE.AnimationMixer
  private clock: null | THREE.Clock
  private actions: {[key: string]: THREE.AnimationClip} | {[key: string]: any}
  private prevAction: null | THREE.AnimationAction
  private currentAction: null | THREE.AnimationAction
  private process: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.clock = null;
    this.model = null;
    this.skeleton = null;
    this.orbitControls = null;
    this.mixer = null;
    this.actions = {};
    this.prevAction = null;
    this.currentAction = null;
    this.process = 0;
  }

  init(fn?: (val: number) => void) {
    // 创建一个时钟
    this.clock = new THREE.Clock();

    // 创建一个场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa0a0a0);
    this.scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

    // 创建半球光
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 创建平行光
    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(3, 10, 10 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    this.scene.add(dirLight);

    // 创建网格模型
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshPhongMaterial({color: 0x999999, depthWrite: false})
    );
    mesh.rotation.x = -(Math.PI / 2);
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // 创建一个模型加载器
    const loader = new GLTFLoader();
    loader.load("./examples/models/gltf/Xbot.glb", (gltf) => {
      this.model = gltf.scene;
      this.scene?.add(this.model);

      this.model.traverse((obj) => {
        // @ts-ignore
        if (obj.isMesh) { obj.castShadow = true; }
      });

      // 添加骨架
      this.skeleton = new THREE.SkeletonHelper(this.model);
      this.skeleton.visible = false;
      this.scene?.add(this.skeleton);

      // 动画处理
      this.mixer = new THREE.AnimationMixer(this.model);
      const animations = gltf.animations;
      animations.forEach((item) => {
        if (this.mixer) {
          const action = this.mixer?.clipAction(item);
          this.actions[item.name] = action;
        }
      });

      if (this.actions["walk"]) {
        this.currentAction = this.actions["walk"] as THREE.AnimationAction;
      }

      if (this.currentAction) {
        this.currentAction.play();
      }
    }, ({ loaded, total }) => {
      this.process = Number(((loaded/total) * 100).toFixed(2));
      fn && fn(this.process);
    }, (e) => {
      console.log(e);
    });

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: false});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 创建相机 模拟人眼
    this.camera = new THREE.PerspectiveCamera(60, this.width/this.height, 1, 100);
    this.camera.position.set(- 1, 2, 3);

    // 创建一个控制器
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enablePan = false;
    this.orbitControls.enableZoom = true;
    this.orbitControls.target.set(0, 1, 0);
    this.orbitControls.update();

    // 创建统计信息
    // @ts-ignore
    this.stats = Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
    this.container.appendChild(this.stats.domElement);

    this.animate();
    this.resize();
  }

  // 状态转变
  stateActive(key: string) {
    if (key === "None") {
      this.currentAction?.stop();
      return false;
    }

    const action = this.actions[key];
    if (!action) { return false; }

    this.prevAction = this.currentAction;
    this.prevAction?.stop();
    this.currentAction = action;
    this.currentAction?.play();
  }

  // 动作状态
  controlScale(type: "slow" | "fast" | "normal") {
    if (!this.currentAction) { return false; }
    this.currentAction.setEffectiveWeight(1);
    switch(type) {
      case "normal":
        this.currentAction.setEffectiveTimeScale(1);
        break;
      case "fast":
        this.currentAction.setEffectiveTimeScale(1.5);
        break;
      case "slow":
        this.currentAction.setEffectiveTimeScale(0.3);
        break;
      default:
        this.currentAction.setEffectiveTimeScale(1);
    }
  }

  // 开启动画
  animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息渲染
    if (this.stats) {
      this.stats.update();
    }

    // 动画混合器 动画混合器需要循环更新 否则动画不启动
    if (this.mixer && this.clock) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
    }

    // 渲染器循环渲染场景和相机
    if (this.scene && this.camera && this.renderer) {
      this.renderer?.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        this.camera.aspect = this.width/this.height;
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;
