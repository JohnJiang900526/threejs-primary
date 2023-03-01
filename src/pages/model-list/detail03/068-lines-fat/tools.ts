import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
// @ts-ignore
import { GPUStatsPanel } from "@/common/examples/jsm/utils/GPUStatsPanel";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private camera2: null | THREE.PerspectiveCamera
  private controls: null | OrbitControls
  private line: null | Line2
  private line1: THREE.Line
  private matLine: LineMaterial
  private matLineBasic: THREE.LineBasicMaterial
  private matLineDashed: THREE.LineDashedMaterial
  private gpuPanel: null | GPUStatsPanel
  private insetWidth: number
  private insetHeight: number
  private offset: number

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.camera2 = null;
    this.controls = null;
    this.line = null;
    this.line1 = new THREE.Line();
    this.matLine = new LineMaterial();
    this.matLineBasic = new THREE.LineBasicMaterial();
    this.matLineDashed = new THREE.LineDashedMaterial();
    this.gpuPanel = null;
    this.offset = 3;

    if (this.isMobile()) {
      this.insetWidth = this.width/this.offset;
      this.insetHeight = this.width/this.offset;
    } else {
      this.insetWidth = this.height/this.offset;
      this.insetHeight = this.height/this.offset;
    }
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 1000);
    this.camera.position.set(-60, 0, 60);

    this.camera2 = new THREE.PerspectiveCamera(60, 1, 1, 1000);
    this.camera2.position.copy(this.camera.position);

    // 创建渲染器
    this.createRenderer();

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;

    // 创建模型
    this.createModel();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建模型
  private createModel() {
    // positions and colors
    const positions = [];
    const colors = [];

    const points = GeometryUtils.hilbert3D(
      new THREE.Vector3(0, 0, 0), 
      20.0, 1, 0, 1, 2, 3, 4, 5, 6, 7
    );

    const spline = new THREE.CatmullRomCurve3(points);
    const divisions = Math.round(12 * points.length);
    const point = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0; i < divisions; i++) {
      const t = i / divisions;
      spline.getPoint(t, point);
      positions.push(point.x, point.y, point.z);

      color.setHSL(t, 1.0, 0.5);
      colors.push(color.r, color.g, color.b);
    }

    // Line2
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);

    this.matLine = new LineMaterial({
      color: 0xffffff,
      linewidth: 1,
      vertexColors: true,
      dashed: false,
      alphaToCoverage: true,
    });

    this.line = new Line2(geometry, this.matLine);
    this.line.computeLineDistances();
    this.line.scale.set(1, 1, 1);
    this.scene.add(this.line);

    // line1
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    this.matLineBasic = new THREE.LineBasicMaterial({ 
      vertexColors: true
    });
    this.matLineDashed = new THREE.LineDashedMaterial({ 
      vertexColors: true, 
      scale: 2, 
      dashSize: 1, 
      gapSize: 1
    });

    this.line1 = new THREE.Line( geo, this.matLineBasic );
    this.line1.computeLineDistances();
    this.line1.visible = false;
    this.scene.add(this.line1);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 0.0);
    this.container.appendChild(this.renderer.domElement);
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);

    if (this.renderer) {
      this.gpuPanel = new GPUStatsPanel(this.renderer.getContext() );
      this.stats.addPanel(this.gpuPanel);
      this.stats.showPanel(0);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); })

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.camera && this.renderer && this.camera2 && this.gpuPanel) {
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.setViewport(0, 0, this.width, this.height);

      this.gpuPanel.startQuery();
      this.renderer.render(this.scene, this.camera);
      this.gpuPanel.endQuery();

      this.renderer.setClearColor(0x222222, 1);
      this.renderer.clearDepth(); // important!

      this.renderer.setScissorTest(true);
      this.renderer.setScissor(20, 20, this.insetWidth, this.insetHeight);
      this.renderer.setViewport(20, 20, this.insetWidth, this.insetHeight);

      this.camera2.position.copy(this.camera.position);
      this.camera2.quaternion.copy(this.camera.quaternion);
      this.matLine.resolution.set(this.insetWidth, this.insetHeight);

      this.renderer.render(this.scene, this.camera2);
      this.renderer.setScissorTest(false);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      if (this.isMobile()) {
        this.insetWidth = this.width/this.offset;
        this.insetHeight = this.width/this.offset;
      } else {
        this.insetWidth = this.height/this.offset;
        this.insetHeight = this.height/this.offset;
      }

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.camera2) {
        this.camera2.aspect = this.insetWidth/this.insetHeight;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera2.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

