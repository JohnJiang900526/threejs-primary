import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LightProbeHelper } from 'three/examples/jsm/helpers/LightProbeHelper';
import { LightProbeGenerator } from 'three/examples/jsm/lights/LightProbeGenerator';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private controls: null | OrbitControls
  private camera: null | THREE.PerspectiveCamera;
  private cubeCamera: null | THREE.CubeCamera
  private mesh: THREE.Mesh
  private stats: null | Stats;
  private cubeRenderTarget: THREE.WebGLCubeRenderTarget
  private lightProbe: THREE.LightProbe
  private directionalLight: THREE.DirectionalLight
  private API: {
    lightProbeIntensity: number,
    directionalLightIntensity: number,
    envMapIntensity: number
  }
  private prefix: string
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.controls = null;
    this.camera = null;
    this.cubeCamera = null;
    this.mesh = new THREE.Mesh();
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget();
    this.stats = null;
    this.lightProbe = new THREE.LightProbe();
    this.directionalLight = new THREE.DirectionalLight();
    this.API = {
      lightProbeIntensity: 1.0,
      directionalLightIntensity: 0.2,
      envMapIntensity: 1
    };
    this.prefix = "/examples/textures/cube/pisa/";
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 1000);
    this.camera.position.set(0, 0, 30);

    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    this.cubeCamera = new THREE.CubeCamera(1, 1000, this.cubeRenderTarget);

    // 光线 平行光（DirectionalLight）
    // DirectionalLight( color : Integer, intensity : Float )
    // color - (可选参数) 16进制表示光的颜色。 缺省值为 0xffffff (白色)
    // intensity - (可选参数) 光照的强度。缺省值为1
    this.directionalLight = new THREE.DirectionalLight(0xffffff, this.API.directionalLightIntensity);
    this.directionalLight.position.set(10, 10, 10);
    this.scene.add(this.directionalLight);

    // 光照探针
    // LightProbe( sh : SphericalHarmonics3, intensity : Float )
    // sh - （可选）一个SphericalHarmonics3的实例
    // intensity - （可选）光照探针强度的数值。默认值为1
    this.lightProbe = new THREE.LightProbe();
    this.scene.add(this.lightProbe);

    // 创建环境
    this.createWorld();

    // 创建渲染器
    this.createRenderer();

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.addEventListener("change", () => {this.render();});
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.enablePan = false;
    
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建模型环境
  private createWorld() {
    const loader = new THREE.CubeTextureLoader();
    const urls = [
      `${this.prefix}px.png`, `${this.prefix}nx.png`,
      `${this.prefix}py.png`, `${this.prefix}ny.png`,
      `${this.prefix}pz.png`, `${this.prefix}nz.png`,
    ];
    loader.load(urls, (texture) => {
      texture.encoding = THREE.sRGBEncoding

      this.scene.background = texture;

      if (this.cubeCamera) {
        this.cubeCamera.update(this.renderer as THREE.WebGLRenderer, this.scene);
      }

      this.lightProbe.copy(LightProbeGenerator.fromCubeRenderTarget(
        this.renderer as THREE.WebGLRenderer, 
        this.cubeRenderTarget 
      ));
			this.scene.add(new LightProbeHelper(this.lightProbe, 5));

      this.render();
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    // 如果渲染目标已经使用 .setRenderTarget、之后将直接使用renderTarget.texture.encoding
		this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  private render() {
    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
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

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }

      this.render();
    };
  }
}

export default THREE;

