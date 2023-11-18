import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { GUI } from 'lil-gui';

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
  private object: THREE.Object3D
  private light: THREE.DirectionalLight;
  private glitchPass: GlitchPass;
  private gui: GUI;
  private params: { goWild: boolean }
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
    this.object = new THREE.Object3D();
    this.light = new THREE.DirectionalLight(0xffffff);
    this.glitchPass = new GlitchPass();
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
    this.params = { goWild: false };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 1, 1000);
    this.scene.add(this.object);

    // 相机 透视相机（PerspectiveCamera）
    // 用来模拟人眼
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 1000);
    this.camera.position.z = 400;

    this.generateLight();
    this.generateMesh();
    // 渲染器
    this.createRenderer();
    this.initComposer();

    // 轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.animate();
    this.resize();
    this.initGUI();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 初始化作曲家
  private initComposer() {
    this.composer = new EffectComposer(this.renderer!);
    const renderPass = new RenderPass(this.scene, this.camera!);

    // 添加处理过程
    this.composer.addPass(renderPass);
    // 添加处理过程
    this.composer.addPass(this.glitchPass);
  }

  private generateMesh() {
    const geometry = new THREE.SphereGeometry(1, 4, 4);

    for ( let i = 0; i < 100; i ++ ) {
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xffffff * Math.random(), 
        flatShading: true 
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        Math.random() - 0.5, 
        Math.random() - 0.5, 
        Math.random() - 0.5,
      );
      // 将该向量转换为单位向量（unit vector）， 
      // 也就是说，将该向量的方向设置为和原向量相同，但是其长度（length）为1。
      mesh.position.normalize();

      // .multiplyScalar ( s : Float ) : this
      // 将该向量与所传入的标量s进行相乘。
      mesh.position.multiplyScalar(Math.random() * 400);
      mesh.rotation.set(
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2,
      );

      const scale = Math.random() * 50;
      mesh.scale.set(scale, scale, scale);
      this.object.add(mesh);
    }
  }

  // 初始化gui
  private initGUI() {
    this.gui.add(this.params, 'goWild').name("显示故障");
  }

  // 创建光照
  private generateLight() {
    // 漫散射光
    // 环境光会均匀的照亮场景中的所有物体。
    // 环境光不能用来投射阴影，因为它没有方向
    const light1 = new THREE.AmbientLight(0x222222);

    this.light.position.set(1, 1, 1);
    this.scene.add(this.light, light1);
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
    this.animateNumber && cancelAnimationFrame(this.animateNumber);
    this.animateNumber = requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    const goWild = this.glitchPass.goWild;
    if (goWild !== this.params.goWild) {
      this.glitchPass.goWild = this.params.goWild;
    }

    // 执行渲染
    this.object.rotation.x += 0.005;
		this.object.rotation.y += 0.01;

		this.composer?.render();
  }

  // 消除 副作用
  dispose() {
    cancelAnimationFrame(this.animateNumber);
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
    };
  }
}

export default THREE;

