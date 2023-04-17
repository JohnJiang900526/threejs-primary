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
  private controls: null | OrbitControls
  private stats: null | Stats;

  private group: THREE.Group;
  private cubes: THREE.Group;
  private geometry: THREE.BoxGeometry
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;

    this.group = new THREE.Group();
    this.cubes = new THREE.Group();
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
  }

  // 初始化方法入口
  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 1500);
    this.camera.position.set(0, 4, 7);
    this.camera.lookAt(0, 0, 0);

    // group
    this.render();
    
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enablePan = true;
    this.controls.update();

    // 创建模型
    this.createModel();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建模型
  private createModel() {
    setTimeout(() => { this.addImage(); }, 300);
    setTimeout(() => { this.addImage(); }, 600);
    setTimeout(() => { this.addImage(); }, 900);
    setTimeout(() => { this.addImageBitmap(); }, 1300);
    setTimeout(() => { this.addImageBitmap(); }, 1600);
    setTimeout(() => { this.addImageBitmap(); }, 1900);
  }

  // 添加到场景
  private render() {
    const grid = new THREE.GridHelper(40, 120, 0x888888, 0x444444);
    grid.position.y = -1;
    this.group = new THREE.Group();
    this.cubes = new THREE.Group();
    this.group.add(this.cubes);

    this.scene.add(this.group);
    this.scene.add(grid);
  }

  // 添加ImageBitmap
  private addImageBitmap() {
    const loader = new THREE.ImageBitmapLoader();
    const url = `/examples/textures/planets/earth_atmos_2048.jpg?${performance.now()}`;

    loader.load(url, (imageBitmap) => {
      const texture = new THREE.CanvasTexture(imageBitmap);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      this.addCube(material);
    });
  }

  // 添加图片
  private addImage() {
    const loader = new THREE.ImageLoader();
    const url = `/examples/textures/planets/earth_atmos_2048.jpg?${performance.now()}`;

    loader.load(url, (image) => {
      const texture = new THREE.CanvasTexture(image);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff8888,
        // .map : Texture
        // 颜色贴图。可以选择包括一个alpha通道，通常与.transparent 或.alphaTest。默认为null
        map: texture,
      });
      this.addCube(material);
    });
  }

  // 添加cube
  private addCube(material: THREE.MeshBasicMaterial) {
    const cube = new THREE.Mesh(this.geometry, material);

    cube.position.set(
      Math.random() * 3 - 1, 
      Math.random() * 3 - 1, 
      Math.random() * 3 - 1,
    );

    cube.rotation.set(
      Math.random() * 3 * Math.PI,
      Math.random() * 3 * Math.PI,
      Math.random() * 3 * Math.PI,
    );
    this.cubes.add(cube);
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

    if (this.group) {
      this.group.traverse((cube) => {
        cube.rotation.y += 0.005;
        cube.rotation.z += 0.005;
      });
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    if (this.controls) { this.controls.update(); }

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

