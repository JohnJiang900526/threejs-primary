import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GUI from 'lil-gui';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private gui: GUI;
  private guiData: {
    currentURL: string,
    drawFillShapes: boolean,
    drawStrokes: boolean,
    fillShapesWireframe: boolean,
    strokesWireframe: boolean
  };
  private urls: {[key: string]: string}
  private group: null | THREE.Group
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });

    this.guiData = {
      currentURL: '/examples/models/svg/tiger.svg',
      drawFillShapes: true,
      drawStrokes: true,
      fillShapesWireframe: false,
      strokesWireframe: false,
    };
    this.urls = {
      'Tiger': '/examples/models/svg/tiger.svg',
      'Three.js': '/examples/models/svg/threejs.svg',
      'Joins and caps': '/examples/models/svg/lineJoinsAndCaps.svg',
      'Hexagon': '/examples/models/svg/hexagon.svg',
      'ellipse': "/examples/models/svg/ellipse.svg",
      'Energy': '/examples/models/svg/energy.svg',
      'Test 1': '/examples/models/svg/tests/1.svg',
      'Test 2': '/examples/models/svg/tests/2.svg',
      'Test 3': '/examples/models/svg/tests/3.svg',
      'Test 4': '/examples/models/svg/tests/4.svg',
      'Test 5': '/examples/models/svg/tests/5.svg',
      'Test 6': '/examples/models/svg/tests/6.svg',
      'Test 7': '/examples/models/svg/tests/7.svg',
      'Test 8': '/examples/models/svg/tests/8.svg',
      'Test 9': '/examples/models/svg/tests/9.svg',
      'Units': '/examples/models/svg/tests/units.svg',
      'Ordering': '/examples/models/svg/tests/ordering.svg',
      'Defs': '/examples/models/svg/tests/testDefs/Svg-defs.svg',
      'Defs2': '/examples/models/svg/tests/testDefs/Svg-defs2.svg',
      'Defs3': '/examples/models/svg/tests/testDefs/Wave-defs.svg',
      'Defs4': '/examples/models/svg/tests/testDefs/defs4.svg',
      'Defs5': '/examples/models/svg/tests/testDefs/defs5.svg',
      'Style CSS inside defs': '/examples/models/svg/style-css-inside-defs.svg',
      'Multiple CSS classes': '/examples/models/svg/multiple-css-classes.svg',
      'Zero Radius': '/examples/models/svg/zero-radius.svg',
      'Styles in svg tag': '/examples/models/svg/tests/styles.svg',
      'Round join': '/examples/models/svg/tests/roundJoinPrecisionIssue.svg',
      'Ellipse Transformations': '/examples/models/svg/tests/ellipseTransform.svg',
    };
    this.group = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xb0b0b0);

    // 相机
    this.camera = new THREE.PerspectiveCamera(100, this.aspect, 1, 1000);
    this.camera.position.set(0, 0, 200);

    // 创建网格
    this.createGrid();

    // 加载模型
    this.loadModel();

    // webgl渲染器
    this.createRenderer();

    // 控制器
    const controls = new OrbitControls(this.camera, this.renderer?.domElement );
    controls.addEventListener('change', () => { this.render(); });
    // .screenSpacePanning : Boolean
    // 定义当平移的时候摄像机的位置将如何移动。如果为true，摄像机将在屏幕空间内平移
    // 否则，摄像机将在与摄像机向上方向垂直的平面中平移
    // 当使用 OrbitControls 时， 默认值为true；当使用 MapControls 时，默认值为false
    controls.screenSpacePanning = true;

    this.createGUI();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createGrid() {
    const helper = new THREE.GridHelper(1600, 100);

    helper.rotation.x = Math.PI / 2;
    this.scene.add(helper);
  }

  private createGUI() {
    if (this.gui) {
      this.gui.destroy();
      this.gui = new GUI({
        container: this.container,
        autoPlace: true,
        title: "控制面板"
      });
    }

    this.gui.add(this.guiData, "currentURL", this.urls).name("SVG文件").onChange(() => {
      this.loadModel();
    });

    this.gui.add(this.guiData, 'drawStrokes').name('绘制笔画').onChange(() => {
      this.loadModel();
    });
    this.gui.add(this.guiData, 'drawFillShapes').name('绘制填充形状').onChange(() => {
      this.loadModel();
    });
    this.gui.add(this.guiData, 'strokesWireframe').name('线框笔画').onChange(() => {
      this.loadModel();
    });
    this.gui.add(this.guiData, 'fillShapesWireframe').name('线框填充形状').onChange(() => {
      this.loadModel();
    });
  }

  // 加载模型 核心
  private loadModel() {
    const loader = new SVGLoader();
    const toast = showLoadingToast({
      duration: 10000,
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    if (this.group) {
      this.group.traverse((child) => {
        const obj = child as THREE.Mesh;
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          (obj.material as THREE.MeshBasicMaterial).dispose();
        }
      });
      this.scene.remove(this.group);
      this.group = null;
    }

    loader.load(this.guiData.currentURL, (data) => {
      toast.close();

      this.group = new THREE.Group();
      this.group.scale.multiplyScalar(0.25);
      this.group.position.x = -70;
      this.group.position.y = 70;
      this.group.scale.y *= -1;

      // 核心逻辑
      const paths = (data.paths || []);
      paths.forEach((path) => {
        const fillColor = path?.userData?.style?.fill;
        if (this.guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none') {
          const color = new THREE.Color().setStyle(fillColor).convertSRGBToLinear();
          const material = new THREE.MeshBasicMaterial({
            color,
            opacity: path?.userData?.style.fillOpacity,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: this.guiData.fillShapesWireframe
          });
          const shapes = SVGLoader.createShapes(path) || [];

          shapes.forEach((shape) => {
            const geometry = new THREE.ShapeGeometry(shape);
            const mesh = new THREE.Mesh(geometry, material);
            this.group?.add(mesh);
          });
        }

        const strokeColor = path?.userData?.style?.stroke;
        if (this.guiData.drawStrokes && strokeColor !== undefined && strokeColor !== 'none') {
          const color = new THREE.Color().setStyle(strokeColor).convertSRGBToLinear();
          const material = new THREE.MeshBasicMaterial({
            color,
            opacity: path?.userData?.style?.strokeOpacity,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: this.guiData.strokesWireframe
          });

          (path.subPaths).forEach((subPath) => {
            const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path?.userData?.style);
            const mesh = new THREE.Mesh(geometry, material);
            this.group?.add(mesh);
          });
        }
      });

      this.scene.add(this.group);
      this.render();
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

  private render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    if (this.renderer && this.scene && this.camera) {
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
        this.render();
      }
    };
  }
}

export default THREE;

