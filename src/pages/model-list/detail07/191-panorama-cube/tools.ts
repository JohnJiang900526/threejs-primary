import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { showLoadingToast } from 'vant';
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

  private controls: null | OrbitControls;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.controls = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(90, this.aspect, 0.1, 10000);
    this.camera.position.z = 0.1;

    // 创建模型
    this.createModel();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.rotateSpeed = -0.25;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createModel() {
    const url = "/examples/textures/cube/sun_temple_stripe.jpg";

    this.getTexturesFromImgFile(url, 6, (textures) => {
      const materials: THREE.MeshBasicMaterial[] = [];
  
      textures.forEach((texture) => {
        materials.push(new THREE.MeshBasicMaterial({ map: texture }));
      });
  
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.geometry.scale(1, 1, -1);
      this.scene.add(mesh);
    });
  }

  private getTexturesFromImgFile(url: string, num: number, fn?: (data: THREE.Texture[]) => void) {
    const textures: THREE.Texture[] = [];

    for (let i = 0; i < num; i++) {
      textures[i] = new THREE.Texture();
    }

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    const loader = new THREE.ImageLoader();
    loader.load(url, (image) => {
      toast.close();

      const width = image.height;

      textures.forEach((texture, index) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d") as CanvasRenderingContext2D;

        canvas.width = width;
        canvas.height = width;
        context.drawImage(image, width * index, 0, width, width, 0, 0, width, width);
        texture.image = canvas;
        texture.needsUpdate = true;
      });

      fn && fn(textures);
    }, undefined, () => {
      toast.close();
    });

    return textures;
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

    this.stats?.update();
    this.controls?.update();
    
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

