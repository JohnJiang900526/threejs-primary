import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { ProgressiveLightMap } from 'three/examples/jsm/misc/ProgressiveLightMap';
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
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;

  private shadowMapRes: number;
  private lightMapRes: number;
  private lightCount: number;
  private control: null | TransformControls;
  private control2:  null | TransformControls;
  private object: THREE.Mesh;
  private lightOrigin: THREE.Group;
  private progressiveSurfacemap: null | ProgressiveLightMap;
  private dirLights: THREE.DirectionalLight[]
  private lightmapObjects: (THREE.DirectionalLight | THREE.Mesh)[];
  private params: {
    'Enable': boolean;
    'Blur Edges': boolean;
    'Blend Window': number;
    'Light Radius': number;
    'Ambient Weight': number;
    'Debug Lightmap': boolean;
  }
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
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });

    this.shadowMapRes = 512;
    this.lightMapRes = 1024;
    this.lightCount = 8;
    this.control = null;
    this.control2 = null;
    this.object = new THREE.Mesh();
    this.lightOrigin = new THREE.Group();
    this.progressiveSurfacemap = null;
    this.dirLights = [];
    this.lightmapObjects = [];
    this.params = {
      'Enable': true, 
      'Blur Edges': true, 
      'Blend Window': 200,
      'Light Radius': 50, 
      'Ambient Weight': 0.5, 
      'Debug Lightmap': false,
    }
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x949494);
    this.scene.fog = new THREE.Fog(0x949494, 1000, 3000);

    this.lightOrigin.position.set(60, 150, 100);
    this.scene.add(this.lightOrigin);

    // 相机
    this.camera = new THREE.PerspectiveCamera(99, this.aspect, 1, 1000);
    this.camera.position.set(0, 100, 300);

    // 光线
    this.generateLights();
    // 地板
    this.generateGround();
    // 渲染器
    this.createRenderer();
    // 模型
    this.loadModel();

    // 渐进光图
    this.progressiveSurfacemap = new ProgressiveLightMap(this.renderer!, this.lightMapRes);

    // 变换坐标系
    this.control = new TransformControls(this.camera, this.renderer!.domElement);
    this.control.addEventListener('dragging-changed', (e) => {
      this.controls!.enabled = !e.value;
    });
    this.control.attach(this.lightOrigin);
    this.scene.add(this.control);

    // 控制器
    this.generateControls();

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

  // 创建控制器
  private generateControls() {
    this.controls = new OrbitControls(this.camera!, this.renderer?.domElement);
    // 当启用阻尼或自动旋转时，需要一个动画循环
    this.controls.enableDamping = true;
    // 当.enableDamping设置为true的时候，阻尼惯性有多大。 Default is 0.05.
    // 请注意，要使得这一值生效，你必须在你的动画循环里调用.update()。
    this.controls.dampingFactor = 0.05;
    // 定义当平移的时候摄像机的位置将如何移动。如果为true，摄像机将在屏幕空间内平移。 
    // 否则，摄像机将在与摄像机向上方向垂直的平面中平移。
    // 当使用 OrbitControls 时， 默认值为true；
    // 当使用 MapControls 时，默认值为false。
    this.controls.screenSpacePanning = true;
    // 你能够将相机向内移动多少（仅适用于PerspectiveCamera），其默认值为0。
    this.controls.minDistance = 100;
    // 你能够将相机向外移动多少（仅适用于PerspectiveCamera），其默认值为Infinity。
    this.controls.maxDistance = 500;
    // 你能够垂直旋转的角度的上限，范围是0到Math.PI，其默认值为Math.PI。
    this.controls.maxPolarAngle = Math.PI / 1.5;
    this.controls.target.set(0, 50, 0);
    this.controls.update();
  }

  private setGUI() {
    this.gui.add(this.params, 'Enable');
    this.gui.add(this.params, 'Blur Edges');
    this.gui.add(this.params, 'Blend Window', 1, 500, 1);
    this.gui.add(this.params, 'Light Radius', 0, 200, 10);
    this.gui.add(this.params, 'Ambient Weight', 0, 1, 0.1);
    this.gui.add(this.params, 'Debug Lightmap');
  }

  private loadModel() {
    const manager = new THREE.LoadingManager(() => {
      // 模型对象
      this.object.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          obj.material = new THREE.MeshPhongMaterial();
  
          this.lightmapObjects.push(obj);
        } else {
          obj.layers.disableAll();
        }
      });

      // 添加对象到 光线贴图
      this.progressiveSurfacemap?.addObjectsToLightMap(this.lightmapObjects);

      this.object.scale.set(2, 2, 2);
      this.object.position.set(0, -16, 0);
      this.scene.add(this.object);
  
      // 第二个坐标控制器
      this.control2 = new TransformControls(this.camera!, this.renderer!.domElement);
      this.control2.addEventListener('dragging-changed', (e) => {
        this.controls!.enabled = !e.value;
      });
      this.control2.attach(this.object);
      this.scene.add(this.control2);
    });

    const loader = new GLTFLoader(manager);
    const url = "/examples/models/gltf/ShadowmappableMesh.glb";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (obj) => {
      toast.close();
      this.object = obj.scene.children[0] as THREE.Mesh;
    }, undefined, () => { toast.close(); });
  }

  private generateLights() {
    // 创建8个方向灯，以加快聚集
    for (let i = 0; i < this.lightCount; i++) {
      const light = new THREE.DirectionalLight(0xffffff, 1.0 / this.lightCount);
      light.name = `Dir.Light_${i}`;
      light.position.set(200, 200, 200);
      light.castShadow = true;

      light.shadow.camera.left = -150;
      light.shadow.camera.right = 150;
      light.shadow.camera.top = 150;
      light.shadow.camera.bottom = -150;

      light.shadow.camera.near = 100;
      light.shadow.camera.far = 5000;
      light.shadow.mapSize.set(this.shadowMapRes, this.shadowMapRes);

      this.lightmapObjects.push(light);
      this.dirLights.push(light);
    }
  }

  // 创建地板
  private generateGround() {
    const geometry = new THREE.PlaneGeometry(600, 600);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, 
      depthWrite: true,
    });
    const ground = new THREE.Mesh(geometry, material);

    ground.position.y = -0.1;
    ground.rotation.x = -Math.PI / 2;
    ground.name = "Ground";

    this.lightmapObjects.push(ground);
    this.scene.add(ground);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
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
    const enable = this.params['Enable'];
    const radius = this.params['Light Radius'];
    const blend = this.params['Blend Window'];
    const blur = this.params['Blur Edges'];
    const debug = this.params['Debug Lightmap'];
    const weight = this.params['Ambient Weight'];

    if (enable) {
      this.progressiveSurfacemap?.update(this.camera!, blend, blur);
      if (!this.progressiveSurfacemap!.firstUpdate) {
        this.progressiveSurfacemap?.showDebugLightmap(debug);
      }
    }

    // 更新光线
    this.dirLights.forEach((light) => {
      // 有时它们会从目标方向采样
      // 有时它们将从半球光均匀取样
      if (Math.random() > weight) {
        const x = this.lightOrigin.position.x + (Math.random() * radius);
        const y = this.lightOrigin.position.y + (Math.random() * radius);
        const z = this.lightOrigin.position.z + (Math.random() * radius);
  
        light.position.set(x, y, z);
      } else {
        const position = this.object.position;
        // 均匀半球表面分布的环境遮挡
        const lambda = Math.acos(2 * Math.random() - 1) - (3.14159 / 2.0);
        const phi = 2 * 3.14159 * Math.random();
  
        const x = ((Math.cos(lambda) * Math.cos(phi)) * 300) + position.x;
        const y = Math.abs((Math.cos(lambda) * Math.sin(phi)) * 300) + position.y + 20;
        const z = (Math.sin(lambda) * 300) + position.z;
        light.position.set(x, y, z);
      }
    });
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();
    this.render();

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

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

