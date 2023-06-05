import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: OrbitControls | null;
  private sceneL: THREE.Scene
  private sceneR: THREE.Scene
  private sliderPosition: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.controls = null;
    this.sceneL = new THREE.Scene();
    this.sceneR = new THREE.Scene();
    this.sliderPosition = this.width / 2;
  }

  init() {
    // 渲染器
    this.createRenderer();

    // 场景
    this.sceneL = new THREE.Scene();
    this.sceneL.background = new THREE.Color(0xBCD48F);

    this.sceneR = new THREE.Scene();
    this.sceneR.background = new THREE.Color(0x8FBCD4);

    // 灯光
    this.generateLight();
    this.generateMeshes();
    this.generateSlider();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.1, 100);
    this.camera.position.z = 6;

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建mesh
  private generateMeshes() {
    const geometry = new THREE.IcosahedronGeometry(1, 3);

    const meshL = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
    this.sceneL.add(meshL);

    const meshR = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ wireframe: true }));
    this.sceneR.add(meshR);
  }

  // Slider 初始化
  private generateSlider() {
    const slider = document.getElementById('slider') as HTMLDivElement;

    const onPointerDown = (event: PointerEvent) => {
      if (event.isPrimary === false ) { return; }

      this.controls && (this.controls.enabled = false);

      window.onpointermove = onPointerMove;
      window.onpointerup = onPointerUp;
    };

    const onPointerUp = () => {
      this.controls && (this.controls.enabled = true);

      window.onpointermove = null;
      window.onpointerup = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.isPrimary === false ) { return; }

      this.sliderPosition = Math.max(0, Math.min(this.width, e.pageX));
      slider.style.left = (this.sliderPosition - (slider.offsetWidth / 2 )) + 'px';
    };

    slider.style.touchAction = 'none';
    slider.onpointerdown = onPointerDown;
  }

  // 灯光
  private generateLight() {
    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    light.position.set(-2, 2, 2);

    this.sceneL.add(light.clone());
    this.sceneR.add(light.clone());
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setScissorTest(true);
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

    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.setScissor(0, 0, this.sliderPosition, this.height);
      this.renderer.render(this.sceneL, this.camera);

      this.renderer.setScissor(this.sliderPosition, 0, this.width, this.height);
      this.renderer.render(this.sceneR, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;
      this.sliderPosition = this.width / 2;

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