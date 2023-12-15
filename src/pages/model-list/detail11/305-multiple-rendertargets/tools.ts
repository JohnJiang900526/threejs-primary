import * as THREE from 'three';
import GUI from 'lil-gui';
import { showFailToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import { gbufferFrag, gbufferVert, renderFrag, renderVert } from './vars';

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
  private renderTarget: null | THREE.WebGLMultipleRenderTargets;
  private postScene: THREE.Scene;
  private postCamera: null | THREE.OrthographicCamera;
  private params: {
    samples: number;
    wireframe: boolean;
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
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.renderTarget = null;
    this.postScene = new THREE.Scene();
    this.postCamera = null;
    this.params = {
      samples: 4,
      wireframe: false,
    };
  }

  init() {
    if (!WebGL.isWebGL2Available()) {
      showFailToast(WebGL.getWebGL2ErrorMessage());
      return false;
    }
    
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x222222);

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 50);
    this.camera.position.z = 6;

    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 渲染目标
    this.initRenderTarget();

    // 渲染网格
    this.createMesh();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;
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
    this.gui.add(this.params, 'samples', 0, 4, 1);
    this.gui.add(this.params, 'wireframe');
  }

  private initRenderTarget() {
    const width = this.width * window.devicePixelRatio;
    const height = this.height * window.devicePixelRatio;

    this.renderTarget = new THREE.WebGLMultipleRenderTargets(width, height, 2);
    this.renderTarget.texture.forEach((texture) => {
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
    });

    this.renderTarget.texture[0].name = 'diffuse';
    this.renderTarget.texture[1].name = 'normal';
  }

  private createMesh() {
    const loader = new THREE.TextureLoader();
    loader.setPath("/examples/");
    const diffuse = loader.load('textures/hardwood2_diffuse.jpg');
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;

    {
      const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 32);
      const material = new THREE.RawShaderMaterial({
        vertexShader: gbufferVert,
        fragmentShader: gbufferFrag,
        uniforms: {
          tDiffuse: { value: diffuse },
          repeat: { value: new THREE.Vector2(5, 0.5) }
        },
        glslVersion: THREE.GLSL3,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = "mesh";
      this.scene.add(mesh);
    }

    {
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.RawShaderMaterial({
        vertexShader: renderVert,
        fragmentShader: renderFrag,
        uniforms: {
          tDiffuse: { value: this.renderTarget!.texture[0] },
          tNormal: { value: this.renderTarget!.texture[1] },
        },
        glslVersion: THREE.GLSL3,
      });
      const mesh = new THREE.Mesh(geometry, material);
      this.postScene.add(mesh);
    }
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

    // 采样
    // @ts-ignore
    this.renderTarget!.samples = this.params.samples;
    this.scene.traverse((item) => {
      if (item instanceof THREE.Mesh) {
        const material = item.material as THREE.RawShaderMaterial;
        if (material) {
          material.wireframe = this.params.wireframe;
        }
      }
    });
    const mesh = this.scene.getObjectByName("mesh") as THREE.Mesh;
    mesh.rotation.y += 0.005;

    this.renderer!.setRenderTarget(this.renderTarget);
    this.renderer!.render(this.scene, this.camera!);

    this.renderer!.setRenderTarget(null);
    this.renderer!.render(this.postScene, this.postCamera!);
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

      const dpr = this.renderer!.getPixelRatio();
      this.renderTarget?.setSize(this.width * dpr, this.height * dpr);
    };
  }
}

export default THREE;

