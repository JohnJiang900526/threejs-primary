import * as THREE from 'three';
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
  private points: null | THREE.Points;
  private particles: number; 
  private drawCount: number;
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
    this.points = null;
    this.particles = 300000;
    this.drawCount = 10000;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.Fog(0x050505, 2000, 3500);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 0.01, 3500);
    this.camera.position.z = 1750;

    // 渲染器
    this.createRenderer();
    // 创建模型
    this.generateModel();
    
    // 控制面板
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateModel() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const positions2 = [];
    const colors = [];

    const color = new THREE.Color();
    const n = 1000, n2 = n / 2;

    for (let i = 0; i < this.particles; i++) {
      // 位置
      const x = Math.random() * n - n2;
      const y = Math.random() * n - n2;
      const z = Math.random() * n - n2;

      positions.push(x, y, z);
      positions2.push(z * 0.5, x * 0.5, y * 0.5);

      // 颜色
      color.setRGB((x / n) + 0.5, (y / n) + 0.5, (z / n) + 0.5);
      colors.push(color.r, color.g, color.b);
    }

    const gl = this.renderer!.getContext();
    const pos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pos);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const pos2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pos2);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions2), gl.STATIC_DRAW);

    const rgb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rgb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const posAttr1 = new THREE.GLBufferAttribute(pos!, gl.FLOAT, 3, 4, this.particles);
    const posAttr2 = new THREE.GLBufferAttribute(pos2!, gl.FLOAT, 3, 4, this.particles);

    geometry.setAttribute('position', posAttr1);
    geometry.setAttribute('color', new THREE.GLBufferAttribute(rgb!, gl.FLOAT, 3, 4, this.particles));

    setInterval(() => {
      const position = geometry.getAttribute('position');
      geometry.setAttribute('position', (position === posAttr1) ? posAttr2 : posAttr1);
    }, 2000);

    const material = new THREE.PointsMaterial({ 
      size: 15, 
      vertexColors: true,
    });
    this.points = new THREE.Points(geometry, material);
    // geometry.boundingSphere = (new THREE.Sphere()).set(new THREE.Vector3(), Infinity);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      const timer = Date.now() * 0.001;
      this.drawCount = (Math.max(5000, this.drawCount) + Math.floor(500 * Math.random())) % this.particles;
      
      if (this.points) {
        this.points.geometry.setDrawRange(0, this.drawCount);
        this.points.rotation.x = timer * 0.1;
        this.points.rotation.y = timer * 0.2;
      }
    }

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

