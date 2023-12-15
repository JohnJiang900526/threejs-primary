import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';
import { fragmentShader, vertexShader } from './vars';


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
  private size: number;
  private mesh: THREE.Mesh;
  private prevTime: number;
  private cloudTexture: null | THREE.Data3DTexture;
  private params: {
    threshold: number;
    opacity: number;
    range: number;
    steps: number;
  }
  private material: THREE.RawShaderMaterial;

  private curr: number;
  private countPerRow: number;
  private countSlice: number;
  private sliceCount: number;
  private totalCount: number;
  private margins: number;
  private perPaddedSize: number;
  private perSize: number;
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
    this.size = 128;
    this.mesh = new THREE.Mesh();
    this.prevTime = performance.now();
    this.cloudTexture = null;
    this.params = {
      threshold: 0.25,
      opacity: 0.25,
      range: 0.1,
      steps: 100,
    };
    this.material = new THREE.RawShaderMaterial();
    this.curr = 0;
    this.countPerRow = 4;
    this.countSlice = this.countPerRow * this.countPerRow;
    this.sliceCount = 4;
    this.totalCount = this.sliceCount * this.countSlice;
    this.margins = 8;
    this.perPaddedSize = (this.size - this.margins) / this.countPerRow;
    this.perSize = Math.floor((this.size - 1) / this.countPerRow);
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 100);
    this.camera.position.set(0, 0, 1.5);

    // 创建天空
    this.generateSky();

    // mesh
    this.createMesh();

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

    // 参数还原
    restore() {
      this.params = {
        threshold: 0.25,
        opacity: 0.25,
        range: 0.1,
        steps: 100,
      };
      this.update();
      this.setGUI();
    }

  private setGUI() {
    if (this.gui) {
      this.gui.destroy();
    }

    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });

    this.gui.add(this.params, 'threshold', 0, 1, 0.01).name("阈值").onChange(() => {
      this.update();
    });
    this.gui.add(this.params, 'opacity', 0, 1, 0.01).name("透明度").onChange(() => {
      this.update();
    });
    this.gui.add(this.params, 'range', 0, 1, 0.01).name("范围").onChange(() => {
      this.update();
    });
    this.gui.add(this.params, 'steps', 0, 200, 1).name("步幅").onChange(() => {
      this.update();
    });

    this.gui.add(this, "restore").name("还原");
  }

  private update() {
    this.material.uniforms.threshold.value = this.params.threshold;
    this.material.uniforms.opacity.value = this.params.opacity;
    this.material.uniforms.range.value = this.params.range;
    this.material.uniforms.steps.value = this.params.steps;
  }

  // mesh
  private createMesh() {
    const data = new Uint8Array(this.size * this.size * this.size).fill(0);
    const texture = new THREE.Data3DTexture(data, this.size, this.size, this.size);
    texture.format = THREE.RedFormat;
    // 当一个纹素覆盖小于一个像素时，贴图将如何采样
    texture.minFilter = THREE.LinearFilter;
    // 当一个纹素覆盖大于一个像素时，贴图将如何采样
    texture.magFilter = THREE.LinearFilter;
    // .unpackAlignment : number
    // 默认为4。指定内存中每个像素行起点的对齐要求。 
    // 允许的值为1（字节对齐）、2（行对齐到偶数字节）、4（字对齐）和8（行从双字边界开始）。 
    // 请参阅glPixelStorei来了解详细信息。
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
    this.cloudTexture = texture;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material.dispose();
    this.material = new THREE.RawShaderMaterial({
      uniforms: {
        base: { value: new THREE.Color(0x798aa0) },
        map: { value: texture },
        cameraPos: { value: new THREE.Vector3() },
        threshold: { value: 0.25 },
        opacity: { value: 0.25 },
        range: { value: 0.1 },
        steps: { value: 100 },
        frame: { value: 0 }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide,
      transparent: true,
      glslVersion: THREE.GLSL3,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  // 天空
  private generateSky() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 32;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D ;
    const gradient = context.createLinearGradient(0, 0, 0, 32);
    gradient.addColorStop(0.0, '#014a84');
    gradient.addColorStop(0.5, '#0561a0');
    gradient.addColorStop(1.0, '#437ab6');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1, 32);

    const geometry = new THREE.SphereGeometry(10);
    const material = new THREE.MeshBasicMaterial({ 
      side: THREE.BackSide,
      map: new THREE.CanvasTexture(canvas),
    });
    const sky = new THREE.Mesh(geometry, material);

    this.scene.add(sky);
  }

  // 核心算法
  private createCloudTexture(size: number, factor = 1.0) {
    const data = new Uint8Array(size * size * size);
    const scale = factor * 10.0 / size;

    let i = 0;
    const perlin = new ImprovedNoise();
    const vector = new THREE.Vector3();

    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dist = vector.set(x, y, z).subScalar(size / 2).divideScalar(size).length();
          const fading = (1.0 - dist) * (1.0 - dist);
          const noise = perlin.noise(x * scale / 1.5, y * scale, z * scale / 1.5);
          data[i] = (128 + 128 * noise) * fading;
          i++;
        }
      }
    }
    return new THREE.Data3DTexture(data, size, size, size);
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
      // 核心逻辑
      const time = performance.now();
      const diff = time - this.prevTime;
      if (diff > 1500.0 && this.curr < this.totalCount) {
        const x = Math.floor(this.curr % this.countPerRow) * this.perSize + this.margins * 0.5;
        const y = (Math.floor(((this.curr % this.countSlice) / this.countPerRow))) * this.perSize + this.margins * 0.5;
        const z = Math.floor(this.curr / this.countSlice) * this.perSize + this.margins * 0.5;
        const position = new THREE.Vector3(x, y, z).floor();

        const maxDime = this.perPaddedSize - 1;
        const min = new THREE.Vector3(0, 0, 0);
        const max = new THREE.Vector3(maxDime, maxDime, maxDime);

        // 三维空间盒
        const box = new THREE.Box3(min, max);
        const factor = (Math.random() + 0.5) * 0.5;
        const source = this.createCloudTexture(this.perPaddedSize, factor);

        this.renderer!.copyTextureToTexture3D(box, position, source, this.cloudTexture!);
        this.prevTime = time;
        this.curr++;
      }

      this.material.uniforms.cameraPos.value.copy(this.camera!.position);
      this.material.uniforms.frame.value++;
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

