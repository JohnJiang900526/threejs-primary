import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private controls: null | TrackballControls
  private effect: null | AsciiEffect
  private sphere: null | THREE.Mesh
  private plane: null | THREE.Mesh
  private start: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.controls = null;
    this.effect = null;
    this.sphere = null;
    this.plane = null;
    this.start = Date.now();
  }

  // 初始化方法入口
  init() {
    // 初始化相机
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 1, 1000);
    this.camera.position.y = 150;
    this.camera.position.z = 500;

    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0, 0, 0);

    // 创建两束光
    const pointLight1 = new THREE.PointLight(0xffffff);
    const pointLight2 = new THREE.PointLight(0xffffff, 0.25);
    pointLight1.position.set(500, 500, 500);
    pointLight2.position.set(-500, -500, -500);
    this.scene.add(pointLight1);
    this.scene.add(pointLight2);

    // 创建一个球体
    this.sphere = new THREE.Mesh(
      new THREE.SphereGeometry(200, 20, 10),
      // .flatShading : Boolean
      // 定义材质是否使用平面着色进行渲染。默认值为false
      new THREE.MeshPhongMaterial({flatShading: true})
    );
    this.scene.add(this.sphere);

    // 创建一个平面
    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshBasicMaterial({color: 0xe0e0e0}) 
    );
    this.plane.position.y = -200;
    // 旋转
    this.plane.rotation.x = (-Math.PI / 2);
    this.scene.add(this.plane);

    // 创建一个渲染器和effect
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // effect
    // .invert 倒置
    this.effect = new AsciiEffect(this.renderer, ' .:-+*=%@#', {invert: true});
    this.effect.setSize(this.width, this.height);
    this.effect.domElement.style.color = 'white';
    this.container.appendChild(this.effect.domElement);

    // 创建一个控制器 轨迹球控制器（TrackballControls）
    // TrackballControls 与 OrbitControls 相类似。然而，它不能恒定保持摄像机的up向量。 
    // 这意味着，如果摄像机绕过“北极”和“南极”，则不会翻转以保持“右侧朝上”
    this.controls = new TrackballControls(this.camera, this.effect.domElement);

    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
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

  // 开启动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    const timer = (Date.now() - this.start);
    (this.sphere as THREE.Mesh).position.y = Math.abs(Math.sin(timer * 0.002)) * 150;
    (this.sphere as THREE.Mesh).rotation.x = timer * 0.0003;
    (this.sphere as THREE.Mesh).rotation.z = timer * 0.0002;

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 控制器
    if (this.controls) { this.controls.update(); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.effect?.render(this.scene, this.camera);
    }
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

      if (this.renderer && this.effect) {
        this.renderer.setSize(this.width, this.height);
        this.effect.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

