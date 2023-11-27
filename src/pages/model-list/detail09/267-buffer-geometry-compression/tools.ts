import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as GeometryCompressionUtils from 'three/examples/jsm/utils/GeometryCompressionUtils';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry';
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
  private animateNumber: number;

  private controls: null | OrbitControls;
  private lights: THREE.PointLight[];
  private data: {
    'model': string
    'wireframe': boolean;
    'texture': boolean;
    'detail': number;
    'rotationSpeed': number;
    'QuantizePosEncoding': boolean;
    'NormEncodingMethods': string
    'DefaultUVEncoding': boolean;
    'totalGPUMemory': string
  };
  private memoryDisplay: null | any;
  private radius: number;
  private lineMaterial: THREE.LineBasicMaterial
  private meshMaterial: THREE.MeshPhongMaterial
  private texture: THREE.Texture;
  private lineSegments: THREE.LineSegments;
  private geom: null | THREE.IcosahedronGeometry | THREE.CylinderGeometry | TeapotGeometry | THREE.TorusKnotGeometry;
  private mesh: THREE.Mesh;
  private gui: GUI;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.lights = [];
    this.data = {
      'model': 'Icosahedron',
      'wireframe': false,
      'texture': false,
      'detail': 4,
      'rotationSpeed': 0.1,
      'QuantizePosEncoding': false,
      'NormEncodingMethods': 'None',
      'DefaultUVEncoding': false,
      'totalGPUMemory': '0 bytes'
    };
    this.radius = 100;
    this.lineMaterial = new THREE.LineBasicMaterial({
      opacity: 0.8,
      color: 0xaaaaaa, 
      transparent: true, 
    });
    this.meshMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff, 
      emissive: 0x111111
    });
    this.texture = new THREE.TextureLoader().load('/examples/textures/uv_grid_opengl.jpg');
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    
    this.lineSegments = new THREE.LineSegments();
    this.geom = null;
    this.mesh = new THREE.Mesh();
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.01, 10000000);
    this.camera.position.set(this.radius * 2, this.radius * 2, this.radius * 2);

    // helper
    this.createHelper();
    // 灯光
    this.generateLight();
    // mesh
    this.generateMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.setGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setGUI() {
    let folder = this.gui.addFolder('Scene');
    const modelValues = ['Icosahedron', 'Cylinder', 'TorusKnot', 'Teapot'];
    folder.add(this.data, 'model', modelValues).onChange(() => {
      this.generateGeometry();
    });
    folder.add(this.data, 'wireframe').onChange(() => {
      this.updateLineSegments();
    });
    folder.add(this.data, 'texture').onChange(() => {
      this.generateGeometry();
    });
    folder.add(this.data, 'detail', 1, 8, 1).onChange(() => {
      this.generateGeometry();
    });
    folder.add(this.data, 'rotationSpeed', 0, 0.5, 0.1);
    folder.open();

    folder = this.gui.addFolder('Position Compression');
    folder.add(this.data, 'QuantizePosEncoding').onChange(() => {
      this.generateGeometry();
    });
    folder.open();

    folder = this.gui.addFolder('Normal Compression');
    const methods = ['None', 'DEFAULT', 'OCT1Byte', 'OCT2Byte', 'ANGLES'];
    folder.add(this.data, 'NormEncodingMethods', methods).onChange(() => {
      this.generateGeometry();
    });
    folder.open();

    folder = this.gui.addFolder('UV Compression');
    folder.add(this.data, 'DefaultUVEncoding').onChange(() => {
      this.generateGeometry();
    });
    folder.open();
    folder = this.gui.addFolder('Memory Info');
    folder.open();
    this.memoryDisplay = folder.add(this.data, 'totalGPUMemory');
    this.computeGPUMemory(this.mesh);
  }

  private generateMesh() {
    this.geom = this.newGeometry(this.data);
    this.mesh = new THREE.Mesh(this.geom, this.meshMaterial);

    this.lineSegments = new THREE.LineSegments(new THREE.WireframeGeometry(this.geom), this.lineMaterial);
    this.lineSegments.visible = this.data.wireframe;

    this.scene.add(this.mesh);
    this.scene.add(this.lineSegments);
  }

  private generateGeometry() {
    this.geom = this.newGeometry(this.data);
    this.updateGroupGeometry(
      this.mesh,
      this.lineSegments,
      this.geom,
      this.data,
    );
  }

  private updateLineSegments() {
    this.lineSegments.visible = this.data.wireframe;
  }

  private newGeometry(data: any) {
    switch (data.model) {
      case 'Icosahedron':
        return new THREE.IcosahedronGeometry(this.radius, data.detail);
      case 'Cylinder':
        return new THREE.CylinderGeometry(this.radius, this.radius, this.radius * 2, data.detail * 6);
      case 'Teapot':
        return new TeapotGeometry(this.radius, data.detail * 3, true, true, true, true, 1);
      case 'TorusKnot':
        return new THREE.TorusKnotGeometry(this.radius, 10, data.detail * 20, data.detail * 6, 3, 4);
      default:
        return new THREE.IcosahedronGeometry(this.radius, data.detail);
    }
  }

  private updateGroupGeometry(
    mesh: THREE.Mesh, 
    lineSegments: THREE.LineSegments, 
    geometry: THREE.IcosahedronGeometry | THREE.CylinderGeometry | TeapotGeometry | THREE.TorusKnotGeometry, 
    data: any,
  ) {
    // dispose first
    lineSegments.geometry.dispose();
    mesh.geometry.dispose();

    lineSegments.geometry = new THREE.WireframeGeometry( geometry );
    mesh.geometry = geometry;
    mesh.material = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x111111 });
    (mesh.material as THREE.MeshPhongMaterial).map = data.texture ? this.texture : null;

    if (data['QuantizePosEncoding']) {
      GeometryCompressionUtils.compressPositions(mesh);
    }

    if (data['NormEncodingMethods'] !== 'None') {
      GeometryCompressionUtils.compressNormals(mesh, data['NormEncodingMethods']);
    }

    if (data['DefaultUVEncoding']) {
      GeometryCompressionUtils.compressUvs(mesh);
    }

    this.computeGPUMemory(mesh);
  }

  private computeGPUMemory(mesh: THREE.Mesh) {
    this.memoryDisplay?.setValue(BufferGeometryUtils.estimateBytesUsed(mesh.geometry) + ' bytes');
  }

  private createHelper() {
    const helper = new THREE.AxesHelper(this.radius * 5);
    this.scene.add(helper);
  }

  private generateLight() {
    const light1 = new THREE.PointLight(0xffffff, 1, 0);
    const light2 = new THREE.PointLight(0xffffff, 1, 0);
    const light3 = new THREE.PointLight(0xffffff, 1, 0);

    light1.position.set(0, 2 * this.radius, 0);
    light2.position.set(2 * this.radius, - 2 * this.radius, 2 * this.radius);
    light3.position.set(-2 * this.radius, - 2 * this.radius, - 2 * this.radius);

    this.lights.push(light1, light2, light3);
    this.scene.add(...this.lights);
  }

  private updateLightsPossition() {
    this.lights.forEach((light) => {
      const direction = light.position.clone();
      const v3 = new THREE.Vector3(1, 1, 0);

      direction.applyAxisAngle(v3, this.data.rotationSpeed / 180 * Math.PI);
      light.position.add(direction.sub(light.position));
    });
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
    this.stats = new Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    this.updateLightsPossition();
    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
  }

  // 消除 副作用
  dispose() {
    window.cancelAnimationFrame(this.animateNumber);
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

