import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  
  private meshKnot: THREE.Mesh
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.meshKnot = new THREE.Mesh();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 1000);
    this.camera.position.set(0, 10, -15);

    this.createLight();
    this.createFloorAndModel();
    
    // 创建渲染器
    this.createRenderer();

    // 创建渲染器
    const controls = new OrbitControls(this.camera, this.renderer?.domElement);
    controls.target.copy(this.meshKnot.position);
    controls.update();

    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建灯光
  private createLight() {
    RectAreaLightUniformsLib.init();

    const light1 = new THREE.RectAreaLight(0xff0000, 5, 4, 10);
    light1.position.set(-5, 5, 5);

    const light2 = new THREE.RectAreaLight(0x00ff00, 5, 4, 10);
    light2.position.set(0, 5, 5);

    const light3 = new THREE.RectAreaLight(0x0000ff, 5, 4, 10);
    light3.position.set(5, 5, 5);

    const helper1 = new RectAreaLightHelper(light1);
    const helper2 = new RectAreaLightHelper(light2);
    const helper3 = new RectAreaLightHelper(light3);

    this.scene.add(light1, light2, light3);
    this.scene.add(helper1, helper2, helper3);
  }

  // 创建地板和模型
  private createFloorAndModel() {
    // 创建地板
    (() => {
      const geometry = new THREE.BoxGeometry(2000, 0.1, 2000);
      // 标准网格材质(MeshStandardMaterial)
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x808080, 
        // 材质的粗糙程度。0.0表示平滑的镜面反射，1.0表示完全漫反射。默认值为1.0。
        // 如果还提供roughnessMap，则两个值相乘
        roughness: 0.1, 
        // 材质与金属的相似度。非金属材质，如木材或石材，使用0.0，金属使用1.0，通常没有中间值
        // 默认值为0.0。0.0到1.0之间的值可用于生锈金属的外观。如果还提供了metalnessMap，则两个值相乘
        metalness: 0,
      });
      const floor = new THREE.Mesh(geometry, material);
      this.scene.add(floor);
    })();

    // 创建模型
    (() => {
      const geometry = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 16);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        roughness: 0, 
        metalness: 0,
      });
      this.meshKnot = new THREE.Mesh(geometry, material);
      this.meshKnot.position.set(0, 5, 0);
      this.meshKnot.name = 'meshKnot';
      this.scene.add(this.meshKnot);
    })();
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setAnimationLoop((time) => {this.animate(time);});
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
  private animate(time: number) {
    if (this.scene) {
      const mesh = this.scene.getObjectByName("meshKnot");

      if (mesh) {
        mesh.rotation.y = time/1000;
      }
    }
    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.camera && this.renderer) {
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

