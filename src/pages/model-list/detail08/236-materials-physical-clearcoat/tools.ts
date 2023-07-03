import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import * as Nodes from 'three/examples/jsm/nodes/Nodes';
import { 
  color, float, vec2, texture, 
  normalMap, uv, mul 
} from 'three/examples/jsm/nodes/Nodes';
import { nodeFrame } from 'three/examples/jsm/renderers/webgl/nodes/WebGLNodes';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader';
import { FlakesTexture } from 'three/examples/jsm/textures/FlakesTexture';
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
  private animateNumber: number;

  private controls: null | OrbitControls;
  private particleLight: THREE.Mesh;
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
    this.particleLight = new THREE.Mesh();
    this.group = new THREE.Group();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(27, this.aspect, 1, 10000);
    this.camera.position.z = 2000;

    this.createLight();

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    this.loadModel().then(() => {
      toast.close();
    }).catch(() => { toast.close(); });

    // 渲染器
    this.createRenderer();

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

  // 核心
  private async loadModel() {
    const loader = new HDRCubeTextureLoader().setPath('/examples/textures/cube/pisaHDR/');
    const urls = ['px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr'];

    const hdrTexture = await loader.loadAsync(urls);
    this.scene.background = hdrTexture;
		this.scene.environment = hdrTexture;

    const geometry = new THREE.SphereGeometry(80, 64, 32);
    const textureLoader = new THREE.TextureLoader();

    const diffuse = await textureLoader.loadAsync('/examples/textures/carbon/Carbon.png');
    diffuse.encoding = THREE.sRGBEncoding;
    diffuse.wrapS = THREE.RepeatWrapping;
    diffuse.wrapT = THREE.RepeatWrapping;

    const normalMap1 = await textureLoader.loadAsync('/examples/textures/carbon/Carbon_Normal.png');
    normalMap1.wrapS = THREE.RepeatWrapping;
    normalMap1.wrapT = THREE.RepeatWrapping;

    const normalMap2 = await textureLoader.loadAsync('/examples/textures/water/Water_1_M_Normal.jpg');

    const normalMap3 = new THREE.CanvasTexture(new FlakesTexture());
    normalMap3.wrapS = THREE.RepeatWrapping;
    normalMap3.wrapT = THREE.RepeatWrapping;
    normalMap3.anisotropy = 16;

    const normalMap4 = await textureLoader.loadAsync('/examples/textures/golfball.jpg');
    const clearcoatNormalMap = await textureLoader.loadAsync('/examples/textures/pbr/Scratched_gold/Scratched_gold_01_1K_Normal.png');

    const carPaintUV = mul(uv(), vec2(10, 6));
    const carPaintNormalScale = vec2(0.15);
    
    // car paint
    {
      const material = new Nodes.MeshPhysicalNodeMaterial({});
      material.clearcoatNode = float(1);
      material.clearcoatRoughnessNode = float(0.1);
      material.metalnessNode = float(0.9);
      material.roughnessNode = float(0.5);
      material.colorNode = color(0x0000ff);
      material.normalNode = normalMap(texture(normalMap3, carPaintUV), carPaintNormalScale);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = -100;
      mesh.position.y = 100;
      this.group.add(mesh);
    }

    // fibers
    {
      const fibersUV = mul(uv(), 10);
      const material = new Nodes.MeshPhysicalNodeMaterial({});
      material.roughnessNode = float(0.5);
      material.clearcoatNode = float(1);
      material.clearcoatRoughnessNode = float(0.1);
      material.colorNode = texture(diffuse, fibersUV);
      material.normalNode = normalMap(texture(normalMap1, fibersUV));

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = 100;
      mesh.position.y = 100;
      this.group.add(mesh);
    }

    // golf
    {
      const material = new Nodes.MeshPhysicalNodeMaterial({});
      material.clearcoatNode = float(1);
      material.roughnessNode = float(0.1);
      material.metalnessNode = float(0);
      material.colorNode = color(0xffffff);
      material.normalNode = normalMap(texture(normalMap4));
      // @ts-ignore
      material.clearcoatNormalNode = normalMap(texture(clearcoatNormalMap), vec2(2.0, - 2.0));

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = -100;
      mesh.position.y = -100;
      this.group.add(mesh);
    }

    // clearcoat + normalmap
    {
      const material = new Nodes.MeshPhysicalNodeMaterial({});
      material.clearcoatNode = float(1);
      material.roughnessNode = float(1);
      material.metalnessNode = float(1);
      material.colorNode = color(0xff0000);
      material.normalNode = normalMap(texture(normalMap2), vec2(0.15, 0.15));
      // @ts-ignore
      material.clearcoatNormalNode = normalMap(texture(clearcoatNormalMap), vec2(2.0, - 2.0));

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = 100;
      mesh.position.y = -100;
      this.group.add(mesh);
    }
  }

  private createLight() {
    const geometry = new THREE.SphereGeometry(4, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const point = new THREE.PointLight(0xffffff, 1)

    this.particleLight = new THREE.Mesh(geometry, material);
    this.particleLight.add(point);

    this.scene.add(this.particleLight);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

    {
      const timer = Date.now() * 0.00025;

      this.particleLight.position.set(
        Math.sin(timer * 7) * 300,
        Math.cos(timer * 5) * 400,
        Math.cos(timer * 3) * 300,
      );
      this.group.children.forEach((mesh) => {
        mesh.rotation.y += 0.005;
      });
    }

    nodeFrame.update();
    this.stats?.update();
    this.controls?.update();

    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
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

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

