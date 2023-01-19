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
    this.object = null;
    this.controls = null;
    this.texture = null;
    this.material = null;
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
    this.texture = new THREE.TextureLoader().load("/examples/textures/uv_grid_opengl.jpg");
    // .wrapS : number
    // 这个值定义了纹理贴图在水平方向上将如何包裹，在UV映射中对应于U
    // 默认值是THREE.ClampToEdgeWrapping，即纹理边缘将被推到外部边缘的纹素
    // 其它的两个选项分别是THREE.RepeatWrapping和THREE.MirroredRepeatWrapping
    this.texture.wrapS = THREE.RepeatWrapping;
    // .wrapT : number
    // 这个值定义了纹理贴图在垂直方向上将如何包裹，在UV映射中对应于V。
    // 可以使用与 .wrapS : number相同的选项。
    this.texture.wrapT = THREE.RepeatWrapping;
    // .anisotropy : number
    // 沿着轴，通过具有最高纹素密度的像素的样本数。 默认情况下，这个值为1
    // 设置一个较高的值将会产生比基本的mipmap更清晰的效果，代价是需要使用更多纹理样本
    this.texture.anisotropy = 16;

    // 创建材质
    this.material = new THREE.MeshPhongMaterial({map: this.texture, side: THREE.DoubleSide});

    // 创建几何体
    this.createFirstRow();
    this.createSecondtRow();
    this.createThirdRow();

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

  // 创建第1排几何体
  createFirstRow() {
    // 球缓冲几何体（SphereGeometry）一个用于生成球体的类。
    // SphereGeometry(
    //   radius : Float, widthSegments : Integer, heightSegments : Integer, 
    //   phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float
    // )
    // radius — 球体半径，默认为1
    // widthSegments — 水平分段数（沿着经线分段），最小值为3，默认值为32。
    // heightSegments — 垂直分段数（沿着纬线分段），最小值为2，默认值为16。
    // phiStart — 指定水平（经线）起始角度，默认值为0
    // phiLength — 指定水平（经线）扫描角度的大小，默认值为 Math.PI * 2
    // thetaStart — 指定垂直（纬线）起始角度，默认值为0
    // thetaLength — 指定垂直（纬线）扫描角度大小，默认值为 Math.PI
    this.object = new THREE.Mesh(new THREE.SphereGeometry(75, 20, 10), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(-300, 0, 200);
    (this.scene as THREE.Scene).add(this.object);

    // 二十面缓冲几何体（IcosahedronGeometry）一个用于生成二十面体的类
    // IcosahedronGeometry(radius : Float, detail : Integer)
    // radius — 二十面体的半径，默认为1
    // detail — 默认值为0。将这个值设为一个大于0的数将会为它增加一些顶点，使其不再是一个二十面体。
    // 当这个值大于1的时候，实际上它将变成一个球体
    this.object = new THREE.Mesh(new THREE.IcosahedronGeometry(75, 1), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(-100, 0, 200);
    (this.scene as THREE.Scene).add(this.object);

    // 八面缓冲几何体（OctahedronGeometry）一个用于创建八面体的类
    // OctahedronGeometry(radius : Float, detail : Integer)
    // radius — 八面体的半径，默认值为1
    // detail — 默认值为0，将这个值设为一个大于0的数将会为它增加一些顶点，使其不再是一个八面体
    this.object = new THREE.Mesh(new THREE.OctahedronGeometry(75, 2), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(100, 0, 200);
    (this.scene as THREE.Scene).add(this.object);

    // 四面缓冲几何体（TetrahedronGeometry）一个用于生成四面几何体的类
    // TetrahedronGeometry(radius : Float, detail : Integer)
    // radius — 四面体的半径，默认值为1
    // detail — 默认值为0。将这个值设为一个大于0的数将会为它增加一些顶点，使其不再是一个四面体
    this.object = new THREE.Mesh(new THREE.TetrahedronGeometry(75, 0), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(300, 0, 200);
    (this.scene as THREE.Scene).add(this.object);
  }

  // 创建第2排几何体
  createSecondtRow() {
    // 平面缓冲几何体（PlaneGeometry）一个用于生成平面几何体的类
    // PlaneGeometry(width : Float, height : Float, widthSegments : Integer, heightSegments : Integer)
    // width — 平面沿着X轴的宽度。默认值是1
    // height — 平面沿着Y轴的高度。默认值是1
    // widthSegments — （可选）平面的宽度分段数，默认值是1
    // heightSegments — （可选）平面的高度分段数，默认值是1
    this.object = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 4, 4), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(-300, 0, 0);
    (this.scene as THREE.Scene).add(this.object);

    // 立方缓冲几何体（BoxGeometry）
    // BoxGeometry是四边形的原始几何类，它通常使用构造函数所提供的“width”、“height”、“depth”参数来创建立方体或者不规则四边形
    // BoxGeometry(width : Float, height : Float, depth : Float, widthSegments : Integer, heightSegments : Integer, depthSegments : Integer)
    // width — X轴上面的宽度，默认值为1
    // height — Y轴上面的高度，默认值为1
    // depth — Z轴上面的深度，默认值为1
    // widthSegments — （可选）宽度的分段数，默认值是1
    // heightSegments — （可选）高度的分段数，默认值是1
    // depthSegments — （可选）深度的分段数，默认值是1
    this.object = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100, 4, 4, 4), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(-100, 0, 0);
    (this.scene as THREE.Scene).add(this.object);

    // 圆形缓冲几何体（CircleGeometry）
    // CircleGeometry是欧式几何的一个简单形状，它由围绕着一个中心点的三角分段的数量所构造，由给定的半径来延展
    // 同时它也可以用于创建规则多边形，其分段数量取决于该规则多边形的边数
    // CircleGeometry(radius : Float, segments : Integer, thetaStart : Float, thetaLength : Float)
    // radius — 圆形的半径，默认值为1
    // segments — 分段（三角面）的数量，最小值为3，默认值为8
    // thetaStart — 第一个分段的起始角度，默认为0。（three o'clock position）
    // thetaLength — 圆形扇区的中心角，通常被称为“θ”（西塔）。默认值是2*Pi，这使其成为一个完整的圆
    this.object = new THREE.Mesh(new THREE.CircleGeometry(50, 20, 0, Math.PI * 2), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(100, 0, 0);
    (this.scene as THREE.Scene).add(this.object);

    // 圆环缓冲几何体（RingGeometry）一个用于生成二维圆环几何体的类
    // RingGeometry(
    //   innerRadius : Float, outerRadius : Float, 
    //   thetaSegments : Integer, phiSegments : Integer, 
    //   thetaStart : Float, thetaLength : Float
    // )
    // innerRadius — 内部半径，默认值为0.5
    // outerRadius — 外部半径，默认值为1
    // thetaSegments — 圆环的分段数。这个值越大，圆环就越圆。最小值为3，默认值为8
    // phiSegments — 最小值为1，默认值为8
    // thetaStart — 起始角度，默认值为0
    // thetaLength — 圆心角，默认值为Math.PI * 2
    this.object = new THREE.Mesh(new THREE.RingGeometry(10, 50, 20, 5, 0, Math.PI * 2), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(300, 0, 0);
    (this.scene as THREE.Scene).add(this.object);
  }

  // 创建第3排几何体
  createThirdRow() {
    // 圆柱缓冲几何体（CylinderGeometry）一个用于生成圆柱几何体的类
    // CylinderGeometry(
    //   radiusTop : Float, radiusBottom : Float, height : Float, 
    //   radialSegments : Integer, heightSegments : Integer, openEnded : Boolean, 
    //   thetaStart : Float, thetaLength : Float
    // )
    // radiusTop — 圆柱的顶部半径，默认值是1
    // radiusBottom — 圆柱的底部半径，默认值是1
    // height — 圆柱的高度，默认值是1
    // radialSegments — 圆柱侧面周围的分段数，默认为8
    // heightSegments — 圆柱侧面沿着其高度的分段数，默认值为1
    // openEnded — 一个Boolean值，指明该圆锥的底面是开放的还是封顶的。默认值为false，即其底面默认是封顶的
    // thetaStart — 第一个分段的起始角度，默认为0
    // thetaLength — 圆柱底面圆扇区的中心角，通常被称为“θ”（西塔）。默认值是2*Pi，这使其成为一个完整的圆柱
    this.object = new THREE.Mesh(new THREE.CylinderGeometry(25, 75, 100, 40, 5), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(-300, 0, -200);
    (this.scene as THREE.Scene).add(this.object);

    const points = [];
    for ( let i = 0; i < 50; i++ ) {
      const point = new THREE.Vector2(Math.sin(i * 0.2) * Math.sin(i * 0.1) * 15 + 50, (i - 5 ) * 2);
      points.push(point);
    }

    // 车削缓冲几何体（LatheGeometry）
    // 创建具有轴对称性的网格，比如花瓶。车削绕着Y轴来进行旋转
    // LatheGeometry(points : Array, segments : Integer, phiStart : Float, phiLength : Float)
    // points — 一个Vector2对象数组。每个点的X坐标必须大于0
    // segments — 要生成的车削几何体圆周分段的数量，默认值是12
    // phiStart — 以弧度表示的起始角度，默认值为0
    // phiLength — 车削部分的弧度（0-2PI）范围，2PI将是一个完全闭合的、完整的车削几何体，小于2PI是部分的车削。默认值是2PI
    this.object = new THREE.Mesh(new THREE.LatheGeometry(points, 20), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(-100, 0, -200);
    (this.scene as THREE.Scene).add(this.object);

    // 圆环缓冲几何体（TorusGeometry）一个用于生成圆环几何体的类
    // TorusGeometry(radius : Float, tube : Float, radialSegments : Integer, tubularSegments : Integer, arc : Float)
    // radius - 环面的半径，从环面的中心到管道横截面的中心。默认值是1
    // tube — 管道的半径，默认值为0.4
    // radialSegments — 管道横截面的分段数，默认值为8
    // tubularSegments — 管道的分段数，默认值为6
    // arc — 圆环的圆心角（单位是弧度），默认值为Math.PI * 2
    this.object = new THREE.Mesh(new THREE.TorusGeometry(50, 20, 20, 20), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(100, 0, -200);
    (this.scene as THREE.Scene).add(this.object);

    // 圆环缓冲扭结几何体（TorusKnotGeometry）
    // 创建一个圆环扭结，其特殊形状由一对互质的整数，p和q所定义。如果p和q不互质，创建出来的几何体将是一个环面链接
    // TorusKnotGeometry(radius : Float, tube : Float, tubularSegments : Integer, radialSegments : Integer, p : Integer, q : Integer)
    // radius - 圆环的半径，默认值为1
    // tube — 管道的半径，默认值为0.4
    // tubularSegments — 管道的分段数量，默认值为64
    // radialSegments — 横截面分段数量，默认值为8
    // p — 这个值决定了几何体将绕着其旋转对称轴旋转多少次，默认值是2
    // q — 这个值决定了几何体将绕着其内部圆环旋转多少次，默认值是3
    this.object = new THREE.Mesh(new THREE.TorusKnotGeometry(50, 10, 50, 20), this.material as THREE.MeshPhongMaterial);
    this.object.position.set(300, 0, -200);
    (this.scene as THREE.Scene).add(this.object);
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

