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
  private sampler: null | MeshSurfaceSampler
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
    // 半球光（HemisphereLight）半球光不能投射阴影
    // 光源直接放置于场景之上，光照颜色从天空光线颜色渐变到地面光线颜色
    // HemisphereLight( skyColor : Integer, groundColor : Integer, intensity : Float )
    // skyColor - (可选参数) 天空中发出光线的颜色。 缺省值 0xffffff
    // groundColor - (可选参数) 地面发出光线的颜色。 缺省值 0xffffff
    // intensity - (可选参数) 光照强度。 缺省值 1
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
  isMobile() {
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
    // 实用程序类，用于对网格表面上的加权随机点进行采样。
    // 加权采样对于某些地形区域中较重的树叶生长或网格特定部分的集中颗粒排放等效果是有用的。
    // 顶点权重可以通过编程编写，或者在Blender等3D工具中手工绘制顶点颜色
    this.sampler = new MeshSurfaceSampler(this.surface);
    // .setWeightAttribute ( name : String ) : this
    // 指定从表面采样时用作权重的顶点属性。权重较高的人脸更有可能被采样，
    // 而权重为零的人脸根本不会被采样。对于向量属性，采样时只使用.x
    this.sampler.setWeightAttribute(this.api.distribution === 'weighted' ? 'uv' : null);
    // 处理输入几何图形并准备返回样本。
    // 几何体或采样器的任何配置都必须在调用此方法之前发生。对于有n个面的曲面，时间复杂度为O(n)
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
      // 根茎
      const _stemMesh = gltf.scene.getObjectByName('Stem') as THREE.InstancedMesh;
      // 花簇
      const _blossomMesh = gltf.scene.getObjectByName('Blossom') as THREE.InstancedMesh;

      this.stemGeometry = (_stemMesh as THREE.InstancedMesh).geometry.clone();
      this.blossomGeometry = (_blossomMesh as THREE.InstancedMesh).geometry.clone();

      const defaultTransform = new THREE.Matrix4();
      // .makeRotationX ( theta : Float ) : this
      // theta — 以弧度为单位的旋转角度
      // 把该矩阵设置为绕x轴旋转弧度theta (θ)大小的矩阵。 结果如下
      defaultTransform.makeRotationX(Math.PI);
      // .multiply ( m : Matrix4 ) : this
      // 将当前矩阵乘以矩阵m
      // .makeScale ( x : Float, y : Float, z : Float ) : this
      // x - 在X轴方向的缩放比
      // y - 在Y轴方向的缩放比
      // z - 在Z轴方向的缩放比
      // 将这个矩阵设置为缩放变换
      defaultTransform.multiply(new THREE.Matrix4().makeScale(7, 7, 7));

      // .applyMatrix4 ( matrix : Matrix4 ) : this
      // 用给定矩阵转换几何体的顶点坐标
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

      // .setUsage ( value : Usage ) : this 用途
      // 将usage设置为value。查看所有可能的输入值的使用常数
      this.stemMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.blossomMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // 重新取样
      this.resample();

      this.scene.add(this.stemMesh);
      this.scene.add(this.blossomMesh);
      this.scene.add(this.surface);
    });
  }

  // 更新调色
  private updateParticle(i: number) {
    this.ages[i] += 0.005;

    if (this.ages[i] >= 1) {
      this.ages[i] = 0.001;
      this.scales[i] = this.scaleCurve(this.ages[i]);
      this.resampleParticle(i);
      return;
    }

    const prevScale = this.scales[i];
    this.scales[i] = this.scaleCurve(this.ages[i]);
    const scale = this.scales[i] / prevScale;
    this._scale.set(scale, scale, scale);

    // .getMatrixAt ( index : Integer, matrix : Matrix4 ) : undefined
    // index: 实例的索引。值必须在 [0, count] 区间
    // matrix: 该4x4矩阵将会被设为已定义实例的本地变换矩阵
    // 获得已定义实例的本地变换矩阵
    (this.stemMesh as THREE.InstancedMesh).getMatrixAt(i, this.dummy.matrix);
    this.dummy.matrix.scale(this._scale);
    // .setMatrixAt ( index : Integer, matrix : Matrix4 ) : undefined
    // index: 实例的索引。值必须在 [0, count] 区间。
    // matrix: 一个4x4矩阵，表示单个实例本地变换。
    // 设置给定的本地变换矩阵到已定义的实例。 请确保在更新所有矩阵后将 .instanceMatrix.needsUpdate 设置为true。
    (this.stemMesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
    (this.blossomMesh as THREE.InstancedMesh).setMatrixAt(i, this.dummy.matrix);
  }

  // 缩放曲线
  private scaleCurve(t: number) {
    const easeOutCubic = (t: number) => {
      return (--t) * t * t + 1;
    };

    return Math.abs(easeOutCubic((t > 0.5 ? 1 - t : t) * 2));
  }

  // 重新取样调色板
  private resampleParticle(i: number) {
    const scale = this.scales[i];
    (this.sampler as MeshSurfaceSampler).sample(this._position, this._normal);
    this._normal.add(this._position);

    this.dummy.position.copy(this._position);
    this.dummy.scale.set(scale, scale, scale);
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

    // 执行场景的自动旋转
    const time = Date.now() * 0.001;
    this.scene.rotation.x = Math.sin(time / 4);
    this.scene.rotation.y = Math.sin(time / 2);
    
    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    
    // 执行动画
    if (this.stemMesh && this.blossomMesh) {
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

