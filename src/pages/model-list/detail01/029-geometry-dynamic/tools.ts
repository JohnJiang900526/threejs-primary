import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | FirstPersonControls
  private geometry: null | THREE.PlaneGeometry
  private material: null | THREE.MeshBasicMaterial
  private clock: THREE.Clock
  private worldWidth: number
  private worldDepth: number
  private stats: null | Stats;
  private mesh: null | THREE.Mesh

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.geometry = null;
    this.material = null;
    this.clock = new THREE.Clock();
    this.worldWidth = 128;
    this.worldDepth  =128;
    this.stats = null;
    this.mesh = null;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xaaccff);
    this.scene.fog = new THREE.FogExp2(0xaaccff, 0.0007);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.width/this.height, 1, 20000);
    this.camera.position.y = 200;

    // 创建波纹 核心
    this.createWaterMesh();

    // 创建渲染器 
    // antialias - 平滑字体；反锯齿显示
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器 
    // 第一人称控制器（FirstPersonControls）该类是 FlyControls 的另一个实现
    this.controls = new FirstPersonControls(this.camera, this.renderer.domElement);
    this.controls.movementSpeed = 100;
    this.controls.lookSpeed = 0.1;

    // 执行动画
    this.animate();
    // 性能统计
    this.initStats();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建波纹 核心
  private createWaterMesh() {
    // 创建几何体
    this.geometry = new THREE.PlaneGeometry(20000, 20000, this.worldWidth - 1, this.worldDepth - 1);
    this.geometry.rotateX(-Math.PI / 2);
    // 设置位置属性
    const position = this.geometry.attributes.position;
    // @ts-ignore
    position.usage = THREE.DynamicDrawUsage;
    for (let i = 0; i < position.count; i++) {
      // .setY ( index : Integer, y : Float ) : this
      // 设置给定索引的矢量的第二维数据（设置 Y 值）
      position.setY(i, 35 * Math.sin(i / 2));
    }
    // 获取纹理
    const texture = new THREE.TextureLoader().load('/examples/textures/water.jpg');
    // 定义了纹理贴图在水平方向上将如何包裹，在UV映射中对应于U
    texture.wrapS = THREE.RepeatWrapping;
    // 定义了纹理贴图在垂直方向上将如何包裹，在UV映射中对应于V
    texture.wrapT = THREE.RepeatWrapping;
    // 设置该向量的x和y分量。
    texture.repeat.set(5, 5);
    // 创建材质
    this.material = new THREE.MeshBasicMaterial({color: 0x0044ff, map: texture});
    // 创建网格模型
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    (this.scene as THREE.Scene).add(this.mesh);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer && this.geometry && this.controls) {
      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime() * 10;

      const position = this.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        // .setY ( index : Integer, y : Float ) : this
        // 设置给定索引的矢量的第二维数据（设置 Y 值）
        position.setY(i, 35 * Math.sin(i / 5 + (time + i) / 7));
      }
      // 该标志位指明当前 attribute 已经被修改过，且需要再次送入 GPU 处理。
      // 当开发者改变了该队列的值，则标志位需要设置为 true
      position.needsUpdate = true;

      this.controls.update(delta);
      this.renderer.render(this.scene, this.camera);
    }
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

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }

      if (this.controls) {
        this.controls.handleResize();
      }
    };
  }
}

export default THREE;

