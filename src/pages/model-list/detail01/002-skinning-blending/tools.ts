
import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private stats: null | Stats
  private mixer: null | THREE.AnimationMixer
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.PerspectiveCamera
  private clock: null | THREE.Clock
  private hemiLight: null | THREE.HemisphereLight
  private model: null | THREE.Group
  private skeleton: null | THREE.SkeletonHelper
  private idleAction: null | THREE.AnimationAction;
  private walkAction: null | THREE.AnimationAction
  private runAction: null | THREE.AnimationAction
  private defaultAnimate: boolean
  private idleWeight: number
  private walkWeight: number
  private runWeight: number
  private singleStepMode: boolean
  private sizeOfNextStep: number
  private actionName: "walk" | "run" | "slow"
  private actions: (null | THREE.AnimationAction)[]

  private process: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.mixer = null;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.clock = null;
    this.hemiLight = null;
    this.model = null;
    this.skeleton = null;
    this.idleAction = null;
    this.walkAction = null;
    this.runAction = null;
    this.actions = [];
    this.idleWeight = 0;
    this.walkWeight = 0;
    this.runWeight = 0;
    this.singleStepMode = false;
    this.sizeOfNextStep = 0;
    this.defaultAnimate = true;
    this.actionName = "walk";
    this.stats = null;
    this.process = 0;
  }

  init(fn?: (val: number) => void) {
    // 创建一个相机
    this.camera = new THREE.PerspectiveCamera(80, this.width/this.height, 1, 1000);
    this.camera.position.set(1, 2, -3);
    this.camera.lookAt(0, 1, 0);

    // 创建一个时钟
    this.clock = new THREE.Clock();
    // 创建一个场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xa0a0a0);
    // 场景中的雾气
    this.scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

    // 创建光源 半球光
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    this.hemiLight.position.set(0, 20, 0);
    this.scene.add(this.hemiLight);

    // 创建一个平行光
    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(-3, 20, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = - 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    this.scene.add(dirLight);

    // 创建一个多边形物体网格
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    mesh.rotation.x = -(Math.PI / 2);
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // 创建一个加载器
    const loader = new GLTFLoader();
    loader.load("./examples/models/gltf/Soldier.glb", (gltf) => {
      this.model = gltf.scene;

      if (this.scene) {
        this.scene?.add(this.model);
      }

      this.model.traverse((obj) => {
        // @ts-ignore
        if (obj.isMesh) {
          obj.castShadow = true;
        }
      });

      // 创建一个骨架
      this.skeleton = new THREE.SkeletonHelper(this.model);
      this.skeleton.visible = false;
      if (this.scene) {
        this.scene?.add(this.skeleton);
      }

      // 创建一个动画
      const animations = gltf.animations;
      // 创建一个动画混合器
      this.mixer = new THREE.AnimationMixer(this.model);
      this.idleAction = this.mixer.clipAction(animations[0]);
      this.walkAction = this.mixer.clipAction(animations[3]);
      this.runAction = this.mixer.clipAction(animations[1]);
      this.actions = [this.idleAction, this.walkAction, this.runAction];
    }, ({loaded, total}) => {
      this.process = (loaded / total);
      fn && fn(this.process * 100);
    }, (e) => {
      console.log(e);
    });

    // 创建一个渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 创建性能监控
    // @ts-ignore
    this.stats = Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
    this.container.appendChild(this.stats.domElement);

    // 创建一个控制器
    const controls = new OrbitControls(this.camera, this.renderer?.domElement);
    controls.target.set(0, 0.5, 0);
    controls.update();
    controls.enablePan = false;
    controls.enableDamping = true;

    this.animate();
    this.resize();
  }

  // 开启动画
  animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    if (this.idleAction) {
      this.idleWeight = this.idleAction.getEffectiveWeight();
    }
    if (this.walkAction) {
      this.walkWeight = this.walkAction.getEffectiveWeight();
    }
    if (this.runAction) {
      this.runWeight = this.runAction.getEffectiveWeight();
    }

    if (this.defaultAnimate) {
      switch(this.actionName) {
        case "walk":
          this.activateAllActions();
          break;
        case "run":
          this.run();
          break;
        case "slow":
          this.slow();
          break;
        default:
          this.activateAllActions();
      }
    } else {
      this.deactivateAllActions();
    }

    const delta = this.clock?.getDelta();

    if (this.mixer) {
      this.mixer?.update(delta as number);
    }

    if (this.stats) {
      this.stats.update();
    }

    if (this.scene && this.camera) {
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

  // 模型的显示和隐藏
  toggleShowModel() {
    if (this.model) {
      this.model.visible = !this.model.visible;
    }
  }

  // 骨架的显示和隐藏
  toggleShowSkeleton() {
    if (this.skeleton) {
      this.skeleton.visible = !this.skeleton.visible;
    }
  }

  // 关闭所有动画
  deactivateAllActions() {
    this.defaultAnimate = false;
    this.actions.forEach((action) => {
      if (action) { action?.stop(); }
    });
  }

  // 开启所有动画
  activateAllActions() {
    this.actionName = "walk";
    this.defaultAnimate = true;
    if (this.idleAction) {
      this.idleAction.enabled = true;
      this.idleAction.setEffectiveTimeScale(1);
      this.idleAction.setEffectiveWeight(0);
    }

    if (this.walkAction) {
      this.walkAction.enabled = true;
      this.walkAction.setEffectiveTimeScale(1);
      this.walkAction.setEffectiveWeight(1);
    }

    if (this.runAction) {
      this.runAction.enabled = true;
      this.runAction.setEffectiveTimeScale(1);
      this.runAction.setEffectiveWeight(0);
    }

    this.actions = [this.idleAction, this.walkAction, this.runAction];
    this.actions.forEach((action) => {
      if (action) { action?.play(); }
    });
  }

  // 停止 or 继续
  togglePauseActions() {
    this.actions.forEach((action) => {
      if (action) {
        action.paused = !action.paused;
      }
    });
  }

  // 走路
  walk() {
    this.activateAllActions();
  }

  // 跑步
  run() {
    this.actionName = "run";
    this.defaultAnimate = true;
    if (this.idleAction) {
      this.idleAction.enabled = true;
      this.idleAction.setEffectiveTimeScale(1);
      this.idleAction.setEffectiveWeight(0);
    }

    if (this.walkAction) {
      this.walkAction.enabled = true;
      this.walkAction.setEffectiveTimeScale(1);
      this.walkAction.setEffectiveWeight(0);
    }

    if (this.runAction) {
      this.runAction.enabled = true;
      this.runAction.setEffectiveTimeScale(1);
      this.runAction.setEffectiveWeight(1);
    }

    this.actions = [this.idleAction, this.walkAction, this.runAction];
    this.actions.forEach((action) => {
      if (action) { action?.play(); }
    });
  }

  // 慢跑
  slow() {
    this.actionName = "slow";
    this.defaultAnimate = true;
    if (this.idleAction) {
      this.idleAction.enabled = true;
      this.idleAction.setEffectiveTimeScale(1);
      this.idleAction.setEffectiveWeight(0);
    }

    if (this.walkAction) {
      this.walkAction.enabled = true;
      this.walkAction.setEffectiveTimeScale(1);
      this.walkAction.setEffectiveWeight(0);
    }

    if (this.runAction) {
      this.runAction.enabled = true;
      this.runAction.setEffectiveTimeScale(0.5);
      this.runAction.setEffectiveWeight(1);
    }

    this.actions = [this.idleAction, this.walkAction, this.runAction];
    this.actions.forEach((action) => {
      if (action) { action?.play(); }
    });
  }
}

export default THREE;
