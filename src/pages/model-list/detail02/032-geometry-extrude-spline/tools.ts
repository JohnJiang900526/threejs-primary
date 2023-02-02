import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as Curves from 'three/examples/jsm/curves/CurveExtras';

export interface Iparams {
  spline: "GrannyKnot" | "HeartCurve" | "VivianiCurve" | "KnotCurve" | "HelixCurve" | "TrefoilKnot" | "TorusKnot" | "CinquefoilKnot" | "TrefoilPolynomialKnot" | "FigureEightPolynomialKnot" | "DecoratedTorusKnot4a" | "DecoratedTorusKnot4b" | "DecoratedTorusKnot5a" | "DecoratedTorusKnot5c" | "PipeSpline" | "SampleClosedSpline",
  scale: number,
  extrusionSegments: number,
  radiusSegments: number,
  closed: boolean,
  animationView: boolean,
  lookAhead: boolean,
  cameraHelper: boolean,
}

interface Isplines {
  GrannyKnot: Curves.GrannyKnot,
  HeartCurve: Curves.HeartCurve,
  VivianiCurve: Curves.VivianiCurve,
  KnotCurve: Curves.KnotCurve,
  HelixCurve: Curves.HelixCurve,
  TrefoilKnot: Curves.TrefoilKnot,
  TorusKnot: Curves.TorusKnot,
  CinquefoilKnot: Curves.CinquefoilKnot,
  TrefoilPolynomialKnot: Curves.TrefoilPolynomialKnot,
  FigureEightPolynomialKnot: Curves.FigureEightPolynomialKnot,
  DecoratedTorusKnot4a: Curves.DecoratedTorusKnot4a,
  DecoratedTorusKnot4b: Curves.DecoratedTorusKnot4b,
  DecoratedTorusKnot5a: Curves.DecoratedTorusKnot5a,
  DecoratedTorusKnot5c: Curves.DecoratedTorusKnot5c,
  PipeSpline: THREE.CatmullRomCurve3,
  SampleClosedSpline: THREE.CatmullRomCurve3
}

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private splineCamera: null | THREE.PerspectiveCamera;
  private cameraHelper: null | THREE.CameraHelper
  private cameraEye: null | THREE.Mesh
  private controls: null | OrbitControls
  private direction: THREE.Vector3
  private binormal: THREE.Vector3
  private normal: THREE.Vector3
  private position: THREE.Vector3
  private lookAt: THREE.Vector3
  private parent: THREE.Object3D
  private tubeGeometry: null | THREE.TubeGeometry
  private mesh: null | THREE.Mesh
  private stats: null | Stats;
  private params: Iparams
  private pipeSpline: THREE.CatmullRomCurve3
  private sampleClosedSpline: THREE.CatmullRomCurve3
  private splines: Isplines

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.splineCamera = null;
    this.cameraHelper = null;
    this.cameraEye = null;
    this.controls = null;
    this.stats = null;
    this.direction = new THREE.Vector3();
    this.binormal = new THREE.Vector3();
    this.normal = new THREE.Vector3();
    this.position = new THREE.Vector3();
    this.lookAt = new THREE.Vector3();
    this.parent = new THREE.Object3D();
    this.tubeGeometry = null;
    this.mesh = null;
    this.params = {
      spline: 'GrannyKnot',
      scale: 4,
      extrusionSegments: 100,
      radiusSegments: 3,
      closed: true,
      animationView: false,
      lookAhead: false,
      cameraHelper: false,
    };

    this.pipeSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 10, -10), new THREE.Vector3(10, 0, -10),
      new THREE.Vector3(20, 0, 0), new THREE.Vector3(30, 0, 10),
      new THREE.Vector3(30, 0, 20), new THREE.Vector3(20, 0, 30),
      new THREE.Vector3(10, 0, 30), new THREE.Vector3(0, 0, 30),
      new THREE.Vector3(-10, 10, 30), new THREE.Vector3(-10, 20, 30),
      new THREE.Vector3(0, 30, 30), new THREE.Vector3(10, 30, 30),
      new THREE.Vector3(20, 30, 15), new THREE.Vector3(10, 30, 10),
      new THREE.Vector3(0, 30, 10), new THREE.Vector3(-10, 20, 10),
      new THREE.Vector3(-10, 10, 10), new THREE.Vector3(0, 0, 10),
      new THREE.Vector3(10, -10, 10), new THREE.Vector3(20, -15, 10),
      new THREE.Vector3(30, -15, 10), new THREE.Vector3(40, -15, 10),
      new THREE.Vector3(50, -15, 10), new THREE.Vector3(60, 0, 10),
      new THREE.Vector3(70, 0, 0), new THREE.Vector3(80, 0, 0),
      new THREE.Vector3(90, 0, 0), new THREE.Vector3(100, 0, 0)
    ]);

    this.sampleClosedSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -40, -40),
      new THREE.Vector3(0, 40, -40),
      new THREE.Vector3(0, 140, -40),
      new THREE.Vector3(0, 40, 40),
      new THREE.Vector3(0, -40, 40),
    ], true, "catmullrom");

    this.splines = {
      GrannyKnot: new Curves.GrannyKnot(),
      HeartCurve: new Curves.HeartCurve(3.5),
      VivianiCurve: new Curves.VivianiCurve(70),
      KnotCurve: new Curves.KnotCurve(),
      HelixCurve: new Curves.HelixCurve(),
      TrefoilKnot: new Curves.TrefoilKnot(),
      TorusKnot: new Curves.TorusKnot(20),
      CinquefoilKnot: new Curves.CinquefoilKnot(20),
      TrefoilPolynomialKnot: new Curves.TrefoilPolynomialKnot(14),
      FigureEightPolynomialKnot: new Curves.FigureEightPolynomialKnot(),
      DecoratedTorusKnot4a: new Curves.DecoratedTorusKnot4a(),
      DecoratedTorusKnot4b: new Curves.DecoratedTorusKnot4b(),
      DecoratedTorusKnot5a: new Curves.DecoratedTorusKnot5a(),
      DecoratedTorusKnot5c: new Curves.DecoratedTorusKnot5c(),
      PipeSpline: this.pipeSpline,
      SampleClosedSpline: this.sampleClosedSpline
    };
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    // 关键一步，否则模型不显示
    this.scene.add(this.parent);

    // 创建直线光源
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0, 1);
    this.scene.add(light);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 0.01, 10000);
    this.camera.position.set(0, 50, 500);

    // 创建样条曲线相机
    this.splineCamera = new THREE.PerspectiveCamera(100, this.width/this.height, 0.01, 10000);
    this.parent.add(this.splineCamera);

    // 创建相机帮助
    this.cameraHelper = new THREE.CameraHelper(this.splineCamera);
    this.cameraHelper.visible = this.params.cameraHelper;
    this.scene.add(this.cameraHelper);

    // 创建cameraEye
    this.cameraEye = new THREE.Mesh(new THREE.SphereGeometry(5), new THREE.MeshBasicMaterial({color: 0xdddddd}));
    this.cameraEye.visible = this.params.cameraHelper;
    this.parent.add(this.cameraEye);

    // 创建管状模型
    this.addTube();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 100;
    this.controls.maxDistance = 2000;

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

  // 创建管状模型
  addTube(obj?: any) {
    this.params = Object.assign(this.params, obj);
    if (this.mesh) {
      this.parent.remove(this.mesh);
      this.mesh.geometry.dispose();
    }

    const { spline, extrusionSegments, radiusSegments, closed } = this.params;
    const path = this.splines[spline];

    this.tubeGeometry = new THREE.TubeGeometry(path, extrusionSegments, 2, radiusSegments, closed);
    this.addGeometry(this.tubeGeometry);
    this.setScale();
  }

  // 添加几何体
  private addGeometry(geometry: THREE.TubeGeometry) {
    const material = new THREE.MeshLambertMaterial({color: 0xff00ff});
    const wireframeMaterial = new THREE.MeshBasicMaterial({color: 0x000000, opacity: 0.3, wireframe: true, transparent: true});
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.add(new THREE.Mesh(geometry, wireframeMaterial));
    this.parent.add(this.mesh);
  }

  // 设置缩放
  setScale(obj?: any) {
    this.params = Object.assign(this.params, obj);
    if (this.mesh) {
      const { scale } = this.params;
      this.mesh.scale.set(scale, scale, scale);
    }
  }

  // 设置相机动画
  animateCamera(obj?: any) {
    this.params = Object.assign(this.params, obj);
    if (this.cameraHelper && this.cameraEye) {
      this.cameraHelper.visible = this.params.cameraHelper;
      this.cameraEye.visible = this.params.cameraHelper;
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    const time = Date.now();
    const looptime = 20 * 1000;
    const t = ( time % looptime ) / looptime;

    if (this.tubeGeometry && this.splineCamera && this.cameraEye && this.cameraHelper) {
      this.tubeGeometry.parameters.path.getPointAt(t, this.position);
      this.position.multiplyScalar(this.params.scale);
  
      const segments = this.tubeGeometry.tangents.length;
      const pickt = t * segments;
      const pick = Math.floor( pickt );
      const pickNext = ( pick + 1 ) % segments;
  
      this.binormal.subVectors( this.tubeGeometry.binormals[ pickNext ], this.tubeGeometry.binormals[ pick ] );
      this.binormal.multiplyScalar( pickt - pick ).add( this.tubeGeometry.binormals[ pick ] );
      this.tubeGeometry.parameters.path.getTangentAt( t, this.direction );
      this.normal.copy( this.binormal ).cross( this.direction );

      const offset = 15;
      this.position.add( this.normal.clone().multiplyScalar( offset ) );
      this.splineCamera.position.copy( this.position );
      this.cameraEye.position.copy( this.position );
      this.tubeGeometry.parameters.path.getPointAt( ( t + 30 / this.tubeGeometry.parameters.path.getLength() ) % 1, this.lookAt );
      this.lookAt.multiplyScalar( this.params.scale );

      if ( ! this.params.lookAhead ) {
        this.lookAt.copy( this.position ).add( this.direction )
      }
      this.splineCamera.matrix.lookAt( this.splineCamera.position, this.lookAt, this.normal );
      this.splineCamera.quaternion.setFromRotationMatrix( this.splineCamera.matrix );

      this.cameraHelper.update();
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 控制器更新
    if (this.controls) {this.controls.update()}

    // 执行渲染
    if (this.scene && this.camera && this.renderer && this.splineCamera) {
      const camera = this.params.animationView?this.splineCamera: this.camera
      this.renderer.render(this.scene, camera);
    }
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);
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
    };
  }
}

export default THREE;

