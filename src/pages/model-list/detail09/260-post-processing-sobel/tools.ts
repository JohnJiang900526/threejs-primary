import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader';
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
  private effectSobel: null | ShaderPass;
  private params: {
    enable: boolean
  };
  private gui: GUI;
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
    this.effectSobel = null;
    this.params = {
      enable: true
    };
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 0.1, 200);
    this.camera.position.set(0, 10, 25);
    this.camera.lookAt(this.scene.position);
    this.scene.add(this.camera);

    // 灯光
    this.generateLight();
    // 模型
    this.generateMesh();
    // 渲染器
    this.createRenderer();
    // 效果合成器
    this.initComposer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 10;
    this.controls.maxDistance = 100;
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
    this.gui.add(this.params, "enable").name("是否使用合成器");
  }

  private generateLight() {
    const light1 = new THREE.AmbientLight(0xcccccc, 0.4);
    const light2 = new THREE.PointLight(0xffffff, 0.8);

    this.scene.add(light1, light2);
  }

  private generateMesh() {
    // 圆环缓冲扭结几何体（TorusKnotGeometry）
    // TorusKnotGeometry(radius : Float, tube : Float, tubularSegments : Integer, radialSegments : Integer, p : Integer, q : Integer)
    // radius - 圆环的半径，默认值为1。
    // tube — 管道的半径，默认值为0.4。
    // tubularSegments — 管道的分段数量，默认值为64。
    // radialSegments — 横截面分段数量，默认值为8。
    // p — 这个值决定了几何体将绕着其旋转对称轴旋转多少次，默认值是2。
    // q — 这个值决定了几何体将绕着其内部圆环旋转多少次，默认值是3。
    const geometry = new THREE.TorusKnotGeometry(4, 1, 256, 32, 2, 3);
    const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "torus";
    this.scene.add(mesh);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 效果合成器
  private initComposer() {
    this.composer = new EffectComposer(this.renderer!);

    const renderPass = new RenderPass(this.scene, this.camera!);
    this.composer.addPass(renderPass);

    const effectGrayScale = new ShaderPass(LuminosityShader);
    this.composer.addPass(effectGrayScale);

    const width = this.width * window.devicePixelRatio;
    const height = this.height * window.devicePixelRatio;
    this.effectSobel = new ShaderPass(SobelOperatorShader);
    this.effectSobel.uniforms['resolution'].value.x = width;
    this.effectSobel.uniforms['resolution'].value.y = height;
    this.composer.addPass(this.effectSobel);
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

    const timer = performance.now();
    const mesh = this.scene.getObjectByName("torus");
    mesh!.rotation.set(
      timer * 0.0005,
      timer * 0.0005,
      timer * 0.0005,
    );

    // 执行渲染
    if (this.params.enable) {
      this.composer!.render();
    } else {
      this.renderer!.render(this.scene, this.camera!);
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

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      this.renderer?.setSize(this.width, this.height);
      this.composer?.setSize(this.width, this.height);

      const width = this.width * window.devicePixelRatio;
      const height = this.height * window.devicePixelRatio;
      this.effectSobel!.uniforms['resolution'].value.x = width;
      this.effectSobel!.uniforms['resolution'].value.y = height;
    };
  }
}

export default THREE;

