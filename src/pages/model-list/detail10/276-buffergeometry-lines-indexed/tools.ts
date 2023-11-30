import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;
  private group: THREE.Object3D;
  private params: {
    autoRotate: boolean,
    primary: () => void,
  }
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.group = new THREE.Object3D();
    this.params = {
      autoRotate: true,
      primary: () => {
        this.group.rotation.z = 0;
      },
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 10000);
    this.camera.position.z = 5000;

    // 模型
    this.generateModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.setGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setGUI() {
    this.gui.add(this.params, "autoRotate").name("自动旋转");

    // 添加一个按钮
    this.gui.add(this.params, "primary").name("回正");
  }

  // 核心逻辑
  private generateModel() {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ vertexColors: true });

    const indices: number[] = [];
    const positions: number[] = [];
    const colors: number[] = [];

    let nextPositionsIndex = 0;

    const count = 4;
    const rangle = 60 * Math.PI / 180.0;

    // 添加顶点
    function addVertex(v3: THREE.Vector3) {
      positions.push(v3.x, v3.y, v3.z);
      colors.push(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, 1);
      nextPositionsIndex++;
    }

    // 核心算法 很难理解
    // 科赫曲线 算法
    function snowFlakeIteration(p0: THREE.Vector3, p4: THREE.Vector3, depth: number) {
      if (--depth < 0) {
        const i = nextPositionsIndex - 1;
        addVertex(p4);
        indices.push(i, i + 1);
        return;
      }

      const v = p4.clone().sub(p0);
      const vTier = v.clone().multiplyScalar(1 / 3);
      const p1 = p0.clone().add(vTier);

      const angle = Math.atan2(v.y, v.x) + rangle;
      const length = vTier.length();
      const p2 = p1.clone();
      p2.x += Math.cos(angle) * length;
      p2.y += Math.sin(angle) * length;

      const p3 = p0.clone().add(vTier).add(vTier);

      snowFlakeIteration(p0, p1, depth);
      snowFlakeIteration(p1, p2, depth);
      snowFlakeIteration(p2, p3, depth);
      snowFlakeIteration(p3, p4, depth);
    }

    // 创建雪花图案
    function snowFlake(points: THREE.Vector3[], loop: boolean, offset: number) {
      for (let index = 0; index < count; index++) {
        addVertex(points[0]);

        for (let i = 0; i < points.length - 1; i++) {
          snowFlakeIteration(points[i], points[i + 1], index);
        }

        if (loop) {
          snowFlakeIteration(points[points.length - 1], points[0], index);
        }

        // 为下一次迭代转换输入曲线
        for (let i = 0; i < points.length; i++) {
          points[i].x += offset;
        }
      }
    }

    let y = 0;
    {
      // 最下面一排
      const points = [
        new THREE.Vector3(0, y, 0),
        new THREE.Vector3(500, y, 0),
      ];
      snowFlake(points, false, 600);
      y += 600;
    }

    {
      // 下面第二排
      const points = [
        new THREE.Vector3(0, y, 0),
        new THREE.Vector3(250, y + 400, 0),
        new THREE.Vector3(500, y, 0),
      ];
      snowFlake(points, true, 600);
      y += 600;
    }

    {
      // 上面第二排
      const points = [
        new THREE.Vector3(0, y, 0),
        new THREE.Vector3(500, y, 0),
        new THREE.Vector3(500, y + 500, 0),
        new THREE.Vector3(0, y + 500, 0),
      ];
      snowFlake(points, true, 600);
      y += 1000;
    }

    {
      // 最上面一排
      const points = [
        new THREE.Vector3(250, y, 0),
        new THREE.Vector3(500, y, 0),
        new THREE.Vector3(250, y, 0),
        new THREE.Vector3(250, y + 250, 0),
        new THREE.Vector3(250, y, 0),
        new THREE.Vector3(0, y, 0),
        new THREE.Vector3(250, y, 0),
        new THREE.Vector3(250, y - 250, 0),
        new THREE.Vector3(250, y, 0),
      ];
      snowFlake(points, false, 600);
    }

    geometry.setIndex(indices);

    const positionAttr = new THREE.Float32BufferAttribute(positions, 3);
    geometry.setAttribute('position', positionAttr);

    const colorAttr = new THREE.Float32BufferAttribute(colors, 3);
    geometry.setAttribute('color', colorAttr);

    geometry.computeBoundingSphere();

    const segments = new THREE.LineSegments(geometry, material);
    segments.position.x -= 1200;
    segments.position.y -= 1200;

    this.group.add(segments);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      const timer = Date.now() * 0.001;
      if (this.params.autoRotate) {
        this.group.rotation.z = timer * 0.5;
      }
    }

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
  }

  // 消除 副作用
  dispose() {
    window.cancelAnimationFrame(this.animateNumber);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

