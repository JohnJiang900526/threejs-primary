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
  private clock: null | THREE.Clock
  private process: number
  private model: null | THREE.Group
  private stats: null | Stats
  private control: null | OrbitControls
  private mixer: null | THREE.AnimationMixer
  private animations: {[key: string]: THREE.AnimationAction}
  private currentAction: null | THREE.AnimationAction
  private prevAction: null | THREE.AnimationAction
  private states: string[]
  private emotes: string[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.clock = null;
    this.process = 0;
    this.model = null;
    this.stats = null;
    this.control = null;
    this.mixer = null;
    // 动画集合对象
    this.animations = {};
    // 之前的执行动画
    this.prevAction = null;
    // 当前执行动画
    this.currentAction = null;
    // 状态
    this.states = ['Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing'];
    // 表情
    this.emotes = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp'];
  }

  init(fn?: (val: number) => void) {
    // 创建一个透视相机 用来模拟人眼
    // 请注意，在大多数属性发生改变之后，你将需要调用.updateProjectionMatrix来使得这些改变生效。
    this.camera = new THREE.PerspectiveCamera(80, this.width/this.height, 0.25, 100);
    // 相机的位置
    this.camera.position.set(- 5, 5, 10);
    // 相机看向的焦点
    this.camera.lookAt(0, 2, 0);

    // 创建一个场景
    this.scene = new THREE.Scene();
    // 背景颜色
    this.scene.background = new THREE.Color(0xe0e0e0);
    // 雾气
    this.scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

    // 创建一个时钟
    this.clock = new THREE.Clock();

    // 光线场景
    // 创建半球光 光源直接放置于场景之上，光照颜色从天空光线颜色渐变到地面光线颜色 半球光没有投影
    const hemisLight = new THREE.HemisphereLight(0xffffff, 0x666666);
    hemisLight.position.set(0, 20, 0);
    this.scene.add(hemisLight);

    // 创建一个平行光
    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(0, 20, 10);
    this.scene.add(dirLight);

    // 创建一个网格模型 多边形网格
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1000, 1000),
      // 一种用于具有镜面高光的光泽表面的材质。
      // depthWrite 渲染此材质是否对深度缓冲区有任何影响。默认为true
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    mesh.rotation.x = -(Math.PI / 2);
    this.scene.add(mesh);

    // 创建一个坐标辅助对象 坐标格辅助对象. 坐标格实际上是2维线数组.
    const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    // @ts-ignore
    grid.material.opacity = 0.2;
    // @ts-ignore
    grid.material.transparent = true;
    this.scene.add(grid);

    // 创建一个模型加载器 加载几何模型
    const loader = new GLTFLoader();
    loader.load("./examples/models/gltf/RobotExpressive/RobotExpressive.glb", (gltf) => {
      const animations = gltf.animations;
      this.model = gltf.scene;
      this.mixer = new THREE.AnimationMixer(this.model);
      
      this.scene?.add(this.model);
      animations.forEach((item) => {
        if (this.mixer?.clipAction) {
          const action = this.mixer?.clipAction(item);

          if (this.states.indexOf(item.name) >= 4 || this.emotes.indexOf(item.name) >= 0) {
            action.clampWhenFinished = true;
            action.loop = THREE.LoopOnce;
          }

          this.animations[item.name] = action as THREE.AnimationAction;
        }
      });

      // 设置当前动作
      this.currentAction = this.animations["Walking"];
      this.currentAction.play();
    }, ({ loaded, total }) => {
      this.process = (loaded / total);

      fn && fn(this.process);
    }, (e) => {
      console.log(e);
    });

    // 创建一个渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    // 创建一个控制器 控制器可以让模型旋转
    this.control = new OrbitControls(this.camera, this.renderer.domElement);
    // 启用或禁用摄像机平移，默认为true。
    this.control.enablePan = false;
    // 将其设置为true以启用阻尼（惯性），这将给控制器带来重量感。默认值为false
    // 请注意，如果该值被启用，你将必须在你的动画循环里调用.update()
    this.control.enableDamping = true;

    // 创建一个性能统计器
    this.stats = Stats();
    const dom = this.stats.dom;
    dom.style.position = "absolute";
    this.container.appendChild(dom);

    this.animate();
    this.resize();
  }

  // 状态操作
  stateAction(key: string, duration: number = 0.5) {
    const action = this.animations[key];
    if (action) {
      if (this.currentAction !== action) {
        if (this.currentAction) {
          this.currentAction.fadeOut(duration);
          this.prevAction = this.currentAction;
        }
      }

      this.currentAction = action;
      this.currentAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();
    }
  }

  // 表情操作
  emoteAction(key: string, duration: number = 0.5) {
    this.stateAction(key, duration);

    // 存储状态
    const restoreState = () => {
      if (this.mixer) {
        this.mixer.removeEventListener("finished", restoreState);
        if (this.prevAction) {
          // @ts-ignore
          const key = this.prevAction._clip.name;
          this.stateAction(key, duration);
        }
      }
    };

    if (this.mixer) {
      this.mixer.addEventListener("finished", restoreState);
    }
  }

  // 开启动画
  animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });
    
    // 统计信息更新
    if (this.stats) {
      this.stats.update();
    }
    
    // 混合器需要更新 否则动画不执行
    if (this.mixer && this.clock) {
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
    }

    // 控制器跟随更新
    if (this.control) {
      this.control.update();
    }

    // 渲染器同步渲染
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
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width/this.height;
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

