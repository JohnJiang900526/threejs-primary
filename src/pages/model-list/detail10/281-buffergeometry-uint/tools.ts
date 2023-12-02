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
  private mesh: THREE.Mesh;
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
    this.mesh = new THREE.Mesh();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 3500);
    this.camera.position.z = 2750;

    // 灯光
    this.generateLight();
    // 模型
    this.generateModel();
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

  private generateLight() {
    const light1 = new THREE.AmbientLight(0x444444);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(1, 1, 1);

    const light3 = new THREE.DirectionalLight(0xffffff, 1.5);
    light3.position.set(0, - 1, 0);

    this.scene.add(light1, light2, light3);
  }

  private generateModel() {
    const triangles = 500000;
    const geometry = new THREE.BufferGeometry();

    const positions = [];
    const normals = [];
    const colors = [];

    const color = new THREE.Color();
    // 三角形在立方体中展开
    const n = 800, halfN = n / 2;
    // 单个三角形尺寸
    const d = 12, halfD = d / 2;

    const pA = new THREE.Vector3();
    const pB = new THREE.Vector3();
    const pC = new THREE.Vector3();

    const cb = new THREE.Vector3();
    const ab = new THREE.Vector3();
    for (let i = 0; i < triangles; i++) {
      // 位置
      const x = Math.random() * n - halfN;
      const y = Math.random() * n - halfN;
      const z = Math.random() * n - halfN;

      const ax = x + Math.random() * d - halfD;
      const ay = y + Math.random() * d - halfD;
      const az = z + Math.random() * d - halfD;

      const bx = x + Math.random() * d - halfD;
      const by = y + Math.random() * d - halfD;
      const bz = z + Math.random() * d - halfD;

      const cx = x + Math.random() * d - halfD;
      const cy = y + Math.random() * d - halfD;
      const cz = z + Math.random() * d - halfD;

      positions.push(ax, ay, az);
      positions.push(bx, by, bz);
      positions.push(cx, cy, cz);

      // 法线
      pA.set(ax, ay, az);
      pB.set(bx, by, bz);
      pC.set(cx, cy, cz);

      cb.subVectors(pC, pB);
      ab.subVectors(pA, pB);
      cb.cross(ab);
      cb.normalize();

      const nx = cb.x;
      const ny = cb.y;
      const nz = cb.z;

      normals.push(nx * 32767, ny * 32767, nz * 32767);
      normals.push(nx * 32767, ny * 32767, nz * 32767);
      normals.push(nx * 32767, ny * 32767, nz * 32767);

      // 颜色
      const vx = (x / n) + 0.5;
      const vy = (y / n) + 0.5;
      const vz = (z / n) + 0.5;
      color.setRGB(vx, vy, vz);
      colors.push(color.r * 255, color.g * 255, color.b * 255);
      colors.push(color.r * 255, color.g * 255, color.b * 255);
      colors.push(color.r * 255, color.g * 255, color.b * 255);
    }

    // 位置
    const positionAttr = new THREE.Float32BufferAttribute(positions, 3);
    geometry.setAttribute('position', positionAttr);
    // 法线
    const normalAttr = new THREE.Int16BufferAttribute(normals, 3);
    // 归一化
    // 将在着色器中将缓冲值映射为0.0f - +1.0f
    normalAttr.normalized = true;
    geometry.setAttribute('normal', normalAttr);
    // 颜色
    const colorAttr = new THREE.Uint8BufferAttribute(colors, 3);
    // 归一化
    // 将在着色器中将缓冲值映射为0.0f - +1.0f
    colorAttr.normalized = true;
    geometry.setAttribute('color', colorAttr);

    // 计算球形边缘
    geometry.computeBoundingSphere();

    const material = new THREE.MeshPhongMaterial({
      // 亮度
      shininess: 250,
      color: 0xaaaaaa, 
      // 镜面颜色
      specular: 0xffffff, 
      // 顶点着色
      vertexColors: true,
      side: THREE.DoubleSide, 
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      const timer = Date.now() * 0.001;
      this.mesh.rotation.x = timer * 0.25;
      this.mesh.rotation.y = timer * 0.50;
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

