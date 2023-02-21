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
    this.camera = new THREE.PerspectiveCamera(60, this.width/this.height, 1, 10000 );
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(this.scene.position);
    this.camera.updateMatrix();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建模型
    this.createModel();

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
    const buffer = this.generatePointcloud(new THREE.Color(1, 0, 0), this.w, this.length);
    buffer.scale.set(5, 10, 10);
    buffer.position.set(-5, 0, 0);
    this.scene.add(buffer);

    const indexed = this.generateIndexedPointcloud(new THREE.Color(0, 1, 0), this.w, this.length);
    indexed.scale.set(5, 10, 10);
    indexed.position.set(0, 0, 0);
    this.scene.add(indexed);

    const offset = this.generateIndexedWithOffsetPointcloud(new THREE.Color(0, 1, 1), this.w, this.length);
    offset.scale.set(5, 10, 10);
    offset.position.set(5, 0, 0);
    this.scene.add(offset);

    this.pointclouds = [buffer, indexed, offset];

    const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    for (let i = 0; i < 40; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      this.scene.add(sphere);
      this.spheres.push(sphere);
    }
    // @ts-ignore
    this.raycaster.params.Points.threshold = this.threshold;
  }

  private generatePointCloudGeometry(color: THREE.Color, width: number, length: number) {
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
    geometry.computeBoundingBox();
    return geometry;
  }

  private generatePointcloud(color: THREE.Color, width: number, length: number) {
    const geometry = this.generatePointCloudGeometry(color, width, length);
    const material = new THREE.PointsMaterial({ size: this.pointSize, vertexColors: true });

    return new THREE.Points(geometry, material);
  }

  private generateIndexedPointcloud(color: THREE.Color, width: number, length: number) {
    const geometry = this.generatePointCloudGeometry(color, width, length);
    const num = width * length;
    const indices = new Uint16Array(num);

    for (let i = 0; i < num; i++) {
      indices[i] = i;
    }

    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    const material = new THREE.PointsMaterial({ size: this.pointSize, vertexColors: true });
    return new THREE.Points(geometry, material);
  }

  private generateIndexedWithOffsetPointcloud(color: THREE.Color, width: number, length: number) {
    const geometry = this.generatePointCloudGeometry(color, width, length);
    const num = width * length;
    const indices = new Uint16Array(num);

    for (let i = 0; i < num; i++) {
      indices[i] = i;
    }

    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.addGroup(0, indices.length);

    const material = new THREE.PointsMaterial({ size: this.pointSize, vertexColors: true });
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
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
        sphere.scale.multiplyScalar(0.98);
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

