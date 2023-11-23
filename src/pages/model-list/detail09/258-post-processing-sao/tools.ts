import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass';

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
  private composer: null | EffectComposer
  private renderPass: null | RenderPass;
  private saoPass: null | SAOPass;
  private group: THREE.Object3D;
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
    this.renderPass = null;
    this.saoPass = null;
    this.group = new THREE.Object3D();
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(85, this.aspect, 3, 10);
    this.camera.position.z = 7;

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
    const obj = {
      'Beauty': SAOPass.OUTPUT.Beauty,
      'Beauty+SAO': SAOPass.OUTPUT.Default,
      'SAO': SAOPass.OUTPUT.SAO,
      'Depth': SAOPass.OUTPUT.Depth,
      'Normal': SAOPass.OUTPUT.Normal,
    };
    const params = {
      addSao: true,
    };

    this.gui.add(params, "addSao").name("是否添加sao").onChange(() => {
      if (params.addSao) {
        this.composer?.addPass(this.saoPass!);
      } else {
        this.composer?.removePass(this.saoPass!);
      }
    });

    this.gui.add(this.saoPass!.params, 'output', obj).onChange((value: string) => {
      this.saoPass!.params.output = parseInt(value);
    });
    this.gui.add(this.saoPass!.params, 'saoBias', -1, 1);
    this.gui.add(this.saoPass!.params, 'saoIntensity', 0, 1);
    this.gui.add(this.saoPass!.params, 'saoScale', 0, 10);
    this.gui.add(this.saoPass!.params, 'saoKernelRadius', 1, 100);
    this.gui.add(this.saoPass!.params, 'saoMinResolution', 0, 1);
    this.gui.add(this.saoPass!.params, 'saoBlur');
    this.gui.add(this.saoPass!.params, 'saoBlurRadius', 0, 200);
    this.gui.add(this.saoPass!.params, 'saoBlurStdDev', 0.5, 150);
    this.gui.add(this.saoPass!.params, 'saoBlurDepthCutoff', 0.0, 0.1);
  }

  private generateMesh() {
    const geometry = new THREE.SphereGeometry(3, 48, 24);

    for (let i = 0; i < 120; i++) {
      const material = new THREE.MeshStandardMaterial();
      // 材质的粗糙程度。0.0表示平滑的镜面反射，1.0表示完全漫反射。
      // 默认值为1.0。如果还提供roughnessMap，则两个值相乘。
      material.roughness = 0.5 * Math.random() + 0.25;
      // 材质与金属的相似度。非金属材质，如木材或石材，使用0.0，金属使用1.0，通常没有中间值。 
      // 默认值为0.0。0.0到1.0之间的值可用于生锈金属的外观。如果还提供了metalnessMap，则两个值相乘
      material.metalness = 0;
      material.color.setHSL(Math.random(), 1.0, 0.3);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
      );
      mesh.rotation.set(Math.random(), Math.random(), Math.random());

      const scale = Math.random() * 0.2 + 0.05;
      mesh.scale.set(scale, scale, scale);
      this.group.add(mesh);
    }
  }

  private generateLight() {
    const light1 = new THREE.PointLight(0xddffdd, 0.8);
    light1.position.set(-70, -70, 70);

    const light2 = new THREE.PointLight(0xffdddd, 0.8);
    light2.position.set(-70, 70, 70);

    const light3 = new THREE.PointLight(0xddddff, 0.8);
    light3.position.set(70, -70, 70);

    const light4 = new THREE.AmbientLight(0xffffff, 0.05);

    this.scene.add(light1, light2, light3, light4);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setClearColor(0x000000);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }
  // 创建效果合成器
  private initComposer() {
    this.composer = new EffectComposer(this.renderer!);

    this.renderPass = new RenderPass(this.scene, this.camera!);
    this.composer.addPass(this.renderPass);

    this.saoPass = new SAOPass(this.scene, this.camera!, false, true);
    this.composer.addPass(this.saoPass);
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

    // 执行渲染
    const timer = performance.now();
    this.group.rotation.x = timer * 0.0002;
    this.group.rotation.y = timer * 0.0001;
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
      this.aspect = this.width / this.height;

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      this.renderer?.setSize(this.width, this.height);
      this.composer?.setSize(this.width, this.height);
    };
  }
}

export default THREE;

