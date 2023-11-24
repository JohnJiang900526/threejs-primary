import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass';

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
  private group: THREE.Group;
  private gui: GUI;
  private ssaoPass: null | SSAOPass;
  private params: {
    enable: boolean
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
    this.group = new THREE.Group();
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.ssaoPass = null;
    this.params = {
      enable: true
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xaaaaaa);
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(85, this.aspect, 1, 2000);
    this.camera.position.z = 500;

    // 灯光
    this.generateLight();
    // 创建模型
    this.generateMesh();
    // 渲染器
    this.createRenderer();
    // 效果合成器
    this.initComposer();

    // 控制器
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
    const OUTPUT: any = SSAOPass.OUTPUT;

    const values = {
      'Default': OUTPUT.Default,
      'SSAO Only': OUTPUT.SSAO,
      'SSAO Only + Blur': OUTPUT.Blur,
      'Beauty': OUTPUT.Beauty,
      'Depth': OUTPUT.Depth,
      'Normal': OUTPUT.Normal
    };

    this.gui.add(this.params, 'enable').name("启用合成器");
    this.gui.add(this.ssaoPass!, 'output', values).onChange((value: string) => {
      this.ssaoPass!.output = parseInt(value);
    });
    this.gui.add(this.ssaoPass!, 'kernelRadius', 0, 32).min( 0 ).max( 32 );
    this.gui.add(this.ssaoPass!, 'minDistance', 0.001, 0.02).min( 0.001 ).max( 0.02 );
    this.gui.add(this.ssaoPass!, 'maxDistance', 0.01, 0.3).min( 0.01 ).max( 0.3 );
  }

  private generateMesh() {
    const geometry = new THREE.BoxGeometry(10, 10, 10);

    for (let i = 0; i < 100; i++) {
      const material = new THREE.MeshLambertMaterial({
        color: Math.random() * 0xffffff
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        Math.random() * 400 - 200,
        Math.random() * 400 - 200,
        Math.random() * 400 - 200,
      );
      mesh.rotation.set(
        Math.random(), 
        Math.random(), 
        Math.random(),
      );

      mesh.scale.setScalar(Math.random() * 10 + 2);
      this.group.add(mesh);
    }
  }

  private generateLight() {
    const light1 = new THREE.DirectionalLight();
    const light2 = new THREE.HemisphereLight();

    this.scene.add(light1, light2);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 初始化效果合成器
  private initComposer() {
    this.composer = new EffectComposer(this.renderer!);

    this.ssaoPass = new SSAOPass(this.scene, this.camera!, this.width, this.height);
    this.ssaoPass.kernelRadius = 16;
    this.composer.addPass(this.ssaoPass);
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

    {
      // 控制旋转
      const timer = performance.now();
      this.group.rotation.x = timer * 0.0002;
      this.group.rotation.y = timer * 0.0001;
    }

    // 执行渲染
    if (this.params.enable) {
      this.composer?.render();
    } else {
      this.renderer?.render(this.scene, this.camera!);
    }
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
      this.composer?.setSize(this.width, this.height);
    };
  }
}

export default THREE;

