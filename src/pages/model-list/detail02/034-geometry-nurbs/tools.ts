import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { NURBSCurve } from 'three/examples/jsm/curves/NURBSCurve';
import { NURBSSurface } from 'three/examples/jsm/curves/NURBSSurface';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats
  private group: THREE.Group
  private targetRotation: number
  private targetRotationOnPointerDown: number
  private pointerX: number
  private pointerXOnPointerDown: number
  private windowHalfX: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.group = new THREE.Group();
    this.targetRotation = 0;
    this.targetRotationOnPointerDown = 0;
    this.pointerX = 0;
    this.pointerXOnPointerDown = 0;
    this.windowHalfX = this.width/2;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.scene.add(new THREE.AmbientLight(0x808080));

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(120, this.width/this.height, 1, 2000);
    this.camera.position.set(0, 150, 750);

    // 创建光源
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    this.scene.add(light);

    // 分组设置
    this.group.position.y = 50;
    this.scene.add(this.group);

    // 创建nurbs模型
    this.createNurbs();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 绑定事件
    this.bind();

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

  // 绑定事件
  bind() {
    if (!this.isMobile()) {
      window.onpointerdown = (e) => {
        if ( e.isPrimary === false ) { return false; }
        this.pointerXOnPointerDown = e.clientX - this.windowHalfX;
        this.targetRotationOnPointerDown = this.targetRotation;
  
        window.onpointermove = (e) => {
          if ( e.isPrimary === false ) { return false; }
          this.pointerX = e.clientX - this.windowHalfX;
          this.targetRotation = this.targetRotationOnPointerDown + (this.pointerX - this.pointerXOnPointerDown) * 0.02;
        };
      };
  
      window.onpointerup = (e) => {
        if ( e.isPrimary === false ) { return false; }
  
        window.onpointermove = null;
      };
    } else {
      window.ontouchstart = (event) => {
        const e = event.touches[0];

        this.pointerXOnPointerDown = e.clientX - this.windowHalfX;
        this.targetRotationOnPointerDown = this.targetRotation;

        window.ontouchmove = (event) => {
          const e = event.touches[0];
          this.pointerX = e.clientX - this.windowHalfX;
          this.targetRotation = this.targetRotationOnPointerDown + (this.pointerX - this.pointerXOnPointerDown) * 0.02;
        };
      };

      window.ontouchend = () => {
        window.ontouchmove = null;
      };
    }
  }

  // 创建nurbs 模型
  private createNurbs() {
    const nurbsControlPoints: THREE.Vector4[] = [];
    const nurbsKnots: number[] = [];
    const nurbsDegree = 3;

    for (let i = 0; i <= nurbsDegree; i++) { nurbsKnots.push(0); }

    for (let i = 0, j = 20; i < j; i++) {
      const vector4 = new THREE.Vector4(Math.random()*400 - 200, Math.random()*400, Math.random()*400 - 200, 1);
      nurbsControlPoints.push(vector4);

      const knot = (i + 1) / (j - nurbsDegree);
      // .clamp ( value : Float, min : Float, max : Float ) : Float
      // value — 需要clamp处理的值
      // min — 最小值
      // max — 最大值
      nurbsKnots.push(THREE.MathUtils.clamp(knot, 0, 1));
    }

    const nurbsCurve = new NURBSCurve(nurbsDegree, nurbsKnots, nurbsControlPoints, 0, nurbsKnots.length - 1);
    const nurbsGeometry = new THREE.BufferGeometry();
    nurbsGeometry.setFromPoints(nurbsCurve.getPoints(200));

    const nurbsMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
    const nurbsLine = new THREE.Line(nurbsGeometry, nurbsMaterial);
    nurbsLine.position.set(200, -100, 0);
    this.group.add(nurbsLine);

    const nurbsControlPointsGeometry = new THREE.BufferGeometry();
    // @ts-ignore
    nurbsControlPointsGeometry.setFromPoints(nurbsCurve.controlPoints);

    const nurbsControlPointsMaterial = new THREE.LineBasicMaterial({color: 0x333333, opacity: 0.25, transparent: true});
    const nurbsControlPointsLine = new THREE.Line(nurbsControlPointsGeometry, nurbsControlPointsMaterial);
    nurbsControlPointsLine.position.copy(nurbsLine.position);
    this.group.add(nurbsControlPointsLine);

    // 创建控制点
    const nsControlPoints: THREE.Vector4[][] = [
      [
        new THREE.Vector4(-200, -200, 100, 1),
        new THREE.Vector4(-200, -100, -200, 1),
        new THREE.Vector4(-200, 100, 250, 1),
        new THREE.Vector4(-200, 200, -100, 1)
      ],
      [
        new THREE.Vector4(0, -200, 0, 1),
        new THREE.Vector4(0, -100, -100, 5),
        new THREE.Vector4(0, 100, 150, 5),
        new THREE.Vector4(0, 200, 0, 1)
      ],
      [
        new THREE.Vector4(200, -200, -100, 1),
        new THREE.Vector4(200, -100, 200, 1),
        new THREE.Vector4(200, 100, -250, 1),
        new THREE.Vector4(200, 200, 100, 1)
      ]
    ];

    const degree1 = 2;
    const degree2 = 3;
    const knots1 = [0, 0, 0, 1, 1, 1];
    const knots2 = [0, 0, 0, 0, 1, 1, 1, 1];
    const nurbsSurface = new NURBSSurface(degree1, degree2, knots1, knots2, nsControlPoints);

    const map = new THREE.TextureLoader().load('/examples/textures/uv_grid_opengl.jpg' );
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = 16;

    // 参数化缓冲几何体（ParametricGeometry）生成由参数表示其表面的几何体
    const geometry = new ParametricGeometry((u, v, target) => {
      return nurbsSurface.getPoint(u, v, target)
    }, 20, 20);
    const material = new THREE.MeshLambertMaterial({map: map, side: THREE.DoubleSide});
    const object = new THREE.Mesh(geometry, material);

    object.position.set(-200, 100, 0);
    object.scale.multiplyScalar(1);
    this.group.add(object);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 设置旋转
    this.group.rotation.y += (this.targetRotation - this.group.rotation.y) * 0.05;

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
      this.windowHalfX = this.width/2;

      // 重新绑定事件
      this.bind();

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

