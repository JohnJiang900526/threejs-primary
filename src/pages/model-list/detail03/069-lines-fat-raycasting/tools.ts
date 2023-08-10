import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
// @ts-ignore
import { GPUStatsPanel } from "@/common/examples/jsm/utils/GPUStatsPanel";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

type Imaterial = THREE.LineBasicMaterial | THREE.LineDashedMaterial

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
  private thresholdLine: Line2
  private segments: LineSegments2
  private thresholdSegments: LineSegments2
  private raycaster: THREE.Raycaster
  private sphereInter: THREE.Mesh
  private sphereOnLine: THREE.Mesh
  private matLine: LineMaterial
  private matThresholdLine: LineMaterial
  private gpuPanel: null | GPUStatsPanel
  private offset: number
  private insetWidth: number
  private insetHeight: number
  private pointer: THREE.Vector2

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.camera2 = null;
    this.stats = null;

    this.controls = null;
    this.line = null;
    this.thresholdLine = new Line2();
    this.segments = new LineSegments2();
    this.thresholdSegments = new LineSegments2();
    this.raycaster = new THREE.Raycaster();
    this.sphereInter = new THREE.Mesh();
    this.sphereOnLine = new THREE.Mesh();
    this.matLine = new LineMaterial()
    this.matThresholdLine = new LineMaterial();
    this.gpuPanel = null;
    this.offset = 3;

    if (this.isMobile()) {
      this.insetWidth = this.width/this.offset;
      this.insetHeight = this.width/this.offset;
    } else {
      this.insetWidth = this.height/this.offset;
      this.insetHeight = this.height/this.offset;
    }
    this.pointer = new THREE.Vector2(Infinity, Infinity);
  }

  // 初始化方法入口
  init() {
    // 创建渲染器
    this.createRenderer();

    // 创建场景
    this.scene = new THREE.Scene();

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 1000);
    this.camera.position.set(-60, 0, 60);

    this.camera2 = new THREE.PerspectiveCamera(40, 1, 1, 1000);
    this.camera2.position.copy(this.camera.position);

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement );
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;

    // 映射
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params = Object.assign(this.raycaster.params, {
      Line2: { threshold: 0 }
    });

    // 创建小球
    this.createSphere();

    // 创建模型
    this.createModel();

    this.bind();
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
        if (this.line) {
          this.line.visible = true;
          this.thresholdLine.visible = true;

          this.segments.visible = false;
          this.thresholdSegments.visible = false;
        }
        break;
      case 1:
        if (this.line) {
          this.line.visible = false;
          this.thresholdLine.visible = false;

          this.segments.visible = true;
          this.thresholdSegments.visible = true;
        }
        break;
      default:
        if (this.line) {
          this.line.visible = true;
          this.thresholdLine.visible = true;

          this.segments.visible = false;
          this.thresholdSegments.visible = false;
        }
    }
  }

  // 世界计量
  setWorldUnits(val: boolean) {
    if (this.matLine) {
      this.matLine.worldUnits = val;
      this.matLine.needsUpdate = true;
      this.matThresholdLine.worldUnits = val;
      this.matThresholdLine.needsUpdate = true;
    }
  }

  // 设置线宽
  setLineWidth(val: number) {
    this.matLine.linewidth = val;

    // @ts-ignore
    const width = this.matLine.linewidth + this.raycaster.params.Line2.threshold;
		this.matThresholdLine.linewidth = width
  }

  // 设置alphaToCoverage
  setAlphaToCoverage(val: boolean) {
    this.matLine.alphaToCoverage = val;
  }

  // 设置threshold
  setThreshold(val: number) {
    // @ts-ignore
    this.raycaster.params.Line2.threshold = val;

    // @ts-ignore
    const width = this.matLine.linewidth + this.raycaster.params.Line2.threshold;
		this.matThresholdLine.linewidth = width;
  }

  setVisualizeThreshold(val: boolean) {
    this.matThresholdLine.visible = val;
  }

  // 绑定事件
  private bind() {
    if (this.isMobile()) {
      this.container.onpointermove = null;
      this.container.ontouchmove = (event) => {
        const e = event.touches[0];

        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = -((e.clientY - 45) / this.height) * 2 + 1;
      };
    } else {
      this.container.ontouchmove = null;
      this.container.onpointermove = (e) => {
        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = -((e.clientY - 45) / this.height) * 2 + 1;
      };
    }
  }

  // 创建模型
  private createModel() {
    // positions and colors and points
    const positions = [];
    const colors = [];
    const points = [];
    for (let i = -50; i < 50; i++) {
      const t = i / 3;
      points.push(new THREE.Vector3(t * Math.sin(2 * t), t, t * Math.cos(2 * t)));
    }

    const spline = new THREE.CatmullRomCurve3(points);
    const divisions = Math.round(3 * points.length);
    const point = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0; i < divisions; i++) {
      const t = i / divisions;
      spline.getPoint(t, point);
      positions.push(point.x, point.y, point.z);

      color.setHSL(t, 1.0, 0.5);
      colors.push(color.r, color.g, color.b);
    }

    // material
    this.matLine = new LineMaterial({
      color: 0xffffff,
      linewidth: 1,
      worldUnits: true,
      vertexColors: true,
      alphaToCoverage: true,
    });
    this.matThresholdLine = new LineMaterial({
      color: 0xffffff,
      linewidth: this.matLine.linewidth,
      worldUnits: true,
      transparent: true,
      opacity: 0.2,
      depthTest: false,
      visible: false,
    });

    // segments 分段线
    (() => {
      const geometry = new LineSegmentsGeometry();
      geometry.setPositions(positions);
      geometry.setColors(colors);

      // 片段线
      this.segments = new LineSegments2(geometry, this.matLine);
      this.segments.computeLineDistances();
      this.segments.scale.set(1, 1, 1);
      this.scene.add(this.segments);
  
      // 阈值 片段线
      this.thresholdSegments = new LineSegments2(geometry, this.matThresholdLine);
      this.thresholdSegments.computeLineDistances();
      this.thresholdSegments.scale.set(1, 1, 1);
      this.scene.add(this.thresholdSegments);
    })();

    // line 实线
    (() => {
      const geometry = new LineGeometry();
      geometry.setPositions(positions);
      geometry.setColors(colors);

      this.line = new Line2(geometry, this.matLine);
      this.line.computeLineDistances();
      this.line.scale.set(1, 1, 1);
      this.line.visible = false;
      this.scene.add(this.line);

      this.thresholdLine = new Line2(geometry, this.matThresholdLine);
      this.thresholdLine.computeLineDistances();
      this.thresholdLine.scale.set(1, 1, 1);
      this.thresholdLine.visible = false;
      this.scene.add(this.thresholdLine);
    })();
  }

  // 创建小球
  private createSphere() {
    const geometry = new THREE.SphereGeometry( 0.25 );
    const sphereInterMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      depthTest: false 
    });
    const sphereOnLineMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00, 
      depthTest: false
    });

    this.sphereInter = new THREE.Mesh(geometry, sphereInterMaterial);
    this.sphereOnLine = new THREE.Mesh(geometry, sphereOnLineMaterial);
    this.sphereInter.visible = false;
    this.sphereOnLine.visible = false;
    this.sphereInter.renderOrder = 10;
    this.sphereOnLine.renderOrder = 10;
    this.scene.add(this.sphereInter);
    this.scene.add(this.sphereOnLine);
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
    this.stats = new Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
    this.container.appendChild(this.stats.domElement);

    if (this.renderer) {
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
    if (this.camera && this.camera2 && this.renderer && this.line && this.sphereInter && this.sphereOnLine && this.gpuPanel) {
      // .setClearColor ( color : Color, alpha : Float ) : undefined
      // 设置颜色及其透明度
      this.renderer.setClearColor(0x000000, 0);
      // .setViewport ( x : Integer, y : Integer, width : Integer, height : Integer ) : undefined
      // 将视口大小设置为(x, y)到 (x + width, y + height).
      this.renderer.setViewport(0, 0, this.width, this.height);
      // .setFromCamera ( coords : Vector2, camera : Camera ) : undefined
      // coords —— 在标准化设备坐标中鼠标的二维坐标 —— X分量与Y分量应当在-1到1之间。
      // camera —— 射线所来源的摄像机
      // 使用一个新的原点和方向来更新射线
      this.raycaster.setFromCamera(this.pointer, this.camera);

      // 分辨率
      this.matLine.resolution.set(this.width, this.height);
      this.matThresholdLine.resolution.set(this.width, this.height);

      const obj = this.line.visible ? this.line : this.segments;
			const intersects = this.raycaster.intersectObject(obj, true);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        // 控制两个小球的位置和颜色、显示与否
        this.sphereInter.visible = true;
        this.sphereOnLine.visible = true;
        this.sphereInter.position.copy(intersect.point);
        // @ts-ignore
        this.sphereOnLine.position.copy(intersect.pointOnLine);
        
        const index = intersect.faceIndex as number;
        const colors = obj.geometry.getAttribute('instanceColorStart') as THREE.BufferAttribute;
        const color = new THREE.Color().setRGB(
          colors.getX(index), 
          colors.getY(index), 
          colors.getZ(index),
        );

        (this.sphereInter.material as Imaterial).color.copy(
          color.clone().offsetHSL(0.3, 0, 0)
        );
        (this.sphereOnLine.material as Imaterial).color.copy(
          color.clone().offsetHSL(0.7, 0, 0)
        );
        this.renderer.domElement.style.cursor = 'crosshair';
      } else {
        this.sphereInter.visible = false;
        this.sphereOnLine.visible = false;
        this.renderer.domElement.style.cursor = '';
      }

      this.gpuPanel.startQuery();
      this.renderer.render(this.scene, this.camera);
      this.gpuPanel.endQuery();

      this.renderer.setClearColor(0x222222, 1);
      // // 清除深度缓存。相当于调用.clear( false, true, false )
      this.renderer.clearDepth(); // important!

      // .setScissorTest ( boolean : Boolean ) : undefined
      // 启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响
      // 开启剪裁检测
      this.renderer.setScissorTest(true);
      // .setScissor ( x : Integer, y : Integer, width : Integer, height : Integer ) : undefined
      // 将剪裁区域设为(x, y)到(x + width, y + height) 
      // 设置剪裁检测
      this.renderer.setScissor(20, 20, this.insetWidth, this.insetHeight);
      // 重新设置视口
      this.renderer.setViewport(20, 20, this.insetWidth, this.insetHeight);

      // 位置
      this.camera2.position.copy(this.camera.position);
      // 表示对象局部旋转的Quaternion（四元数）
      this.camera2.quaternion.copy(this.camera.quaternion);
      // 分标率
      this.matLine.resolution.set(this.insetWidth, this.insetHeight);
      // 重新执行渲染
      this.renderer.render(this.scene, this.camera2);
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
      this.bind();

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.isMobile()) {
        this.insetWidth = this.width/this.offset;
        this.insetHeight = this.width/this.offset;
      } else {
        this.insetWidth = this.height/this.offset;
        this.insetHeight = this.height/this.offset;
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

