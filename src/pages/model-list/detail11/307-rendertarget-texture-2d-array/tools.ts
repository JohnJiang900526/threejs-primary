import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { unzipSync } from 'fflate';
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import { showFailToast, showLoadingToast } from 'vant';
import { fragmentPostprocess, fragmentShader, vertexPostprocess, vertexShader } from './vars';

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
  private dimensions: {
    width: number;
    height: number;
    depth: number;
  }
  private params: {
    intensity: number;
  }
  private postProcessScene: THREE.Scene;
  private postProcessCamera: THREE.OrthographicCamera;
  private renderTarget: THREE.WebGLArrayRenderTarget;
  private postProcessMaterial: THREE.ShaderMaterial;
  private depthStep: number;
  private mesh: THREE.Mesh;
  private planeWidth: number;
  private planeHeight: number;
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
    this.dimensions = {
      width: 256,
      height: 256,
      depth: 109,
    };
    this.params = {
      intensity: 1.0
    };
    this.postProcessScene = new THREE.Scene();
    this.postProcessCamera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
    this.renderTarget = new THREE.WebGLArrayRenderTarget(
      this.dimensions.width, 
      this.dimensions.height, 
      this.dimensions.depth,
    );
    this.renderTarget.texture.format = THREE.RedFormat;
    this.postProcessMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uDepth: { value: 55 },
        uIntensity: { value: 1.0 }
      },
      vertexShader: vertexPostprocess,
      fragmentShader: fragmentPostprocess,
    });
    this.depthStep = 0.4;
    this.mesh = new THREE.Mesh();
    this.planeWidth = 50;
    this.planeHeight = 50;
  }

  init() {
    if (!WebGL.isWebGL2Available()) {
      showFailToast(WebGL.getWebGL2ErrorMessage());
      return false;
    }
    
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 0.1, 2000);
    this.camera.position.z = 70;

    // ScreenQuad
    this.createScreenQuad();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    // load mesh
    this.createMesh();

    this.setGUI();
    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setGUI() {
    this.gui.add(this.params, 'intensity', 0, 1, 0.01).name("强度");
  }

  private createMesh() {
    const url = "textures/3d/head256x256x109.zip";
    const loader = new THREE.FileLoader();
    loader.setPath("/examples/");
    loader.setResponseType("arraybuffer");

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (data) => {
      toast.close();
      const zip = unzipSync(new Uint8Array(data as ArrayBuffer));
      const array = new Uint8Array(zip['head256x256x109'].buffer);

      const texture = new THREE.DataArrayTexture(
        array,
        this.dimensions.width, 
        this.dimensions.height, 
        this.dimensions.depth,
      );
      texture.format = THREE.RedFormat;
      texture.needsUpdate = true;
      this.postProcessMaterial.uniforms.uTexture.value = texture;

      const plane = new THREE.Vector2(this.planeWidth, this.planeHeight);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          diffuse: { 
            value: this.renderTarget.texture 
          },
          depth: { 
            value: 55
          },
          size: { 
            value: plane,
          }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
      });

      const geometry = new THREE.PlaneGeometry(plane.x, plane.y);
      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);

      this.animate();
    }, undefined, () => {
      toast.close();
    });
  }

  private createScreenQuad() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const screenQuad = new THREE.Mesh(geometry, this.postProcessMaterial);
    this.postProcessScene.add(screenQuad);
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

  private renderTo2DArray() {
    const material = this.mesh.material as THREE.ShaderMaterial;
    const layer = Math.floor(material.uniforms['depth'].value);

    this.postProcessMaterial.uniforms.uDepth.value = layer;
    this.renderer?.setRenderTarget(this.renderTarget, layer);
    this.renderer?.render(this.postProcessScene, this.postProcessCamera);
    this.renderer?.setRenderTarget(null);
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      const material = this.mesh.material as THREE.ShaderMaterial;
      var value = material.uniforms['depth'].value;
      value += this.depthStep;
      if (value > 109.0 || value < 0.0) {
        if (value > 1.0) { 
          value = 109.0 * 2.0 - value;
        }

        if (value < 0.0) { 
          value = -value; 
        }

        this.depthStep = -this.depthStep;
      }
      material.uniforms['depth'].value = value;
      // 强度设置
      this.postProcessMaterial.uniforms.uIntensity.value = this.params.intensity;
    }

    // 执行渲染
    this.renderTo2DArray();
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

