import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

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
  private mixers: THREE.AnimationMixer[]
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
    this.mixers = [];
  }

  init(fn?: (val: number) => void) {
    // 创建一个透视相机 模拟人眼
    this.camera = new THREE.PerspectiveCamera(80, this.width/this.height, 1, 1000);
    // 设置相机的位置
    this.camera.position.set(2, 3, - 6);
    // 设置相机看向的位置
    this.camera.lookAt(0, 1, 0);

    // 创建一个时钟
    this.clock = new THREE.Clock();
    // 创建一个场景
    this.scene = new THREE.Scene();
    // 设置场景的背景颜色
    this.scene.background = new THREE.Color(0xa0a0a0);
    // 设置场景的雾气
    this.scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

    // 创建一个半球光 漫散射光
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    // 设置光的位置
    hemiLight.position.set(0, 20, 0);
    // 添加到场景中
    this.scene.add(hemiLight);

    // 创建一个平行光
    const dirLight = new THREE.DirectionalLight(0xffffff);
    // 设置平行光的光源位置
    dirLight.position.set(- 3, 10, - 10);
    // 设置平行光允许出现阴影
    dirLight.castShadow = true;
    // 设置阴影相机的位置
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -4;
    dirLight.shadow.camera.left = - 4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    // 将平行光添加到场景中
    this.scene.add(dirLight);

    // 创建一个网格模型
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshPhongMaterial({color: 0x999999, depthWrite: false})
    );
    // 调整物体的旋转弧度
    mesh.rotation.x = -(Math.PI / 2);
    // 材质是否接受阴影
    mesh.receiveShadow = true;
    // 将网格模型添加到场景中去
    this.scene.add(mesh);

    // 加载动画模型
    const loader = new GLTFLoader();
    loader.load("./examples/models/gltf/Soldier.glb", (gltf) => {
      gltf.scene.traverse((item) => {
        // @ts-ignore
        if (item.isMesh) { item.castShadow = true; }
      });

      // 克隆动画模型
      // 克隆给定对象及其后代，确保任何 SkinnedMesh 实例都与其骨骼正确关联
      const model1 = SkeletonUtils.clone(gltf.scene);
      const model2 = SkeletonUtils.clone(gltf.scene);
      const model3 = SkeletonUtils.clone(gltf.scene);

      // 创建动画混合器
      // 返回所传入的剪辑参数的AnimationAction, 根对象参数可选，
      // 默认值为混合器的默认根对象。第一个参数可以是动画剪辑(AnimationClip)对象或者动画剪辑的名称。
      const mixer1 = new THREE.AnimationMixer(model1);
      const mixer2 = new THREE.AnimationMixer(model2);
      const mixer3 = new THREE.AnimationMixer(model3);

      // idle
      mixer1.clipAction(gltf.animations[0]).play();
      // walk
      mixer2.clipAction(gltf.animations[1]).play();
      // run
      mixer3.clipAction(gltf.animations[3]).play();

      model1.position.x = -2;
      model2.position.x = 0;
      model3.position.x = 2;

      this.scene?.add(model1, model2, model3);
      this.mixers.push(mixer1, mixer2, mixer3);
    }, ({ loaded, total }) => {
      this.process = Number(((loaded/total) * 100).toFixed(2));
      fn && fn(this.process);
    }, (e) => {
      console.log(e);
    });

    // 创建一个渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 创建统计信息
    this.stats = Stats();
    const dom = this.stats.dom;
    dom.style.position = "absolute";
    this.container.appendChild(dom);

    // 创建一个控制器 允许鼠标控制场景
    this.control = new OrbitControls(this.camera, this.renderer.domElement);
    this.control.enablePan = false;
    this.control.enableDamping = true;
    this.control.enableZoom = true;

    this.animate();
    this.resize();
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
    if (this.mixers && this.clock) {
      const delta = this.clock.getDelta();
      this.mixers.forEach((mixer) => { mixer.update(delta); });
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

