import * as THREE from 'three';
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

  private controls: null | OrbitControls;
  private mesh: THREE.Mesh
  private target: THREE.Mesh
  private spherical: THREE.Spherical
  private rotationMatrix: THREE.Matrix4
  private targetQuaternion: THREE.Quaternion
  private clock: THREE.Clock
  private speed: number
  private timer: any
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.controls = null;
    this.mesh = new THREE.Mesh();
    this.target = new THREE.Mesh();
    this.spherical = new THREE.Spherical();
    this.rotationMatrix = new THREE.Matrix4();
    this.targetQuaternion = new THREE.Quaternion();
    this.clock = new THREE.Clock();
    this.speed = 2;
    this.timer = -1;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 0.01, 10);
    this.camera.position.set(0, 0, 6.5);

    this.generateMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;

    this.generateTarget();
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
    {
      // 圆锥缓冲几何体（ConeGeometry）
      // 一个用于生成圆锥几何体的类
      const geometry = (new THREE.ConeGeometry(0.1, 0.5, 8)).rotateX(Math.PI * 0.5);
      const material = new THREE.MeshNormalMaterial();

      this.mesh = new THREE.Mesh(geometry, material);
      this.scene.add(this.mesh);
    }

    {
      // 小的圆球
      const geometry = new THREE.SphereGeometry(0.05);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

      this.target = new THREE.Mesh(geometry, material);
      this.scene.add(this.target);
    }

    {
      // 大的请求网格
      const geometry = new THREE.SphereGeometry(2, 32, 32);
      const material = new THREE.MeshBasicMaterial({ 
        opacity: 0.3,
        color: 0xcccccc, 
        wireframe: true, 
        transparent: true, 
      });
      const sphere = new THREE.Mesh( geometry, material );
      this.scene.add(sphere);
    }
  }

  // 核心
  private generateTarget() {
    // 球坐标（Spherical）
    // Spherical( radius : Float, phi : Float, theta : Float )
    // radius - 半径值，或者说从该点到原点的 Euclidean distance（欧几里得距离，即直线距离）。默认值为1.0
    // phi - 与 y (up) 轴的极角（以弧度为单位）。 默认值为 0
    // theta - 绕 y (up) 轴的赤道角(方位角)（以弧度为单位）。 默认值为 0
    // 极角（phi）位于正 y 轴和负 y 轴上。赤道角(方位角)（theta）从正 z 开始
    this.spherical.theta = Math.random() * Math.PI * 2;
    this.spherical.phi = Math.acos((2 * Math.random()) - 1);
    this.spherical.radius = 2;
    // .setFromSpherical ( s : Spherical ) : this
    // 从球坐标s中设置该向量
    this.target.position.setFromSpherical(this.spherical);
    // .lookAt ( eye : Vector3, target : Vector3, up : Vector3 ) : this
    // 构造一个旋转矩阵，从eye 指向 target，由向量 up 定向
    this.rotationMatrix.lookAt(this.target.position, this.mesh.position, this.mesh.up);
    // 四元数（Quaternion）
    // .setFromRotationMatrix ( m : Matrix4 ) : this
    // 从m的旋转分量中来设置该四元数
    // 改编自 here 所概述的方法
    this.targetQuaternion.setFromRotationMatrix(this.rotationMatrix);

    this.timer && clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.generateTarget(); }, 2000);
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
    window.requestAnimationFrame(() => { this.animate(); });

    const delta = this.clock.getDelta();
    // 核心逻辑
    if (!this.mesh.quaternion.equals(this.targetQuaternion)) {
      const step = this.speed * delta;
      // .rotateTowards ( q : Quaternion, step : Float ) : this
      // q - 目标四元数
      // step - 以弧度为单位的角度步长
      // 将该四元数按照步长 step 向目标 q 进行旋转。该方法确保最终的四元数不会超过 q
      this.mesh.quaternion.rotateTowards(this.targetQuaternion, step);
    }

    this.stats?.update();
    this.controls?.update();
    
    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      if (this.camera) {
        this.camera.aspect = this.aspect;
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

