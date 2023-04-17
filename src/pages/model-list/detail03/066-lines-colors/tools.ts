import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils';

type Iarr = [THREE.LineBasicMaterial, number, [number, number, number], THREE.BufferGeometry];

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  
  private pointer: THREE.Vector2
  private half: THREE.Vector2
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.pointer = new THREE.Vector2();
    this.half = new THREE.Vector2(this.width/2, this.height/2);
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 10000);
    this.camera.position.z = 1000;

    // 创建线条
    this.createLines();
    
    // 创建渲染器
    this.createRenderer();

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

  // 创建线条
  private createLines() {
    const hilbertPoints = GeometryUtils.hilbert3D(
      new THREE.Vector3(0, 0, 0), 
      200.0, 1, 0, 1, 2, 3, 4, 5, 6, 7
    );

    // 前三个
    const geometry1 = new THREE.BufferGeometry();
    const geometry2 = new THREE.BufferGeometry();
    const geometry3 = new THREE.BufferGeometry();

    // 分支个数
    const divisions = 6;
    // 顶点
    let vertices = [];
    let colors1 = [];
    let colors2 = [];
    let colors3 = [];

    const point = new THREE.Vector3();
    const color = new THREE.Color();
    // CatmullRomCurve3 使用Catmull-Rom算法， 从一系列的点创建一条平滑的三维样条曲线
    const spline = new THREE.CatmullRomCurve3(hilbertPoints);
    const num = hilbertPoints.length * divisions;

    for (let i = 0; i < num; i++) {
      const t = i / num;
      spline.getPoint(t, point);
      vertices.push(point.x, point.y, point.z);

      color.setHSL(0.6, 1.0, Math.max(0, -point.x / 200) + 0.5);
      colors1.push(color.r, color.g, color.b);

      color.setHSL(0.9, 1.0, Math.max(0, -point.y / 200) + 0.5);
      colors2.push(color.r, color.g, color.b);

      color.setHSL(i / num, 1.0, 0.5);
      colors3.push(color.r, color.g, color.b);
    }

    geometry1.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry2.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry3.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    geometry1.setAttribute('color', new THREE.Float32BufferAttribute(colors1, 3));
    geometry2.setAttribute('color', new THREE.Float32BufferAttribute(colors2, 3));
    geometry3.setAttribute('color', new THREE.Float32BufferAttribute(colors3, 3));

    // 后三个
    const geometry4 = new THREE.BufferGeometry();
    const geometry5 = new THREE.BufferGeometry();
    const geometry6 = new THREE.BufferGeometry();

    vertices = [];
    colors1 = [];
    colors2 = [];
    colors3 = [];

    for (let i = 0; i < hilbertPoints.length; i++) {
      const point = hilbertPoints[i];
      vertices.push(point.x, point.y, point.z);

      color.setHSL(0.6, 1.0, Math.max(0, (200 - hilbertPoints[i].x) / 400) * 0.5 + 0.5);
      colors1.push(color.r, color.g, color.b );

      color.setHSL(0.3, 1.0, Math.max(0, (200 + hilbertPoints[i].x) / 400) * 0.5);
      colors2.push(color.r, color.g, color.b);

      color.setHSL(i / hilbertPoints.length, 1.0, 0.5);
      colors3.push(color.r, color.g, color.b);
    }

    geometry4.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry5.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry6.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    geometry4.setAttribute('color', new THREE.Float32BufferAttribute(colors1, 3));
    geometry5.setAttribute('color', new THREE.Float32BufferAttribute(colors2, 3));
    geometry6.setAttribute('color', new THREE.Float32BufferAttribute(colors3, 3));

    // 收集数据 插入场景
    const	material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      // 是否使用顶点着色。默认值为false。
      vertexColors: true
    });
    const scale = 0.45, d = 225;
    const arr: Iarr[]= [
      [material, scale, [-d, -d/2, 0], geometry1],
      [material, scale, [0, -d/2, 0], geometry2],
      [material, scale, [d, -d/2, 0], geometry3],
      [material, scale, [-d, d/2, 0], geometry4],
      [material, scale, [0, d/2, 0], geometry5],
      [material, scale, [d, d/2, 0], geometry6],
    ];

    arr.forEach((item) => {
      const line = new THREE.Line(item[3], item[0]);
      line.scale.set(item[1], item[1], item[1]);
      line.position.set(item[2][0], item[2][1], item[2][2]);
      this.scene.add(line);
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 绑定事件
  private bind() {
    if (this.isMobile()) {
      this.container.onpointermove = null;
      this.container.ontouchmove = (event) => {
        const e = event.touches[0];

        this.pointer.x = e.clientX - this.half.x;
				this.pointer.y = (e.clientY - 45) - this.half.y;
      };
    } else {
      this.container.ontouchmove = null;
      this.container.onpointermove = (e) => {
        this.pointer.x = e.clientX - this.half.x;
				this.pointer.y = (e.clientY - 45) - this.half.y;
      };
    }
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
    if (this.camera) {
      const time = Date.now() * 0.0005;
      const {x, y } = this.pointer;
      this.camera.position.x += (x - this.camera.position.x) * 0.05;
      this.camera.position.y += (-y + 200 - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.scene.position);

      this.scene.children.forEach((obj, index) => {
        if ((obj as THREE.Line).isLine) {
          obj.rotation.y = time * ( index % 2 ? 1 : -1);
        }
      });
    }
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
      this.half.set(this.width/2, this.height/2);

      this.bind();
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

