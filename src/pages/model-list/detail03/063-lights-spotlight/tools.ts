import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private spotLight: THREE.SpotLight
  private lightHelper: null | THREE.SpotLightHelper
  private textures: {[key: string]: THREE.Texture}
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.spotLight = new THREE.SpotLight();
    this.lightHelper = null;
    this.textures = {};
  }

  // 初始化方法入口
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 1000);
    this.camera.position.set(70, 50, 10);

    // 加载模型
    this.loadModel();

    // 创建光源
    this.createLight();

    // 渲染器
    this.createRenderer();

    // 控制器
    const controls = new OrbitControls(this.camera, this.renderer?.domElement);
    controls.minDistance = 20;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 18, 0);
    controls.update();

    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 设置纹理
  setMap(map: string) {
    // @ts-ignore
    this.spotLight.map = this.textures[map];
  }

  // 设置颜色
  setColor (color: string) {
    this.spotLight.color.setStyle(color);
  }

  // 设置强度
  setIntensity(intensity: number) {
    this.spotLight.intensity = intensity;
  }

  // 设置距离
  setDistance(distance: number) {
    this.spotLight.distance = distance;
  }

  // 设置角度
  setAngle(angle: number) {
    this.spotLight.angle = angle;
  }

  // 设置半阴影
  setPenumbra(penumbra: number) {
    this.spotLight.penumbra = penumbra;
  }

  // 设置衰变
  setDecay(decay: number) {
    this.spotLight.decay = decay;
  }

  setFocus(focus: number) {
    this.spotLight.shadow.focus = focus;
  }

  setShadows(enabled: boolean) {
    if (this.renderer) {
      this.renderer.shadowMap.enabled = enabled;

      this.scene.traverse((child) => {
        const obj = child as THREE.Mesh;
        if (obj.material) {
          (obj.material as THREE.Material).needsUpdate = true;
        }
      });
    }
  }

  // 加载模型
  private loadModel() {
    const loader = new PLYLoader();
    const url = "/examples/models/ply/binary/Lucy100k.ply";

    loader.load(url, (geometry) => {
      geometry.scale(0.024, 0.024, 0.024);
      geometry.computeVertexNormals();

      const mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial());
      mesh.rotation.y = -Math.PI/2;
      mesh.position.y = 18;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });
  }

  // 创建光源
  private createLight() {
    const loader = new THREE.TextureLoader().setPath("/examples/textures/");
    const filenames = ['disturb.jpg', 'colors.png', 'uv_grid_opengl.jpg'];

    filenames.forEach((filename) => {
      const texture = loader.load(filename);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.encoding = THREE.sRGBEncoding;
      this.textures[filename] = texture;
    });

    this.spotLight = new THREE.SpotLight(0xffffff, 5);
    this.spotLight.position.set(25, 50, 25);
    this.spotLight.angle = Math.PI/6;
    this.spotLight.penumbra = 1;
    this.spotLight.decay = 2;
    this.spotLight.distance = 100;
    // @ts-ignore
    this.spotLight.map = this.textures['disturb.jpg'];

    this.spotLight.castShadow = true;
    this.spotLight.shadow.mapSize.width = 1024;
    this.spotLight.shadow.mapSize.height = 1024;
    this.spotLight.shadow.camera.near = 10;
    this.spotLight.shadow.camera.far = 200;
    this.spotLight.shadow.focus = 1;
    this.scene.add(this.spotLight);

    // 帮助
    this.lightHelper = new THREE.SpotLightHelper(this.spotLight);
		this.scene.add(this.lightHelper);

    // geometry
    const geometry = new THREE.PlaneGeometry(1000, 1000);
    const material = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(0, -1, 0);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // - enabled: 如果设置开启，允许在场景中使用阴影贴图。默认是 false
    this.renderer.shadowMap.enabled = true;
    // - type: 定义阴影贴图类型 (未过滤, 关闭部分过滤, 关闭部分双线性过滤), 可选值有
    // THREE.BasicShadowMap
    // THREE.PCFShadowMap (默认)
    // THREE.PCFSoftShadowMap
    // THREE.VSMShadowMap
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    // 默认是NoToneMapping 色调映射
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 色调映射的曝光级别。默认是1
    this.renderer.toneMappingExposure = 1;

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);

    this.renderer.setAnimationLoop(() => { this.render(); });
    this.container.appendChild(this.renderer.domElement);
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  private render() {
    const time = performance.now()/3000;

    this.spotLight.position.x = Math.cos(time) * 25;
    this.spotLight.position.z = Math.sin(time) * 25;
    if (this.lightHelper) { this.lightHelper.update(); }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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
    };
  }
}

export default THREE;

