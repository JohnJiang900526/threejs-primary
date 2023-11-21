import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass';
import { MaskPass, ClearMaskPass } from 'three/examples/jsm/postprocessing/MaskPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private scene1: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private composer: null | EffectComposer;
  private box: THREE.Mesh;
  private torus: THREE.Mesh;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.scene1 = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.composer = null;
    this.box = new THREE.Mesh();
    this.torus = new THREE.Mesh();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 1000);
    this.camera.position.z = 15;

    // 创建模型网格
    this.generateMesh();
    // 渲染器
    this.createRenderer();
    // init composer
    this.initComposer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
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
    this.box = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4));
    this.scene.add(this.box);

    this.torus = new THREE.Mesh(new THREE.TorusGeometry(3, 1, 16, 32));
    this.scene1.add(this.torus);
  }

  // 初始化合成器
  private initComposer() {
    const clearPass = new ClearPass();
    const clearMaskPass = new ClearMaskPass();
    const maskPass1 = new MaskPass(this.scene, this.camera!);
    const maskPass2 = new MaskPass(this.scene1, this.camera!);

    const url1 = '/examples/textures/758px-Canestra_di_frutta_(Caravaggio).jpg';
    const texture1 = new THREE.TextureLoader().load(url1);
    texture1.minFilter = THREE.LinearFilter;

    const url2 = '/examples/textures/2294472375_24a3b8ef46_o.jpg';
    const texture2 = new THREE.TextureLoader().load(url2);

    const texturePass1 = new TexturePass(texture1);
    const texturePass2 = new TexturePass(texture2);
    const outputPass = new ShaderPass(CopyShader);

    const target = new THREE.WebGLRenderTarget(this.width, this.height, {
      stencilBuffer: true
    });

    // 效果合成器（EffectComposer）
    // 用于在three.js中实现后期处理效果。该类管理了产生最终视觉效果的后期处理过程链。 
    // 后期处理过程根据它们添加/插入的顺序来执行，最后一个过程会被自动渲染到屏幕上。
    this.composer = new EffectComposer(this.renderer!, target);
    this.composer.addPass(clearPass);
    this.composer.addPass(maskPass1);
    this.composer.addPass(texturePass1);
    this.composer.addPass(clearMaskPass);
    this.composer.addPass(maskPass2);
    this.composer.addPass(texturePass2);
    this.composer.addPass(clearMaskPass);
    this.composer.addPass(outputPass);
  }


  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.autoClear = false;
    // .setClearColor ( color : Color, alpha : Float ) : undefined
    // 设置颜色及其透明度
    this.renderer.setClearColor(0xe0e0e0);
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
    
    const time = performance.now() * 0.001 + 6000;

    this.stats?.update();
    this.controls?.update();

    {
      this.box.position.x = Math.cos(time / 1.5) * 2;
      this.box.position.y = Math.sin(time) * 2;

      this.box.rotation.x = time;
      this.box.rotation.y = time / 2;
    }

    {
      this.torus.position.x = Math.cos(time) * 2;
      this.torus.position.y = Math.sin(time / 1.5) * 2;

      this.torus.rotation.x = time;
      this.torus.rotation.y = time / 2;
    }

    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer?.clear();
      this.composer?.render(time);
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
    };
  }
}

export default THREE;

