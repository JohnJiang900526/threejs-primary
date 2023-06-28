import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GUI from 'lil-gui';

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
  private gui: GUI;
  private clock: THREE.Clock;
  private dirLight: THREE.DirectionalLight;
  private spotLight: THREE.SpotLight;
  private torusKnot: THREE.Mesh;
  private dirGroup: THREE.Group;
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
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
    this.clock = new THREE.Clock();
    this.dirLight = new THREE.DirectionalLight();
    this.spotLight = new THREE.SpotLight();
    this.torusKnot = new THREE.Mesh();
    this.dirGroup = new THREE.Group();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222244);
    this.scene.fog = new THREE.Fog(0x222244, 50, 100);

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 1000);
    this.camera.position.set(0, 25, 60);

    // light
    this.createLights();
    // mesh
    this.createMeshes();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(0, 2, 0);
    this.controls.update();

    this.initStats();
    this.setUpGUI();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    const config = {
      spotlightRadius: 4,
      spotlightSamples: 8,
      dirlightRadius: 4,
      dirlightSamples: 8
    };

    const spotlightFolder = this.gui.addFolder('点光');
    spotlightFolder.add(config, 'spotlightRadius', 0, 25).name('半径').onChange((value: number) => {
      this.spotLight.shadow.radius = value;
    });

    spotlightFolder.add(config, 'spotlightSamples', 1, 25, 1).name('采样').onChange((value: number) => {
      this.spotLight.shadow.blurSamples = value;
    });

    const dirlightFolder = this.gui.addFolder('直线光');
    dirlightFolder.add(config, 'dirlightRadius', 0, 25).name('半径').onChange((value: number) => {
      this.dirLight.shadow.radius = value;
    });

    dirlightFolder.add(config, 'dirlightSamples', 1, 25, 1).name('采样').onChange((value: number) => {
      this.dirLight.shadow.blurSamples = value;
    });
  }

  private createMeshes() {
    // torusKnot
    const geometry = new THREE.TorusKnotGeometry(25, 8, 75, 20);
    const material = new THREE.MeshPhongMaterial({
      color: 0x999999,
      shininess: 0,
      specular: 0x222222
    });

    this.torusKnot = new THREE.Mesh(geometry, material);
    this.torusKnot.scale.multiplyScalar( 1 / 18 );
    this.torusKnot.position.y = 3;
    this.torusKnot.castShadow = true;
    this.torusKnot.receiveShadow = true;
    this.scene.add(this.torusKnot);

    // 四根柱子
    const cylinderGeometry = new THREE.CylinderGeometry(0.75, 0.75, 7, 32);

    const pillar1 = new THREE.Mesh(cylinderGeometry, material);
    pillar1.position.set(8, 3.5, 8);
    pillar1.castShadow = true;
    pillar1.receiveShadow = true;

    const pillar2 = pillar1.clone();
    pillar2.position.set(8, 3.5, -8);
    const pillar3 = pillar1.clone();
    pillar3.position.set(-8, 3.5, 8);
    const pillar4 = pillar1.clone();
    pillar4.position.set(-8, 3.5, -8);

    this.scene.add(pillar1, pillar2, pillar3, pillar4);

    // 地板
    const planeGeometry = new THREE.PlaneGeometry(200, 200);
    const planeMaterial = new THREE.MeshPhongMaterial({
      color: 0x999999,
      shininess: 0,
      specular: 0x111111
    });
    const ground = new THREE.Mesh(planeGeometry, planeMaterial);
    ground.rotation.x = - Math.PI / 2;
    ground.scale.multiplyScalar(3);
    ground.castShadow = true;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private createLights() {
    const ambient = new THREE.AmbientLight(0x444444);

    if (this.spotLight) { this.spotLight.dispose(); }
    this.spotLight = new THREE.SpotLight(0xff8888);
    this.spotLight.angle = Math.PI / 5;
    this.spotLight.penumbra = 0.3;
    this.spotLight.position.set(8, 10, 5);
    this.spotLight.castShadow = true;
    this.spotLight.shadow.camera.near = 8;
    this.spotLight.shadow.camera.far = 200;
    this.spotLight.shadow.mapSize.width = 256;
    this.spotLight.shadow.mapSize.height = 256;
    this.spotLight.shadow.bias = -0.002;
    this.spotLight.shadow.radius = 4;


    if (this.dirLight) { this.dirLight.dispose(); }
    this.dirLight = new THREE.DirectionalLight(0x8888ff);
    this.dirLight.position.set(3, 12, 17);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.camera.near = 0.1;
    this.dirLight.shadow.camera.far = 500;
    this.dirLight.shadow.camera.right = 17;
    this.dirLight.shadow.camera.left = -17;
    this.dirLight.shadow.camera.top	= 17;
    this.dirLight.shadow.camera.bottom = -17;
    this.dirLight.shadow.mapSize.width = 512;
    this.dirLight.shadow.mapSize.height = 512;
    this.dirLight.shadow.radius = 4;
    this.dirLight.shadow.bias = - 0.0005;

    this.dirGroup.add(this.dirLight);
    this.scene.add(ambient, this.dirGroup, this.spotLight);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
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
  private animate(time: number = 0) {
    window.requestAnimationFrame((time) => { this.animate(time); });

    const delta = this.clock.getDelta();
    this.torusKnot.rotation.x += 0.25 * delta;
    this.torusKnot.rotation.y += 0.5 * delta;
    this.torusKnot.rotation.z += 1 * delta;

    this.dirGroup.rotation.y += 0.7 * delta;
    this.dirLight.position.z = 17 + Math.sin(time * 0.001 ) * 5;

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

