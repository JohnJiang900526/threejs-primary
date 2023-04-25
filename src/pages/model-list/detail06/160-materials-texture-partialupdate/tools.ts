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

  private clock: THREE.Clock
  private dataTexture: THREE.DataTexture
  private diffuseMap: THREE.Texture
  private last: number
  private position: THREE.Vector2
  private color: THREE.Color
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

    this.clock = new THREE.Clock();
    this.dataTexture = new THREE.DataTexture();
    this.diffuseMap = new THREE.Texture();
    this.last = 0;
    this.position = new THREE.Vector2();
    this.color = new THREE.Color();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 0.01, 10);
    this.camera.position.z = 3.5;

    this.generateTexture();
    this.generateMap();
    this.generateMesh();

    // 渲染器
    this.createRenderer();

    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateTexture() {
    const width = 32;
    const height = 32;
    const data = new Uint8Array(width * height * 4);

    this.dataTexture = new THREE.DataTexture(data, width, height);
    return this.dataTexture;
  }

  private generateMesh() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ map: this.diffuseMap });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
  }

  private generateMap() {
    const loader = new THREE.TextureLoader();
    const url = "/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg";

    this.diffuseMap = loader.load(url, () => {
      this.animate();
    });
    // 当一个纹素覆盖小于一个像素时，贴图将如何采样。
    // 默认值为THREE.LinearMipmapLinearFilter， 它将使用mipmapping以及三次线性滤镜
    this.diffuseMap.minFilter = THREE.LinearFilter;
    // 是否为纹理生成mipmap（如果可用）。默认为true。 如果你手动生成mipmap，请将其设为false
    this.diffuseMap.generateMipmaps = false;
    return this.diffuseMap;
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

  // 核心
  private updateDataTexture(texture: THREE.DataTexture) {
    this.color.setHex(Math.random() * 0xffffff);

    const size = texture.image.width * texture.image.height;
		const data = texture.image.data;

    const r = Math.floor(this.color.r * 255);
    const g = Math.floor(this.color.g * 255);
    const b = Math.floor(this.color.b * 255);

    for (let i = 0; i < size; i++) {
      const stride = i * 4;
      data[stride] = r;
      data[stride + 1] = g;
      data[stride + 2] = b;
      data[stride + 3] = 1;
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // .getElapsedTime () : Float
    // 获取自时钟启动后的秒数，同时将 .oldTime 设置为当前时间
    // 如果 .autoStart 设置为 true 且时钟并未运行，则该方法同时启动时钟
    const timer = this.clock.getElapsedTime();
    if (timer - this.last > 0.1) {
      this.last = timer;

      this.position.x = (32 * THREE.MathUtils.randInt(1, 16)) - 32;
      this.position.y = (32 * THREE.MathUtils.randInt(1, 16)) - 32;

      this.updateDataTexture(this.dataTexture);

      if (this.renderer && this.camera) {
        // .copyTextureToTexture ( position : Vector2, srcTexture : Texture, dstTexture : Texture, level : Number ) : undefined
        // 将纹理的所有像素复制到一个已有的从给定位置开始的纹理中
        this.renderer.copyTextureToTexture(
          this.position, 
          this.dataTexture, 
          this.diffuseMap
        );
      }
    }
    
    this.stats?.update();
    
    // 执行渲染
    if (this.renderer && this.camera) {
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

