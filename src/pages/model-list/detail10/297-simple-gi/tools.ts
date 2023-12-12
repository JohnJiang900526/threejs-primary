import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class GIMesh extends THREE.Mesh {
  copy(source: this, recursive?: boolean | undefined): this {
    super.copy(source, recursive);
    this.geometry = source.geometry.clone();
    return this;
  }
}

// 核心
class SimpleGI {
  private readonly SIZE: number;
  private readonly SIZE2: number;
  private readonly camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private clone: THREE.Scene;
  private rt: THREE.WebGLRenderTarget;
  private normalMatrix: THREE.Matrix3;
  private position: THREE.Vector3;
  private normal: THREE.Vector3
  private bounces: number;
  private currentVertex: number;
  private color: Float32Array;
  private buffer: Uint8Array;
  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    this.SIZE = 32;
    this.SIZE2 = this.SIZE * this.SIZE;

    this.camera = new THREE.PerspectiveCamera(90, 1, 0.01, 100);

    this.renderer = renderer;
    scene.updateMatrixWorld(true);
    this.scene = scene;
    this.clone = scene.clone();

    this.rt = new THREE.WebGLRenderTarget(this.SIZE, this.SIZE);
    this.normalMatrix = new THREE.Matrix3();
    this.position = new THREE.Vector3();
    this.normal = new THREE.Vector3();
    this.bounces = 0;
    this.currentVertex = 0;
    this.color = new Float32Array(3);
    this.buffer = new Uint8Array(this.SIZE2 * 4);
  }

  update() {
    if (this.bounces === 3) { return; }

    // 圆环缓冲扭结几何体（TorusKnotGeometry）
    const object = this.scene.getObjectByName("torusKnot") as THREE.Mesh;
    const geometry = object.geometry;

    const attributes = geometry.attributes;
    const positions = (attributes.position as THREE.BufferAttribute).array;
    const normals = (attributes.normal as THREE.BufferAttribute).array;

    if (!attributes.color) {
      const colors = new Float32Array(positions.length);
      const colorAttr = new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage);

      geometry.setAttribute('color', colorAttr);
    }

    const colors = (attributes.color as THREE.BufferAttribute).array as Float32Array;
    const startVertex = this.currentVertex;
    const totalVertex = positions.length / 3;

    for (let i = 0; i < 32; i++) {
      if (this.currentVertex >= totalVertex) {
        break;
      }

      this.position.fromArray(positions, this.currentVertex * 3);
      this.position.applyMatrix4(object.matrixWorld);

      this.normal.fromArray(normals, this.currentVertex * 3);
      this.normal.applyMatrix3(this.normalMatrix.getNormalMatrix(object.matrixWorld)).normalize();

      this.camera.position.copy(this.position);
      this.camera.lookAt(this.position.add(this.normal));

      this.renderer.setRenderTarget(this.rt);
      this.renderer.render(this.clone, this.camera);

      this.renderer.readRenderTargetPixels(this.rt, 0, 0, this.SIZE, this.SIZE, this.buffer);

      this.color[0] = 0;
      this.color[1] = 0;
      this.color[2] = 0;

      for (let k = 0; k < this.buffer.length; k += 4) {
        this.color[0] += this.buffer[k + 0];
        this.color[1] += this.buffer[k + 1];
        this.color[2] += this.buffer[k + 2];
      }

      colors[this.currentVertex * 3 + 0] = (this.color[0] / (this.SIZE2 * 255));
      colors[this.currentVertex * 3 + 1] = (this.color[1] / (this.SIZE2 * 255));
      colors[this.currentVertex * 3 + 2] = (this.color[2] / (this.SIZE2 * 255));

      this.currentVertex++;
    }

    const color = (attributes.color as THREE.BufferAttribute);
    color.updateRange.offset = startVertex * 3;
    color.updateRange.count = (this.currentVertex - startVertex) * 3;
    color.needsUpdate = true;

    if (this.currentVertex >= totalVertex) {
      this.clone = this.scene.clone();
      this.clone.matrixWorldAutoUpdate = false;
      this.bounces++;
      this.currentVertex = 0;
    }
  }
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
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;
  private simpleGI: null | SimpleGI;
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
    this.simpleGI = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 0.1, 1000);
    this.camera.position.z = 7;

    // TorusKnot
    this.createTorusKnot();
    // room
    this.generateRoom();
    // 渲染器
    this.createRenderer();

    // new SimpleGI( renderer, scene );
    this.simpleGI = new SimpleGI(this.renderer!, this.scene);

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
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

  private createTorusKnot() {
    const geometry = new THREE.TorusKnotGeometry(0.75, 0.20, 128, 32, 1);
    const material = new THREE.MeshBasicMaterial({ 
      vertexColors: true
    });

    const torusKnot = new GIMesh(geometry, material);
    torusKnot.name = "torusKnot";
    this.scene.add(torusKnot);
  }

  private generateRoom() {
    const materials: THREE.MeshBasicMaterial[] = [];

    for (let i = 0; i < 8; i++) {
      const material = new THREE.MeshBasicMaterial({ 
        color: Math.random() * 0xffffff, 
        side: THREE.BackSide,
      });
      materials.push(material);
    }

    const geometry = new THREE.BoxGeometry(3, 3, 3);
    const mesh = new THREE.Mesh(geometry, materials);
    this.scene.add(mesh);
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
    this.simpleGI?.update();

    {
      const torusKnot = this.scene.getObjectByName("torusKnot");
      if (torusKnot) {
        torusKnot.rotation.y += 0.01;
      }
    }

    // 执行渲染
    this.renderer!.setRenderTarget(null);
    this.renderer!.render(this.scene, this.camera!);
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

