import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
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

  private objects: (THREE.Line | THREE.LineSegments)[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.objects = [];
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.scene.fog = new THREE.Fog(0x111111, 150, 200);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 0.01, 1000);
    this.camera.position.z = 150;

    // 创建线条
    this.createLine();

    // 创建渲染器
    this.createRenderer();
    
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建线条
  private createLine() {
    // 线条
    (() => {
      const divisions = 6;
      const points = GeometryUtils.hilbert3D(
        new THREE.Vector3(0, 0, 0),
        20.0, 1,
        0, 1, 2, 3, 4, 5, 6, 7
      );

      // 创建曲线
      const spline = new THREE.CatmullRomCurve3(points);
      // .getPoints ( divisions : Integer ) : Array
      // divisions -- 要将曲线划分为的分段数。默认是 5.
      const samples = spline.getPoints(points.length * divisions);
      // .setFromPoints ( points : Array ) : this
      // 通过点队列设置该 BufferGeometry 的 attribute
      const geometry = new THREE.BufferGeometry().setFromPoints(samples);
      // 虚线材质(LineDashedMaterial) 一种用于绘制虚线样式几何体的材质
      const line = new THREE.Line(geometry, new THREE.LineDashedMaterial({ 
        color: 0xffffff,
        // 虚线的大小，是指破折号和间隙之和。默认值为 3
        dashSize: 1,
        // 间隙的大小，默认值为 1
        gapSize: 0.5
      }));
      // 计算LineDashedMaterial所需的距离的值的数组。 对于几何体中的每一个顶点，
      // 这个方法计算出了当前点到线的起始点的累积长度
      line.computeLineDistances();
      line.name = "curve-line";
      this.objects.push(line);
      this.scene.add(line);
    })();

    // 箱体
    (() => {
      const geometry = this.createBox(50, 50, 50);
      // 线段（LineSegments）
      const line = new THREE.LineSegments(geometry, new THREE.LineDashedMaterial({ 
        color: 0xffaa00, 
        dashSize: 3, 
        gapSize: 1
      }));
      line.computeLineDistances();
      line.name = "box-line";
      this.objects.push(line);
      this.scene.add(line);
    })();
  }

  // 创建箱体 geometry
  private createBox(w: number, h: number, d: number) {
    const width = w * 0.5;
    const height = h * 0.5;
    const depth = d * 0.5;

    const geometry = new THREE.BufferGeometry();
    // 难点 不明白这个数组为什么这样设置
    const position: number[] = [
      -width, -height, -depth,
      -width, height, -depth,
  
      -width, height, -depth,
      width, height, -depth,
  
      width, height, -depth,
      width, -height, -depth,
  
      width, -height, -depth,
      -width, -height, -depth,
  
      -width, -height, depth,
      -width, height, depth,
  
      -width, height, depth,
      width, height, depth,
  
      width, height, depth,
      width, -height, depth,
  
      width, -height, depth,
      -width, -height, depth,
  
      -width, -height, -depth,
      -width, -height, depth,
  
      -width, height, -depth,
      -width, height, depth,
  
      width, height, -depth,
      width, height, depth,
  
      width, -height, -depth,
      width, -height, depth
    ];

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
    return geometry;
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
    // 控制几何体旋转
    const time = Date.now() * 0.001;
    this.scene.traverse((obj) => {
      if ((obj as THREE.Line).isLine) {
        if (obj.name === "curve-line") {
          obj.rotation.x = time * 0.25;
          obj.rotation.y = -time * 0.25;
        } else {
          obj.rotation.x = time * 0.25;
          obj.rotation.y = time * 0.25;
        }
      }
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }

    window.requestAnimationFrame(() => { this.animate(); })
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      if (this.camera) {
        this.camera.aspect = this.aspect;
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

