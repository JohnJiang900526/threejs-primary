import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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
  private mesh: THREE.Mesh
  private stats: null | Stats;
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
    this.mesh = new THREE.Mesh();
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

  setAttr(obj: any) {
    this.API = Object.assign(this.API, obj);

    const {
      lightProbeIntensity,
      directionalLightIntensity,
      envMapIntensity,
    } = this.API;

    this.lightProbe.intensity = lightProbeIntensity;
    this.directionalLight.intensity = directionalLightIntensity;
    (this.mesh.material as THREE.MeshStandardMaterial).envMapIntensity = envMapIntensity;

    this.render();
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
      // .copy ( source : Light ) : this
      // 从source复制 color, intensity 的值到当前光源对象中
      this.lightProbe.copy(LightProbeGenerator.fromCubeTexture(texture));

      const { envMapIntensity } = this.API;
      // 球缓冲几何体（SphereGeometry）
      // 一个用于生成球体的类
      const geometry = new THREE.SphereGeometry(5, 64, 32);
      // 标准网格材质(MeshStandardMaterial)
      // 一种基于物理的标准材质，使用Metallic-Roughness工作流程
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        // 材质与金属的相似度。非金属材质，如木材或石材，使用0.0，金属使用1.0，通常没有中间值
        //  默认值为0.0。0.0到1.0之间的值可用于生锈金属的外观。如果还提供了metalnessMap，则两个值相乘
        metalness: 0,
        // 材质的粗糙程度。0.0表示平滑的镜面反射，1.0表示完全漫反射。
        // 默认值为1.0。如果还提供roughnessMap，则两个值相乘
        roughness: 0,
        // 环境贴图，为了能够保证物理渲染准确，您应该添加由PMREMGenerator预处理过的环境贴图，默认为null
        envMap: texture,
        // 通过乘以环境贴图的颜色来缩放环境贴图的效果
        envMapIntensity,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);

      this.render();
    });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);

    // 默认是NoToneMapping。查看Renderer constants以获取其它备选项
    this.renderer.toneMapping = THREE.NoToneMapping;
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    // 如果渲染目标已经使用 .setRenderTarget、之后将直接使用renderTarget.texture.encoding
		this.renderer.outputEncoding = THREE.sRGBEncoding;

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

