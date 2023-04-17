import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private stats: null | Stats
  private material: THREE.MeshNormalMaterial
  private Method: {
    INSTANCED: string,
    MERGED: string,
    NAIVE: string
  }
  private api: {
    method: string,
		count: number
  }
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
    this.material = new THREE.MeshNormalMaterial();
    this.Method = {
      INSTANCED: 'INSTANCED',
			MERGED: 'MERGED',
			NAIVE: 'NAIVE'
    };
    this.api = {
      method: this.Method.INSTANCED,
			count: 1000
    };
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 1, 100);
    this.camera.position.z = 30;

    // initMesh
    this.initMesh();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.autoRotate = true;

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
    this.api.count = count;

    this.initMesh();
  }

  // 设置加载模式
  setMethod(method: string) {
    this.api.method = method;

    this.initMesh();
  }

  // 初始化网格
  private initMesh() {
    // 先执行清除
    this.clean();

    // 加载模型
    const loader = new THREE.BufferGeometryLoader();
    const url = "/examples/models/json/suzanne_buffergeometry.json";

    loader.load(url, (geometry) => {
      // 通过面片法向量的平均值计算每个顶点的法向量
      geometry.computeVertexNormals();
      switch(this.api.method) {
        case this.Method.INSTANCED:
          this.makeInstanced(geometry);
          break;
        case this.Method.MERGED:
          this.makeMerged(geometry);
          break;
        case this.Method.NAIVE:
          this.makeNaive(geometry);
          break;
        default:
          this.makeInstanced(geometry);
      }
    });
  }

  // 清除模型中的网格对象
  private clean() {
    const meshes: THREE.Mesh[] = [];

    this.scene.traverse((item: THREE.Object3D | THREE.Mesh) => {
      // @ts-ignore
      if (item.isMesh) {
        meshes.push(item as THREE.Mesh);
      }
    });

    meshes.forEach((mesh) => {
      (mesh.material as THREE.Material).dispose();
			mesh.geometry.dispose();
      this.scene.remove(mesh);
    });
  }

  private makeInstanced(geometry: THREE.InstancedBufferGeometry | THREE.BufferGeometry) {
    const matrix = new THREE.Matrix4();
    const randomizeMatrix = this.randomizeMatrix();
    const mesh = new THREE.InstancedMesh(geometry, this.material, this.api.count);

    for (let i = 0; i < this.api.count; i++) {
      randomizeMatrix(matrix);
      mesh.setMatrixAt(i, matrix);
    }
    this.scene.add(mesh);
  }
  private makeMerged(geometry: THREE.InstancedBufferGeometry | THREE.BufferGeometry) {
    const geometries: THREE.BufferGeometry[] = [];
    const randomizeMatrix = this.randomizeMatrix();
    const matrix = new THREE.Matrix4();

    for (let i = 0; i < this.api.count; i++) {
      randomizeMatrix(matrix);
      const instanceGeometry = geometry.clone();
      instanceGeometry.applyMatrix4(matrix);
      geometries.push(instanceGeometry);
    }
    
    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries);
    this.scene.add(new THREE.Mesh(mergedGeometry, this.material));
  }

  private makeNaive(geometry: THREE.InstancedBufferGeometry | THREE.BufferGeometry) {
    const matrix = new THREE.Matrix4();
    const randomizeMatrix = this.randomizeMatrix();

    for (let i = 0; i < this.api.count; i++) {
      randomizeMatrix(matrix);
      const mesh = new THREE.Mesh(geometry, this.material);
      mesh.applyMatrix4(matrix);
      this.scene.add(mesh);
    }
  }

  // 随机矩阵
  private randomizeMatrix() {
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    return  (matrix: THREE.Matrix4) => {
      position.x = Math.random() * 40 - 20;
      position.y = Math.random() * 40 - 20;
      position.z = Math.random() * 40 - 20;

      rotation.x = Math.random() * 2 * Math.PI;
      rotation.y = Math.random() * 2 * Math.PI;
      rotation.z = Math.random() * 2 * Math.PI;

      quaternion.setFromEuler(rotation);
      scale.x = scale.y = scale.z = Math.random() * 1;
      matrix.compose(position, quaternion, scale);
    };
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
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    // 控制器更新
    if (this.controls) { this.controls.update(); }

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

