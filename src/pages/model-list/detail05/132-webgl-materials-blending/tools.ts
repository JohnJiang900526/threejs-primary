import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private mapBg: THREE.CanvasTexture | null;
  private textureLoader: THREE.TextureLoader;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.mapBg = null;
    this.textureLoader = new THREE.TextureLoader();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = this.createBackground();

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 1000);
    this.camera.position.z = 1000;

    // 创建对象
    this.createObjects();

    // webgl渲染器
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

  // 创建对象 核心
  private createObjects() {
    const blendings: {name: string, constant: THREE.Blending}[] = [
      { name: 'No', constant: THREE.NoBlending },
      { name: 'Normal', constant: THREE.NormalBlending },
      { name: 'Additive', constant: THREE.AdditiveBlending },
      { name: 'Subtractive', constant: THREE.SubtractiveBlending },
      { name: 'Multiply', constant: THREE.MultiplyBlending }
    ];

    const imgRows = [
      {
        map: this.textureLoader.load('/examples/textures/uv_grid_opengl.jpg'),
        num: 300,
      },
      {
        map: this.textureLoader.load('/examples/textures/sprite0.jpg'),
        num: 150,
      },
      {
        map: this.textureLoader.load('/examples/textures/sprite0.png'),
        num: 0,
      },
      {
        map: this.textureLoader.load('/examples/textures/lensflare/lensflare0.png'),
        num: -150,
      },
      {
        map: this.textureLoader.load('/examples/textures/lensflare/lensflare0_alpha.png'),
        num: -300,
      }
    ];

    const geometry1 = new THREE.PlaneGeometry(100, 100);
    const geometry2 = new THREE.PlaneGeometry(100, 25);

    const addImageRow = (map: THREE.Texture, num: number) => {
      blendings.forEach((blending, i) => {
        const material = new THREE.MeshBasicMaterial({map});
        material.transparent = true;
        material.blending = blending.constant;

        const x = (i - blendings.length / 2 + 0.5) * 110;
        const y = num;
        const z = 0;

        const mesh1 = new THREE.Mesh(geometry1, material);
        mesh1.position.set(x, y, z);

        const mesh2 = new THREE.Mesh(geometry2, this.createLabelMaterial(blending.name));
        mesh2.position.set(x, y - 60, z);

        this.scene.add(mesh1, mesh2);
      });
    };

    imgRows.forEach(({map, num}) => {
      addImageRow(map, num);
    });
  }

  // 创建label的材质
  private createLabelMaterial(text: string) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    canvas.width = 128;
    canvas.height = 32;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, 128, 32);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 12pt arial';
    ctx.fillText(text, 10, 22);

    const map = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({map, transparent: true});

    return material;
  }

  // 创建背景
  private createBackground() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    canvas.width = 128;
    canvas.height = 128;

    ctx.fillStyle = '#ddd';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#999';
    ctx.fillRect(32, 32, 32, 32);
    ctx.fillStyle = '#555';
    ctx.fillRect(64, 64, 64, 64);
    ctx.fillStyle = '#777';
    ctx.fillRect(96, 96, 32, 32);

    this.mapBg = new THREE.CanvasTexture(canvas);
    this.mapBg.wrapS = THREE.RepeatWrapping;
    this.mapBg.wrapT = THREE.RepeatWrapping;
    this.mapBg.repeat.set(64, 32);

    return this.mapBg;
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

    // 控制背景动画
    if (this.mapBg) {
      const { repeat } = this.mapBg;
      const time = Date.now() * 0.00075;
      
      const x = (time * - 0.01 * repeat.x) % 1;
      const y = (time * - 0.01 * repeat.y) % 1;

      this.mapBg.offset.set(x, y);
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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

