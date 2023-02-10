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
    }

    // 实例化网格（InstancedMesh）
    // 一种具有实例化渲染支持的特殊版本的Mesh。
    // 可以使用 InstancedMesh 来渲染大量具有相同几何体与材质、但具有不同世界变换的物体
    // 使用 InstancedMesh 将帮助你减少 draw call 的数量，从而提升你应用程序的整体渲染性能
    // InstancedMesh( geometry : BufferGeometry, material : Material, count : Integer )
    // geometry - 一个 BufferGeometry 的实例
    // material - 一个 Material 的实例。默认为一个新的 MeshBasicMaterial
    // count - 实例的数量
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    // .setUsage ( value : Usage ) : this
    // 将usage设置为value。查看所有可能的输入值的使用常数
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(this.mesh);
  }

  // 加载模型
  private loadModel() {
    const loader = new THREE.BufferGeometryLoader();
    const url = "/examples/models/json/suzanne_buffergeometry.json";

    loader.load(url, (geometry) => {
      // BufferGeometry
      // 是面片、线或点几何体的有效表述。包括顶点位置，面片索引、法相量、颜色值、UV 坐标和自定义缓存属性值。
      // 使用 BufferGeometry 可以有效减少向 GPU 传输上述数据所需的开销
      this.geometry = geometry;
      // .computeVertexNormals () : undefined
      // 通过面片法向量的平均值计算每个顶点的法向量
      this.geometry.computeVertexNormals();
      // .scale ( x : Float, y : Float, z : Float ) : this
      // 缩放几何体。该操作一般在一次处理中完成，不会循环处理。
      // 典型的用法是通过调用 Object3D.scale 实时旋转几何体
      this.geometry.scale(0.5, 0.5, 0.5);
      // 创建模型
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
            // .setMatrixAt ( index : Integer, matrix : Matrix4 ) : undefined
            // index: 实例的索引。值必须在 [0, count] 区间。
            // matrix: 一个4x4矩阵，表示单个实例本地变换。
            // 设置给定的本地变换矩阵到已定义的实例。 
            // 请确保在更新所有矩阵后将 .instanceMatrix.needsUpdate 设置为true。
            this.mesh.setMatrixAt(i++, this.dummy.matrix);
            // 更新局部变换。
            this.dummy.updateMatrix();
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

