import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private stats: null | Stats
  private effectController: {
    newTess: number,
    bottom: boolean,
    lid: boolean,
    body: boolean,
    fitLid: boolean,
    nonblinn: boolean,
    newShading: string
  }
  private teapotSize: number
  private ambientLight: null | THREE.AmbientLight
  private light: null | THREE.DirectionalLight
  private tess: number;
  private bBottom: boolean
  private bLid: boolean
  private bBody: boolean
  private bFitLid: boolean
  private bNonBlinn: boolean
  private shading: string
  private teapot: null | THREE.Mesh
  private textureCube: null | THREE.Texture
  private materials: {
    wireframe: THREE.MeshBasicMaterial,
    flat: THREE.MeshBasicMaterial,
    smooth: THREE.MeshBasicMaterial,
    glossy: THREE.MeshBasicMaterial,
    textured: THREE.MeshBasicMaterial,
    reflective: THREE.MeshBasicMaterial,
  }
  private readonly path: string
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;
    this.effectController = {
      newTess: 15,
      bottom: true,
      lid: true,
      body: true,
      fitLid: false,
      nonblinn: false,
      newShading: 'glossy'
    };
    this.teapotSize = 300;
    this.ambientLight = null;
    this.light = null;
    this.tess = - 1;
    this.bBottom = true;
    this.bLid = true
    this.bBody = true;
    this.bFitLid = false;
    this.bNonBlinn = true;
    this.shading = "glossy"
    this.teapot = null;
    this.textureCube = null;
    this.materials = {
      wireframe: new THREE.MeshBasicMaterial(),
      flat: new THREE.MeshBasicMaterial(),
      smooth: new THREE.MeshBasicMaterial(),
      glossy: new THREE.MeshBasicMaterial(),
      textured: new THREE.MeshBasicMaterial(),
      reflective: new THREE.MeshBasicMaterial(),
    };
    this.path = "/examples/textures/cube/pisa/";
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(80, this.width/this.height, 1, 80000);
    this.camera.position.set(-600, 550, 1300);

    // 创建光源
    this.ambientLight = new THREE.AmbientLight(0x333333);
    this.light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    this.light.position.set(0.32, 0.39, 0.7);
    this.scene.add(this.ambientLight);
    this.scene.add(this.light);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener("change", () => { this.render(); });

    // 材质 MAP
    const textureMap = new THREE.TextureLoader().load('/examples/textures/uv_grid_opengl.jpg');
    textureMap.wrapS = THREE.RepeatWrapping;
    textureMap.wrapT = THREE.RepeatWrapping;
    textureMap.anisotropy = 16;
    textureMap.encoding = THREE.sRGBEncoding;

    // 映射 MAP
    const urls = ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'];
    this.textureCube = new THREE.CubeTextureLoader().setPath(this.path).load(urls);
    this.textureCube.encoding = THREE.sRGBEncoding;

    this.materials['wireframe'] = new THREE.MeshBasicMaterial({wireframe: true});
    this.materials['flat'] = new THREE.MeshPhongMaterial({specular: 0x000000, flatShading: true, side: THREE.DoubleSide});
    this.materials['smooth'] = new THREE.MeshLambertMaterial({side: THREE.DoubleSide});
    this.materials['glossy'] = new THREE.MeshPhongMaterial({side: THREE.DoubleSide});
    this.materials['textured'] = new THREE.MeshPhongMaterial({map: textureMap, side: THREE.DoubleSide});
    this.materials['reflective'] = new THREE.MeshPhongMaterial({envMap: this.textureCube, side: THREE.DoubleSide});

    // 执行渲染
    this.render();
    // 性能统计
    this.initStats();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 设置控制参数
  setController(obj: any) {
    this.effectController = Object.assign(this.effectController, obj);
    this.render();
  }

  private render() {
    if ( 
      this.effectController.newTess !== this.tess ||
      this.effectController.bottom !== this.bBottom ||
      this.effectController.lid !== this.bLid ||
      this.effectController.body !== this.bBody ||
      this.effectController.fitLid !== this.bFitLid ||
      this.effectController.nonblinn !== this.bNonBlinn ||
      this.effectController.newShading !== this.shading 
    ) {
      this.tess = this.effectController.newTess;
      this.bBottom = this.effectController.bottom;
      this.bLid = this.effectController.lid;
      this.bBody = this.effectController.body;
      this.bFitLid = this.effectController.fitLid;
      this.bNonBlinn = this.effectController.nonblinn;
      this.shading = this.effectController.newShading;

      this.createNewTeapot();
    }

    if (this.shading === 'reflective' ) {
      this.scene.background = this.textureCube;
    } else {
      this.scene.background = new THREE.Color(0x000000);
    }

    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private createNewTeapot() {
    if (this.teapot) {
      this.teapot.geometry.dispose();
      this.scene.remove(this.teapot);
    }

    const geometry = new TeapotGeometry( 
      this.teapotSize,
      this.tess,
      this.effectController.bottom,
      this.effectController.lid,
      this.effectController.body,
      this.effectController.fitLid,
      // @ts-ignore
      !Number(this.effectController.nonblinn)
    );

    // @ts-ignore
    const material: THREE.MeshBasicMaterial = this.materials[this.shading];
    this.teapot = new THREE.Mesh(geometry, material);
    this.scene.add(this.teapot);
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);
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
        this.render();
      }
    };
  }
}

export default THREE;

