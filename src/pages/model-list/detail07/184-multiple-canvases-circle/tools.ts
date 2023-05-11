import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

interface Iparams {
  canvas: HTMLCanvasElement, 
  rotateY: number,
  mouse: THREE.Vector2,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
}

// 视图
class View {
  private canvas: HTMLCanvasElement;
  private rotateY: number;
  private mouse: THREE.Vector2;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private context: CanvasRenderingContext2D | null;
  private camera: THREE.PerspectiveCamera | null;
  private virtualCamera: THREE.Camera
  constructor (params: Iparams) {
    const { canvas, rotateY, mouse, scene, renderer } = params;

    this.canvas = canvas;
    this.rotateY = rotateY;
    this.mouse = mouse;
    this.scene = scene;
    this.renderer = renderer;
    this.context = null;
    this.camera = null;
    // @ts-ignore
    this.virtualCamera = new THREE.Camera();

    this.init();
  }

  private init () {
    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(20, aspect, 1, 20000);
    this.camera.rotation.y = this.rotateY;
    this.virtualCamera.add(this.camera);
  }

  render() {
    this.virtualCamera.position.x = -this.mouse.x * 4;
    this.virtualCamera.position.y = -this.mouse.y * 4;
    this.virtualCamera.position.z = 1800;

    this.virtualCamera.lookAt(this.scene.position);
    this.virtualCamera.updateMatrixWorld(true);

    this.renderer.render(this.scene, this.camera as THREE.PerspectiveCamera);
    this.context?.drawImage(this.renderer?.domElement, 0, 0);
  }
}

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private canvas: {code: String, canvas: HTMLCanvasElement}[];
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private views: View[];
  private mouse: THREE.Vector2;
  private half: THREE.Vector2;
  private readonly noof_balls: number;
  private baseNumber: number;
  constructor(container: HTMLDivElement, canvas: {code: String, canvas: HTMLCanvasElement}[]) {
    this.container = container;
    this.canvas = canvas;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.views = [];
    this.mouse = new THREE.Vector2(0, 0);
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.noof_balls = 51;
    this.baseNumber = 0.45 * 30 * THREE.MathUtils.DEG2RAD
  }

  init() {
    // 渲染器
    this.createRenderer();

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    this.generateLight();
    this.generateShadow();
    this.createGeometry();

    this.canvas.forEach(({ canvas }, i) => {
      const rotateY = (i - 2) * this.baseNumber;
      const view = new View({ 
        canvas, 
        rotateY, 
        mouse: this.mouse, 
        scene: this.scene,
        renderer: this.renderer as THREE.WebGLRenderer
      });
      this.views.push(view);
    });

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

  private bind() {
    if (this.isMobile()) {
      window.onmousemove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];
        const x = e.clientX - this.half.x;
        const y = e.clientY - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    } else {
      window.onmousemove = (e) => {
        const x = e.clientX - this.half.x;
        const y = e.clientY - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    }
  }

  // 创建几何体
  private createGeometry() {
    const radius = 200;
    const geometry = new THREE.IcosahedronGeometry(radius, 1);

    const count = geometry.attributes.position.count;
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

    const color = new THREE.Color();
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const colors = geometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      color.setHSL((positions.getY(i) / radius + 1) / 2, 1.0, 0.5);
      colors.setXYZ(i, color.r, color.g, color.b);
    }

    const material = new THREE.MeshPhongMaterial({
      shininess: 0,
      color: 0xffffff,
      flatShading: true,
      vertexColors: true,
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      wireframe: true, 
      transparent: true,
    });

    for (let i = 0; i < this.noof_balls; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
      mesh.add(wireframe);

      mesh.position.x = -(this.noof_balls - 1) / 2 * 400 + i * 400;
      mesh.rotation.x = i * 0.5;
      this.scene.add(mesh);
    }
  }

  // 创建阴影
  private generateShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d') as  CanvasRenderingContext2D;
    const gradient = context.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 
      0, canvas.width / 2, 
      canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0.1, 'rgba(210,210,210,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,1)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const shadowTexture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: shadowTexture });
    const geomentry = new THREE.PlaneGeometry(300, 300, 1, 1);

    for (let i = 0; i < this.noof_balls; i++) {
      const mesh = new THREE.Mesh(geomentry, material);
      mesh.position.x = -(this.noof_balls - 1) / 2 * 400 + i * 400;
      mesh.position.y = -250;
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
    }
  }

  // 创建灯光
  private generateLight() {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0, 1).normalize();
    this.scene.add(light);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(200, 300);
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
    this.stats?.update();
    this.views.forEach((view) => { view.render(); });
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;
      this.half = new THREE.Vector2(this.width/2, this.height/2);

      this.bind();
      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(200, 300);
      }
    };
  }
}

export default THREE;