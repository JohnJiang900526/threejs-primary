import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | TrackballControls
  private stats: null | Stats;

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);
    this.scene.add(new THREE.AmbientLight(0x222222));

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(90, this.width/this.height, 0.1, 1000);
    this.camera.position.set(0, 0, 500);

    // 创建光源
    const light = new THREE.PointLight(0xffffff);
    light.position.copy(this.camera.position);
    this.scene.add(light);

    // 创建模型
    this.createShape();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new TrackballControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 200;
    this.controls.maxDistance = 500;

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

  // 创建模型
  private createShape() {
    // 1. 创建环形丝带 CatmullRomCurve3
    // 使用Catmull-Rom算法， 从一系列的点创建一条平滑的三维样条曲线
    const closedSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-60, -100, 60),
      new THREE.Vector3(-60, 20, 60),
      new THREE.Vector3(-60, 120, 60),
      new THREE.Vector3(60, 20, -60),
      new THREE.Vector3(60, -100, -60)
    ], true, "catmullrom");
    const pts1:THREE.Vector2[] = [];
    const count1 = 3;
    for (let i = 0; i < count1; i++) {
      const l = 20;
      const a = 2 * i / count1 * Math.PI;
      pts1.push(new THREE.Vector2(Math.cos(a) * l, Math.sin(a) * l));
    }
    // 形状（Shape）使用路径以及可选的孔洞来定义一个二维形状平面
    // 它可以和ExtrudeGeometry、ShapeGeometry一起使用，获取点，或者获取三角面
    const shape1 = new THREE.Shape(pts1);
    // 挤压缓冲几何体（ExtrudeGeometry）从一个形状路径中，挤压出一个BufferGeometry
    // steps — int，用于沿着挤出样条的深度细分的点的数量，默认值为1
    // bevelEnabled — bool，对挤出的形状应用是否斜角，默认值为true
    // extrudePath — THREE.Curve对象。一条沿着被挤出形状的三维样条线
    const geometry1 = new THREE.ExtrudeGeometry(shape1, {
      steps: 100,
      bevelEnabled: false,
      extrudePath: closedSpline
    });
    // Lambert网格材质(MeshLambertMaterial)
    // 一种非光泽表面的材质，没有镜面高光
    // .wireframe : Boolean 将几何体渲染为线框。默认值为false
    const material1 = new THREE.MeshLambertMaterial({color: 0xb00000, wireframe: false});
    const mesh1 = new THREE.Mesh(geometry1, material1);
    (this.scene as THREE.Scene).add(mesh1);

    // 2. 创建横向条形丝带
    const randomPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 10; i++) {
      const vector3 = new THREE.Vector3(
        (i - 4.5) * 50, 
        THREE.MathUtils.randFloat(-50, 50), 
        THREE.MathUtils.randFloat(-50, 50)
      );
      randomPoints.push(vector3);
    }
    const randomSpline = new THREE.CatmullRomCurve3(randomPoints);
    const pts2:THREE.Vector2[] = [];
    const count2 = 5;
    for (let i = 0; i < count2 * 2; i++) {
      const l = i % 2 == 1 ? 10 : 20;
      const a = i / count2 * Math.PI;
      pts2.push(new THREE.Vector2(Math.cos(a) * l, Math.sin(a) * l));
    }
    const shape2 = new THREE.Shape(pts2);
    const geometry2 = new THREE.ExtrudeGeometry(shape2, {
      steps: 200,
      bevelEnabled: false,
      extrudePath: randomSpline
    });
    const material2 = new THREE.MeshLambertMaterial({ color: 0xff8000, wireframe: false });
    const mesh2 = new THREE.Mesh(geometry2, material2);
    (this.scene as THREE.Scene).add(mesh2);

    // 3. 创建五角星
    const materials: THREE.MeshLambertMaterial[] = [material1, material2];
    const geometry3 = new THREE.ExtrudeGeometry(shape2, {
      // depth — float，挤出的形状的深度，默认值为1
      depth: 20,
      // steps — int，用于沿着挤出样条的深度细分的点的数量，默认值为1
      steps: 1,
      // bevelEnabled — bool，对挤出的形状应用是否斜角，默认值为true
      bevelEnabled: true,
      // bevelThickness — float，设置原始形状上斜角的厚度。默认值为0.2
      bevelThickness: 2,
      // bevelSize — float。斜角与原始形状轮廓之间的延伸距离，默认值为bevelThickness-0.1
      bevelSize: 4,
      // bevelSegments — int。斜角的分段层数，默认值为3
      bevelSegments: 3
    });
    const mesh3 = new THREE.Mesh(geometry3, materials);
    mesh3.position.set(50, 100, 50);
    (this.scene as THREE.Scene).add(mesh3);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 控制器更新
    if (this.controls) {this.controls.update()}

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
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

