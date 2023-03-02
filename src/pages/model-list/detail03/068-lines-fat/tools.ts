import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
// @ts-ignore
import { GPUStatsPanel } from "@/common/examples/jsm/utils/GPUStatsPanel";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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

  // 设置线的类型
  setLineType(type: number = 0) {
    switch(type) {
      case 0:
        if (this.line && this.line1) {
          this.line.visible = true;
          this.line1.visible = false;
        }
        break;
      case 1:
        if (this.line && this.line1) {
          this.line.visible = false;
          this.line1.visible = true;
        }
        break;
    }
  }

  // 世界计量
  setWorldUnits(val: boolean) {
    if (this.matLine) {
      this.matLine.worldUnits = val;
      this.matLine.needsUpdate = true;
    }
  }

  // 设置线宽
  setLineWidth(width: number) {
    if (this.matLine) {
      this.matLine.linewidth = width;
    }
  }

  // 设置alphaToCoverage
  setAlphaToCoverage(val: boolean) {
    if (this.matLine) {
      this.matLine.alphaToCoverage = val;
    }
  }

  // 设置是否为虚线
  setLineDashed(dashed: boolean) {
    if (this.matLine && this.line1) {
      this.matLine.dashed = dashed;
      this.line1.material = dashed ? this.matLineDashed : this.matLineBasic;
    }
  }

  // 设置虚线缩放
  setDashScale(scale: number) {
    if (this.matLine) {
      this.matLine.dashScale = scale;
      this.matLineDashed.scale = scale;
    }
  }

  // 设置dash / gap比例
  setDashGap(val: 0 | 1 | 2) {
    switch (val) {
      case 0:
        this.matLine.dashSize = 2;
        this.matLine.gapSize = 1;

        this.matLineDashed.dashSize = 2;
        this.matLineDashed.gapSize = 1;
        break;
      case 1:
        this.matLine.dashSize = 1;
        this.matLine.gapSize = 1;

        this.matLineDashed.dashSize = 1;
        this.matLineDashed.gapSize = 1;
        break;
      case 2:
        this.matLine.dashSize = 1;
        this.matLine.gapSize = 2;

        this.matLineDashed.dashSize = 1;
        this.matLineDashed.gapSize = 2;
        break;
      default:
        this.matLine.dashSize = 2;
        this.matLine.gapSize = 1;

        this.matLineDashed.dashSize = 2;
        this.matLineDashed.gapSize = 1;
    }
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
    // 四舍五入 取整
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
      // 控制线宽。默认值为 1
      linewidth: 1,
      // 是否使用顶点着色。默认值为false
      vertexColors: true,
      // 是否为虚线
      dashed: false,
      // 启用alpha to coverage. 只能在开启了MSAA的渲染环境中使用 
      // (当渲染器创建的时候antialias 属性要true才能使用). 默认为 false
      alphaToCoverage: true,
    });

    this.line = new Line2(geometry, this.matLine);
    // 计算LineDashedMaterial所需的距离的值的数组。 
    // 对于几何体中的每一个顶点，这个方法计算出了当前点到线的起始点的累积长度
    this.line.computeLineDistances();
    this.line.scale.set(1, 1, 1);
    this.scene.add(this.line);

    // line1
    const geometry1 = new THREE.BufferGeometry();
    geometry1.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry1.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    this.matLineBasic = new THREE.LineBasicMaterial({ 
      vertexColors: true
    });
    this.matLineDashed = new THREE.LineDashedMaterial({ 
      vertexColors: true, 
      scale: 2, 
      dashSize: 1,
      gapSize: 1
    });

    this.line1 = new THREE.Line(geometry1, this.matLineBasic);
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
      // 非常重要
      this.gpuPanel = new GPUStatsPanel(this.renderer.getContext());
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
      // .setClearColor ( color : Color, alpha : Float ) : undefined
      // 设置颜色及其透明度
      this.renderer.setClearColor(0x000000, 0);
      // .setViewport ( x : Integer, y : Integer, width : Integer, height : Integer ) : undefined
      // 将视口大小设置为(x, y)到 (x + width, y + height).
      this.renderer.setViewport(0, 0, this.width, this.height);

      // 非常重要 否则CPU有飙升
      this.gpuPanel.startQuery();
      // 渲染器执行渲染
      this.renderer.render(this.scene, this.camera);
      // 非常重要 否则CPU有飙升
      this.gpuPanel.endQuery();

      this.renderer.setClearColor(0x222222, 1);
      // 清除深度缓存。相当于调用.clear( false, true, false )
      this.renderer.clearDepth(); // important!

      // .setScissorTest ( boolean : Boolean ) : undefined
      // 启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响
      // 开启剪裁检测
      this.renderer.setScissorTest(true);
      // .setScissor ( x : Integer, y : Integer, width : Integer, height : Integer ) : undefined
      // 将剪裁区域设为(x, y)到(x + width, y + height) 
      // 执行剪裁
      this.renderer.setScissor(20, 20, this.insetWidth, this.insetHeight);
      // 重新设置视口
      this.renderer.setViewport(20, 20, this.insetWidth, this.insetHeight);

      // 位置
      this.camera2.position.copy(this.camera.position);
      // 表示对象局部旋转的Quaternion（四元数）
      this.camera2.quaternion.copy(this.camera.quaternion);
      // 分辨率
      this.matLine.resolution.set(this.insetWidth, this.insetHeight);

      this.renderer.render(this.scene, this.camera2);
      // .setScissorTest ( boolean : Boolean ) : undefined
      // 启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响
      // 关闭剪裁检测
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

