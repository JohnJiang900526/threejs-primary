import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import { showFailToast, showLoadingToast } from 'vant';
import { fragmentShader, vertexShader } from './vars';

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
  private mesh: THREE.Mesh;
  private clock: THREE.Clock;
  private planeWidth: number;
  private planeHeight: number;
  private depthStep: number;
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
    this.mesh = new THREE.Mesh();
    this.clock = new THREE.Clock();
    this.planeWidth = 50;
    this.planeHeight = 25;
    this.depthStep = 1;
  }

  init() {
    if (!WebGL.isWebGL2Available()) {
      showFailToast(WebGL.getWebGL2ErrorMessage());
      return false;
    }
    
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 0.1, 2000);
    this.camera.position.z = 70;

    // 渲染器
    this.createRenderer();
    // 模型
    this.loadModel();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private loadModel() {
    const url = "/examples/textures/spiritedaway.ktx2";
    const loader = new KTX2Loader();
    loader.setTranscoderPath('/examples/js/libs/basis/');
    loader.detectSupport(this.renderer!);

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (textureArray) => {
      toast.close();

      const plane = new THREE.Vector2(this.planeWidth, this.planeHeight);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          diffuse: { value: textureArray },
          depth: { value: 55 },
          size: { value: plane }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        glslVersion: THREE.GLSL3,
      });

      const geometry = new THREE.PlaneGeometry(plane.x, plane.y);
      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);

      this.animate();
    }, undefined, () => {
      toast.close();
    });
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

    {
      if (this.mesh) {
        const delta = this.clock.getDelta() * 10;
        this.depthStep += delta;

        const value = this.depthStep % 5;
        const material = this.mesh.material as THREE.ShaderMaterial;
        material.uniforms['depth'].value = value;
      }
    }

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
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
    };
  }
}

export default THREE;

