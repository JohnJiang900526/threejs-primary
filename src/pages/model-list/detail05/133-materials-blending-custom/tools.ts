import GUI from 'lil-gui';
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

  private gui: GUI
  private mapBg: THREE.CanvasTexture | null;
  private textureLoader: THREE.TextureLoader;
  private materials: THREE.MeshBasicMaterial[]
  private params: {
    blendEquation: THREE.BlendingEquation
  }
  private equations: {
    Add: THREE.BlendingEquation, 
    Subtract: THREE.BlendingEquation, 
    ReverseSubtract: THREE.BlendingEquation, 
    Min: THREE.BlendingEquation, 
    Max: THREE.BlendingEquation
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

    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.mapBg = null;
    this.textureLoader = new THREE.TextureLoader();
    this.materials = [];
    this.params = {
      blendEquation: THREE.AddEquation
    };
    this.equations = {
      Add: THREE.AddEquation, 
      Subtract: THREE.SubtractEquation, 
      ReverseSubtract: THREE.ReverseSubtractEquation, 
      Min: THREE.MinEquation, 
      Max: THREE.MaxEquation 
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = this.createBackground();

    // 相机
    this.camera = new THREE.PerspectiveCamera(100, this.aspect, 1, 5000);
    this.camera.position.z = 1300;

    // 创建对象
    this.createObjects();

    // webgl渲染器
    this.createRenderer();

    this.setUpGrid();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGrid() {
    this.gui.add(this.params, 'blendEquation', this.equations).onChange((value: THREE.BlendingEquation) => {
      this.materials.forEach((material) => {
        material.blendEquation = value;
      });
    });
  }

  // 创建对象 核心
  private createObjects() {
    const src = [
      { name: 'Zero', constant: THREE.ZeroFactor },
      { name: 'One', constant: THREE.OneFactor },
      { name: 'SrcColor', constant: THREE.SrcColorFactor },
      { name: 'OneMinusSrcColor', constant: THREE.OneMinusSrcColorFactor },
      { name: 'SrcAlpha', constant: THREE.SrcAlphaFactor },
      { name: 'OneMinusSrcAlpha', constant: THREE.OneMinusSrcAlphaFactor },
      { name: 'DstAlpha', constant: THREE.DstAlphaFactor },
      { name: 'OneMinusDstAlpha', constant: THREE.OneMinusDstAlphaFactor },
      { name: 'DstColor', constant: THREE.DstColorFactor },
      { name: 'OneMinusDstColor', constant: THREE.OneMinusDstColorFactor },
      { name: 'SrcAlphaSaturate', constant: THREE.SrcAlphaSaturateFactor },
    ];

    const dst = [
      { name: 'Zero', constant: THREE.ZeroFactor },
      { name: 'One', constant: THREE.OneFactor },
      { name: 'SrcColor', constant: THREE.SrcColorFactor },
      { name: 'OneMinusSrcColor', constant: THREE.OneMinusSrcColorFactor },
      { name: 'SrcAlpha', constant: THREE.SrcAlphaFactor },
      { name: 'OneMinusSrcAlpha', constant: THREE.OneMinusSrcAlphaFactor },
      { name: 'DstAlpha', constant: THREE.DstAlphaFactor },
      { name: 'OneMinusDstAlpha', constant: THREE.OneMinusDstAlphaFactor },
      { name: 'DstColor', constant: THREE.DstColorFactor },
      { name: 'OneMinusDstColor', constant: THREE.OneMinusDstColorFactor },
    ];

    const geometry1 = new THREE.PlaneGeometry(100, 100);
    const geometry2 = new THREE.PlaneGeometry(100, 25);
    const texture = this.textureLoader.load('/examples/textures/lensflare/lensflare0_alpha.png');

    dst.forEach((blendDst, i) => {
      src.forEach((blendSrc, j) => {
        const material = new THREE.MeshBasicMaterial({ map: texture });
        material.transparent = true;
        // 在使用此材质显示对象时要使用何种混合。
        // 必须将其设置为CustomBlending才能使用自定义blendSrc, blendDst 
        // 或者 [page:Constant blendEquation]。 混合模式所有可能的取值请参阅constants。
        // 默认值为NormalBlending
        material.blending = THREE.CustomBlending;
        // 混合源。默认值为SrcAlphaFactor。 源因子所有可能的取值请参阅constants。
        // 必须将材质的blending设置为CustomBlending才能生效
        material.blendSrc = blendSrc.constant;
        // 混合目标。默认值为OneMinusSrcAlphaFactor。 目标因子所有可能的取值请参阅constants
        // 必须将材质的blending设置为CustomBlending才能生效
        material.blendDst = blendDst.constant;
        // 使用混合时所采用的混合方程式。默认值为AddEquation。 
        // 混合方程式所有可能的取值请参阅constants。 
        // 必须将材质的blending设置为CustomBlending才能生效
        material.blendEquation = THREE.AddEquation;

        const x = (j - src.length / 2 + 0.5) * 110;
        const y = (i - dst.length / 2 + 0.5) * 110 + 50;
        const z = 0;

        const mesh = new THREE.Mesh(geometry1, material);
        mesh.position.set(x, -y, z);
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();

        this.scene.add(mesh);
        this.materials.push(material);
      });
    });

    src.forEach((blendSrc, j) => {
      const x = (j - src.length / 2 + 0.5) * 110;
      const y = (0 - dst.length / 2 + 0.5) * 110 + 50;
      const z = 0;

      const material = this.createLabelMaterial(blendSrc.name, 'rgba(0, 150, 0, 1)');
      const mesh = new THREE.Mesh(geometry2, material);

      mesh.position.set(x, -(y - 70), z);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      this.scene.add(mesh);
    });

    dst.forEach((blendDst, i) => {
      const x = (0 - src.length / 2 + 0.5) * 110 - 125;
      const y = (i - dst.length / 2 + 0.5) * 110 + 165;
      const z = 0;

      const material = this.createLabelMaterial(blendDst.name, 'rgba(0, 150, 0, 1)');
      const mesh = new THREE.Mesh(geometry2, material);

      mesh.position.set(x, - (y - 120), z);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      this.scene.add(mesh);
    });
  }

  // 创建label的材质
  private createLabelMaterial(text: string, bg: string) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    canvas.width = 128;
    canvas.height = 32;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 128, 32);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 11pt arial';
    ctx.fillText(text, 8, 22);

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

