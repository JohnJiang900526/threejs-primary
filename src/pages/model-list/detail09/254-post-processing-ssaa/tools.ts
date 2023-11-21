import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import GUI from 'lil-gui';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private stats: null | Stats;
  private animateNumber: number;

  private composer: null | EffectComposer;
  private copyPass: null | ShaderPass;
  private cameraP: null | THREE.PerspectiveCamera;
  private ssaaRenderPassP: null | SSAARenderPass;
  private cameraO: null | THREE.OrthographicCamera;
  private ssaaRenderPassO: null | SSAARenderPass;
  private gui: GUI;
  private params: {
    sampleLevel: number;
    renderToScreen: boolean;
    unbiased: boolean;
    camera: string;
    clearColor: string;
    clearAlpha: number;
    viewOffsetX: number;
    autoRotate: boolean;
  };
  private group: THREE.Group;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.stats = null;
    this.animateNumber = 0;

    this.composer = null;
    this.copyPass = null;
    this.cameraP = null;
    this.ssaaRenderPassP = null;
    this.cameraO = null;
    this.ssaaRenderPassO = null;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.params = {
      sampleLevel: 4,
      renderToScreen: false,
      unbiased: true,
      camera: 'perspective',
      clearColor: 'black',
      clearAlpha: 1.0,
      viewOffsetX: 0,
      autoRotate: true
    };
    this.group = new THREE.Group();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.add(this.group);

    // 相机
    this.generateCamera();
    // 灯光
    this.generateLight();
    // 创建模型
    this.generateMesh();

    // 渲染器
    this.createRenderer();
    // 初始化渲染合成器
    this.initComposer();

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
    this.gui.add(this.params, 'unbiased');
    this.gui.add(this.params, 'renderToScreen').name("渲染到屏幕");
    this.gui.add(this.params, 'sampleLevel', {
      'Level 0: 1 Sample': 0,
      'Level 1: 2 Samples': 1,
      'Level 2: 4 Samples': 2,
      'Level 3: 8 Samples': 3,
      'Level 4: 16 Samples': 4,
      'Level 5: 32 Samples': 5,
    }).name("层级设置");
    this.gui.add(this.params, 'camera', ['perspective', 'orthographic']).name("相机选择");
    this.gui.add(this.params, 'clearColor', ['black', 'white', 'blue', 'green', 'red']).name("颜色");
    this.gui.add(this.params, 'clearAlpha', 0, 1).name("透明度");
    this.gui.add(this.params, 'viewOffsetX', -100, 100).name("X偏移量");
    this.gui.add(this.params, 'autoRotate').name("自动旋转");
  }

  private generateMesh() {
    const geometry = new THREE.SphereGeometry(3, 48, 24);

    for (let i = 0; i < 120; i++) {
      const material = new THREE.MeshStandardMaterial();
      material.roughness = 0.5 * Math.random() + 0.25;
      material.metalness = 0;
      material.color.setHSL( Math.random(), 1.0, 0.3 );

      const mesh = new THREE.Mesh( geometry, material );
      mesh.position.set(
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
      );
      mesh.rotation.set(Math.random(), Math.random(), Math.random());

      mesh.scale.setScalar(Math.random() * 0.2 + 0.05);
      this.group.add(mesh);
    }
  }

  private generateLight() {
    const light1 = new THREE.PointLight(0xddffdd, 1.0);
    light1.position.set(-70, -70, 70);

    const light2 = new THREE.PointLight(0xffdddd, 1.0);
    light2.position.set(-70, 70, 70);

    const light3 = new THREE.PointLight(0xddddff, 1.0);
    light3.position.set(70, -70, 70);

    const light4 = new THREE.AmbientLight(0xffffff, 0.05);

    this.scene.add(light1, light2, light3, light4);
  }

  private generateCamera() {
    this.cameraP = new THREE.PerspectiveCamera(65, this.aspect, 3, 10);
    this.cameraP.position.z = 7;
    this.cameraP.setViewOffset(
      this.width, this.height, 
      this.params.viewOffsetX, 0, 
      this.width, this.height
    );

    this.cameraO = new THREE.OrthographicCamera(
      this.width / -2, this.width / 2, 
      this.height / 2, this.height / -2, 
      3, 10
    );
    this.cameraO.position.z = 7;

    const fov = THREE.MathUtils.degToRad(this.cameraP.fov);
    const hyperfocus = (this.cameraP.near + this.cameraP.far) / 2;
    const height = 2 * Math.tan(fov / 2) * hyperfocus;
    this.cameraO.zoom = this.height / height;
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 渲染合成器
  private initComposer() {
    this.composer = new EffectComposer(this.renderer!);
    this.composer.setPixelRatio(1);

    this.ssaaRenderPassP = new SSAARenderPass(this.scene, this.cameraP!);
    this.composer.addPass(this.ssaaRenderPassP);

    this.ssaaRenderPassO = new SSAARenderPass(this.scene, this.cameraO!);
    this.composer.addPass(this.ssaaRenderPassO);

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

  private render() {
    if (this.params.autoRotate) {
      this.scene.traverse((item) => {
        item.rotation.x += 0.005;
				item.rotation.y += 0.01;
      });
    }

    let newColor = this.ssaaRenderPassP!.clearColor;
    switch (this.params.clearColor) {
      case 'blue': 
        newColor = 0x0000ff; 
        break;
      case 'red': 
        newColor = 0xff0000; 
        break;
      case 'green': 
        newColor = 0x00ff00; 
        break;
      case 'white': 
        newColor = 0xffffff; 
        break;
      case 'black': 
        newColor = 0x000000; 
        break;
      default: 
        newColor = 0x000000;
    }

    this.ssaaRenderPassP!.clearColor = this.ssaaRenderPassO!.clearColor = newColor;
    this.ssaaRenderPassP!.clearAlpha = this.ssaaRenderPassO!.clearAlpha = this.params.clearAlpha;

    this.ssaaRenderPassP!.sampleLevel = this.ssaaRenderPassO!.sampleLevel = this.params.sampleLevel;
    this.ssaaRenderPassP!.unbiased = this.ssaaRenderPassO!.unbiased = this.params.unbiased!;

    this.ssaaRenderPassP!.enabled = (this.params.camera === 'perspective');
    this.ssaaRenderPassO!.enabled = (this.params.camera === 'orthographic');

    this.copyPass!.enabled = ! this.params.renderToScreen;
    this.cameraP!.view!.offsetX = this.params.viewOffsetX;

    this.composer?.render();
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.begin();
    this.render();
    this.stats?.end();
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

      if (this.cameraP) {
        this.cameraP.aspect = this.aspect;
				this.cameraP.setViewOffset(this.width, this.height, this.params.viewOffsetX, 0, this.width, this.height);
        this.cameraP.updateProjectionMatrix();

      }
      
      if (this.cameraO) {
        this.cameraO.left = -this.height * this.aspect;
				this.cameraO.right = this.height * this.aspect;
				this.cameraO.top = this.height;
				this.cameraO.bottom = -this.height;
				this.cameraO.updateProjectionMatrix();
      }

      this.renderer?.setSize(this.width, this.height);
      this.composer?.setSize(this.width, this.height);
    };
  }
}

export default THREE;

