import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import { showFailToast } from 'vant';
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
  private material: THREE.RawShaderMaterial;
  private params: { 
    threshold: number;
    steps: number;
  };
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
    this.mesh = new THREE.Mesh();
    this.material = new THREE.RawShaderMaterial();
    this.params = { threshold: 0.6, steps: 200 };
  }

  init() {
    if (!WebGL.isWebGL2Available()) {
      showFailToast(WebGL.getWebGL2ErrorMessage());
      return false;
    }
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 0.1, 100);
    this.camera.position.z = 3;

    // mesh
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
    this.gui.add(this.params, 'threshold', 0, 1, 0.01);
    this.gui.add(this.params, 'steps', 0, 300, 1);
  }

  private createMesh() {
    const size = 128;
    const data = new Uint8Array(size * size * size);

    const perlin = new ImprovedNoise();
    const vector = new THREE.Vector3();
    let i = 0;

    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          vector.set(x, y, z).divideScalar(size);
          const d = perlin.noise(vector.x * 6.5, vector.y * 6.5, vector.z * 6.5);
          data[i++] = (d * size + size);
        }
      }
    }

    const texture = new THREE.Data3DTexture(data, size, size, size);
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    // 打开对齐方式
    // 默认为4。指定内存中每个像素行起点的对齐要求。 
    // 允许的值为1（字节对齐）、2（行对齐到偶数字节）、4（字对齐）和8（行从双字边界开始）。 
    // 请参阅glPixelStorei来了解详细信息。
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    if (this.material) {this.material.dispose()}
    this.material = new THREE.RawShaderMaterial({
      uniforms: {
        map: { value: texture },
        cameraPos: { value: new THREE.Vector3() },
        threshold: { value: 0.6 },
        steps: { value: 200 }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide,
      glslVersion: THREE.GLSL3,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
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

    this.material.uniforms.cameraPos.value.copy(this.camera!.position);
    this.material.uniforms.threshold.value = this.params.threshold;
    this.material.uniforms.steps.value = this.params.steps;

    this.mesh.rotation.y += 0.005;
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

