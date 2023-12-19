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
  private params: {
    threshold: number;
    opacity: number;
    range: number;
    steps: number;
  }
  private material: THREE.RawShaderMaterial;
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
    this.params = {
      threshold: 0.25,
      opacity: 0.25,
      range: 0.1,
      steps: 100,
    };
    this.material = new THREE.RawShaderMaterial();
  }

  init() {
    if (!WebGL.isWebGL2Available()) {
      showFailToast(WebGL.getWebGL2ErrorMessage());
      return false;
    }
    
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(90, this.aspect, 0.1, 100);
    this.camera.position.z = 2;

    // 天空
    this.createSky();
    // mesh
    this.createMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
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
    const update = () => {
      this.material.uniforms.threshold.value = this.params.threshold;
      this.material.uniforms.opacity.value = this.params.opacity;
      this.material.uniforms.range.value = this.params.range;
      this.material.uniforms.steps.value = this.params.steps;
    };
    
    this.gui.add(this.params, 'threshold', 0, 1, 0.01).onChange(update);
    this.gui.add(this.params, 'opacity', 0, 1, 0.01).onChange(update);
    this.gui.add(this.params, 'range', 0, 1, 0.01).onChange(update);
    this.gui.add(this.params, 'steps', 0, 200, 1).onChange(update);
  }

  private createMesh() {
    const size = 128;
    const data = new Uint8Array(size * size * size);

    let i = 0;
    const scale = 0.05;
    const perlin = new ImprovedNoise();
    const vector = new THREE.Vector3();

    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const d = 1.0 - vector.set(x, y, z).subScalar(size / 2).divideScalar(size).length();
          data[i] = (128 + 128 * perlin.noise(x * scale / 1.5, y * scale, z * scale / 1.5)) * d * d;
          i++;
        }
      }
    }

    const texture = new THREE.Data3DTexture(data, size, size, size);
    texture.format = THREE.RedFormat;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      uniforms: {
        base: { value: new THREE.Color(0x798aa0) },
        map: { value: texture },
        cameraPos: { value: new THREE.Vector3() },
        threshold: { value: 0.25 },
        opacity: { value: 0.25 },
        range: { value: 0.1 },
        steps: { value: 100 },
        frame: { value: 0 },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.BackSide,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  private createSky() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 32;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    const gradient = context.createLinearGradient(0, 0, 0, 32);
    gradient.addColorStop(0.0, '#014a84');
    gradient.addColorStop(0.5, '#0561a0');
    gradient.addColorStop(1.0, '#437ab6');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1, 32);

    const geometry = new THREE.SphereGeometry(10);
    const material = new THREE.MeshBasicMaterial({ 
      map: new THREE.CanvasTexture(canvas), 
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(geometry, material);
    this.scene.add(sky);
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
      const timer = performance.now();
      this.material.uniforms.cameraPos.value.copy(this.camera!.position);
      this.material.uniforms.frame.value++;
      this.mesh.rotation.y = -timer / 7500;
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

