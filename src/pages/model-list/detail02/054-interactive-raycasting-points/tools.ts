import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private raycaster: THREE.Raycaster
  private pointer: THREE.Vector2
  private intersection: null | THREE.Points
  private pointclouds: THREE.Points[]
  private spheresIndex: number
  private clock: THREE.Clock
  private toggle: number
  private spheres: THREE.Mesh[]
  private threshold: number
  private pointSize: number
  private w: number
  private length: number
  private rotateY: THREE.Matrix4
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.intersection = null;
    this.pointclouds = [];
    this.spheresIndex = 0;
    this.clock = new THREE.Clock();
    this.toggle = 0;
    this.spheres = []
    this.threshold = 0.1;
    this.pointSize = 0.05;
    this.w = 80;
    this.length = 160;
    this.rotateY = new THREE.Matrix4().makeRotationY(0.005);
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.width/this.height, 1, 10000);
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(this.scene.position);
    this.camera.updateMatrix();

    // 创建模型
    this.createModel();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 事件绑定
    this.bind();
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

  // 创建模型
  private createModel() {
    const buffer = this.generatePointCloud(new THREE.Color(1, 0, 0), this.w, this.length);
    buffer.scale.set(5, 10, 10);
    buffer.position.set(-5, 0, 0);
    this.scene.add(buffer);

    const indexed = this.indexedPointCloud(new THREE.Color(0, 1, 0), this.w, this.length);
    indexed.scale.set(5, 10, 10);
    indexed.position.set(0, 0, 0);
    this.scene.add(indexed);

    const offset = this.indexedOffsetPointCloud(new THREE.Color(0, 1, 1), this.w, this.length);
    offset.scale.set(5, 10, 10);
    offset.position.set(5, 0, 0);
    this.scene.add(offset);

    // 缓存THREE.Points实例
    this.pointclouds = [buffer, indexed, offset];

    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshBasicMaterial({color: 0xff0000});
    for (let i = 0; i < 40; i++) {
      const sphere = new THREE.Mesh(geometry, material);
      this.scene.add(sphere);
      this.spheres.push(sphere);
    }
    // @ts-ignore 阈值
    this.raycaster.params.Points.threshold = this.threshold;
  }

  // 基础实例方法
  private pointCloudGeometry(color: THREE.Color, width: number = 80, length: number = 160) {
    const geometry = new THREE.BufferGeometry();
    const num = width * length;

    const positions = new Float32Array(num * 3);
    const colors = new Float32Array(num * 3);

    let k = 0;
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < length; j++) {
        const u = i / width;
        const v = j / length;

        const x = u - 0.5;
        const y = (Math.cos(u * Math.PI * 4) + Math.sin(v * Math.PI * 8)) / 20;
        const z = v - 0.5;

        positions[3 * k] = x;
        positions[3 * k + 1] = y;
        positions[3 * k + 2] = z;

        const intensity = (y + 0.1) * 5;
        colors[3 * k] = color.r * intensity;
        colors[3 * k + 1] = color.g * intensity;
        colors[3 * k + 2] = color.b * intensity;
        k++;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    // 计算当前几何体的的边界矩形，该操作会更新已有 [param:.boundingBox]
    // 边界矩形不会默认计算，需要调用该接口指定计算边界矩形，否则保持默认值 null
    geometry.computeBoundingBox();
    return geometry;
  }

  // 基本实例调用
  private generatePointCloud(color: THREE.Color, width: number, length: number) {
    const geometry = this.pointCloudGeometry(color, width, length);
    const material = new THREE.PointsMaterial({size: this.pointSize, vertexColors: true});

    return new THREE.Points(geometry, material);
  }

  // 设置Index的实例
  private indexedPointCloud(color: THREE.Color, width: number, length: number) {
    const geometry = this.pointCloudGeometry(color, width, length);
    const material = new THREE.PointsMaterial({size: this.pointSize, vertexColors: true});

    const num = width * length;
    // Uint16Array 类型数组表示在平台字节顺序中的16位无符号整数数组
    // 可以使用对象的方法引用数组中的元素, 或者使用标准数组索引语法
    const indices = new Uint16Array(num);

    for (let i = 0; i < num; i++) { indices[i] = i; }

    // .setIndex ( index : BufferAttribute ) : this
    // 设置缓存的 .index
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    return new THREE.Points(geometry, material);
  }

  // 设置idnex和添加分组
  private indexedOffsetPointCloud(color: THREE.Color, width: number, length: number) {
    const geometry = this.pointCloudGeometry(color, width, length);
    const material = new THREE.PointsMaterial({size: this.pointSize, vertexColors: true});

    const num = width * length;
    const indices = new Uint16Array(num);

    for (let i = 0; i < num; i++) { indices[i] = i; }

    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    // .addGroup ( start : Integer, count : Integer, materialIndex : Integer ) : undefined
    // 为当前几何体增加一个 group，详见 groups 属性
    geometry.addGroup(0, indices.length);

    return new THREE.Points(geometry, material);
  }

  // 事件绑定
  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];

        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = - ((e.clientY - 45) / this.height) * 2 + 1;
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = - ((e.clientY - 45) / this.height) * 2 + 1;
      }
    }
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
    window.requestAnimationFrame(() => { this.animate(); });

    if (this.camera) {
      // 对当前物体应用这个变换矩阵，并更新物体的位置、旋转和缩放
      this.camera.applyMatrix4(this.rotateY);
      // 更新物体及其后代的全局变换
      this.camera.updateMatrixWorld();
      this.raycaster.setFromCamera(this.pointer, this.camera);

      const intersections = this.raycaster.intersectObjects(this.pointclouds, false);
      // @ts-ignore
      this.intersection = (intersections.length) > 0 ? intersections[0] : null;
      if (this.toggle > 0.02 && this.intersection !== null) {
        // @ts-ignore
        this.spheres[this.spheresIndex].position.copy(this.intersection.point);
        this.spheres[this.spheresIndex].scale.set(1, 1, 1);
        this.spheresIndex = (this.spheresIndex + 1) % this.spheres.length;
        this.toggle = 0;
      }

      this.spheres.forEach((sphere) => {
        // .multiplyScalar ( s : Float ) : this
        // 将该向量与所传入的标量s进行相乘
        sphere.scale.multiplyScalar(0.98);
        // .clampScalar ( min : Float, max : Float ) : this
        // min - 分量将被限制为的最小值
        // max - 分量将被限制为的最大值
        // 如果该向量的x值、y值或z值大于最大值，则它们将被最大值所取代。
        // 如果该向量的x值、y值或z值小于最小值，则它们将被最小值所取代。
        sphere.scale.clampScalar(0.01, 1);
      });

      this.toggle += this.clock.getDelta();
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

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
      // 绑定事件
      this.bind();

      if (this.camera) {
        this.camera.aspect = this.width/this.height;
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

