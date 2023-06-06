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

  private isUserInteracting: boolean;
  private onPointerDownMouseX: number;
  private onPointerDownMouseY: number;
  private lon: number;
  private onPointerDownLon: number;
  private lat: number;
  private onPointerDownLat: number;
  private phi: number;
  private theta: number;
  private material: THREE.MeshBasicMaterial;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.isUserInteracting = false;
    this.onPointerDownMouseX = 0;
    this.onPointerDownMouseY = 0;
    this.lon = 0;
    this.onPointerDownLon = 0;
    this.lat = 0;
    this.onPointerDownLat = 0;
    this.phi = 0;
    this.theta = 0;
    this.material = new THREE.MeshBasicMaterial();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 1, 1100);

    // 创建模型
    this.createModel();

    // 渲染器
    this.createRenderer();

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

  // 核心事件
  private bind() {
    // 鼠标事件
    window.onwheel = (e: WheelEvent) => {
      if (this.camera) {
        const fov = this.camera.fov + e.deltaY * 0.05;

        this.camera.fov = THREE.MathUtils.clamp(fov, 10, 75);
        this.camera.updateProjectionMatrix();
      }
    };

    window.onpointerdown = (e: PointerEvent) => {
      if (e.isPrimary === false ) { return; }

      this.isUserInteracting = true;

      this.onPointerDownMouseX = e.clientX;
      this.onPointerDownMouseY = e.clientY;
      this.onPointerDownLon = this.lon;
      this.onPointerDownLat = this.lat;

      window.onpointermove = (e: PointerEvent) => {
        if (e.isPrimary === false ) { return; }

        this.lon = (this.onPointerDownMouseX - e.clientX) * 0.1 + this.onPointerDownLon;
        this.lat = (e.clientY - this.onPointerDownMouseY) * 0.1 + this.onPointerDownLat;
      };

      window.onpointerup = (e: PointerEvent) => {
        if (e.isPrimary === false ) { return; }

        this.isUserInteracting = false;

        window.onpointermove = null;
        window.onpointerup = null;
      };
    };

    // 拖拽事件
    window.ondragover = (e: DragEvent) => {
      e.preventDefault();
			e.dataTransfer && (e.dataTransfer.dropEffect = 'copy');
    };

    window.ondragenter = () => {
      this.container.style.opacity = "0.5";
    };

    window.ondragleave = () => {
      this.container.style.opacity = "1";
    };

    window.ondrop = (e: DragEvent) => {
      e.preventDefault();

      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.material.map && e.target) {
          this.material.map.image.src = e.target.result;
          this.material.map.needsUpdate = true;
          this.material.needsUpdate = true;
        }
      };

      if (e.dataTransfer && e.dataTransfer.files[0]) {
        reader.readAsDataURL(e.dataTransfer.files[0]);
      }
      this.container.style.opacity = "1";
    };
  }

  private createModel() {
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const texture = new THREE.TextureLoader().load('/examples/textures/2294472375_24a3b8ef46_o.jpg');
    console.log(texture);
    this.material = new THREE.MeshBasicMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(mesh);
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

    // 核心旋转逻辑
    if (!this.isUserInteracting) { this.lon += 0.1; }
    this.lat = Math.max(-85, Math.min(85, this.lat));
    // .degToRad ( degrees : Float ) : Float
    // 将度转化为弧度
    this.phi = THREE.MathUtils.degToRad(90 - this.lat);
    this.theta = THREE.MathUtils.degToRad(this.lon);

    const x = 500 * Math.sin(this.phi) * Math.cos(this.theta);
    const y = 500 * Math.cos(this.phi);
    const z = 500 * Math.sin(this.phi) * Math.sin(this.theta);
    
    // 执行渲染
    if (this.renderer && this.camera) {
      this.camera.lookAt(x, y, z);
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

