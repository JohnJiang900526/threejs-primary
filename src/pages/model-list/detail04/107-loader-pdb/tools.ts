import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { PDBLoader } from 'three/examples/jsm/loaders/PDBLoader';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | TrackballControls
  private stats: null | Stats;
  
  private gui: GUI
  private labelRenderer: CSS2DRenderer
  private root: THREE.Group
  private MOLECULES: {[key: string]: string}
  private params: {
    molecule: string
  }
  private loader: PDBLoader
  private offset: THREE.Vector3
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
    
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.labelRenderer = new CSS2DRenderer();
    this.root = new THREE.Group();
    this.MOLECULES = {
      'Ethanol': 'ethanol.pdb',
      'Aspirin': 'aspirin.pdb',
      'Caffeine': 'caffeine.pdb',
      'Nicotine': 'nicotine.pdb',
      'LSD': 'lsd.pdb',
      'Cocaine': 'cocaine.pdb',
      'Cholesterol': 'cholesterol.pdb',
      'Lycopene': 'lycopene.pdb',
      'Glucose': 'glucose.pdb',
      'Aluminium oxide': 'Al2O3.pdb',
      'Cubane': 'cubane.pdb',
      'Copper': 'cu.pdb',
      'Fluorite': 'caf2.pdb',
      'Salt': 'nacl.pdb',
      'YBCO superconductor': 'ybco.pdb',
      'Buckyball': 'buckyball.pdb',
      'Graphite': 'graphite.pdb'
    };
    this.params = {
      molecule: 'caffeine.pdb'
    };
    this.loader = new PDBLoader();
    this.offset = new THREE.Vector3();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.add(this.root);

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 5000);
    this.camera.position.z = 1000;
    this.scene.add(this.camera);

    this.createLight();

    // 加载模型
    this.loadModel(this.params.molecule);

    // webgl渲染器 & CSS2D 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new TrackballControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 500;
    this.controls.maxDistance = 2000;

    // gui
    this.gui.add(this.params, 'molecule', this.MOLECULES ).onChange(() => {
      this.loadModel(this.params.molecule);
    });
		this.gui.open();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createLight() {
    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(1, 1, 1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(-1, -1, 1);
    this.scene.add(light1, light2);
  }

  // 加载模型 核心
  private loadModel(model: string = "caffeine.pdb") {
    const url = `/examples/models/pdb/${model}`;

    while(this.root.children.length > 0) {
      this.root.remove(this.root.children[0]);
    }

    const toast = showLoadingToast({
      duration: 10000,
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    this.loader.load(url, (pdb) => {
      toast.close();
      // 原子
      const geometryAtoms = pdb.geometryAtoms;
      // 联系
      const geometryBonds = pdb.geometryBonds;
      const json = pdb.json;

      const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
      // 二十面缓冲几何体（IcosahedronGeometry）一个用于生成二十面体的类
      const sphereGeometry = new THREE.IcosahedronGeometry(1, 3);

      // 计算当前几何体的的边界矩形，该操作会更新已有 [param:.boundingBox]。
      // 边界矩形不会默认计算，需要调用该接口指定计算边界矩形，否则保持默认值 null。
      geometryAtoms.computeBoundingBox();
      // 当前 bufferGeometry 的外边界矩形。可以通过 .computeBoundingBox() 计算。默认值是 null
      const boundingBox = geometryAtoms.boundingBox as THREE.Box3;
      // .negate () : this
      // 向量取反，即： x = -x, y = -y , z = -z
      boundingBox.getCenter(this.offset).negate();

      const {x, y, z} = this.offset;
      // 移动几何体。该操作一般在一次处理中完成，不会循环处理。
      // 典型的用法是通过调用 Object3D.rotation 实时旋转几何体
      geometryAtoms.translate(x, y, z);
      geometryBonds.translate(x, y, z);

      // 原子和label
      let positions = geometryAtoms.getAttribute('position');
      const colors = geometryAtoms.getAttribute('color');
      const position = new THREE.Vector3();
      const color = new THREE.Color();
      for (let i = 0; i < positions.count; i++) {
        position.set(positions.getX(i), positions.getY(i), positions.getZ(i));
        color.setRGB(colors.getX(i), colors.getY(i), colors.getZ(i));

        // 圆球
        const material = new THREE.MeshPhongMaterial({ color: color });
        const object = new THREE.Mesh(sphereGeometry, material);
        object.position.copy(position);
        object.position.multiplyScalar(75);
        object.scale.multiplyScalar(25);
        this.root.add(object);

        // label
        const atom = json.atoms[i];
        const [r, g, b] = atom[3];
        const text = document.createElement('div');
        text.className = 'label';
        text.style.color = 'rgb(' + r + ',' + g + ',' + b + ')';
        text.textContent = atom[4];

        const label = new CSS2DObject(text);
        label.position.copy(object.position);
        this.root.add(label);
      }

      // 原子之间的接线
      positions = geometryBonds.getAttribute('position');
      const start = new THREE.Vector3();
      const end = new THREE.Vector3();
      for (let i = 0; i < positions.count; i += 2) {
        start.set(positions.getX(i), positions.getY(i), positions.getZ(i));
        end.set(positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1));
        start.multiplyScalar(75);
        end.multiplyScalar(75);

        const material = new THREE.MeshPhongMaterial({color: 0xffffff});
        const object = new THREE.Mesh(boxGeometry, material);
        object.position.copy(start);
        // .lerp ( v : Vector3, alpha : Float ) : this
        // v - 朝着进行插值的Vector3
        // alpha - 插值因数，其范围通常在[0, 1]闭区间
        object.position.lerp(end, 0.5);
        // .distanceTo ( v : Vector3 ) : Float
        // 计算该向量到所传入的v间的距离
        object.scale.set(5, 5, start.distanceTo(end));
        // .lookAt ( vector : Vector3 ) : undefined
        // .lookAt ( x : Float, y : Float, z : Float ) : undefined
        // vector - 一个表示世界空间中位置的向量 也可以使用世界空间中x、y和z的位置分量
        // 旋转物体使其在世界空间中面朝一个点
        // 这一方法不支持其父级被旋转过或者被位移过的物体
        object.lookAt(end);
        this.root.add(object);
      }
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(this.width, this.height);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0px';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    if (this.controls) { this.controls.update(); }

    // 控制物体旋转
    if (this.root) {
      const time = Date.now() * 0.0004;
      this.root.rotation.x = time;
      this.root.rotation.y = time * 0.01;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
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
        this.labelRenderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

