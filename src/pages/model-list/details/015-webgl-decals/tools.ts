import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry';

interface IplaneProps {
  constant: number,
  negated: boolean,
  displayHelper: boolean
}

interface Iparams {
  animate: boolean
  planeX: IplaneProps,
  planeY: IplaneProps,
  planeZ: IplaneProps,
}

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private controls: null | OrbitControls;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private line: null | THREE.Line;
  private mesh: null | THREE.Object3D;
  private raycaster: THREE.Raycaster;
  private intersection: {
    intersects: boolean;
    point: THREE.Vector3;
    normal: THREE.Vector3;
  };
  private mouse: THREE.Vector2;
  private intersects: any[];
  private textureLoader: THREE.TextureLoader;
  private decalMaterial: null | THREE.MeshPhongMaterial;
  private mouseHelper: null | THREE.Mesh;
  private moved: boolean;
  private position: THREE.Vector3
  private orientation: THREE.Euler
  private size: THREE.Vector3
  private params: {
    minScale: number,
    maxScale: number,
    rotate: boolean,
    clear: () => void
  }
  private decals: THREE.Mesh[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.controls = null;
    this.camera = null;
    this.stats = null;
    this.line = null;
    this.mesh = null;
    this.raycaster = new THREE.Raycaster();
    this.intersection = {
      intersects: false,
      point: new THREE.Vector3(),
      normal: new THREE.Vector3(),
    };
    this.mouse = new THREE.Vector2();
    this.intersects = [];
    this.textureLoader = new THREE.TextureLoader();
    this.decalMaterial = null;
    this.mouseHelper = null;
    this.moved = false;
    this.position = new THREE.Vector3();
    this.orientation = new THREE.Euler();
    this.size = new THREE.Vector3();

    this.params = {
      minScale: 10,
      maxScale: 20,
      rotate: true,
      clear: () => {
        this.removeDecals();
      }
    };
    this.decals = [];
  }

  // 初始化方法入口
  init() {
    // 初始化参数
    const decalDiffuse = this.textureLoader.load(
      "/examples/textures/decal/decal-diffuse.png"
    );
    const decalNormal = this.textureLoader.load(
      "/examples/textures/decal/decal-normal.jpg"
    );
    this.decalMaterial = new THREE.MeshPhongMaterial({
      specular: 0x444444,
      map: decalDiffuse,
      normalMap: decalNormal,
      normalScale: new THREE.Vector2(1, 1),
      shininess: 30,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      wireframe: false,
    });

    // 实例化相机
    this.camera = new THREE.PerspectiveCamera( 50, this.width / this.height, 1, 1000);
    this.camera.position.z = 200;

    // 创建一个场景 and 添加环境光
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0x443333));

    // 创建两束光
    const dirLight1 = new THREE.DirectionalLight(0xffddcc, 1);
    const dirLight2 = new THREE.DirectionalLight(0xccccff, 1);
    dirLight1.position.set(1, 0.75, 0.5);
    dirLight2.position.set(-1, 0.75, -0.5);
    this.scene.add(dirLight1);
    this.scene.add(dirLight2);

    // 创建一个线几何体
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
    this.scene.add(this.line);

    // 加载模型
    this.loadLeePerrySmith();

    // 鼠标帮助
    this.mouseHelper = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 10),
      new THREE.MeshNormalMaterial()
    );
    this.mouseHelper.visible = false;
    this.scene.add(this.mouseHelper);

    // 创建一个渲染器
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建一个控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 50;
    this.controls.maxDistance = 200;

    // 事件绑定
    this.controls.addEventListener("change", () => {
      this.moved = true;
    });

    window.onpointerdown = () => {
      this.moved = false;
    };
    window.onpointerup = (e) => {
      if (this.moved === false) {
        this.checkIntersection(e.clientX, e.clientY - 50);
        if (this.intersection.intersects) {
          this.shoot();
        }
      }
    };
    window.onpointermove = (e) => {
      if (e.isPrimary) {
        this.checkIntersection(e.clientX, e.clientY - 50);
      }
    };

    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
  }

  setMinScale (val: number) {
    this.params.minScale = val;
  }
  setMaxScale (val: number) {
    this.params.maxScale = val;
  }
  setRotate (check: boolean) {
    this.params.rotate = check;
  }
  clear () {
    this.removeDecals();
  }

  // 删除喷射材质
  private removeDecals() {
    this.decals.forEach((d) => {
      (this.scene as THREE.Scene).remove(d);
    });
    this.decals = [];
  }

  // 选择交叉点
  private checkIntersection(x: number, y: number) {
    if (!this.mesh) { return false; }

    this.mouse.x = (x / this.width) * 2 - 1;
    this.mouse.y = -(y / this.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera as THREE.PerspectiveCamera);
    this.raycaster.intersectObject(this.mesh, false, this.intersects);

    if (this.intersects.length > 0) {
      const p = this.intersects[0].point;
      (this.mouseHelper as THREE.Mesh).position.copy(p);
      this.intersection.point.copy(p);

      const n = this.intersects[0].face.normal.clone();
      n.transformDirection(this.mesh.matrixWorld);
      n.multiplyScalar(10);
      n.add(this.intersects[0].point);

      this.intersection.normal.copy(this.intersects[0].face.normal);
      (this.mouseHelper as THREE.Mesh).lookAt(n);

      const positions = (this.line as THREE.Line).geometry.attributes.position;
      positions.setXYZ(0, p.x, p.y, p.z);
      positions.setXYZ(1, n.x, n.y, n.z);
      positions.needsUpdate = true;
      this.intersection.intersects = true;
      this.intersects.length = 0;
    } else {
      this.intersection.intersects = false;
    }
  }

  // 喷射
  private shoot() {
    this.position.copy(this.intersection.point);
    this.orientation.copy((this.mouseHelper as THREE.Mesh).rotation);

    if ( this.params.rotate) {
      this.orientation.z = Math.random() * 2 * Math.PI
    }

    const scale = this.params.minScale + Math.random() * ( this.params.maxScale - this.params.minScale );
    this.size.set(scale, scale, scale);

    const material = (this.decalMaterial as THREE.MeshPhongMaterial).clone();
    material.color.setHex( Math.random() * 0xffffff );

    // @ts-ignore
    const m = new THREE.Mesh(new DecalGeometry(this.mesh as THREE.Object3D, this.position, this.orientation, this.size), material);

    this.decals.push(m);
    (this.scene as THREE.Scene).add(m);
  }

  // 加载模型
  private loadLeePerrySmith() {
    const loader = new GLTFLoader();
    loader.load( "/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb", (gltf) => {
        this.mesh = gltf.scene.children[0];
        // @ts-ignore
        this.mesh.material = new THREE.MeshPhongMaterial({
          specular: 0x111111,
          map: this.textureLoader.load("/examples/models/gltf/LeePerrySmith/Map-COL.jpg"),
          specularMap: this.textureLoader.load("/examples/models/gltf/LeePerrySmith/Map-SPEC.jpg"),
          normalMap: this.textureLoader.load("/examples/models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg"),
          shininess: 25,
        });

        (this.scene as THREE.Scene).add(this.mesh);
        this.mesh.scale.set(10, 10, 10);
      }
    );
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
    if (this.stats) {
      this.stats.update();
    }

    // 控制器更新
    if (this.controls) {
      this.controls.update();
    }

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

