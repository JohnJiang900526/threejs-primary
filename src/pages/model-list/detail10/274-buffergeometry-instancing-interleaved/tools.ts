import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
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
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;
  private mesh: null | THREE.InstancedMesh;
  private instances: number;
  private lastTime: number;
  private moveQ: THREE.Quaternion;
  private tmpQ: THREE.Quaternion;
  private tmpM: THREE.Matrix4;
  private current: THREE.Matrix4;
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
    }).hide();

    this.mesh = null;
    this.instances = 5000;
    this.lastTime = 0;
    this.moveQ = new THREE.Quaternion(0.5, 0.5, 0.5, 0.0).normalize()
    this.tmpQ = new THREE.Quaternion();
    this.tmpM = new THREE.Matrix4();
    this.current = new THREE.Matrix4();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101010);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 1000);

    // 模型
    this.generateMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
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

  private generateMesh() {
    const geometry = new THREE.InstancedBufferGeometry();

    const vertexBuffer = new THREE.InterleavedBuffer(new Float32Array([
      // Front
      -1, 1, 1, 0, 0, 0, 0, 0,
      1, 1, 1, 0, 1, 0, 0, 0,
      -1, -1, 1, 0, 0, 1, 0, 0,
      1, -1, 1, 0, 1, 1, 0, 0,
      // Back
      1, 1, -1, 0, 1, 0, 0, 0,
      -1, 1, -1, 0, 0, 0, 0, 0,
      1, -1, -1, 0, 1, 1, 0, 0,
      -1, -1, -1, 0, 0, 1, 0, 0,
      // Left
      -1, 1, -1, 0, 1, 1, 0, 0,
      -1, 1, 1, 0, 1, 0, 0, 0,
      -1, -1, -1, 0, 0, 1, 0, 0,
      -1, -1, 1, 0, 0, 0, 0, 0,
      // Right
      1, 1, 1, 0, 1, 0, 0, 0,
      1, 1, -1, 0, 1, 1, 0, 0,
      1, -1, 1, 0, 0, 0, 0, 0,
      1, -1, -1, 0, 0, 1, 0, 0,
      // Top
      -1, 1, 1, 0, 0, 0, 0, 0,
      1, 1, 1, 0, 1, 0, 0, 0,
      -1, 1, -1, 0, 0, 1, 0, 0,
      1, 1, -1, 0, 1, 1, 0, 0,
      // Bottom
      1, -1, 1, 0, 1, 0, 0, 0,
      -1, -1, 1, 0, 0, 0, 0, 0,
      1, -1, -1, 0, 1, 1, 0, 0,
      -1, -1, -1, 0, 0, 1, 0, 0
    ]), 8);

    const positionAttr = new THREE.InterleavedBufferAttribute(vertexBuffer, 3, 0);
    geometry.setAttribute('position', positionAttr);

    const uvAttr = new THREE.InterleavedBufferAttribute(vertexBuffer, 2, 4);
    geometry.setAttribute('uv', uvAttr);

    const indices = new Uint16Array([
      0, 2, 1,
      2, 3, 1,
      4, 6, 5,
      6, 7, 5,
      8, 10, 9,
      10, 11, 9,
      12, 14, 13,
      14, 15, 13,
      16, 17, 18,
      18, 17, 19,
      20, 21, 22,
      22, 21, 23
    ]);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // 材质
    const material = new THREE.MeshBasicMaterial();
    const loader = new THREE.TextureLoader();
    material.map = loader.load('/examples/textures/crate.gif');
    material.map.flipY = false;

    // 实例化每一个数据
    const matrix = new THREE.Matrix4();
    const offset = new THREE.Vector3();
    const orientation = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);

    this.mesh = new THREE.InstancedMesh(geometry, material, this.instances);
    for (let i = 0; i < this.instances; i++) {
      // 偏移量
      const x = Math.random() * 100 - 50;
      const y = Math.random() * 100 - 50;
      const z = Math.random() * 100 - 50;

      offset.set(x, y, z).normalize();
      offset.multiplyScalar(5);
      offset.set(x + offset.x, y + offset.y, z + offset.z);

      // 朝向
      orientation.set(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ).normalize();
      matrix.compose(offset, orientation, scale);
      this.mesh.setMatrixAt(i, matrix);
    }

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
      const timer = performance.now();
			this.mesh!.rotation.y = timer * 0.00005;
			const delta = (timer - this.lastTime) / 5000;
			this.tmpQ.set(this.moveQ.x * delta, this.moveQ.y * delta, this.moveQ.z * delta, 1).normalize();
			this.tmpM.makeRotationFromQuaternion(this.tmpQ);

			for (let i = 0; i < this.instances; i++) {
				this.mesh!.getMatrixAt(i, this.current);
				this.current.multiply(this.tmpM);
				this.mesh!.setMatrixAt(i, this.current);
			}

			this.mesh!.instanceMatrix.needsUpdate = true;
			this.lastTime = timer;
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

