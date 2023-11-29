import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GUI from 'lil-gui';

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
  private material: THREE.MeshPhongMaterial;
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
    this.mesh = new THREE.Mesh();
    this.material = new THREE.MeshPhongMaterial();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 3500);
    this.camera.position.z = 60;

    // 灯光
    this.generateLight();
    // 模型
    this.generateMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.setGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setGUI() {
    this.gui.add(this.material, "wireframe");
  }

  private generateLight() {
    const light = new THREE.HemisphereLight();
    this.scene.add(light);
  }

  // 核心
  private generateMesh() {
    const geometry = new THREE.BufferGeometry();

    // 索引
    const indices: number[] = [];
    // 顶点
    const vertices: number[] = [];
    // 法线
    const normals: number[] = [];
    // 颜色
    const colors: number[] = [];

    const size = 20;
    const segments = 10;
    const half = (size / 2);
    const segmentSize = (size / segments);

    for (let i = 0; i <= segments; i++) {
      const y = (i * segmentSize) - half;
      for (let j = 0; j <= segments; j++) {
        const x = (j * segmentSize) - half;
        // 顶点
        vertices.push(x, -y, 0);
        // 法线
        normals.push(0, 0, 1);
        // 颜色
        colors.push((x / size) + 0.5, (y / size) + 0.5, 1);
      }
    }

    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + (j + 1);
        const b = i * (segments + 1) + j;
        const c = (i + 1) * (segments + 1) + j;
        const d = (i + 1) * (segments + 1) + (j + 1);

        // face one 索引
        indices.push(a, b, d);
        // face two 索引
        indices.push(b, c, d);
      }
    }

    // 设置缓存的 .index。
    geometry.setIndex(indices);
    const verticesAttr = new THREE.Float32BufferAttribute(vertices, 3);
    geometry.setAttribute('position', verticesAttr);

    const normalsAttr = new THREE.Float32BufferAttribute(normals, 3);
    geometry.setAttribute('normal', normalsAttr);

    const colorsAttr = new THREE.Float32BufferAttribute(colors, 3);
    geometry.setAttribute('color', colorsAttr);

    this.material.dispose();
    this.material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    });

    (this.mesh.material as THREE.Material).dispose();
    this.mesh.geometry.dispose();
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
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

