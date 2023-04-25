import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private mesh: THREE.Mesh
  private material: THREE.MeshBasicMaterial
  private drawStart: THREE.Vector2
  constructor(container: HTMLDivElement, canvas: HTMLCanvasElement) {
    this.container = container;
    this.canvas = canvas;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.mesh = new THREE.Mesh();
    this.material = new THREE.MeshBasicMaterial();
    this.drawStart = new THREE.Vector2();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 2000);
    this.camera.position.z = 500;

    // 模型
    const geometry = new THREE.BoxGeometry(100, 100, 100);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    this.setupDrawing();
    // 渲染器
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

  private draw(context: CanvasRenderingContext2D, x: number, y: number) {
    context.moveTo(this.drawStart.x, this.drawStart.y);
    context.strokeStyle = '#000000';
    context.lineTo(x, y);
    context.stroke();

    this.drawStart.set(x, y);
    if (this.material.map) {
      this.material.map.needsUpdate = true;
    }
  }

  private setupDrawing() {
    let paint = false;

    const context = this.canvas.getContext("2d") as CanvasRenderingContext2D ;
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, 128, 128);
    this.material.map = new THREE.CanvasTexture(this.canvas);

    this.canvas.onpointerdown = (e) => {
      paint = true;
      this.drawStart.set(e.offsetX, e.offsetY);
    };

    this.canvas.onpointermove = (e) => {
      if (paint) {
        this.draw(context, e.offsetX, e.offsetY);
      }
    };

    this.canvas.onpointerup = () => {
      paint = false;
    };

    this.canvas.onpointerleave = () => {
      paint = false;
    };
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
    window.requestAnimationFrame(() => { this.animate(); });

    this.mesh.rotation.x += 0.005;
    this.mesh.rotation.y += 0.005;
    
    this.stats?.update();
    
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
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

