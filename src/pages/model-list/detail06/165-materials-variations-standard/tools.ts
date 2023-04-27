import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls;
  private particleLight: THREE.Mesh
  private loader: FontLoader
  private texture: THREE.DataTexture
  private font: Font
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.controls = null;
    this.particleLight = new THREE.Mesh();
    this.loader = new FontLoader();
    this.texture = new THREE.DataTexture();
    this.font = new Font({});
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 2500);
    this.camera.position.set(0.0, 400, 400 * 3.5);

    // 创建灯光
    this.generateLight();

    this.generateBackground(() => {
      // 加载字体
      this.getFont(() => {
        // 创建模型
        this.createModel();
      });
    });

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 50;
    this.controls.maxDistance = 2000;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private getFont(fn?: () => void) {
    const url = "/examples/fonts/gentilis_regular.typeface.json";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    this.loader.load(url, (font) => {
      toast.close();
      this.font = font;
      fn && fn();
    }, undefined, () => { toast.close(); });
  }
  // 核心
  private addLabel(name: string, location: THREE.Vector3) {
    const geometry = new TextGeometry(name, {
      // font — THREE.Font的实例
      font: this.font,
      // size — Float。字体大小，默认值为100
      size: 20,
      // height — Float。挤出文本的厚度。默认值为50
      height: 1,
      // curveSegments — Integer。（表示文本的）曲线上点的数量。默认值为12
      curveSegments: 1,
    });

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(location);
    this.scene.add(mesh);
  }
  // 核心
  private createModel() {
    const width = 400;
    const side = 5;
    const radius = (width/side) * 0.8 * 0.5;
    const step = 1.0/side;

    // 创建球形模型
    let index = 0;
    const geometry = new THREE.SphereGeometry(radius, 32, 16);
    for (let x = 0; x <= 1.0; x += step) {
      for (let y = 0; y <= 1.0; y += step) {
        for (let z = 0; z <= 1.0; z += step) {
          const color = new THREE.Color().setHSL(x, 0.5, z * 0.5 + 0.1);
          const envMap = index % 2 === 0 ? null : this.texture
          const material = new THREE.MeshStandardMaterial({
            map: null,
            bumpMap: null,
            bumpScale: 1,
            color,
            metalness: y,
            roughness: 1.0 - x,
            // 环境贴图。默认值为null
            envMap,
          });
          index++;
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(x * 400 - 200, y * 400 - 200, z * 400 - 200);
          this.scene.add(mesh);
        }
      }
      index++;
    }

    // label
    this.addLabel('+roughness', new THREE.Vector3(-350, 0, 0));
    this.addLabel('-roughness', new THREE.Vector3(350, 0, 0));

    this.addLabel('-metalness', new THREE.Vector3(0, -300, 0));
    this.addLabel('+metalness', new THREE.Vector3(0, 300, 0));

    this.addLabel('-diffuse', new THREE.Vector3(0, 0, -300));
    this.addLabel('+diffuse', new THREE.Vector3(0, 0, 300));
  }

  private generateLight() {
    const geometry = new THREE.SphereGeometry(4, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particleLight = new THREE.Mesh(geometry, material);

    const ambient = new THREE.AmbientLight(0x222222);

    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(1, 1, 1).normalize();

    const light2 = new THREE.PointLight(0xffffff, 2, 800);
    this.particleLight.add(light2);

    this.scene.add(ambient, light1, this.particleLight);
  }

  private generateBackground(fn?: () => void) {
    const loader = new RGBELoader();
    const url = "/examples/textures/equirectangular/pedestrian_overpass_1k.hdr";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (texture) => {
      toast.close();
      this.texture = texture;
      this.texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = this.texture;

      fn && fn();
    }, undefined, () => { toast.close(); });
    return this.texture;
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.75;
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
    window.requestAnimationFrame(() => { this.animate(); });

    const timer = Date.now() * 0.00025;
    this.particleLight.position.set(
      Math.sin(timer * 7) * 300,
      Math.cos(timer * 5) * 400,
      Math.cos(timer * 3) * 300,
    );
    
    this.stats?.update();
    this.controls?.update();
    
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
      this.camera.lookAt(this.scene.position);
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

