
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private axesHelper: null | THREE.AxesHelper
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.PerspectiveCamera
  private controls: null | OrbitControls

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.axesHelper = null;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.controls = null;
  }

  init() {
    // 创建一个三维场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#000");

    // 创建一个几何体
    const geometry = new THREE.BoxGeometry(100, 100, 100);
    // 创建一个材质
    const material = new THREE.MeshLambertMaterial({
      color: "#12a7ff",
      transparent: true,
      opacity: 0.5
    });

    // 批量创建网格模型
    for(let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(i * 200, 0, j * 200);
        this.scene.add(mesh);
      }
    }

    // 创建光源
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(ambient);

    // 创建一个点光源
    const point = new THREE.PointLight(0xffffff, 0.4);
    point.position.set(2000, 1000, 2000);
    this.scene.add(point);

    // 创建一个pointLightHelper
    const pointLightHelper = new THREE.PointLightHelper(point, 20);
    this.scene.add(pointLightHelper);

    // 创建一个相机
    this.camera = new THREE.PerspectiveCamera(40, this.width/this.height, 0.1, 8000);
    this.camera.position.set(3500, 3500, 3500);
    this.camera.lookAt(1000, 0, 1000);
    this.scene.add(this.camera);

    // 创建一个渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.render(this.scene, this.camera);
    this.container.appendChild(this.renderer.domElement);

    // 创建一个控制器
    this.controls = new OrbitControls( this.camera, this.renderer.domElement);
    this.controls.target.set(900, 0, 900);
    this.controls.update();
    // 禁止相机平移
    this.controls.enablePan = false;
    // 启用阻尼（惯性）
    this.controls.enableDamping = true;
    // 启用自动旋转
    this.controls.autoRotate = true;

    // 创建一个3d坐标
    this.axesHelper = new THREE.AxesHelper(1500);
    this.axesHelper.position.set(900, 0, 900);
    this.scene.add(this.axesHelper);

    this.resize();
    this.animate();
  }

  animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    if (this.controls) {
      this.controls?.update();
    }

    if (this.scene && this.camera) {
      this.renderer?.render(this.scene, this.camera);
    }
  }

  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        this.camera.aspect = this.width/this.height;
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;
