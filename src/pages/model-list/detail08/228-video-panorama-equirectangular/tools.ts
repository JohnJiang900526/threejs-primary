import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private video: HTMLVideoElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private isUserInteracting: boolean;
  private lon: number;
  private lat: number;
  private phi: number;
  private theta: number;
  private onPointerDownPointerX: number;
  private onPointerDownPointerY: number;
  private onPointerDownLon: number;
  private onPointerDownLat: number;
  private readonly distance: number;
  constructor(container: HTMLDivElement, video: HTMLVideoElement) {
    this.container = container;
    this.video = video;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.isUserInteracting = false;
    this.lon = 0;
    this.lat = 0;
    this.phi = 0;
    this.theta = 0;
    this.onPointerDownPointerX = 0;
    this.onPointerDownPointerY = 0;
    this.onPointerDownLon = 0;
    this.onPointerDownLat = 0;
    this.distance = 50;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 1, 1100);

    this.createMesh();
    // 渲染器
    this.createRenderer();

    this.initStats();
    this.bind();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 核心
  private bind() {
    if (this.isMobile()) {
      this.container.onpointerdown = null;
      this.container.onpointermove = null;
      this.container.onpointerleave = null;
      this.container.ontouchstart = (event) => {
        const e = event.touches[0];

        this.isUserInteracting = true;
				this.onPointerDownPointerX = e.clientX;
				this.onPointerDownPointerY = e.clientY - 45;
				this.onPointerDownLon = this.lon;
				this.onPointerDownLat = this.lat;        
      };

      this.container.ontouchmove = (event) => {
        const e = event.touches[0];

        if (this.isUserInteracting) {
					this.lon = (this.onPointerDownPointerX - e.clientX) * 0.1 + this.onPointerDownLon;
					this.lat = (this.onPointerDownPointerY - e.clientY - 45) * 0.1 + this.onPointerDownLat;
				}
      }
      this.container.ontouchend = () => {
        this.isUserInteracting = false;
      };
    } else {
      this.container.ontouchstart = null;
      this.container.ontouchmove = null;
      this.container.ontouchend = null;
      this.container.onpointerdown = (e) => {
        this.isUserInteracting = true;
				this.onPointerDownPointerX = e.clientX;
				this.onPointerDownPointerY = e.clientY - 45;
				this.onPointerDownLon = this.lon;
				this.onPointerDownLat = this.lat;
      };
      this.container.onpointermove = (e) => {
        if (this.isUserInteracting) {
					this.lon = (this.onPointerDownPointerX - e.clientX) * 0.1 + this.onPointerDownLon;
					this.lat = (this.onPointerDownPointerY - e.clientY - 45) * 0.1 + this.onPointerDownLat;
				}
      };
      this.container.onpointerleave = () => {
        this.isUserInteracting = false;
      };
    }
  }

  private createMesh() {
    const geometry = (new THREE.SphereGeometry(500, 60, 40)).scale(-1, 1, 1);
    const texture = new THREE.VideoTexture(this.video);
    const material = new THREE.MeshBasicMaterial({ map: texture });
  
    const mesh = new THREE.Mesh(geometry, material);

    this.scene.add(mesh);
    this.video.play();
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

    {
      // 核心
      this.lat = Math.max(-85, Math.min(85, this.lat));
      this.phi = THREE.MathUtils.degToRad(90 - this.lat);
      this.theta = THREE.MathUtils.degToRad(this.lon);

      if (this.camera) {
        this.camera.position.set(
          this.distance * Math.sin(this.phi) * Math.cos(this.theta),
          this.distance * Math.cos(this.phi),
          this.distance * Math.sin(this.phi) * Math.sin(this.theta),
        );
        this.camera.lookAt(0, 0, 0);
      }
    }

    this.stats?.update();

    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 消除 副作用
  dispose() {
    window.cancelAnimationFrame(this.animateNumber);

    this.container.ontouchstart = null;
    this.container.ontouchmove = null;
    this.container.ontouchend = null;

    this.container.onpointerdown = null;
    this.container.onpointermove = null;
    this.container.onpointerleave = null;
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.bind();
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

