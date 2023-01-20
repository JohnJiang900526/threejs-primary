import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as Curves from 'three/examples/jsm/curves/CurveExtras';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry';
import { ParametricGeometries } from 'three/examples/jsm/geometries/ParametricGeometries';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private controls: null | OrbitControls
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private geometry: null | ParametricGeometry
  private object: null | THREE.Mesh
  private texture: null | THREE.Texture
  private material: null | THREE.MeshPhongMaterial
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.geometry = null;
    this.object = null;
    this.controls = null;
    this.texture = null;
    this.material = null;
  }

  // 初始化方法入口
  init() {
    // 创建相机
    this.camera = new THREE.PerspectiveCamera(80, this.width/this.height, 1, 20000);
    this.camera.position.y = 400;

    // 创建一个场景
    this.scene = new THREE.Scene();
    // 给场景添加环境光
    this.scene.add(new THREE.AmbientLight(0xcccccc, 1));

    // 创建一个点光源
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    this.camera.add(pointLight);
    this.scene.add(this.camera);

    // 创建纹理 纹理（Texture）
    // 创建一个纹理贴图，将其应用到一个表面，或者作为反射/折射贴图
    this.texture = (new THREE.TextureLoader()).load("/examples/textures/uv_grid_opengl.jpg");
    // .wrapS : number
    // 这个值定义了纹理贴图在水平方向上将如何包裹，在UV映射中对应于U
    this.texture.wrapS = THREE.RepeatWrapping;
    // .wrapT : number
    // 这个值定义了纹理贴图在垂直方向上将如何包裹，在UV映射中对应于V
    this.texture.wrapT = THREE.RepeatWrapping;
    // .anisotropy : number
    // 沿着轴，通过具有最高纹素密度的像素的样本数。 默认情况下，这个值为1
    // 设置一个较高的值将会产生比基本的mipmap更清晰的效果，代价是需要使用更多纹理样本
    // 这个值通常是2的幂
    this.texture.anisotropy = 16;
    // 创建材质
    this.material = new THREE.MeshPhongMaterial({map: this.texture, side: THREE.DoubleSide});

    // 创建几何体
    this.createFirstRow();
    this.createSecondRow();

    // 渲染器
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 控制器
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.update();

    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 创建第1列
  createFirstRow() {
    const material = this.material as THREE.MeshPhongMaterial;

    // 创建面几何体 平面缓冲几何体（PlaneGeometry）一个用于生成平面几何体的类 
    this.geometry = new ParametricGeometry(ParametricGeometries.plane(100, 100), 10, 10);
    this.geometry.center();
    this.object = new THREE.Mesh(this.geometry, material);
    this.object.position.set(-200, 0, 200);
    this.scene?.add(this.object);

    // klein
    this.geometry = new ParametricGeometry(ParametricGeometries.klein, 20, 20);
    this.object = new THREE.Mesh(this.geometry, material);
    this.object.position.set(0, 0, 200);
    this.object.scale.multiplyScalar(5);
    this.scene?.add(this.object);

    // 莫比乌斯环 or Mobius带
    this.geometry = new ParametricGeometry(ParametricGeometries.mobius, 20, 20);
    this.object = new THREE.Mesh(this.geometry, material);
    this.object.position.set(200, 0, 200);
    this.object.scale.multiplyScalar(30);
    this.scene?.add(this.object);
  }

  // 创建第2列
  createSecondRow() {
    const material = this.material as THREE.MeshPhongMaterial;

    const GrannyKnot = new Curves.GrannyKnot();
    const torus = new ParametricGeometries.TorusKnotGeometry(50, 10, 50, 20, 2, 3);
    const sphere = new ParametricGeometries.SphereGeometry(50, 20, 10);
    const tube = new ParametricGeometries.TubeGeometry(GrannyKnot, 100, 3, 8, true);

    // 圆环缓冲扭结几何体（TorusKnotGeometry）
    this.object = new THREE.Mesh(torus, material);
    this.object.position.set(-200, 0, -200);
    this.scene?.add(this.object);

    // 球缓冲几何体（SphereGeometry）
    this.object = new THREE.Mesh(sphere, material);
    this.object.position.set(0, 0, -200);
    this.scene?.add(this.object);

    // 管道缓冲几何体（TubeGeometry）
    this.object = new THREE.Mesh(tube, material);
    this.object.position.set(200, 0, -200);
    this.object.scale.multiplyScalar(2);
    this.scene?.add(this.object);
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

