import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats
  private mesh: null | THREE.InstancedMesh
  private amount: number
  private count: number
  private dummy: THREE.Object3D
  private geometry: THREE.BufferGeometry | THREE.InstancedBufferGeometry
  private material: THREE.MeshNormalMaterial
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.mesh = null;
    this.amount = 10;
    this.count = Math.pow(this.amount, 3);
    this.dummy = new THREE.Object3D();
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.MeshNormalMaterial();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(120, this.width/this.height, 1, 1000);
    this.camera.position.set(this.amount * 0.9, this.amount * 0.9, this.amount * 0.9);
    this.camera.lookAt(0, 0, 0);

    // 加载模型
    this.loadModel();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 性能统计
    this.initStats();
    // 动画
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 设置模型个数
  setCount(count: number) {
    this.count = count;
    this.setMesh();
  }

  // 创建模型
  private setMesh() {
    if (this.mesh) {
      this.mesh.dispose();
      this.scene.remove(this.mesh);
  
      this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
      this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.scene.add(this.mesh);
    } else {
      this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
      this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.scene.add(this.mesh);
    }
  }

  // 加载模型
  private loadModel() {
    const loader = new THREE.BufferGeometryLoader();
    const url = "/examples/models/json/suzanne_buffergeometry.json";

    loader.load(url, (geometry) => {
      this.geometry = geometry;
      this.geometry.computeVertexNormals();
      this.geometry.scale(0.5, 0.5, 0.5);

      this.setMesh();
    });
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    if (this.mesh) {
      let i = 0;
      const time = Date.now() * 0.001;
      this.mesh.rotation.x = Math.sin(time / 4);
      this.mesh.rotation.y = Math.sin(time / 2);

      const offset = (this.amount - 1) / 2;
      for (let x = 0; x < this.amount; x++) {
        for (let y = 0; y < this.amount; y++) {
          for (let z = 0; z < this.amount; z++) {
            this.dummy.position.set(offset - x, offset - y, offset - z);
            this.dummy.rotation.y = (Math.sin(x / 4 + time) + Math.sin(y / 4 + time) + Math.sin(z / 4 + time));
            this.dummy.rotation.z = this.dummy.rotation.y * 2;
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i++, this.dummy.matrix);
          }
        }
      }
      this.mesh.instanceMatrix.needsUpdate = true;
    }

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

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
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

