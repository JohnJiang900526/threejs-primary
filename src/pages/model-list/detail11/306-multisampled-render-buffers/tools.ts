import * as THREE from 'three';
import GUI from 'lil-gui';
import { showFailToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import WebGL from 'three/examples/jsm/capabilities/WebGL';

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
  private clock: THREE.Clock;
  private group: THREE.Group;
  private composer1: null | EffectComposer
  private composer2: null | EffectComposer;
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
    this.gui.hide();
    this.clock = new THREE.Clock();
    this.group = new THREE.Group();
    this.composer1 = null;
    this.composer2 = null;
  }

  init() {
    if (!WebGL.isWebGL2Available()) {
      showFailToast(WebGL.getWebGL2ErrorMessage());
      return false;
    }
    
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.scene.fog = new THREE.Fog(0xcccccc, 1000, 15000);
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.1, 20000);
    this.camera.position.z = 1000;

    // 灯光
    this.generateLight();

    // mesh
    this.generateMesh();

    // 渲染器
    this.createRenderer();

    this.initComposer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;
    this.controls.update();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateMesh() {
    const geometry = new THREE.SphereGeometry(10, 64, 40);
    const material1 = new THREE.MeshLambertMaterial({ 
      color: 0xee0808,
    });
    const material2 = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      wireframe: true,
    });

    for (let i = 0; i < 10; i++) {
      const mesh = new THREE.Mesh(geometry, material1);
      mesh.position.set(
        Math.random() * 600 - 300,
        Math.random() * 600 - 300,
        Math.random() * 600 - 300,
      );

      mesh.rotation.x = Math.random();
      mesh.rotation.z = Math.random();
      mesh.scale.setScalar(Math.random() * 5 + 5);
      this.group.add(mesh);

      const mesh2 = new THREE.Mesh(geometry, material2);
      mesh2.position.copy(mesh.position);
      mesh2.rotation.copy(mesh.rotation);
      mesh2.scale.copy(mesh.scale);
      this.group.add(mesh2);
    }
  }

  private generateLight() {
    const light = new THREE.HemisphereLight(0xffffff, 0x222222, 1.5);
    light.position.set(1, 1, 1);
    this.scene.add(light);
  }

  private initComposer() {
    const size = this.renderer!.getDrawingBufferSize(new THREE.Vector2());
    const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, { samples: 4 });

    const renderPass = new RenderPass(this.scene, this.camera!);
    const copyPass = new ShaderPass(CopyShader);
    this.composer1 = new EffectComposer(this.renderer!);
    this.composer1.addPass(renderPass);
    this.composer1.addPass(copyPass);

    this.composer2 = new EffectComposer(this.renderer!, renderTarget);
    this.composer2.addPass(renderPass);
    this.composer2.addPass(copyPass);
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

    this.stats?.update();
    this.controls?.update();

    const half = this.width / 2;
    this.group.rotation.y += this.clock.getDelta() * 0.1;

    this.renderer?.setScissorTest(true);
    this.renderer?.setScissor(0, 0, half - 1, this.height);
    this.composer1?.render();

    this.renderer?.setScissor(half, 0, half, this.height);
    this.composer2?.render();

    this.renderer?.setScissorTest(false);
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
      this.camera?.updateProjectionMatrix();

      this.renderer?.setSize(this.width, this.height);
      this.composer1?.setSize(this.width, this.height);
      this.composer2?.setSize(this.width, this.height);
    };
  }
}

export default THREE;

