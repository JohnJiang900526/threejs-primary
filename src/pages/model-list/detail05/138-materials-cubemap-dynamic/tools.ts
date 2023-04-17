import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private gui: GUI
  private controls: null | OrbitControls
  private cube: THREE.Mesh
  private sphere: THREE.Mesh
  private torus: THREE.Mesh
  private material: THREE.MeshStandardMaterial
  private cubeCamera: null | THREE.CubeCamera
  private cubeRenderTarget: THREE.WebGLCubeRenderTarget
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
      title: "控制面板",
    });
    this.controls = null;
    this.cube = new THREE.Mesh();
    this.sphere = new THREE.Mesh();
    this.torus = new THREE.Mesh();
    this.material = new THREE.MeshStandardMaterial();
    this.cubeCamera = null;
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xc0d0d4);
    this.scene.rotation.y = 0.5;

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 1000);
    this.camera.position.z = 75;

    // 加载模型
    this.loadModel(() => {
      this.generateCubeCamera();
      this.createMesh();
      this.setUpGUI();
    });

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.autoRotate = true;

    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.material, 'roughness', 0, 1).name("粗糙程度");
    this.gui.add(this.material, 'metalness', 0, 1).name("金属相似度");
    this.gui.add(this.renderer as THREE.WebGLRenderer, 'toneMappingExposure', 0, 2).name('曝光级别');
  }

  private loadModel(fn?: () => void) {
    const loader = new RGBELoader();
    const url = "/examples/textures/equirectangular/quarry_01_1k.hdr";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (texture) => {
      toast.close();

      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = texture;
      this.scene.environment = texture;
      fn && fn();
    }, undefined, () => { toast.close(); });
  }

  private generateCubeCamera() {
    // WebGLCubeRenderTarget 被CubeCamera作为它的WebGLRenderTarget使用
    // WebGLCubeRenderTarget(size : Number, options : Object)
    // size - the size, in pixels. Default is 1
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    // .type : number
    // 这个值必须与.format相对应。默认值为THREE.UnsignedByteType， 它将会被用于绝大多数纹理格式
    this.cubeRenderTarget.texture.type = THREE.HalfFloatType;
    // 立方相机（CubeCamera）创建6个渲染到WebGLCubeRenderTarget的摄像机
    this.cubeCamera = new THREE.CubeCamera(1, 1000, this.cubeRenderTarget);

    this.material = new THREE.MeshStandardMaterial( {
      roughness: 0.05,
      metalness: 1,
      envMap: this.cubeRenderTarget.texture,
    });
  }

  private createMesh() {
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.1,
      metalness: 0,
    });

    // 二十面缓冲几何体（IcosahedronGeometry）
    // IcosahedronGeometry(radius : Float, detail : Integer)
    // radius — 二十面体的半径，默认为1
    // detail — 默认值为0。将这个值设为一个大于0的数将会为它增加一些顶点，
    // 使其不再是一个二十面体。当这个值大于1的时候，实际上它将变成一个球体
    this.sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(10, 8), this.material);
    this.cube = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), material);
    // 圆环缓冲扭结几何体（TorusKnotGeometry）
    // TorusKnotGeometry(radius : Float, tube : Float, tubularSegments : Integer, radialSegments : Integer, p : Integer, q : Integer)
    // radius - 圆环的半径，默认值为1。
    // tube — 管道的半径，默认值为0.4。
    // tubularSegments — 管道的分段数量，默认值为64。
    // radialSegments — 横截面分段数量，默认值为8。
    // p — 这个值决定了几何体将绕着其旋转对称轴旋转多少次，默认值是2。
    // q — 这个值决定了几何体将绕着其内部圆环旋转多少次，默认值是3。
    this.torus = new THREE.Mesh(new THREE.TorusKnotGeometry(4, 1, 128, 16), material);

    this.scene.add(this.sphere, this.cube, this.torus);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setAnimationLoop((time) => { this.render(time); })
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

  private render(ms: number) {
    const time = ms / 1000 / 2;

    this.cube.position.set(
      Math.cos(time) * 30,
      Math.sin(time) * 30,
      Math.sin(time) * 30,
    );
    this.cube.rotation.x += 0.02;
    this.cube.rotation.y += 0.03;

    this.torus.position.set(
      Math.cos(time + 10) * 30,
      Math.sin(time + 10) * 30,
      Math.sin(time + 10) * 30,
    );
    this.torus.rotation.x += 0.02;
    this.torus.rotation.y += 0.03;

    
    this.stats?.update();
    this.controls?.update();
    
    if (this.renderer && this.scene && this.camera && this.cubeCamera) {
      // .update ( renderer : WebGLRenderer, scene : Scene ) : undefined
      // renderer -- 当前的WebGL渲染器
      // scene -- 当前的场景
      // 这个方法用来更新renderTarget（渲染目标对象）
      this.cubeCamera.update(this.renderer, this.scene);
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    // 执行渲染
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
      }
    };
  }
}

export default THREE;

