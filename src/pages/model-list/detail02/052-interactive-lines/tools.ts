import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private raycaster: THREE.Raycaster
  private pointer: THREE.Vector2
  private theta: number
  private INTERSECTED: null | THREE.Mesh
  private radius: number
  private transform: THREE.Object3D
  private sphereInter: THREE.Mesh
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.theta = 0;
    this.INTERSECTED = null;
    this.radius = 100;
    this.transform = new THREE.Object3D();
    this.sphereInter = new THREE.Mesh();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(150, this.width/this.height, 1, 10000);

    // 创建红点集合
    // 球缓冲几何体（SphereGeometry）一个用于生成球体的类 
    this.sphereInter = new THREE.Mesh(
      new THREE.SphereGeometry(5), 
      new THREE.MeshBasicMaterial({
        color: 0xff0000
      })
    );
    this.sphereInter.visible = false;
    this.scene.add(this.sphereInter);

    // 创建线条
    this.createLines();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 事件绑定
    this.bind();
    // 性能统计
    this.initStats();
    // 动画
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建线条
  private createLines() {
    const lineGeometry = new THREE.BufferGeometry();
    const points: number[] = [];

    const point = new THREE.Vector3();
    const direction = new THREE.Vector3();

    for (let i = 0; i < 50; i++) {
      direction.x += Math.random() - 0.5;
      direction.y += Math.random() - 0.5;
      direction.z += Math.random() - 0.5;
      direction.normalize().multiplyScalar(10);

      point.add(direction);
      points.push(point.x, point.y, point.z);
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    this.transform = new THREE.Object3D();
    this.transform.position.set(
      Math.random() * 40 - 20,
      Math.random() * 40 - 20,
      Math.random() * 40 - 20,
    );

    this.transform.rotation.set(
      Math.random() * 2 * Math.PI,
      Math.random() * 2 * Math.PI,
      Math.random() * 2 * Math.PI,
    );

    this.transform.scale.set(
      Math.random() + 0.5,
      Math.random() + 0.5,
      Math.random() + 0.5,
    );

    for (let i = 0; i < 50; i++) {
      let object: THREE.Line | THREE.LineSegments;

      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: Math.random() * 0xffffff 
      });

      if (Math.random() > 0.5) {
        // 线（Line）一条连续的线
        // 它几乎和LineSegments是一样的，唯一的区别是它在渲染时使用的是gl.LINE_STRIP， 而不是gl.LINES
        // Line( geometry : BufferGeometry, material : Material )
        // geometry —— 表示线段的顶点，默认值是一个新的BufferGeometry
        // material —— 线的材质，默认值是一个新的具有随机颜色的LineBasicMaterial
        object = new THREE.Line(lineGeometry, lineMaterial);
      } else {
        // 线段（LineSegments）在若干对的顶点之间绘制的一系列的线
        // 它和Line几乎是相同的，唯一的区别是它在渲染时使用的是gl.LINES， 而不是gl.LINE_STRIP
        // LineSegments( geometry : BufferGeometry, material : Material )
        // geometry —— 表示每条线段的两个顶点
        // material —— 线的材质，默认值是LineBasicMaterial
        object = new THREE.LineSegments(lineGeometry, lineMaterial);
      }

      object.position.set(
        Math.random() * 400 - 200,
        Math.random() * 400 - 200,
        Math.random() * 400 - 200,
      );

      object.rotation.set(
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI,
      );

      object.scale.set(
        Math.random() + 0.5,
        Math.random() + 0.5,
        Math.random() + 0.5,
      );

      this.transform.add(object);
    }

    // @ts-ignore 阈值
    this.raycaster.params.Line.threshold = 3;
    this.scene.add(this.transform);
  }

  // 事件绑定
  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];

        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = - ((e.clientY - 45) / this.height) * 2 + 1;
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = - ((e.clientY - 45) / this.height) * 2 + 1;
      }
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
    window.requestAnimationFrame(() => { this.animate(); });

    if (this.camera) {
      // 视野旋转
      this.theta += 0.05;
      const x = this.radius * Math.sin(THREE.MathUtils.degToRad(this.theta));
      const y = this.radius * Math.sin(THREE.MathUtils.degToRad(this.theta));
      const z = this.radius * Math.cos(THREE.MathUtils.degToRad(this.theta));

      this.camera.position.set(x, y, z);
      this.camera.lookAt(this.scene.position);
      this.camera.updateMatrixWorld();

      // 获取目标 控制红点显示和隐藏
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.transform.children, false);
      if (intersects.length > 0) {
        this.sphereInter.position.copy(intersects[0].point);
        this.sphereInter.visible = true;
      } else {
        this.sphereInter.visible = false;
      }
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      // 绑定事件
      this.bind();

      if (this.camera) {
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

