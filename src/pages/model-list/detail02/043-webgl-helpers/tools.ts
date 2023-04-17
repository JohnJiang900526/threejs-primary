import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VertexNormalsHelper } from 'three/examples/jsm/helpers/VertexNormalsHelper';
import { VertexTangentsHelper } from 'three/examples/jsm/helpers/VertexTangentsHelper';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private light: THREE.PointLight
  private stats: null | Stats
  private vnh: null | VertexNormalsHelper
  private vth: null | VertexTangentsHelper
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.light = new THREE.PointLight();
    this.stats = null;
    this.vnh = null;
    this.vth = null;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(150, this.width/this.height, 0.01, 10000);
    this.camera.position.z = 400;

    // 创建灯光
    this.light = new THREE.PointLight();
    this.light.position.set(200, 100, 150);
    this.scene.add(this.light);
    this.scene.add(new THREE.PointLightHelper(this.light, 15));

    // GridHelper 坐标格辅助对象. 坐标格实际上是2维线数组.
    const gridHelper = new THREE.GridHelper(400, 40, 0x0000ff, 0x808080);
    gridHelper.position.x = -150;
    gridHelper.position.y = -150;
    this.scene.add(gridHelper);

    // PolarGridHelper 极坐标格辅助对象. 坐标格实际上是2维线数组.
    // PolarGridHelper( radius : Number, sectors : Number, rings : Number, divisions : Number, color1 : Color, color2 : Color )
    // radius -- 极坐标格半径. 可以为任何正数. 默认为 10.
    // sectors ——网格将被划分的扇区数量。这可以是任何正整数。默认值是16
    // rings -- 这可以是任何正整数。默认为8
    // divisions -- 圆圈细分段数. 可以为任何大于或等于3的正整数. 默认为 64
    // color1 -- 极坐标格使用的第一个颜色. 值可以为 Color 类型, 16进制 和 CSS 颜色名. 默认为 0x444444
    // color2 -- 极坐标格使用的第二个颜色. 值可以为 Color 类型, 16进制 和 CSS 颜色名. 默认为 0x888888
    const polarGridHelper = new THREE.PolarGridHelper(200, 16, 8, 64, 0x0000ff, 0x808080);
    polarGridHelper.position.x = 200;
    polarGridHelper.position.y = -150;
    this.scene.add(polarGridHelper);

    // 加载模型
    this.loaderModel();

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

  // 加载模型
  loaderModel() {
    const loader = new GLTFLoader();
    const url = "/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb";

    loader.load(url, (gltf) => {
      const mesh = gltf.scene.children[0] as THREE.Mesh;

      const group = new THREE.Group();
      // .computeTangents 计算并向该几何图形添加切线属性
      mesh.geometry.computeTangents();
      group.scale.multiplyScalar(50);
      group.add(mesh);
      // .updateMatrixWorld ( force : Boolean ) : undefined
      // 更新物体及其后代的全局变换
      group.updateMatrixWorld(true);
      this.scene.add(group);

      // 渲染箭头辅助对象 arrows 来模拟顶点的法线. 需要定义了法线缓存属性 custom attribute 
      // 或 使用了 computeVertexNormals 方法计算了顶点法线.
      this.vnh = new VertexNormalsHelper(mesh, 5);
      // 渲染箭头以可视化对象的顶点切向量。
      // 要求切线已在自定义属性中指定或已使用computeTangents计算。
      this.vth = new VertexTangentsHelper(mesh, 5);
      this.scene.add(this.vnh);
      this.scene.add(this.vth);
      // BoxHelper 用于图形化地展示对象世界轴心对齐的包围盒的辅助对象
      this.scene.add(new THREE.BoxHelper(mesh));

      // 网格几何体（WireframeGeometry）
      // 这个类可以被用作一个辅助物体，来对一个geometry以线框的形式进行查看
      const wireframe = new THREE.WireframeGeometry(mesh.geometry);
      // 线段（LineSegments）
      // 在若干对的顶点之间绘制的一系列的线
      // 它和Line几乎是相同的，唯一的区别是它在渲染时使用的是gl.LINES， 而不是gl.LINE_STRIP
      let line = new THREE.LineSegments(wireframe);
      // .depthTest : Boolean
      // 是否在渲染此材质时启用深度测试。默认为 true
      (line.material as THREE.Material).depthTest = false;
      (line.material as THREE.Material).opacity = 0.25;
      (line.material as THREE.Material).transparent = true;
      line.position.x = 4;
      group.add(line);
      this.scene.add(new THREE.BoxHelper(line));

      // 边缘几何体（EdgesGeometry）
      // 这可以作为一个辅助对象来查看geometry的边缘。
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      line = new THREE.LineSegments(edges);
      // .depthTest : Boolean
      // 是否在渲染此材质时启用深度测试。默认为 true
      (line.material as THREE.Material).depthTest = false;
      (line.material as THREE.Material).opacity = 0.25;
      (line.material as THREE.Material).transparent = true;
      line.position.x = -4;
      group.add(line);
      this.scene.add(new THREE.BoxHelper(line));
      this.scene.add(new THREE.BoxHelper(group));
      this.scene.add(new THREE.BoxHelper(this.scene));
    });
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

    const time = -performance.now() * 0.0003;
    if (this.camera) {
      this.camera.position.x = 400 * Math.cos(time);
      this.camera.position.z = 400 * Math.sin(time);
      this.camera.lookAt(this.scene.position);
    }
    this.light.position.x = Math.sin(time * 1.7) * 300;
    this.light.position.y = Math.cos(time * 1.5) * 400;
    this.light.position.z = Math.cos(time * 1.3) * 300;

    if ( this.vnh ) { this.vnh.update(); }
    if ( this.vth ) { this.vth.update(); }

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

