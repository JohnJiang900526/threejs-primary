import * as THREE from 'three';
import { showLoadingToast } from "vant";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BVHLoader } from 'three/examples/jsm/loaders/BVHLoader';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private stats: null | Stats;

  private mixer: null | THREE.AnimationMixer
  private skeletonHelper: null | THREE.SkeletonHelper
  private clock: THREE.Clock
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;

    this.mixer = null;
    this.skeletonHelper = null;
    this.clock = new THREE.Clock();
  }

  // 初始化方法入口
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 1000);
    this.camera.position.set(0, 200, 300);

    // 模型加载
    this.loadModel();
    // 创建地板
    this.createFlooter();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 100;
    this.controls.maxDistance = 700;
    
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 加载模型
  private loadModel() {
    const loader = new BVHLoader();
    const url = "/examples/models/bvh/pirouette.bvh";

    const toast = showLoadingToast({
      message: '模型加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (result) => {
      toast.close();
      // 添加骨骼
      const bone = result.skeleton.bones[0];
      this.skeletonHelper = new THREE.SkeletonHelper(bone);
      // @ts-ignore
      this.skeletonHelper.skeleton = result.skeleton;
      this.scene.add(this.skeletonHelper);

      // 为骨骼添加容器
      const boneContainer = new THREE.Group();
      boneContainer.add(bone);
      this.scene.add(boneContainer);

      // 创建动画混合器 执行动画 AnimationMixer
      // 动画混合器是用于场景中特定对象的动画的播放器。当场景中的多个对象独立动画时，每个对象都可以使用同一个动画混合器
      // AnimationMixer( rootObject : Object3D )
      // rootObject - 混合器播放的动画所属的对象
      this.mixer = new THREE.AnimationMixer(this.skeletonHelper);
      // .clipAction (clip : AnimationClip, optionalRoot : Object3D) : AnimationAction
      // 返回所传入的剪辑参数的AnimationAction, 根对象参数可选，默认值为混合器的默认根对象
      // 第一个参数可以是动画剪辑(AnimationClip)对象或者动画剪辑的名称

      // .setEffectiveWeight ( weight : Number ) : this
      // 设置权重（weight）以及停止所有淡入淡出。该方法可以链式调用
      // .play () : this 让混合器激活动作。此方法可链式调用
      this.mixer.clipAction(result.clip).setEffectiveWeight(1.0).play();
    }, undefined, () => {
      toast.close();
    });
  }

  // 创建地板
  private createFlooter() {
    const helper = new THREE.GridHelper(400, 10);
    this.scene.add(helper);
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

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    if (this.mixer) { this.mixer.update(this.clock.getDelta()); }

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

