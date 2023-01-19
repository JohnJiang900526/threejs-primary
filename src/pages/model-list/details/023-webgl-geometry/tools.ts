import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private controls: null | OrbitControls
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private object: null | THREE.Mesh
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.object = null;
    this.controls = null;
  }

  // 初始化方法入口
  init() {
    // 实例化相机
    this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 0.01, 200000);
    this.camera.position.y = 400;

    // 实例化一个场景
    this.scene = new THREE.Scene();
    // 添加环境光
    this.scene.add(new THREE.AmbientLight(0xcccccc, 0.6));

    // 创建一个点光
    const pointLight = new THREE.PointLight(0xffffff, 1);
    this.camera.add(pointLight);
    this.scene.add(this.camera);

    // 加载贴图
    const texture = new THREE.TextureLoader().load("/examples/textures/uv_grid_opengl.jpg");
    // .wrapS : number
    // 这个值定义了纹理贴图在水平方向上将如何包裹，在UV映射中对应于U
    // 默认值是THREE.ClampToEdgeWrapping，即纹理边缘将被推到外部边缘的纹素
    // 其它的两个选项分别是THREE.RepeatWrapping和THREE.MirroredRepeatWrapping
    texture.wrapS = THREE.RepeatWrapping;
    // .wrapT : number
    // 这个值定义了纹理贴图在垂直方向上将如何包裹，在UV映射中对应于V。
    // 可以使用与 .wrapS : number相同的选项。
    texture.wrapT = THREE.RepeatWrapping;
    // .anisotropy : number
    // 沿着轴，通过具有最高纹素密度的像素的样本数。 默认情况下，这个值为1
    // 设置一个较高的值将会产生比基本的mipmap更清晰的效果，代价是需要使用更多纹理样本
    texture.anisotropy = 16;

    // 创建材质
    const material = new THREE.MeshPhongMaterial({map: texture, side: THREE.DoubleSide});

    // 第一排
    this.object = new THREE.Mesh(new THREE.SphereGeometry(75, 20, 10), material);
    this.object.position.set(-300, 0, 200);
    this.scene.add(this.object);

    this.object = new THREE.Mesh(new THREE.IcosahedronGeometry(75, 1), material);
    this.object.position.set(-100, 0, 200);
    this.scene.add(this.object);

    this.object = new THREE.Mesh(new THREE.OctahedronGeometry(75, 2), material);
    this.object.position.set(100, 0, 200);
    this.scene.add(this.object);

    this.object = new THREE.Mesh(new THREE.TetrahedronGeometry(75, 0), material);
    this.object.position.set(300, 0, 200);
    this.scene.add(this.object);


    // 第二排
    this.object = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 4, 4), material);
    this.object.position.set(-300, 0, 0);
    this.scene.add(this.object);

    this.object = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100, 4, 4, 4), material);
    this.object.position.set(-100, 0, 0);
    this.scene.add(this.object);

    this.object = new THREE.Mesh(new THREE.CircleGeometry(50, 20, 0, Math.PI * 2), material);
    this.object.position.set(100, 0, 0);
    this.scene.add(this.object);

    this.object = new THREE.Mesh(new THREE.RingGeometry(10, 50, 20, 5, 0, Math.PI * 2), material);
    this.object.position.set(300, 0, 0);
    this.scene.add(this.object);

    // 第三排
    this.object = new THREE.Mesh(new THREE.CylinderGeometry( 25, 75, 100, 40, 5 ), material);
    this.object.position.set(-300, 0, - 200);
    this.scene.add(this.object);

    const points = [];
    for ( let i = 0; i < 50; i++ ) {
      const point = new THREE.Vector2(Math.sin(i * 0.2) * Math.sin(i * 0.1) * 15 + 50, (i - 5 ) * 2);
      points.push(point);
    }

    this.object = new THREE.Mesh(new THREE.LatheGeometry(points, 20), material);
    this.object.position.set(-100, 0, -200);
    this.scene.add(this.object);

    this.object = new THREE.Mesh(new THREE.TorusGeometry(50, 20, 20, 20), material);
    this.object.position.set(100, 0, -200);
    this.scene.add(this.object);

    this.object = new THREE.Mesh(new THREE.TorusKnotGeometry(50, 10, 50, 20), material);
    this.object.position.set(300, 0, -200);
    this.scene.add(this.object);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 控制器
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.update();
    // 禁止相机平移
    controls.enablePan = true;
    // 启用阻尼（惯性）
    controls.enableDamping = true;
    // 启用自动旋转
    controls.autoRotate = true;

    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
  }

  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);
  }

  // 开启动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 控制器
    if (this.controls) { this.controls.update(); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      const timer = Date.now() * 0.0001;

      this.camera.position.x = Math.cos(timer) * 800;
      this.camera.position.z = Math.sin(timer) * 800;
      this.camera.lookAt(this.scene.position);

      this.scene.traverse((obj) => {
        // @ts-ignore
        if (obj.isMesh === true) {
          obj.rotation.x = timer * 5;
          obj.rotation.y = timer * 2.5;
        }
      });

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

