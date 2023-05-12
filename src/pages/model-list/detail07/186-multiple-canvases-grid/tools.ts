import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

interface Iparams {
  canvas: HTMLCanvasElement, 
  mouse: THREE.Vector2,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  fullWidth: number,
  fullHeight: number,
  viewX: number,
  viewY: number,
}

interface ICanvasParams {
  code: String, 
  canvas: HTMLCanvasElement,
  viewX: number, 
  viewY: number,
}

// 视图class 用于构建每一个小的视图
class View {
  private canvas: HTMLCanvasElement;
  private mouse: THREE.Vector2;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private context: CanvasRenderingContext2D | null;
  private camera: THREE.PerspectiveCamera;
  private fullWidth: number;
  private fullHeight: number;
  private viewWidth: number;
  private viewHeight: number;
  private viewX: number;
  private viewY: number;
  constructor (params: Iparams) {
    const { canvas, mouse, scene, renderer, fullWidth, fullHeight, viewX, viewY, } = params;

    this.canvas = canvas;
    this.mouse = mouse;
    this.scene = scene;
    this.renderer = renderer;
    this.fullWidth = fullWidth;
    this.fullHeight = fullHeight;
    this.viewWidth = 0;
    this.viewHeight = 0;
    this.viewX = viewX;
    this.viewY = viewY;
    this.context = null;
    this.camera = new THREE.PerspectiveCamera();

    this.init();
  }

  // 核心逻辑
  private init () {
    this.viewWidth = this.canvas.clientWidth;
    this.viewHeight = this.canvas.clientHeight;

    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
    this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    const aspect = this.fullWidth / this.fullHeight;
    this.camera = new THREE.PerspectiveCamera(20, aspect, 1, 10000);
    this.camera.setViewOffset(
      this.fullWidth, this.fullHeight, 
      this.viewX, this.viewY, 
      this.viewWidth, this.viewHeight,
    );
    this.camera.position.z = 1800;
  }

  // 核心逻辑
  render() {
    this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.05;
    this.camera.position.y += (-this.mouse.y - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
    this.context?.drawImage(this.renderer.domElement, 0, 0);
  }
}


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private canvas: ICanvasParams[];
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private views: View[];
  private mouse: THREE.Vector2;
  private half: THREE.Vector2;
  private meshes: THREE.Mesh[];
  private w: number;
  private h: number;
  constructor(container: HTMLDivElement, canvas: ICanvasParams[]) {
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
    this.meshes = [];
    this.w = this.canvas[0].canvas.clientWidth;
    this.h = this.canvas[0].canvas.clientHeight;
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

    this.canvas.forEach(({ canvas, viewX, viewY }) => {
      const renderer = this.renderer as THREE.WebGLRenderer;
      const view = new View({ 
        viewX, 
        viewY,
        canvas, 
        renderer,
        mouse: this.mouse, 
        scene: this.scene,
        fullWidth: this.w * 2,
        fullHeight: this.h * 2,
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

  // 创建几何体 核心逻辑
  private createGeometry() {
    const radius = 200;
    const geometry1 = new THREE.IcosahedronGeometry(radius, 1);
    const count = geometry1.attributes.position.count;
    geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const geometry2 = geometry1.clone();
    const geometry3 = geometry1.clone();

    const color = new THREE.Color();
    const positions1 = geometry1.attributes.position as THREE.BufferAttribute;
    const positions2 = geometry2.attributes.position as THREE.BufferAttribute;
    const positions3 = geometry3.attributes.position as THREE.BufferAttribute;

    const colors1 = geometry1.attributes.color as THREE.BufferAttribute;
    const colors2 = geometry2.attributes.color as THREE.BufferAttribute;
    const colors3 = geometry3.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      color.setHSL((positions1.getY(i) / radius + 1) / 2, 1.0, 0.5);
      colors1.setXYZ( i, color.r, color.g, color.b );

      color.setHSL(0, (positions2.getY(i) / radius + 1) / 2, 0.5);
      colors2.setXYZ(i, color.r, color.g, color.b);

      color.setRGB( 1, 0.8 - (positions3.getY(i) / radius + 1) / 2, 0 );
      colors3.setXYZ(i, color.r, color.g, color.b);
    }

    const material = new THREE.MeshPhongMaterial({
      shininess: 0,
      color: 0xffffff,
      flatShading: true,
      vertexColors: true,
    });

    const wireMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      wireframe: true, 
      transparent: true,
    });

    {
      const mesh = new THREE.Mesh(geometry1, material );
      const wireframe = new THREE.Mesh(geometry1, wireMaterial);
      mesh.add(wireframe);
      mesh.position.x = -400;
      mesh.rotation.x = -1.87;
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }

    {
      const mesh = new THREE.Mesh(geometry2, material );
      const wireframe = new THREE.Mesh(geometry2, wireMaterial);
      mesh.add(wireframe);
      mesh.position.x = 400;
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }

    {
      const mesh = new THREE.Mesh(geometry3, material );
      const wireframe = new THREE.Mesh(geometry3, wireMaterial);
      mesh.add(wireframe);
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }
  }

  // 创建阴影 核心逻辑
  private generateShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D ;
    const x0 = canvas.width / 2;
    const y0 = canvas.height / 2;
    const r0 = 0;

    const x1 = canvas.width / 2;
    const y1 = canvas.height / 2;
    const r1 = canvas.width / 2;
    const gradient = context.createRadialGradient(x0, y0, r0, x1, y1,r1);
    gradient.addColorStop(0.1, 'rgba(210,210,210,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,1)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const geometry = new THREE.PlaneGeometry(300, 300, 1, 1);

    {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = -250;
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
    }

    {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = -400;
      mesh.position.y = -250;
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
    }

    {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = 400;
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
    this.renderer.setSize(this.w, this.h);
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

    // 控制模型旋转
    this.meshes.forEach((mesh) => {
      mesh.rotation.y += 0.005;
    });
    // 控制场景渲染
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
        this.renderer.setSize(this.w, this.h);
      }
    };
  }
}

export default THREE;