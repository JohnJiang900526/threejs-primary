import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { TAARenderPass } from 'three/examples/jsm/postprocessing/TAARenderPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
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
  private animateNumber: number;

  private controls: null | OrbitControls;
  private composer: null | EffectComposer;
  private copyPass: null | ShaderPass;
  private taaRenderPass: null | TAARenderPass;
  private renderPass: null | RenderPass;
  private index: number;
  private gui: GUI;
  private params: { 
    TAAEnabled: string, 
    TAASampleLevel: number,
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
    this.copyPass = null;
    this.taaRenderPass = null;
    this.renderPass = null;
    this.index = 0;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.params = {
      TAAEnabled: '1', 
      TAASampleLevel: 0
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 1000);
    this.camera.position.z = 500;

    // 模型
    this.generateMesh();
    // 渲染器
    this.createRenderer();
    // 初始化 效果合成器
    this.initComposer();

    // 控制面板
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

  private setGUI() {
    const enableValues = {
      'Disabled': '0',
      'Enabled': '1',
    };
    this.gui.add(this.params, 'TAAEnabled', enableValues).onChange(() => {
      this.taaRenderPass!.enabled = (this.params.TAAEnabled === '1');
      this.renderPass!.enabled = (this.params.TAAEnabled !== '1');
    });

    const levelValues = {
      'Level 0: 1 Sample': 0,
      'Level 1: 2 Samples': 1,
      'Level 2: 4 Samples': 2,
      'Level 3: 8 Samples': 3,
      'Level 4: 16 Samples': 4,
      'Level 5: 32 Samples': 5,
    };
    this.gui.add(this.params, 'TAASampleLevel', levelValues).onChange(() => {
      this.taaRenderPass!.sampleLevel = this.params.TAASampleLevel;
    });
  }

  private generateMesh() {
    const geometry = new THREE.BoxGeometry(120, 120, 120);
    const material1 = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      wireframe: true 
    });

    const mesh1 = new THREE.Mesh(geometry, material1);
    mesh1.position.x = -100;

    const loader = new THREE.TextureLoader();
    const texture = loader.load('/examples/textures/brick_diffuse.jpg');
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.anisotropy = 1;
    texture.generateMipmaps = false;

    const material2 = new THREE.MeshBasicMaterial({ map: texture });
    const mesh2 = new THREE.Mesh(geometry, material2);
    mesh2.position.x = 100;
    
    this.scene.add(mesh1, mesh2);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  private initComposer() {
    this.composer = new EffectComposer(this.renderer!);

    this.taaRenderPass = new TAARenderPass(this.scene, this.camera!, "", 0.01);
    this.taaRenderPass.unbiased = false;
    this.composer.addPass(this.taaRenderPass);

    this.renderPass = new RenderPass(this.scene, this.camera!);
    this.renderPass.enabled = false;
    this.composer.addPass(this.renderPass);

    this.copyPass = new ShaderPass(CopyShader);
    this.composer.addPass(this.copyPass);
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

    this.index++;
    if (Math.round(this.index / 200) % 2 === 0) {
      this.scene.traverse((item) => {
        item.rotation.x += 0.005;
        item.rotation.y += 0.01;
      });
      this.taaRenderPass!.accumulate = false;
    } else {
      this.taaRenderPass!.accumulate = true;
    }

    // 执行渲染
    this.composer!.render();
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
      this.composer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

