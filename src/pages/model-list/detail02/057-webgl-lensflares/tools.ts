import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';

interface Iparams {
  h: number, 
  s: number, 
  l: number,
  x: number, 
  y: number, 
  z: number,
  texture1: THREE.Texture,
  texture2: THREE.Texture,
}

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private controls: null | FlyControls
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private clock: THREE.Clock
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.controls = null;
    this.camera = null;
    this.stats = null;
    this.clock = new THREE.Clock();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    // HSL 色彩模式
    this.scene.background = new THREE.Color().setHSL(0.51, 0.4, 0.01);
    this.scene.fog = new THREE.Fog(this.scene.background, 3500, 15000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(50, this.width/this.height, 1, 15000);
    this.camera.position.z = 250;

    // 添加光线
    const light = new THREE.DirectionalLight(0xffffff, 0.05);
    light.position.set(0, -1, 0).normalize();
    light.color.setHSL(0.1, 0.7, 0.5);
    this.scene.add(light);

    // 创建几何
    this.createGeometry();

    // 创建渲染器
    this.createRenderer();

    // 创建控制器 飞行控制器（FlyControls）
    // FlyControls 启用了一种类似于数字内容创建工具（例如Blender）中飞行模式的导航方式
    // 可以在3D空间中任意变换摄像机，并且无任何限制
    this.controls = new FlyControls(this.camera, this.renderer?.domElement);
    // 移动速度，默认为1
    this.controls.movementSpeed = 5;
    // 该 HTMLDOMElement 用于监听鼠标/触摸事件，该属性必须在构造函数中传入。在此处改变它将不会设置新的事件监听
    this.controls.domElement = this.container;
    // 旋转速度。默认为0.005
    this.controls.rollSpeed = Math.PI / 18;
    // 若该值设为true，初始变换后，摄像机将自动向前移动（且不会停止）。默认为false
    this.controls.autoForward = false;
    // 若该值设为true，你将只能通过执行拖拽交互来环视四周。默认为false
    this.controls.dragToLook = false;
    
    // 性能统计
    this.initStats();
    // 动画
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建几何体
  private createGeometry() {
    // 创建几何体
    const geometry = new THREE.BoxGeometry(250, 250, 250);
    // Phong网格材质(MeshPhongMaterial)
    // 一种用于具有镜面高光的光泽表面的材质
    const material = new THREE.MeshPhongMaterial({
      // 材质的颜色(Color)，默认值为白色 (0xffffff)
      color: 0xffffff,
      // 材质的高光颜色。默认值为0x111111（深灰色）的颜色Color
      // 定义了材质的光泽度和光泽的颜色
      specular: 0xffffff, 
      // .specular高亮的程度，越高的值越闪亮。默认值为 30
      shininess: 50
    });

    for (let i = 0; i < 3000; i++) {
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(
        8000 * (2.0 * Math.random() - 1.0),
        8000 * (2.0 * Math.random() - 1.0),
        8000 * (2.0 * Math.random() - 1.0),
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );

      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();

      this.scene.add(mesh);
    }

    // 创建光线
    const loader = new THREE.TextureLoader();
    const texture1 = loader.load('/examples/textures/lensflare/lensflare0.png');
    const texture2 = loader.load('/examples/textures/lensflare/lensflare3.png');

    this.addLight({
      h: 0.55, s: 0.9, l: 0.5,
      x: 5000, y: 0, z: -1000,
      texture1, texture2,
    });

    this.addLight({
      h: 0.08, s: 0.8, l: 0.5,
      x: 0, y: 0, z: -1000,
      texture1, texture2,
    });

    this.addLight({
      h: 0.995, s: 0.5, l: 0.9,
      x: 5000, y: 5000, z: -1000,
      texture1, texture2,
    });
  }

  // 添加光线
  private addLight(option: Iparams) {
    const { h, s, l, x, y, z, texture1, texture2 } = option;

    // 点光源（PointLight）
    // 从一个点向各个方向发射的光源。一个常见的例子是模拟一个灯泡发出的光
    const light = new THREE.PointLight(0xffffff, 1.5, 2000);
    light.color.setHSL(h, s, l);
    light.position.set(x, y, z);

    // 镜头光晕（Lensflare）
    // 创建一个模拟追踪着灯光的镜头光晕
    const lensflare = new Lensflare();

    // LensflareElement( texture : Texture, size : Float, distance : Float, color : Color )
    // texture - 用于光晕的THREE.Texture（贴图）
    // size - （可选）光晕尺寸（单位为像素）
    // distance - （可选）和光源的距离值在0到1之间（值为0时在光源的位置）
    // color - （可选）光晕的（Color）颜色
    lensflare.addElement(new LensflareElement(texture1, 700, 0, light.color));
    lensflare.addElement(new LensflareElement(texture2, 60, 0.6));
    lensflare.addElement(new LensflareElement(texture2, 70, 0.7));
    lensflare.addElement(new LensflareElement(texture2, 120, 0.9));
    lensflare.addElement(new LensflareElement(texture2, 70, 1));

    light.add(lensflare);
    this.scene.add(light);
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    // 控制器更新
    if (this.controls) { this.controls.update(this.clock.getDelta()); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
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

