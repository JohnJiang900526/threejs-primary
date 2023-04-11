import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';


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
  private cubeMaterial1: THREE.MeshLambertMaterial
  private cubeMaterial2: THREE.MeshLambertMaterial
  private cubeMaterial3: THREE.MeshLambertMaterial
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
    this.cubeMaterial1 = new THREE.MeshLambertMaterial();
    this.cubeMaterial2 = new THREE.MeshLambertMaterial();
    this.cubeMaterial3 = new THREE.MeshLambertMaterial();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 5000);
    this.camera.position.z = 2000;

    this.generateLight();
    this.generateMaterial();

    // 加载模型
    this.loadModel();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.minPolarAngle = Math.PI / 4;
    this.controls.maxPolarAngle = Math.PI / 1.5;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private loadModel() {
    const loader = new OBJLoader();
    const url = "/examples/models/obj/walt/WaltHead.obj";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (obj) => {
      toast.close();
      const head1 = obj.children[0] as THREE.Mesh;

      head1.scale.multiplyScalar(5);
      head1.position.y = -150;
      head1.name = "center_header";
      head1.material = this.cubeMaterial1;

      const head2 = head1.clone();
      head2.position.x = -300;
      head2.name = "left_header";
      head2.material = this.cubeMaterial2;

      const head3 = head1.clone();
      head3.position.x = 300;
      head3.name = "right_header";
      head3.material = this.cubeMaterial3;

      this.scene.add(head1, head2, head3);
    }, undefined, () => { toast.close(); });
  }

  private generateMaterial() {
    const loader = new THREE.CubeTextureLoader();
    const path = '/examples/textures/cube/SwedishRoyalCastle/';
    const format = '.jpg';
    const urls = [
      path + 'px' + format, path + 'nx' + format,
      path + 'py' + format, path + 'ny' + format,
      path + 'pz' + format, path + 'nz' + format
    ];

    const reflectionCube = loader.load(urls);
    const refractionCube = loader.load(urls);
    refractionCube.mapping = THREE.CubeRefractionMapping;

    this.scene.background = reflectionCube;
    this.cubeMaterial1 = new THREE.MeshLambertMaterial({ 
      color: 0xffffff, 
      // 环境贴图。默认值为null
      envMap: reflectionCube,
    });
    this.cubeMaterial2 = new THREE.MeshLambertMaterial({ 
      color: 0xffee00, 
      // 环境贴图。默认值为null
      envMap: refractionCube, 
      // 空气的折射率（IOR）（约为1）除以材质的折射率。
      // 它与环境映射模式THREE.CubeRefractionMapping 和THREE.EquirectangularRefractionMapping一起使用
      // 折射率不应超过1。默认值为0.98
      refractionRatio: 0.95,
    });
    this.cubeMaterial3 = new THREE.MeshLambertMaterial({ 
      color: 0xff6600, 
      // 环境贴图。默认值为null
      envMap: reflectionCube, 
      // 如何将表面颜色的结果与环境贴图（如果有）结合起来
      // 选项为THREE.MultiplyOperation（默认值），THREE.MixOperation， THREE.AddOperation。
      // 如果选择多个，则使用.reflectivity在两种颜色之间进行混合
      combine: THREE.MixOperation, 
      // 环境贴图对表面的影响程度; 见.combine。默认值为1，有效范围介于0（无反射）和1（完全反射）之间
      reflectivity: 0.3,
    });
  }

  private generateLight() {
    const light1 = new THREE.AmbientLight(0xffffff);

    const light2 = new THREE.PointLight(0xffffff, 2);
    this.scene.add(light1, light2);
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 旋转
    this.scene.traverse((obj) => {
      switch(obj.name) {
        case "left_header":
          obj.rotation.y -= 0.005;
          break;
        case "right_header":
          obj.rotation.y += 0.005;
      }
    });

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

