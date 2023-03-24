import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader';

interface ModelParamsType {
  x: number,
  y: number,
  geometry: THREE.TorusGeometry | THREE.BoxGeometry,
  material: THREE.MeshBasicMaterial
}

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private meshes: THREE.Mesh[]
  private geometry: THREE.BoxGeometry
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    
    this.meshes = [];
    this.geometry = new THREE.BoxGeometry(200, 200, 200);
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(100, this.aspect, 1, 2000);
    this.camera.position.z = 1000;

    // 创建模型
    this.createModel();

    // webgl渲染器
    this.createRenderer();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 加载模型
  private createModel() {
    const loader = new DDSLoader();

    const map1 = loader.load('/examples/textures/compressed/disturb_dxt1_nomip.dds', () => {});
    map1.minFilter = THREE.LinearFilter;
    map1.magFilter = THREE.LinearFilter;
    // anisotropy -- 沿着轴，通过具有最高纹素密度的像素的样本数。 
    // 默认情况下，这个值为1。设置一个较高的值将会产生比基本的mipmap更清晰的效果，代价是需要使用更多纹理样本。 
    // 使用renderer.getMaxAnisotropy() 来查询GPU中各向异性的最大有效值；这个值通常是2的幂。
    map1.anisotropy = 4;

    const map2 = loader.load('/examples/textures/compressed/disturb_dxt1_mip.dds', () => {});
    map2.anisotropy = 4;

    const map3 = loader.load('/examples/textures/compressed/hepatica_dxt3_mip.dds', () => {});
    map3.anisotropy = 4;

    const map4 = loader.load('/examples/textures/compressed/explosion_dxt5_mip.dds', () => {});
    map4.anisotropy = 4;

    const map5 = loader.load('/examples/textures/compressed/disturb_argb_nomip.dds', () => {});
    map5.minFilter = THREE.LinearFilter;
    map5.magFilter = THREE.LinearFilter;
    map5.anisotropy = 4;

    const map6 = loader.load('/examples/textures/compressed/disturb_argb_mip.dds', () => {});
    map6.anisotropy = 4;


    const cubemap1 = loader.load('/examples/textures/compressed/Mountains.dds', (texture) => {
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.mapping = THREE.CubeReflectionMapping;
      material1.needsUpdate = true;
    });
    const cubemap2 = loader.load('/examples/textures/compressed/Mountains_argb_mip.dds', (texture) => {
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.mapping = THREE.CubeReflectionMapping;
      material5.needsUpdate = true;
    });
    const cubemap3 = loader.load('/examples/textures/compressed/Mountains_argb_nomip.dds', (texture) => {
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.mapping = THREE.CubeReflectionMapping;
      material6.needsUpdate = true;
    });

    const material1 = new THREE.MeshBasicMaterial({ 
      map: map1, 
      // 环境贴图。默认值为null
      envMap: cubemap1 
    });
    const material2 = new THREE.MeshBasicMaterial({ map: map2 });
    const material3 = new THREE.MeshBasicMaterial({ 
      map: map3, 
      alphaTest: 0.5, 
      side: THREE.DoubleSide 
    });
    const material4 = new THREE.MeshBasicMaterial({ 
      // 颜色贴图。可以选择包括一个alpha通道，通常与.transparent 或.alphaTest。默认为null
      map: map4, 
      // 定义将要渲染哪一面 - 正面，背面或两者。 默认为THREE.FrontSide。其他选项有THREE.BackSide和THREE.DoubleSide
      side: THREE.DoubleSide, 
      // 在使用此材质显示对象时要使用何种混合。
      // 必须将其设置为CustomBlending才能使用自定义blendSrc, blendDst 或者 [page:Constant blendEquation]。 
      // 混合模式所有可能的取值请参阅constants。默认值为NormalBlending。
      blending: THREE.AdditiveBlending, 
      // 是否在渲染此材质时启用深度测试。默认为 true
      depthTest: false, 
      // 定义此材质是否透明。这对渲染有影响，因为透明对象需要特殊处理，并在非透明对象之后渲染。
      // 设置为true时，通过设置材质的opacity属性来控制材质透明的程度。默认值为false
      transparent: true 
    });
    const material5 = new THREE.MeshBasicMaterial({ envMap: cubemap2 });
    const material6 = new THREE.MeshBasicMaterial({ envMap: cubemap3 });
    const material7 = new THREE.MeshBasicMaterial({ map: map5 });
    const material8 = new THREE.MeshBasicMaterial({ map: map6 });

    const modelParams: ModelParamsType[] = [
      { x: -200, y: -600, geometry: new THREE.TorusGeometry(100, 50, 32, 16), material: material1 },
      { x: -200, y: -200, geometry: this.geometry, material: material2 },
      { x:  200, y: -200, geometry: this.geometry, material: material3 },
      { x:  200, y: -600, geometry: this.geometry, material: material4 },
      { x:  200, y:  200, geometry: this.geometry, material: material5 },
      { x: -200, y:  200, geometry: this.geometry, material: material6 },
      { x: -200, y:  600, geometry: this.geometry, material: material7 },
      { x:  200, y:  600, geometry: this.geometry, material: material8 },
    ];

    modelParams.forEach((model) => {
      const mesh = new THREE.Mesh(model.geometry, model.material);

      mesh.position.x = model.x;
      mesh.position.y = model.y;

      this.scene.add(mesh);
      this.meshes.push(mesh);
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    const timer = Date.now() * 0.001;
    this.meshes.forEach((mesh) => {
      mesh.rotation.x = timer;
      mesh.rotation.y = timer;
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    if (this.renderer && this.scene && this.camera) {
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
    };
  }
}

export default THREE;

