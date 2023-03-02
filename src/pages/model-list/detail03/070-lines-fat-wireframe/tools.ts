import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { Wireframe } from 'three/examples/jsm/lines/Wireframe';
import { WireframeGeometry2 } from 'three/examples/jsm/lines/WireframeGeometry2';

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
  private wireframe: null | Wireframe
  private wireframe1: THREE.LineSegments
  private matLine: LineMaterial
  private matLineBasic: THREE.LineBasicMaterial
  private matLineDashed: THREE.LineDashedMaterial
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
    this.wireframe = null;
    this.wireframe1 = new THREE.LineSegments();
    this.matLine = new LineMaterial();
    this.matLineBasic = new THREE.LineBasicMaterial();
    this.matLineDashed = new THREE.LineDashedMaterial();
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

    this.camera2 = new THREE.PerspectiveCamera(30, 1, 1, 1000);
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
        if (this.wireframe && this.wireframe1) {
          this.wireframe.visible = true;
          this.wireframe1.visible = false;
        }
        break;
      case 1:
        if (this.wireframe && this.wireframe1) {
          this.wireframe.visible = false;
          this.wireframe1.visible = true;
        }
        break;
      default:
        if (this.wireframe && this.wireframe1) {
          this.wireframe.visible = true;
          this.wireframe1.visible = false;
        }
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
    if (this.matLine && this.wireframe1) {
      this.matLine.dashed = dashed;

      if (dashed) {
        this.matLine.defines.USE_DASH = '';
      } else {
        delete this.matLine.defines.USE_DASH;
      }
      this.matLine.needsUpdate = true;
      this.wireframe1.material = dashed ? this.matLineDashed : this.matLineBasic;
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
    // Wireframe 实线线框
    (() => {
      const primary = new THREE.IcosahedronGeometry(20, 1);
      const geometry = new WireframeGeometry2(primary);
      this.matLine = new LineMaterial({
        color: 0x4080ff,
        linewidth: 5,
        dashed: false
      });
  
      this.wireframe = new Wireframe(geometry, this.matLine);
      this.wireframe.computeLineDistances();
      this.wireframe.scale.set(1, 1, 1);
      this.scene.add(this.wireframe);
    })();

    // 虚线 线框
    (() => {
      const primary = new THREE.IcosahedronGeometry(20, 1);
      const geometry = new THREE.WireframeGeometry(primary);
      this.matLineBasic = new THREE.LineBasicMaterial({ 
        color: 0x4080ff 
      });
      this.matLineDashed = new THREE.LineDashedMaterial({ 
        scale: 2, 
        dashSize: 1,
        gapSize: 1
      });
  
      this.wireframe1 = new THREE.LineSegments(geometry, this.matLineBasic);
      this.wireframe1.computeLineDistances();
      this.wireframe1.visible = false;
      this.scene.add(this.wireframe1);
    })();
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
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); })

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.camera && this.renderer && this.camera2) {
      // .setClearColor ( color : Color, alpha : Float ) : undefined
      // 设置颜色及其透明度
      this.renderer.setClearColor(0x000000, 0);
      // .setViewport ( x : Integer, y : Integer, width : Integer, height : Integer ) : undefined
      // 将视口大小设置为(x, y)到 (x + width, y + height).
      this.renderer.setViewport(0, 0, this.width, this.height);
      // 分辨率
      this.matLine.resolution.set(this.width, this.height);
      this.renderer.render(this.scene, this.camera);

      // .setClearColor ( color : Color, alpha : Float ) : undefined
      // 设置颜色及其透明度
      this.renderer.setClearColor(0x222222, 1);
      // 清除深度缓存。相当于调用.clear( false, true, false )
      this.renderer.clearDepth(); // important!

      // .setScissorTest ( boolean : Boolean ) : undefined
      // 启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响
      // 开启剪裁检测
      this.renderer.setScissorTest(true);
      // 执行剪裁
      this.renderer.setScissor(20, 20, this.insetWidth, this.insetHeight);
      // .setViewport ( x : Integer, y : Integer, width : Integer, height : Integer ) : undefined
      // 将视口大小设置为(x, y)到 (x + width, y + height).
      this.renderer.setViewport(20, 20, this.insetWidth, this.insetHeight);

      // 位置
      this.camera2.position.copy(this.camera.position);
      // 表示对象局部旋转的Quaternion（四元数）
      this.camera2.quaternion.copy(this.camera.quaternion);
      // 分辨率
      this.matLine.resolution.set(this.insetWidth, this.insetHeight);
      // 根据当前视口进行绘制
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

