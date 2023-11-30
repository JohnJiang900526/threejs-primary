import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;
  private clock: THREE.Clock;
  private line: null | THREE.Line;
  private segments: number;
  private radius: number;
  private timer: number;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.gui.hide();
    this.clock = new THREE.Clock();
    this.line = null;
    this.segments = 10000;
    this.radius = 800;
    this.timer = 0;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 4000);
    this.camera.position.z = 2750;

    // 模型
    this.generateMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 核心
  private generateMesh() {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ vertexColors: true });

    const positions = [];
    const colors = [];

    for (let i = 0; i < this.segments; i++) {
      const x = Math.random() * this.radius - this.radius / 2;
      const y = Math.random() * this.radius - this.radius / 2;
      const z = Math.random() * this.radius - this.radius / 2;

      // 位置
      positions.push(x, y, z);

      // 颜色
      colors.push((x / this.radius) + 0.5);
      colors.push((y / this.radius) + 0.5);
      colors.push((z / this.radius) + 0.5);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    this.generateMorphTargets(geometry);
    geometry.computeBoundingSphere();

    this.line = new THREE.Line(geometry, material);
    this.scene.add(this.line);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 核心
  private generateMorphTargets(geometry: THREE.BufferGeometry) {
    const data: number[] = [];

    for (let i = 0; i < this.segments; i++) {
      data.push(
        Math.random() * this.radius - this.radius / 2,
        Math.random() * this.radius - this.radius / 2,
        Math.random() * this.radius - this.radius / 2,
      );
    }

    const morphTarget = new THREE.Float32BufferAttribute(data, 3);
    morphTarget.name = 'target1';
    geometry.morphAttributes.position = [morphTarget];
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      if (this.line) {
        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        this.line.rotation.x = time * 0.25;
        this.line.rotation.y = time * 0.5;

        this.timer += delta * 0.5;
        this.line.morphTargetInfluences![0] = Math.abs(Math.sin(this.timer));
      }
    }

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
  }

  // 消除 副作用
  dispose() {
    window.cancelAnimationFrame(this.animateNumber);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

