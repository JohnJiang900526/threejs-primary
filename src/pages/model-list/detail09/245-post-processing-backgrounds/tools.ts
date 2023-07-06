import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass';
import { CubeTexturePass } from 'three/examples/jsm/postprocessing/CubeTexturePass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass';
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
  private gui: GUI;
  private composer: null | EffectComposer;
  private clearPass: null | ClearPass;
  private texturePass: null | TexturePass;
  private renderPass: null | RenderPass;
  private cubeTexturePassP: null | CubeTexturePass;
  private params: {
    clearPass: boolean,
    clearColor: string,
    clearAlpha: number,
    texturePass: boolean,
    texturePassOpacity: number,
    cubeTexturePass: boolean,
    cubeTexturePassOpacity: number,
    renderPass: boolean
  }
  private group: THREE.Group;
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
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
    this.composer = null;
    this.clearPass = null;
    this.texturePass = null;
    this.renderPass = null;
    this.cubeTexturePassP = null;
    this.params = {
      clearPass: true,
      clearColor: 'white',
      clearAlpha: 1.0,
      texturePass: true,
      texturePassOpacity: 1.0,
      cubeTexturePass: true,
      cubeTexturePassOpacity: 1.0,
      renderPass: true
    };
    this.group = new THREE.Group();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(65, this.aspect, 1, 10);
    this.camera.position.z = 7;

    this.createLight();
    // 渲染器
    this.createRenderer();
    this.createMesh();
    this.postProcessing();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableZoom = false;
    this.controls.update();

    this.initStats();
    this.setUpGUI();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.params, 'clearPass');
    this.gui.add(this.params, 'clearColor', [ 'black', 'white', 'blue', 'green', 'red' ]);
    this.gui.add(this.params, 'clearAlpha', 0, 1);

    this.gui.add(this.params, 'texturePass');
    this.gui.add(this.params, 'texturePassOpacity', 0, 1);

    this.gui.add(this.params, 'cubeTexturePass');
    this.gui.add(this.params, 'cubeTexturePassOpacity', 0, 1);

    this.gui.add(this.params, 'renderPass');
  }

  private formatUrls(prefix: string, postfix: string) {
    return [
      prefix + 'px' + postfix, prefix + 'nx' + postfix,
      prefix + 'py' + postfix, prefix + 'ny' + postfix,
      prefix + 'pz' + postfix, prefix + 'nz' + postfix
    ];
  }

  // 核心
  private postProcessing() {
    this.composer = new EffectComposer(this.renderer as THREE.WebGLRenderer);
    this.clearPass = new ClearPass( this.params.clearColor, this.params.clearAlpha );
    this.composer.addPass(this.clearPass);

    this.texturePass = new TexturePass(new THREE.Texture());
    this.composer.addPass(this.texturePass);

    {
      // 地板 材质
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('/examples/textures/hardwood2_diffuse.jpg', (map) => {
        if (this.texturePass) {
          this.texturePass.map = map;
        }
      });
    }

    {
      // 环境材质
      const loader = new THREE.CubeTextureLoader();
      const ldrUrls = this.formatUrls('/examples/textures/cube/pisa/', '.png');
      loader.load(ldrUrls, (ldrCubeMap) => {
        this.cubeTexturePassP = new CubeTexturePass(this.camera as THREE.PerspectiveCamera, ldrCubeMap);
        this.composer?.insertPass(this.cubeTexturePassP, 2);
      });
    }

    this.renderPass = new RenderPass(this.scene, this.camera as THREE.PerspectiveCamera);
    this.renderPass.clear = false;
    this.composer.addPass(this.renderPass);

    const copyPass = new ShaderPass(CopyShader);
    this.composer.addPass(copyPass);
  }

  private createMesh() {
    const geometry = new THREE.SphereGeometry(1, 48, 24);
    const material = new THREE.MeshStandardMaterial();
    material.roughness = 0.5 * Math.random() + 0.25;
    material.metalness = 0;
    material.color.setHSL(Math.random(), 1.0, 0.3);

    const mesh = new THREE.Mesh(geometry, material);
    this.group.add(mesh);
  }

  private createLight() {
    const light1 = new THREE.PointLight(0xddffdd, 1.0);
    light1.position.set(-70, -70, 70);

    const light2 = new THREE.PointLight(0xffdddd, 1.0);
    light2.position.set(-70, 70, 70);

    const light3 = new THREE.PointLight(0xddddff, 1.0);
    light3.position.set(70, -70, 70);
    
    this.scene.add(light1, light2, light3);
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

    this.stats?.begin();

    {
      if (this.clearPass) {
        this.camera?.updateMatrixWorld(true);
        let newColor = this.clearPass.clearColor;
        switch (this.params.clearColor ) {
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
            newColor = 0xffffff; 
        }
  
        this.clearPass.enabled = this.params.clearPass;
        this.clearPass.clearColor = newColor;
        this.clearPass.clearAlpha = this.params.clearAlpha;
  
        if (this.texturePass) {
          this.texturePass.enabled = this.params.texturePass;
          this.texturePass.opacity = this.params.texturePassOpacity;
        }
        if ( this.cubeTexturePassP !== null ) {
          this.cubeTexturePassP.enabled = this.params.cubeTexturePass;
          this.cubeTexturePassP.opacity = this.params.cubeTexturePassOpacity;
        }
  
        if (this.renderPass) {
          this.renderPass.enabled = this.params.renderPass;
        }
        this.composer?.render();
      }
    }

    this.controls?.update();
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

