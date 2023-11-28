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
  private group: THREE.Group;
  private particlesData: {
    velocity: THREE.Vector3,
    numConnections: number,
  }[];
  private positions: Float32Array;
  private colors: Float32Array;
  private particles: THREE.BufferGeometry;
  private point: THREE.Points;
  private particlePositions: Float32Array;
  private linesMesh: THREE.LineSegments;
  private maxParticleCount: number;
  private particleCount: number;
  private r: number;
  private half: number;
  private helper: null | THREE.BoxHelper;
  private params: {
    showHelper: boolean;
    showDots: boolean;
    showLines: boolean;
    minDistance: number;
    limitConnections: boolean;
    maxConnections: number;
    particleCount: number;
  }
  private gui: GUI;
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
    this.group = new THREE.Group();
    this.particlesData = [];
    this.positions = new Float32Array();
    this.colors = new Float32Array();
    this.particles = new THREE.BufferGeometry();
    this.point = new THREE.Points();
    this.particlePositions = new Float32Array();
    this.linesMesh = new THREE.LineSegments();
    this.maxParticleCount = 1000;
    this.particleCount = 500;
    this.r = 800;
    this.half = this.r/2;
    this.helper = null;
    this.params = {
      showHelper: true,
      showDots: true,
      showLines: true,
      minDistance: 150,
      limitConnections: false,
      maxConnections: 20,
      particleCount: 500,
    };
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 4000);
    this.camera.position.z = 1750;

    // helper
    this.createHelper();
    // 创建模型
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
    this.gui.add(this.params, 'showHelper').name("显示helper").onChange((value: boolean) =>{
      this.helper!.visible = value;
    });
    this.gui.add(this.params, 'showDots').name("显示点").onChange((value: boolean) =>{
      this.point.visible = value;
    });
    this.gui.add(this.params, 'showLines').name("显示线").onChange((value: boolean) =>{
      this.linesMesh.visible = value;
    });
    this.gui.add(this.params, 'minDistance', 10, 300).name("最小距离");
    this.gui.add(this.params, 'limitConnections').name("限制连接");
    this.gui.add(this.params, 'maxConnections', 0, 30, 1).name("最大连接");
    this.gui.add(this.params, 'particleCount', 0, this.maxParticleCount, 1).name("粒子数量").onChange((value: string) => {
      this.particleCount = parseInt(value);
      this.particles.setDrawRange(0, this.particleCount);
    });
  };

  private createHelper() {
    const geometry = new THREE.BoxGeometry(this.r, this.r, this.r);
    const mesh = new THREE.Mesh(geometry);
    this.helper = new THREE.BoxHelper(mesh);

    const material = this.helper!.material as THREE.LineBasicMaterial;
    material.color.setHex(0x101010);
    // 在使用此材质显示对象时要使用何种混合。
    // 必须将其设置为CustomBlending才能使用自定义blendSrc, blendDst 或者 [page:Constant blendEquation]。 
    // 混合模式所有可能的取值请参阅constants。默认值为NormalBlending。
    material.blending = THREE.AdditiveBlending;
    material.transparent = true;
    this.group.add(this.helper!);
  }

  // 核心
  private generateModel() {
    const segments = Math.pow(this.maxParticleCount, 2);

    this.colors = new Float32Array(segments * 3);
    this.positions = new Float32Array(segments * 3);

    this.particles = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.maxParticleCount * 3);

    // 计算位置信息
    for (let i = 0; i < this.maxParticleCount; i++) {
      this.particlePositions[i * 3 + 0] = Math.random() * this.r - this.r / 2;
      this.particlePositions[i * 3 + 1] = Math.random() * this.r - this.r / 2;
      this.particlePositions[i * 3 + 2] = Math.random() * this.r - this.r / 2;

      const v3 = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      );
      this.particlesData.push({ velocity: v3, numConnections: 0 });
    }

    
    {
      // 创建连接点
      this.particles.setDrawRange(0, this.particleCount);
      const position = new THREE.BufferAttribute(this.particlePositions, 3).setUsage(THREE.DynamicDrawUsage);
      this.particles.setAttribute('position',  position);

      const material = new THREE.PointsMaterial({
        size: 3,
        color: "#295AA6",
        transparent: true,
        sizeAttenuation: false,
        blending: THREE.AdditiveBlending,
      });
      this.point = new THREE.Points(this.particles, material);
      this.group.add(this.point);
    }

    {
      // 创建连接线
      const geometry = new THREE.BufferGeometry();
      const position = new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage)
      geometry.setAttribute("position", position);
  
      const colors = new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage)
      geometry.setAttribute("color", colors);
  
      // 计算当前几何体的的边界球形，该操作会更新已有 [param:.boundingSphere]。
      // 边界球形不会默认计算，需要调用该接口指定计算边界球形，否则保持默认值 null
      geometry.computeBoundingSphere();
      // .setDrawRange ( start : Integer, count : Integer ) : undefined
      // .drawRange用于判断几何体的哪个部分需要被渲染。该值不应该直接被设置，而需要通过 .setDrawRange 进行设置。
      // 默认值为 { start: 0, count: Infinity }
      geometry.setDrawRange(0, 0);
  
      const material = new THREE.LineBasicMaterial({
        color: "#3AA45A",
        transparent: true,
        // 是否使用顶点着色。默认值为false。
        vertexColors: true,
        // 在使用此材质显示对象时要使用何种混合。
        // 必须将其设置为CustomBlending才能使用自定义blendSrc, blendDst 或者 [page:Constant blendEquation]。 
        // 混合模式所有可能的取值请参阅constants。默认值为NormalBlending。
        blending: THREE.AdditiveBlending,
      });
      this.linesMesh = new THREE.LineSegments(geometry, material);
      this.group.add(this.linesMesh);
    }
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

  private isOut(num: number, half: number) {
    return (num < -half || num > half);
  }

  // 核心中的核心
  private createConnection() {
    const { limitConnections, maxConnections, minDistance } = this.params;

    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    for (let i = 0; i < this.particleCount; i++) {
      this.particlesData[i].numConnections = 0;
    }

    for (let i = 0; i < this.particleCount; i++) {
      const particleDataA = this.particlesData[i];
      this.particlePositions[i * 3 + 0] += particleDataA.velocity.x;
      this.particlePositions[i * 3 + 1] += particleDataA.velocity.y;
      this.particlePositions[i * 3 + 2] += particleDataA.velocity.z;

      // 反向置换
      if (this.isOut(this.particlePositions[i * 3 + 0], this.half)) {
        particleDataA.velocity.x = -particleDataA.velocity.x;
      }
      if (this.isOut(this.particlePositions[i * 3 + 1], this.half)) {
        particleDataA.velocity.y = -particleDataA.velocity.y;
      }
      if (this.isOut(this.particlePositions[i * 3 + 2], this.half)) {
        particleDataA.velocity.z = -particleDataA.velocity.z;
      }
      // 如果超过了最大限制 直接停止向下运行
      if (limitConnections && particleDataA.numConnections >= maxConnections) { continue; }

      // 和其他位置位置坐比对 检查碰撞
      for (let j = i + 1; j < this.particleCount; j++) {
        const particleDataB = this.particlesData[j];
        // 如果超过了最大限制 直接停止向下运行
        if (limitConnections && particleDataB.numConnections >= maxConnections) { continue; }

        const x = this.particlePositions[i * 3 + 0] - this.particlePositions[j * 3 + 0];
        const y = this.particlePositions[i * 3 + 1] - this.particlePositions[j * 3 + 1];
        const z = this.particlePositions[i * 3 + 2] - this.particlePositions[j * 3 + 2];
        // 开平方根
        const dist = Math.sqrt(x * x + y * y + z * z);
        const diff = dist - minDistance;
        // 距离diff 小于最小距离
        if (diff < 0) {
          const alpha = 1.0 - dist / minDistance;

          // 连接点+1
          particleDataA.numConnections++;
          particleDataB.numConnections++;

          // 以i为准 设置位置
          this.positions[vertexpos++] = this.particlePositions[i * 3 + 0];
          this.positions[vertexpos++] = this.particlePositions[i * 3 + 1];
          this.positions[vertexpos++] = this.particlePositions[i * 3 + 2];

          // 以j为准 设置位置
          this.positions[vertexpos++] = this.particlePositions[j * 3 + 0];
          this.positions[vertexpos++] = this.particlePositions[j * 3 + 1];
          this.positions[vertexpos++] = this.particlePositions[j * 3 + 2];

          // 以i为准 设置colors
          this.colors[colorpos++] = alpha;
          this.colors[colorpos++] = alpha;
          this.colors[colorpos++] = alpha;

          // 以j为准 设置colors
          this.colors[colorpos++] = alpha;
          this.colors[colorpos++] = alpha;
          this.colors[colorpos++] = alpha;

          numConnected++;
        }
      }
    }

    // 用于判断几何体的哪个部分需要被渲染。该值不应该直接被设置，而需要通过 .setDrawRange 进行设置。
    // 默认值为 { start: 0, count: Infinity }
    this.linesMesh.geometry.setDrawRange(0, numConnected * 2);
    this.linesMesh.geometry.attributes.color.needsUpdate = true;
    this.linesMesh.geometry.attributes.position.needsUpdate = true;
    this.point.geometry.attributes.position.needsUpdate = true;
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    // 创建连接
    this.createConnection();

    // 旋转
    const timer = Date.now() * 0.001;
    this.group.rotation.y = timer * 0.1;
    // 执行渲染
    this.renderer!.render(this.scene, this.camera!);
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

