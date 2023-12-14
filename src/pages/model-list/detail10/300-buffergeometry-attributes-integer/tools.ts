import * as THREE from 'three';
import GUI from 'lil-gui';
import { showFailToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import { fragmentShader, vertexShader } from './vars';

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
  private mesh: THREE.Mesh;
  private vertexShader: string;
  private fragmentShader: string;
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
    this.gui.hide();
    this.mesh = new THREE.Mesh();
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
  }

  init() {
    if (!WebGL.isWebGL2Available()) {
      showFailToast(WebGL.getWebGL2ErrorMessage());
      return false;
    }

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.Fog(0x050505, 2000, 3500);

    // 相机
    this.camera = new THREE.PerspectiveCamera(100, this.aspect, 1, 5000);
    this.camera.position.z = 1500;

    // mode
    this.generateModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;
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

  // 核心 难点
  private generateModel() {
    const triangles = 10000;
    const geometry = new THREE.BufferGeometry();

    const positions: number[] = [];
    const uvs: number[] = [];
    const textureIndices: number[] = [];

    // 三角形在立方体中展开
    const n = 800, n2 = n / 2;
    // 单个三角形尺寸
    const d = 50, d2 = d / 2;

    for (let i = 0; i < triangles; i++) {
      // 位置
      const x = Math.random() * n - n2;
      const y = Math.random() * n - n2;
      const z = Math.random() * n - n2;

      const ax = x + Math.random() * d - d2;
      const ay = y + Math.random() * d - d2;
      const az = z + Math.random() * d - d2;

      const bx = x + Math.random() * d - d2;
      const by = y + Math.random() * d - d2;
      const bz = z + Math.random() * d - d2;

      const cx = x + Math.random() * d - d2;
      const cy = y + Math.random() * d - d2;
      const cz = z + Math.random() * d - d2;

      positions.push(ax, ay, az);
      positions.push(bx, by, bz);
      positions.push(cx, cy, cz);

      // uvs映射
      uvs.push(0.0, 0.0);
      uvs.push(0.5, 1.0);
      uvs.push(1.0, 0.0);

      // 索引
      const t = i % 3;
      textureIndices.push(t, t, t);
    }

    // 位置
    const positionAttr = new THREE.Float32BufferAttribute(positions, 3);
    geometry.setAttribute('position', positionAttr);

    // uv映射
    const uvAttr = new THREE.Float32BufferAttribute(uvs, 2);
    geometry.setAttribute('uv', uvAttr);

    // 索引
    const indexAttr = new THREE.Int32BufferAttribute(textureIndices, 1);
    geometry.setAttribute('textureIndex', indexAttr);

    // 计算球形边界
    geometry.computeBoundingSphere();

    // 材质
    const loader = new THREE.TextureLoader();
    loader.setPath("/examples/");

    const map1 = loader.load('textures/crate.gif');
    const map2 = loader.load('textures/floors/FloorsCheckerboard_S_Diffuse.jpg');
    const map3 = loader.load('textures/terrain/grasslight-big.jpg');

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTextures: {
          value: [map1, map2, map3]
        }
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide,
      glslVersion: THREE.GLSL3,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
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

    {
      const timer = Date.now() * 0.001;
      this.mesh.rotation.x = timer * 0.25;
      this.mesh.rotation.y = timer * 0.5;
    }

    // 执行渲染
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

