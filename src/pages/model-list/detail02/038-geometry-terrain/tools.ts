import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | FirstPersonControls
  private stats: null | Stats
  private mesh: THREE.Mesh
  private texture: THREE.Texture
  private worldWidth: number
  private worldDepth: number
  private clock: THREE.Clock
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
    this.mesh = new THREE.Mesh();
    this.texture = new THREE.Texture();
    this.worldWidth = 256;
    this.worldDepth = 256;
    this.clock = new THREE.Clock();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xefd1b5);
    this.scene.fog = new THREE.FogExp2(0xefd1b5, 0.0025);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 1, 10000);
    this.camera.position.set(100, 800, -800);
    this.camera.lookAt(-100, 810, -800);

    // 创建集合
    this.createGeometry();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new FirstPersonControls(this.camera, this.renderer.domElement);
    this.controls.movementSpeed = 15;
    this.controls.lookSpeed = 0.1;

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

  // 创建集合 核心
  private createGeometry() {
    const data = this.generateHeight(this.worldWidth, this.worldDepth);
    // 平面缓冲几何体（PlaneGeometry）一个用于生成平面几何体的类
    const geometry = new THREE.PlaneGeometry(7500, 7500, this.worldWidth - 1, this.worldDepth - 1);

    geometry.rotateX(-Math.PI / 2);
    // @ts-ignore
    const vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0; i < vertices.length; i++, j += 3) {
      // @ts-ignore
      vertices[j + 1] = data[i] * 10;
    }

    // 创建纹理
    const canvas = this.generateTexture(data, this.worldWidth, this.worldDepth)
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    // 创建网格模型
    this.mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({map: this.texture}));
    this.scene.add(this.mesh);
  }

  // 创建几何高度 核心算法
  private generateHeight(width: number, height: number) {
    let seed = Math.PI/4;
    
    Math.random = () => {
      const x = Math.sin(seed++) * 10000;
			return x - Math.floor(x);
    };

    const size = width * height;
    const data = new Uint8Array(size);
		const perlin = new ImprovedNoise();
    const z = Math.random() * 100;

    let quality = 1;
    for (let j = 0; j < 4; j++) {
      for (let i = 0; i < size; i++) {
        const x = i % width;
        const y = ~~(i / width);
        data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);
      }
      quality *= 5;
    }
    return data;
  }

  // 创建材质信息 核心算法
  private generateTexture(data: Uint8Array, width: number, height: number) {
    let context: CanvasRenderingContext2D;
    let image: ImageData;
    let imageData: Uint8ClampedArray;
    let shade: number;

    const vector3 = new THREE.Vector3(0, 0, 0);
    // 将该向量转换为单位向量（unit vector）， 也就是说，将该向量的方向设置为和原向量相同，但是其长度（length）为1
    const sun = new THREE.Vector3(1, 1, 1).normalize();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    image = context.getImageData(0, 0, canvas.width, canvas.height);
    imageData = image.data;

    for (let i = 0, j = 0; i < imageData.length; i += 4, j++) {
      vector3.x = data[j - 2] - data[j + 2];
      vector3.y = 2;
      vector3.z = data[j - width * 2] - data[j + width * 2];
      vector3.normalize();
      shade = vector3.dot(sun);
      imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
      imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
      imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);
    }
    context.putImageData(image, 0, 0);

    const canvasScaled = document.createElement('canvas');
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;

    context = canvasScaled.getContext('2d') as CanvasRenderingContext2D;
    context.scale(4, 4);
    context.drawImage(canvas, 0, 0);

    image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
    imageData = image.data;

    for (let i = 0; i < imageData.length; i += 4) {
      const v = ~~(Math.random() * 5);
      imageData[i] += v;
      imageData[i + 1] += v;
      imageData[i + 2] += v;
    }
    context.putImageData(image, 0, 0);
    return canvasScaled;
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
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    if (this.controls) {
      this.controls.update(this.clock.getDelta());
    }

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

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer && this.controls) {
        this.renderer.setSize(this.width, this.height);
        this.controls.handleResize();
      }
    };
  }
}

export default THREE;

