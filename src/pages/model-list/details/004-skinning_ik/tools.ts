
import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { CCDIKSolver, CCDIKHelper } from 'three/examples/jsm/animation/CCDIKSolver.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

interface iOOIType {
  head: THREE.Object3D,
  lowerarm_l: THREE.Object3D,
  Upperarm_l: THREE.Object3D,
  hand_l: THREE.Object3D,
  target_hand_l: THREE.Object3D,
  sphere: THREE.Object3D,
  kira: THREE.Object3D,
}

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.PerspectiveCamera
  private stats: null | Stats
  private orbitControls: null | OrbitControls
  private OOI: iOOIType | {[key: string]: any}
  private mirrorSphereCamera: null | THREE.CubeCamera
  private IKSolver: null | CCDIKSolver
  private v0: THREE.Vector3
  private conf: {[key: string]: any}
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.orbitControls = null;
    this.OOI = {
      head: new THREE.Object3D,
      lowerarm_l: new THREE.Object3D,
      Upperarm_l: new THREE.Object3D,
      hand_l: new THREE.Object3D,
      target_hand_l: new THREE.Object3D,
      sphere: new THREE.Object3D,
      kira: new THREE.Object3D,
    };
    this.mirrorSphereCamera = null;
    this.IKSolver = null;
    this.v0 = new THREE.Vector3();
    this.conf = {
      followSphere: true,
      turnHead: true,
      ik_solver: true,
    };
  }

  init() {
    // 创建一个场景
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xffffff, 0.17);
    this.scene.background = new THREE.Color(0xdddddd);

    // 创建一个透视相机，用来模拟人眼 是3D场景中使用的最普遍的投影模式
    this.camera = new THREE.PerspectiveCamera(88, this.width/this.height, 0.001, 5000);
    this.camera.position.set(0.9728517749133652, 1.1044765132727201, 0.7316689528482836);
    this.camera.lookAt(this.scene.position);

    // 创建环境光 soft white light
    // 环境光会均匀的照亮场景中的所有物体
    // 环境光不能用来投射阴影，因为它没有方向
    const ambientLight = new THREE.AmbientLight(0xffffff, 8);
    this.scene.add(ambientLight);

    // 创建一个渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // 将输出canvas的大小调整为(width, height)并考虑设备像素比
    this.renderer.setSize(this.width, this.height);
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    // 是否使用物理上正确的光照模式。 默认是false
    this.renderer.physicallyCorrectLights = true;
    // 一个canvas HTML对象，渲染器在其上绘制输出
    this.container.appendChild(this.renderer.domElement);

    // 创建统计信息 性能统计信息
    this.stats = Stats();
    // 输出的dom对象也可以使用domElement
    const dom = this.stats.dom;
    // 其position属性默认是fixed，根据需要可以设置为reletive | absolute | fixed
    dom.style.position = "absolute";
    this.container.appendChild(this.stats.dom);

    // 创建一个控制器
    // Orbit controls（轨道控制器）可以使得相机围绕目标进行轨道运动
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    // 启用或禁用摄像机平移，默认为true。
    this.orbitControls.enablePan = false;
    // 将其设置为true以启用阻尼（惯性），这将给控制器带来重量感。默认值为false
    // 请注意，如果该值被启用，你将必须在你的动画循环里调用.update()
    this.orbitControls.enableDamping = true;

    // 创建一个DRACOLoader 加载器 几何加载器
    const dRACOLoader = new DRACOLoader();
    // 包含JS和WASM解码器库的文件夹的路径。
    dRACOLoader.setDecoderPath("./examples/js/libs/draco/");
    
    // 创建一个GLTFLoader 加载器 用于载入glTF 2.0资源的加载器。
    const gltfLoader = new GLTFLoader();
    // dracoLoader — THREE.DRACOLoader的实例，用于解码使用KHR_draco_mesh_compression扩展压缩过的文件。
    gltfLoader.setDRACOLoader(dRACOLoader);
    // 加载数据模型
    gltfLoader.load("./examples/models/gltf/kira.glb", (gltf) => {
      gltf.scene.traverse((item) => {
        if (item.name === "head") { this.OOI["head"] = item }
        if (item.name === "lowerarm_l") { this.OOI["lowerarm_l"] = item }
        if (item.name === "Upperarm_l") { this.OOI["Upperarm_l"] = item }
        if (item.name === "hand_l") { this.OOI["hand_l"] = item }
        if (item.name === "target_hand_l") { this.OOI["target_hand_l"] = item }

        if (item.name === "boule") { this.OOI["sphere"] = item }
        if (item.name === "Kira_Shirt_left") { this.OOI["kira"] = item }

        // @ts-ignore
        if ( item?.isMesh ) { item.frustumCulled = false; }
      });
      
      // 添加到主场景中
      if (this.scene) { this.scene.add(gltf.scene); }
      // 调整相机视角，看相球体
      if (this.orbitControls && this.OOI.sphere) {
        this.orbitControls?.target.copy(this.OOI.sphere.position);
      }
      // 将sphere作为子级来添加到该对象中，同时保持该object的世界变换。
      this.OOI.hand_l.attach(this.OOI.sphere);

      // mirror sphere cube-camera
      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
      // 创建6个渲染到WebGLCubeRenderTarget的摄像机。
      this.mirrorSphereCamera = new THREE.CubeCamera(0.05, 50, cubeRenderTarget);
      if (this.scene) { this.scene?.add(this.mirrorSphereCamera); }

      // 创建材质对象
      // envMap 环境贴图。默认值为null
      const mirrorSphereMaterial = new THREE.MeshBasicMaterial({envMap: cubeRenderTarget.texture});
      this.OOI.sphere.material = mirrorSphereMaterial;

      // 创建一个TransformControls 变换控制器
      // TransformControls 期望其所附加的3D对象是场景图的一部分。
      const transformControls = new TransformControls(
        this.camera as THREE.PerspectiveCamera, 
        this.renderer?.domElement
      );
      // 手柄UI（轴/平面）的大小。默认为1。
      transformControls.size = 0.75;
      // x轴手柄是否显示
      transformControls.showX = false;
      // 定义了在哪种坐标空间中进行变换。可能的值有"world" 和 "local"。默认为world。
      transformControls.space = "world";
      // 设置 应当变换的3D对象。
      transformControls.attach(this.OOI["target_hand_l"]);
      this.scene?.add(transformControls);

      this.OOI.kira.add( this.OOI.kira.skeleton.bones[0] );
			const iks = [
				{
					target: 22, // "target_hand_l"
					effector: 6, // "hand_l"
					links: [
						{
							index: 5, // "lowerarm_l"
							rotationMin: new THREE.Vector3( 1.2, - 1.8, - .4 ),
							rotationMax: new THREE.Vector3( 1.7, - 1.1, .3 )
						},
						{
							index: 4, // "Upperarm_l"
							rotationMin: new THREE.Vector3( 0.1, - 0.7, - 1.8 ),
							rotationMax: new THREE.Vector3( 1.1, 0, - 1.4 )
						},
					],
				}
			];
      // @ts-ignore
			this.IKSolver = new CCDIKSolver( this.OOI.kira, iks);
      // @ts-ignore
			const ccdikhelper = new CCDIKHelper( this.OOI.kira, iks, 0.01 );
			this.scene?.add(ccdikhelper);

      // 运行动画
      this.animate();
    });

    this.resize();
  }

  // 开启动画
  animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 设置球体可见
    if ( this.OOI.sphere && this.mirrorSphereCamera && this.renderer && this.scene) {
      // 可见性。这个值为true时，物体将被渲染。默认值为true。
      this.OOI.sphere.visible = false;
      // position — 结果将被复制到这个Vector3中。
      this.OOI.sphere.getWorldPosition( this.mirrorSphereCamera.position );
      // 更新渲染场景
      this.mirrorSphereCamera.update(this.renderer, this.scene );
      // 可见性。这个值为true时，物体将被渲染。默认值为true。
      this.OOI.sphere.visible = true;
    }

    if (this.OOI.sphere && this.conf.followSphere && this.v0 && this.orbitControls) {
      this.OOI.sphere.getWorldPosition(this.v0);
      // 线性差值
      this.orbitControls.target.lerp(this.v0, 0.1);
    }

    if ( this.OOI.head && this.OOI.sphere && this.conf.turnHead ) {
      this.OOI.sphere.getWorldPosition(this.v0);
      this.OOI.head.lookAt(this.v0);
      this.OOI.head.rotation.set(
        this.OOI.head.rotation.x,
        this.OOI.head.rotation.y + Math.PI, 
        this.OOI.head.rotation.z
      );
    }

    if (this.IKSolver && this.conf.ik_solver) { 
      this.IKSolver.update(); 
    }

    // 更细性能监控
    if (this.stats) {
      this.stats?.update();
    }

    // 控制更新
    if (this.orbitControls) {
      this.orbitControls.update();
    }

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
