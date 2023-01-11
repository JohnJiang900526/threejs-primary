import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.PerspectiveCamera
  private stats: null | Stats
  private material: null | THREE.MeshPhongMaterial
  private object: null | THREE.Mesh
  private localPlane: null | THREE.Plane
  private globalPlane: null | THREE.Plane
  private startTime: number
  private globalPlanes: THREE.Plane[]
  private Empty: any[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.material = null;
    this.object = null;
    this.localPlane = null;
    this.globalPlane = null;
    this.startTime = 0;
    this.globalPlanes = [];
    this.Empty = [];
  }

  // 初始化方法入口
  init() {
    // 实例化相机
    this.camera = new THREE.PerspectiveCamera(80, this.width/this.height, 0.25, 16);
    this.camera.position.set(0, 1.5, 3);

    // 创建一个场景
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0x505050));

    // 创建一个点光
    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.2;
    spotLight.position.set(2, 3, 3);
    spotLight.castShadow = true;
    spotLight.shadow.camera.near = 3;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    this.scene.add(spotLight);

    // 创建一个直线光
    const dirLight = new THREE.DirectionalLight(0x55505a, 1);
    dirLight.position.set(0, 3, 0);
    dirLight.castShadow = true;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 10;
    dirLight.shadow.camera.right = 1;
    dirLight.shadow.camera.left = - 1;
    dirLight.shadow.camera.top	= 1;
    dirLight.shadow.camera.bottom = - 1;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    // 创建剪切物体
    this.localPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.8);
    this.globalPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.1);

    // 创建集合体
    this.material = new THREE.MeshPhongMaterial({
      color: 0x80ee10,
      shininess: 100,
      side: THREE.DoubleSide,
      clippingPlanes: [ this.localPlane ],
      clipShadows: true
    });
    const geometry = new THREE.TorusKnotGeometry(0.4, 0.08, 95, 20);

    this.object = new THREE.Mesh(geometry, this.material);
    this.object.castShadow = true;
    this.scene.add(this.object);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 9, 1, 1),
      new THREE.MeshPhongMaterial({color: 0xa0adaf, shininess: 150})
    );
    ground.rotation.x = - Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.globalPlanes = [this.globalPlane];
		this.Empty = [];
    this.renderer.clippingPlanes = this.Empty;
    this.renderer.localClippingEnabled = true;

    const controls = new OrbitControls(this.camera, this.renderer.domElement );
    controls.target.set(0, 1, 0);
    controls.update();

    this.startTime = Date.now();

    // 性能统计 方法调用
    this.initStats();
    // 启动动画
    this.animate();
    // 自适应窗口
    this.resize();
  }

  // enabled
  setEnabled(type: "local" | "global", enabled: boolean) {
    switch(type) {
      case "local":
        if (this.renderer) {
          this.renderer.localClippingEnabled = enabled;
        }
        break;
      case "global":
        if (this.renderer) {
          this.renderer.clippingPlanes = (enabled ? this.globalPlanes : this.Empty);
        }
        break;
      default:
        if (this.renderer) {
          this.renderer.localClippingEnabled = enabled;
        }
    }
  }

  // Shadows
  setShadows(type: "local" | "global", enabled: boolean) {
    switch(type) {
      case "local":
        if (this.material) {
          this.material.clipShadows = enabled;
        }
        break;
      default:
        if (this.renderer) {
          this.renderer.localClippingEnabled = enabled;
        }
    }
  }

  // Plane
  setPlane(type: "local" | "global", val: number) {
    switch(type) {
      case "local":
        if (this.localPlane) {
          this.localPlane.constant = val;
        }
        break;
      case "global":
        if (this.globalPlane) {
          this.globalPlane.constant = val;
        }
        break;
      default:
        if (this.localPlane) {
          this.localPlane.constant = val;
        }
    }
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

    const currentTime = Date.now();
		const time = (currentTime - this.startTime ) / 1000;
    
    if (this.object) {
      this.object.position.y = 0.8;
      this.object.rotation.x = time * 0.5;
      this.object.rotation.y = time * 0.2;
      this.object.scale.setScalar( Math.cos( time ) * 0.125 + 0.875 );
    }

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

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width/this.height;
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

