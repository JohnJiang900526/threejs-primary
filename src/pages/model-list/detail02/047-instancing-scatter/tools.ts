import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private api: {
    count: number,
    distribution: 'random' | "weighted",
    resample: () => void,
    surfaceColor: number,
    backgroundColor: number,
  }
  private stemMesh: null | THREE.InstancedMesh
  private blossomMesh: null | THREE.InstancedMesh
  private stemGeometry: null | THREE.BufferGeometry
  private blossomGeometry: null | THREE.BufferGeometry
  private stemMaterial: null | THREE.Material
  private blossomMaterial: null | THREE.Material
  private sampler: any
  private count: number
  private ages: Float32Array
  private scales: Float32Array
  private dummy: THREE.Object3D
  private _position: THREE.Vector3
  private _normal: THREE.Vector3
  private _scale: THREE.Vector3
  private surfaceGeometry: THREE.BufferGeometry
  private surfaceMaterial: THREE.MeshLambertMaterial
  private surface: THREE.Mesh
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.api = {
      count: 2000,
      distribution: 'random',
      resample: this.resample,
      surfaceColor: 0xFFF784,
      backgroundColor: 0xE39469,
    };
    this.stemMesh = null;
    this.blossomMesh = null;
    this.stemGeometry = null;
    this.blossomGeometry = null;
    this.stemMaterial = null;
    this.blossomMaterial = null;
    this.sampler = null;
    this.count = this.api.count
    this.ages = new Float32Array(this.api.count);
    this.scales = new Float32Array(this.api.count);
    this.dummy = new THREE.Object3D();
    this._position = new THREE.Vector3();
    this._normal = new THREE.Vector3();
    this._scale = new THREE.Vector3();
    this.surfaceGeometry = new THREE.TorusKnotGeometry(10, 3, 100, 16).toNonIndexed();
    this.surfaceMaterial = new THREE.MeshLambertMaterial({color: this.api.surfaceColor, wireframe: false});
    this.surface = new THREE.Mesh(this.surfaceGeometry, this.surfaceMaterial);
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.api.backgroundColor);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 0.1, 100);
    this.camera.position.set(25, 25, 25);
    this.camera.lookAt(0, 0, 0);

    // 创建光源
    const pointLight = new THREE.PointLight(0xAA8899, 0.75);
    pointLight.position.set(50, -25, 75);
    this.scene.add(pointLight);
    this.scene.add(new THREE.HemisphereLight());

    // 加载对应的模型
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
  private isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 设置模型个数
  setCount(count: number) {
    this.api.count = count;
    (this.stemMesh as THREE.InstancedMesh).count = this.api.count;
    (this.blossomMesh as THREE.InstancedMesh).count = this.api.count;
  }

  // 设置描述
  setDistribution(distribution: 'random' | 'weighted') {
    this.api.distribution = distribution;
    this.resample();
  }

  // 重新取样
  resample() {
    this.sampler = new MeshSurfaceSampler(this.surface);
    this.sampler.setWeightAttribute(this.api.distribution === 'weighted' ? 'uv' : null);
    this.sampler.build();

    for ( let i = 0; i < this.count; i ++ ) {
      this.ages[i] = Math.random();
      this.scales[i] = this.scaleCurve(this.ages[i]);
      this.resampleParticle(i);
    }

    (this.stemMesh as THREE.InstancedMesh).instanceMatrix.needsUpdate = true;
    (this.blossomMesh as THREE.InstancedMesh).instanceMatrix.needsUpdate = true;
  }

  // 加载模型
  private loadModel() {
    const loader = new GLTFLoader();
    const url = "/examples/models/gltf/Flower/Flower.glb";

    loader.load(url, (gltf) => {
      const _stemMesh = gltf.scene.getObjectByName('Stem') as THREE.InstancedMesh;
      const _blossomMesh = gltf.scene.getObjectByName('Blossom') as THREE.InstancedMesh;

      this.stemGeometry = (_stemMesh as THREE.InstancedMesh).geometry.clone();
      this.blossomGeometry = (_blossomMesh as THREE.InstancedMesh).geometry.clone();

      const defaultTransform = new THREE.Matrix4();
      defaultTransform.makeRotationX(Math.PI);
      defaultTransform.multiply(new THREE.Matrix4().makeScale(7, 7, 7));

      this.stemGeometry.applyMatrix4(defaultTransform);
      this.blossomGeometry.applyMatrix4(defaultTransform);

      this.stemMaterial = _stemMesh.material as THREE.Material;
      this.blossomMaterial = _blossomMesh.material as THREE.Material;

      this.stemMesh = new THREE.InstancedMesh(this.stemGeometry, this.stemMaterial, this.count);
      this.blossomMesh = new THREE.InstancedMesh(this.blossomGeometry, this.blossomMaterial, this.count);

      const color = new THREE.Color();
      const blossomPalette = [0xF20587, 0xF2D479, 0xF2C879, 0xF2B077, 0xF24405];

      for (let i = 0; i < this.count; i++) {
        color.setHex(blossomPalette[Math.floor(Math.random() * blossomPalette.length)]);
        this.blossomMesh.setColorAt(i, color);
      }

      this.stemMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.blossomMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      this.resample();

      this.scene.add(this.stemMesh);
      this.scene.add(this.blossomMesh);
      this.scene.add(this.surface);
    });
  }

  private updateParticle(i: number) {
    this.ages[ i ] += 0.005;

    if (this.ages[i] >= 1) {
      this.ages[i] = 0.001;
      this.scales[i] = this.scaleCurve(this.ages[i]);
      this.resampleParticle(i);
      return;
    }

    const prevScale = this.scales[i];
    this.scales[i] = this.scaleCurve(this.ages[i]);
    this._scale.set(this.scales[i] / prevScale, this.scales[i] / prevScale, this.scales[i] / prevScale);

    (this.stemMesh as THREE.InstancedMesh).getMatrixAt(i, this.dummy.matrix);
    this.dummy.matrix.scale(this._scale);
    (this.stemMesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
    (this.blossomMesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
  }

  private scaleCurve(t: number) {
    const easeOutCubic = (t: number) => {
      return (--t) * t * t + 1;
    };

    return Math.abs(easeOutCubic((t > 0.5 ? 1 - t : t) * 2));
  }
  private resampleParticle(i: number) {
    this.sampler.sample(this._position, this._normal);
    this._normal.add(this._position);

    this.dummy.position.copy(this._position);
    this.dummy.scale.set(this.scales[i], this.scales[i], this.scales[i]);
    this.dummy.lookAt(this._normal);
    this.dummy.updateMatrix();

    (this.stemMesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
    (this.blossomMesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
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

    // 执行动画
    if (this.stemMesh && this.blossomMesh) {
      const time = Date.now() * 0.001;

      this.scene.rotation.x = Math.sin(time / 4);
      this.scene.rotation.y = Math.sin(time / 2);

      for (let i = 0; i < this.api.count; i++) {
        this.updateParticle(i);
      }

      this.stemMesh.instanceMatrix.needsUpdate = true;
      this.blossomMesh.instanceMatrix.needsUpdate = true;
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

