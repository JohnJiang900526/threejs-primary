import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls
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
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 1000);
    this.camera.position.set(-10, 0, 23);
    this.scene.add(this.camera);

    this.generateLight();
    this.loadModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.enablePan = false;
    this.controls.addEventListener("change", () => { this.render(); })

    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateLight() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.2);
    const light = new THREE.PointLight(0xffffff, 1.5);

    this.scene.add(ambient);
    this.camera?.add(light);
  }

  private loadModel() {
    const loader = new GLTFLoader();
    const url = "/examples/models/gltf/Nefertiti/Nefertiti.glb";
    // toast
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (gltf) => {
      toast.close();

      const mesh = gltf.scene.children[0] as THREE.Mesh;
      const material = mesh.material as THREE.MeshStandardMaterial;

      material.normalMapType = THREE.ObjectSpaceNormalMap;
      material.side = THREE.DoubleSide;
      mesh.material = material;

      mesh.geometry.deleteAttribute('normal');
      mesh.scale.multiplyScalar(0.3);
      
      const box3 = new THREE.Box3();
      // .setFromObject ( object : Object3D ) : this
      // object - 用来计算包围盒的3D对象 Object3D
      // 计算和世界轴对齐的一个对象 Object3D （含其子对象）的包围盒，计算对象和子对象的世界坐标变换。 
      // 该方法可能会导致一个比严格需要的更大的框

      // .getCenter ( target : Vector3 ) : Vector3
      // target — 如果指定了target ，结果将会被拷贝到target
      // 返回包围盒的中心点 Vector3
      box3.setFromObject(mesh).getCenter(mesh.position).multiplyScalar(-1);
      this.scene.add(mesh);
      this.render();
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

  private render() {
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
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
      this.render();
    };
  }
}

export default THREE;

