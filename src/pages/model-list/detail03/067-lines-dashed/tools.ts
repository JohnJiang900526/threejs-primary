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
        25.0, 1,
        0, 1, 2, 3, 4, 5, 6, 7
      );

      const spline = new THREE.CatmullRomCurve3(points);
      const samples = spline.getPoints(points.length * divisions);
      const geometry = new THREE.BufferGeometry().setFromPoints(samples);
      const line = new THREE.Line(geometry, new THREE.LineDashedMaterial({ 
        color: 0xffffff, 
        dashSize: 1, 
        gapSize: 0.5 
      }));
      line.computeLineDistances();
      this.objects.push(line);
      this.scene.add(line);
    })();

    // 箱体
    (() => {
      const geometry = this.createBox(50, 50, 50);
      const line = new THREE.LineSegments(geometry, new THREE.LineDashedMaterial({ 
        color: 0xffaa00, 
        dashSize: 3, 
        gapSize: 1
      }));
      line.computeLineDistances();
  
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    const time = Date.now() * 0.001;

    this.scene.traverse((obj) => {
      if ((obj as THREE.Line).isLine) {
        obj.rotation.x = time * 0.25;
        obj.rotation.y = time * 0.25;
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

