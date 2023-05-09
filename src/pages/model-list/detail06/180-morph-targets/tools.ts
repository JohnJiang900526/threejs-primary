import * as THREE from 'three';
import GUI from 'lil-gui';
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
  private stats: null | Stats;

  private controls: null | OrbitControls;
  private gui: GUI;
  private mesh: THREE.Mesh
  private params: {
    Spherify: number,
    Twist: number,
  };
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.controls = null;
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板",
    });
    this.mesh = new THREE.Mesh();
    this.params = {
      Spherify: 0,
      Twist: 0,
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8FBCD4);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 1000);
    this.camera.position.set(0, 0, 10);

    this.generateLight();
    this.generateMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableZoom = false;

    this.setUpGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.params, 'Spherify', 0, 1).name("球形扭曲").step(0.01).onChange(() => {
      if (this.mesh.morphTargetInfluences) {
        this.mesh.morphTargetInfluences[0] = this.params.Spherify;
      }
    });
    this.gui.add(this.params, 'Twist', 0, 1).name("变形程度").step(0.01).onChange(() => {
      if (this.mesh.morphTargetInfluences) {
        this.mesh.morphTargetInfluences[1] = this.params.Twist;
      }
    });
  }

  private generateMesh() {
    const geometry = this.createGeometry();
    const material = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      // 平面着色
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  private generateLight() {
    const light1 = new THREE.AmbientLight(0x8FBCD4, 0.4);

    const light2 = new THREE.PointLight(0xffffff, 1);
    this.camera?.add(light2);

    this.scene.add(light1, this.camera as THREE.PerspectiveCamera);
  }

  // 核心逻辑
  private createGeometry() {
    const geometry = new THREE.BoxGeometry(2, 2, 2, 32, 32, 32);
    geometry.morphAttributes.position = [];

    const pAttr = geometry.attributes.position as THREE.BufferAttribute;
    const count = pAttr.count;
    const spherePositions: number[] = [];
    const twistPositions: number[] = [];
    const direction = new THREE.Vector3(1, 0, 0);
    const vertex = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const x = pAttr.getX(i);
      const y = pAttr.getY(i);
      const z = pAttr.getZ(i);

      // 这部分逻辑看不懂
      spherePositions.push(
        x * Math.sqrt(1 - (y * y / 2) - (z * z / 2) + (y * y * z * z / 3)),
        y * Math.sqrt(1 - (z * z / 2) - (x * x / 2) + (z * z * x * x / 3)),
        z * Math.sqrt(1 - (x * x / 2) - (y * y / 2) + (x * x * y * y / 3)),
      );

      vertex.set(x * 2, y, z);
      // .applyAxisAngle ( axis : Vector3, angle : Float ) : this
      // axis - 一个被归一化的Vector3
      // angle - 以弧度表示的角度
      // 将轴和角度所指定的旋转应用到该向量上

      // .toArray ( array : Array, offset : Integer ) : Array
      // array - （可选）被用于存储向量的数组。如果这个值没有传入，则将创建一个新的数组
      // offset - （可选） 数组中元素的偏移量
      // 返回一个数组[x, y ,z]，或者将x、y和z复制到所传入的array中
      vertex.applyAxisAngle(direction, Math.PI * x / 2).toArray(twistPositions, twistPositions.length);
    }

    // 这部分也看不明白 只知道这里存着位置信息
    geometry.morphAttributes.position[0] = new THREE.Float32BufferAttribute(spherePositions, 3);
    geometry.morphAttributes.position[1] = new THREE.Float32BufferAttribute(twistPositions, 3);
    return geometry;
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

    this.stats?.update();
    this.controls?.update();
    
    // 执行渲染
    if (this.renderer && this.camera) {
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

