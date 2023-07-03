import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { 
  MeshPhysicalNodeMaterial, add, mul, 
  normalWorld, timerLocal, 
  // @ts-ignore
  mx_noise_vec3, mx_worley_noise_vec3, 
  // @ts-ignore
  mx_cell_noise_float, mx_fractal_noise_vec3 
} from 'three/examples/jsm/nodes/Nodes';

import { nodeFrame } from 'three/examples/jsm/renderers/webgl/nodes/WebGLNodes';
import { HDRCubeTextureLoader } from 'three/examples/jsm/loaders/HDRCubeTextureLoader';
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
    this.scene.background = new THREE.Color(0xaec5d5);
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

  private async loadModel() {
    const loader = new HDRCubeTextureLoader().setPath('/examples/textures/cube/pisaHDR/');
    const urls = [ 'px.hdr', 'nx.hdr', 'py.hdr', 'ny.hdr', 'pz.hdr', 'nz.hdr'];
    const hdrTexture = await loader.loadAsync(urls);

    this.scene.background = hdrTexture;
    this.scene.environment = hdrTexture;

    const geometry = new THREE.SphereGeometry(80, 64, 32);
    const offsetNode = timerLocal(0);
    const customUV = add(mul(normalWorld, 10), offsetNode);

    // left top
    {
      const material = new MeshPhysicalNodeMaterial({});
      material.colorNode = mx_noise_vec3(customUV);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = -100;
      mesh.position.y = 100;
      this.group.add(mesh);
    }

    // right top
    {
      const material = new MeshPhysicalNodeMaterial({});
      material.colorNode = mx_cell_noise_float(customUV);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = 100;
			mesh.position.y = 100;
      this.group.add(mesh);
    }

    // left bottom
    {
      const material = new MeshPhysicalNodeMaterial({});
      material.colorNode = mx_worley_noise_vec3(customUV);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = -100;
			mesh.position.y = -100;
      this.group.add(mesh);
    }

    // right bottom
    {
      const material = new MeshPhysicalNodeMaterial({});
      material.colorNode = mx_fractal_noise_vec3(mul(customUV, 0.2));
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

