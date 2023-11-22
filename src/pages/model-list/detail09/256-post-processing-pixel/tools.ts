import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
// @ts-ignore
import { RenderPixelatedPass } from '@/common/examples/jsm/postprocessing/RenderPixelatedPass.js';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.OrthographicCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private composer: null | EffectComposer;
  private crystalMesh: THREE.Mesh;
  private clock: THREE.Clock;
  private renderPixelatedPass: null | any;
  private gui: GUI;
  private params: {
    pixelSize: number, 
    normalEdgeStrength: number, 
    depthEdgeStrength: number,
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
    this.composer = null;
    this.crystalMesh = new THREE.Mesh();
    this.clock = new THREE.Clock();
    this.renderPixelatedPass = null;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.params = {
      pixelSize: 6,
      normalEdgeStrength: 0.3, 
      depthEdgeStrength: 0.4,
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x151729);

    // 相机
    this.camera = new THREE.OrthographicCamera(-this.aspect, this.aspect, 1, -1, 0.1, 10);
    this.camera.position.y = 2 * Math.tan(Math.PI / 6);
    this.camera.position.z = 5;

    this.generateLight();
    this.generateMesh();
    // 渲染器
    this.createRenderer();
    this.initComposer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.maxZoom = 2;
    this.controls.update();

    this.initGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private initGUI() {
    const renderPass = this.renderPixelatedPass;
    this.gui.add(this.params, 'pixelSize', 1, 16, 1).name("像素").onChange(() => {
      renderPass.setPixelSize(this.params.pixelSize);
    });
    this.gui.add(renderPass, 'normalEdgeStrength', 0, 2, 0.05).name("Normal Edge");
    this.gui.add(renderPass, 'depthEdgeStrength', 0, 1, 0.05).name("Depth Edge");
  }

  private addBox(size: number, x: number, z: number, rotation: number, material: THREE.MeshPhongMaterial) {
    const geometry = new THREE.BoxGeometry(size, size, size);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.rotation.y = rotation;
    mesh.position.y = size / 2;
    mesh.position.set(x, size / 2 + .0001, z);
    this.scene.add(mesh);
    return mesh;
  }

  private pixelTexture(texture: THREE.Texture) {
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private generateMesh() {
    // 材质
    const loader = new THREE.TextureLoader();
    const texChecker = this.pixelTexture(loader.load('/examples/textures/checker.png'));
    const texChecker2 = this.pixelTexture(loader.load('/examples/textures/checker.png'));
    texChecker.repeat.set(30, 30);
    texChecker2.repeat.set(1.5, 1.5);

    const boxMaterial = new THREE.MeshPhongMaterial({ map: texChecker2 });
    // 箱子
    {
      this.addBox(0.4, 0, 0, Math.PI / 4, boxMaterial);
			this.addBox(0.5, -0.5, -0.5, Math.PI / 4, boxMaterial);
    }

    // plane
    {
      const geometry = new THREE.PlaneGeometry(30, 30);
      const material = new THREE.MeshPhongMaterial({ map: texChecker });
			const mesh = new THREE.Mesh(geometry,material);

			mesh.receiveShadow = true;
			mesh.rotation.x = -Math.PI / 2;
			this.scene.add(mesh);
    }

    // crystal
    {
			const geometry = new THREE.IcosahedronGeometry(0.2);
      const material = new THREE.MeshPhongMaterial({
        shininess: 10,
        color: 0x2379cf,
        specular: 0xffffff,
        emissive: 0x143542,
      });
			this.crystalMesh = new THREE.Mesh(geometry, material);
			this.crystalMesh.castShadow = true;
			this.crystalMesh.receiveShadow = true;
			this.scene.add(this.crystalMesh);
    }
  }
  private generateLight() {
    const light1 = new THREE.AmbientLight(0x2d3645, 1.5);

    const light2 = new THREE.DirectionalLight(0xfffc9c, .5);
    light2.position.set(100, 100, 100);
    light2.castShadow = true;
    light2.shadow.mapSize.set(2048, 2048);

    const light3 = new THREE.SpotLight(0xff8800, 1, 10, Math.PI / 16, .02, 2);
    light3.position.set(2, 2, 0);

    const target = light3.target;
    target.position.set(0, 0, 0);
    light3.castShadow = true;
    
    this.scene.add(light1, light2, light3, target);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }
  // 初始化Composer
  private initComposer() {
    this.composer = new EffectComposer(this.renderer!);

    this.renderPixelatedPass = new RenderPixelatedPass(6, this.scene, this.camera!);
    this.composer.addPass(this.renderPixelatedPass);
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

  private easeInOutCubic(x: number) {
    return x ** 2 * 3 - x ** 3 * 2;
  }
  private linearStep(x: number, edge0: number, edge1: number) {
    const w = edge1 - edge0;
    const m = 1 / w;
    const y0 = -m * edge0;
    return THREE.MathUtils.clamp(y0 + m * x, 0, 1);
  }

  private stopGoEased(x: number, downtime: number, period: number) {
    const cycle = ( x / period ) | 0;
    const tween = x - cycle * period;
    const linStep = this.easeInOutCubic(this.linearStep(tween, downtime, period));
    return cycle + linStep;
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    const t = this.clock.getElapsedTime();
    (this.crystalMesh.material as THREE.MeshPhongMaterial).emissiveIntensity = Math.sin(t * 3) * .5 + .5;
    this.crystalMesh.position.y = .7 + Math.sin(t * 2) * .05;
    this.crystalMesh.rotation.y = this.stopGoEased(t, 2, 4) * 2 * Math.PI;


    // 执行渲染
    this.composer?.render();
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

      if (this.camera) {
        this.camera.left = -this.aspect;
        this.camera.right = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      this.renderer?.setSize(this.width, this.height);
      this.composer?.setSize(this.width, this.height);
    };
  }
}

export default THREE;

