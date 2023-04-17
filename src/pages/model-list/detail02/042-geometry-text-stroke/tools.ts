import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private stats: null | Stats
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(100, this.width/this.height, 1, 10000);
    this.camera.position.set(0, -400, 600);

    // 加载字体
    this.loadFont();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.controls.addEventListener("change", () => {
      if (this.scene && this.camera && this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }
    });

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

  // 加载字体
  loadFont() {
    const color = new THREE.Color(0x006699);
    const loader = new FontLoader();
    const url = "/examples/fonts/helvetiker_regular.typeface.json";

    loader.load(url, (font) => {
      // 实心材质 基础网格材质(MeshBasicMaterial)
      // 一个以简单着色（平面或线框）方式来绘制几何体的材质 这种材质不受光照的影响
      const matLite = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      // 空心材质 基础线条材质（LineBasicMaterial）
      // 一种用于绘制线框样式几何体的材质
      const matDark = new THREE.LineBasicMaterial({
        color: color,
        side: THREE.DoubleSide
      });

      const message = 'Three.js\nStroke text.';
      const shapes: THREE.Shape[] = font.generateShapes(message, 100);
      const geometry = new THREE.ShapeGeometry(shapes as THREE.Shape[]);
      // 计算当前几何体的的边界矩形，该操作会更新已有 [param:.boundingBox]
      // 边界矩形不会默认计算，需要调用该接口指定计算边界矩形，否则保持默认值 null
      geometry.computeBoundingBox();

      // .boundingBox : Box3
      // 当前 bufferGeometry 的外边界矩形。可以通过 .computeBoundingBox() 计算。默认值是 null
      const boundingBox = geometry.boundingBox as THREE.Box3;
      const { max, min } = boundingBox;
      const middle = (-0.5 * (max.x - min.x));
      // .translate ( x : Float, y : Float, z : Float ) : this
      // 移动几何体。该操作一般在一次处理中完成，不会循环处理
      // 典型的用法是通过调用 Object3D.rotation 实时旋转几何体
      geometry.translate(middle, 0, 0);

      // 创建实体文字
      const text = new THREE.Mesh(geometry, matLite);
      text.position.z = -150;
      text.position.y = 100;
      this.scene.add(text);

      // 创建空心线性文字
      const holeShapes:any[] = [];
      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i] as THREE.Shape;
        // .holes : Array
        // 一个paths数组，定义了形状上的孔洞
        const holes: THREE.Path[] = shape.holes || [];
        for (let j = 0; j < holes.length; j++) {
          const hole = holes[j];
          holeShapes.push(hole);
        }
      }
      // eslint-disable-next-line prefer-spread
      shapes.push.apply(shapes, holeShapes);

      const style = SVGLoader.getStrokeStyle(5, color.getStyle());
      const strokeText = new THREE.Group();
      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const points = shape.getPoints();
        // @ts-ignore
        const geometry = SVGLoader.pointsToStroke(points, style);
        geometry.translate(middle, 0, 0);
        strokeText.add(new THREE.Mesh(geometry, matDark));
      }
      strokeText.position.y = 100;
      this.scene.add(strokeText);
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

