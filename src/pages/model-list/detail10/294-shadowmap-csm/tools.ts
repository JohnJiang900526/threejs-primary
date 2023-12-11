import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { type CMSMode, CSM } from 'three/examples/jsm/csm/CSM';
import { CSMHelper } from 'three/examples/jsm/csm/CSMHelper';

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
  private orthoCamera: null | THREE.OrthographicCamera
  private csm: null | CSM;
  private csmHelper: null | CSMHelper;
  private params: {
    orthographic: boolean;
    fade: boolean;
    far: number;
    mode: string;
    lightX: number;
    lightY: number;
    lightZ: number;
    margin: number;
    lightFar: number;
    lightNear: number;
    autoUpdateHelper: boolean;
    updateHelper: () => void
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
    this.animateNumber = 0;

    this.controls = null;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.orthoCamera = new THREE.OrthographicCamera();
    this.csm = null;
    this.csmHelper = null;
    this.params = {
      orthographic: false,
      fade: false,
      far: 1000,
      mode: 'practical',
      lightX: -1,
      lightY: -1,
      lightZ: -1,
      margin: 100,
      lightFar: 5000,
      lightNear: 1,
      autoUpdateHelper: true,
      updateHelper: () => {
        this.csmHelper?.update();
      }
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#454e61');

    // 相机
    this.camera = new THREE.PerspectiveCamera(90, this.aspect, 0.1, 5000);
    this.camera.position.set(60, 60, 0);
    this.orthoCamera = new THREE.OrthographicCamera();

    // 光线
    this.generateLight();
    // 初始化csm & helper
    this.initCSMAndHelper();
    // 地板
    this.generateFloor();
    // 创建柱子
    this.generateBoxes();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target = new THREE.Vector3(-100, 10, 0);
    this.controls.enableDamping = true;
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

  private setGUI() {
    this.gui.add(this.params, 'orthographic').onChange((value: boolean) => {
      this.csm!.camera = (value ? this.orthoCamera : this.camera) as THREE.Camera;
      this.csm!.updateFrustums();
    });

    this.gui.add(this.params, 'fade').name("淡入淡出").onChange((value: boolean) => {
      this.csm!.fade = value;
      this.csm!.updateFrustums();
    });

    this.gui.add(this.params, 'far', 1, 5000, 1).name('shadow far').onChange((value: number) => {
      this.csm!.maxFar = value;
      this.csm!.updateFrustums();
    });

    const modes = ['uniform', 'logarithmic', 'practical'];
    this.gui.add(this.params, 'mode', modes).name('分割模式').onChange((value: CMSMode) => {
      this.csm!.mode = value;
      this.csm!.updateFrustums();
    });

    const lightFolder = this.gui.addFolder("光线");
    lightFolder.add(this.params, 'lightX', -1, 1).name('X方向').onChange((value: number) => {
      this.csm!.lightDirection.x = value;
    });
    lightFolder.add(this.params, 'lightY', -1, 1).name('Y方向').onChange((value: number) => {
      this.csm!.lightDirection.y = value;
    });
    lightFolder.add(this.params, 'lightZ', -1, 1).name('Z方向').onChange((value: number) => {
      this.csm!.lightDirection.z = value;
    });
    lightFolder.add(this.params, 'margin', 0, 200).name('间隔').onChange((value: number) => {
      this.csm!.lightMargin = value;
    });
    lightFolder.add(this.params, 'lightNear', 1, 10000).name('near').onChange((value: number) => {
      for (let i = 0; i < this.csm!.lights.length; i++) {
        this.csm!.lights[i].shadow.camera.near = value;
        this.csm!.lights[i].shadow.camera.updateProjectionMatrix();
      }
    });
    lightFolder.add(this.params, 'lightFar', 1, 10000).name('far').onChange((value: number) => {
      for (let i = 0; i < this.csm!.lights.length; i++) {
        this.csm!.lights[i].shadow.camera.far = value;
        this.csm!.lights[i].shadow.camera.updateProjectionMatrix();
      }
    });
    lightFolder.close();

    const helperFolder = this.gui.addFolder('帮助');
    helperFolder.add(this.csmHelper!, 'visible').name("是否可见");
    helperFolder.add(this.csmHelper!, 'displayFrustum').onChange(() => {
      this.csmHelper!.updateVisibility();
    });
    helperFolder.add(this.csmHelper!, 'displayPlanes').onChange(() => {
      this.csmHelper!.updateVisibility();
    });
    helperFolder.add(this.csmHelper!, 'displayShadowBounds').onChange(() => {
      this.csmHelper!.updateVisibility();
    });
    helperFolder.add(this.params, 'autoUpdateHelper').name('自动更新');
    helperFolder.add(this.params, 'updateHelper').name('更新');
    helperFolder.close();
  }

  private generateLight() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.5);

    const light2 = new THREE.DirectionalLight(0x000020, 0.5);
    light2.position.set(
      this.params.lightX, 
      this.params.lightY, 
      this.params.lightZ,
    );
    light2.position.normalize().multiplyScalar(-200);

    this.scene.add(light1, light2);
  }

  private initCSMAndHelper() {
    const { lightX, lightY, lightZ } = this.params;
    const direction = new THREE.Vector3(lightX, lightY, lightZ).normalize();

    // CSM
    this.csm = new CSM({
      cascades: 4,
      shadowMapSize: 1024,
      maxFar: this.params.far,
      mode: this.params.mode as CMSMode,
      lightDirection: direction,
      parent: this.scene,
      camera: this.camera!,
    });

    // 帮助
    this.csmHelper = new CSMHelper(this.csm);
    this.csmHelper.visible = false;
    this.scene.add(this.csmHelper);
  }

  private generateFloor() {
    const floorMaterial = new THREE.MeshPhongMaterial({ color: '#252a34' });
    this.csm!.setupMaterial(floorMaterial);

    const geometry = new THREE.PlaneGeometry(10000, 10000, 8, 8);
    const floor = new THREE.Mesh(geometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = true;
    floor.receiveShadow = true;

    this.scene.add(floor);
  }

  private generateBoxes() {
    const material1 = new THREE.MeshPhongMaterial({ color: '#08d9d6' });
    this.csm!.setupMaterial(material1);

    const material2 = new THREE.MeshPhongMaterial({ color: '#ff2e63' });
    this.csm!.setupMaterial(material2);

    const geometry = new THREE.BoxGeometry(10, 10, 10);
    for (let i = 0; i < 40; i++) {
      const cube1 = new THREE.Mesh(geometry, (i % 2 === 0)? material1 : material2);
      cube1.castShadow = true;
      cube1.receiveShadow = true;
      cube1.position.set(-i * 25, 20, 30);
      cube1.scale.y = Math.random() * 2 + 6;

      const cube2 = new THREE.Mesh(geometry, (i % 2 === 0)? material2 : material1);
      cube2.castShadow = true;
      cube2.receiveShadow = true;
      cube2.position.set(-i * 25, 20, -30);
      cube2.scale.y = Math.random() * 2 + 6;

      this.scene.add(cube1, cube2);
    }
  }

  // 更新正交相机
  private updateOrthoCamera() {
    const size = this.controls!.target.distanceTo(this.camera!.position);

    this.orthoCamera!.left = size * this.aspect / -2;
    this.orthoCamera!.right = size * this.aspect / 2;
    this.orthoCamera!.top = size / 2;
    this.orthoCamera!.bottom = size / -2;

    this.orthoCamera!.position.copy(this.camera!.position);
    this.orthoCamera!.rotation.copy(this.camera!.rotation);
    this.orthoCamera!.updateProjectionMatrix();
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    this.camera!.updateMatrixWorld();
    this.csm?.update();

    if (this.params.orthographic) {
      this.updateOrthoCamera();
      this.csm?.updateFrustums();
      if (this.params.autoUpdateHelper) {
        this.csmHelper?.update();
      }
      this.renderer!.render(this.scene, this.orthoCamera!);
    } else {
      if (this.params.autoUpdateHelper) {
        this.csmHelper?.update();
      }
      this.renderer?.render(this.scene, this.camera!);
    }
  }

  // 消除 副作用
  dispose() {
    this.csm?.dispose();
    this.csmHelper?.dispose();
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

      this.updateOrthoCamera();
      this.csm?.updateFrustums();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

