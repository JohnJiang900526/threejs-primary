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
  private theta: number
  private radius: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.theta = 0;
    this.radius = 100;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 1, 10000);
    this.camera.layers.enable(0);
    this.camera.layers.enable(1);
    this.camera.layers.enable(2);
    this.scene.add(this.camera);

    // 创建光线
    const light = new THREE.PointLight(0xffffff, 1);
    light.layers.enable(0);
    light.layers.enable(1);
    light.layers.enable(2);
    this.scene.add(light);

    // 创建几何体
    this.createGeometry();

    // 创建渲染器
    this.createRenderer();

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


  toggleRed() {
    if (this.camera) {
      this.camera.layers.toggle(0);
    }
  }

  toggleGreen() {
    if (this.camera) {
      this.camera.layers.toggle(1);
    }
  }

  toggleBlue() {
    if (this.camera) {
      this.camera.layers.toggle(2);
    }
  }

  enableAll() {
    if (this.camera) {
      this.camera.layers.enableAll();
    }
  }

  disableAll() {
    if (this.camera) {
      this.camera.layers.disableAll();
    }
  }

  // 创建几何体
  private createGeometry() {
    const colors = [0xff0000, 0x00ff00, 0x0000ff];
    const geometry = new THREE.BoxGeometry(20, 20, 20);

    for (let i = 0; i < 300; i++) {
      const layer = (i % 3);
      
      const material = new THREE.MeshLambertMaterial({color: colors[layer]});
      const object = new THREE.Mesh(geometry, material);

      object.position.x = Math.random() * 800 - 400;
      object.position.y = Math.random() * 800 - 400;
      object.position.z = Math.random() * 800 - 400;

      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      object.scale.x = Math.random() + 0.5;
      object.scale.y = Math.random() + 0.5;
      object.scale.z = Math.random() + 0.5;

      object.layers.set(layer);
      this.scene.add(object);
    }
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    if (this.camera) {
      this.theta += 0.1;

      const x = this.radius * Math.sin(THREE.MathUtils.degToRad(this.theta));
      const y = this.radius * Math.sin(THREE.MathUtils.degToRad(this.theta));
      const z = this.radius * Math.cos(THREE.MathUtils.degToRad(this.theta));

      this.camera.position.set(x, y, z);
      this.camera.lookAt(this.scene.position);
      this.camera.updateMatrixWorld();
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

