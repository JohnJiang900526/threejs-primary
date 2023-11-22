import { showLoadingToast } from 'vant';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

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
  private composer: null | EffectComposer;
  private effectFXAA: null | ShaderPass;
  private outlinePass: null | OutlinePass;
  private selectedObjects: THREE.Object3D[];
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private obj3d: THREE.Object3D;
  private group: THREE.Group;
  private params: {
    edgeStrength: number;
    edgeGlow: number;
    edgeThickness: number;
    pulsePeriod: number;
    rotate: boolean;
    usePatternTexture: boolean;
  }
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
    this.composer = null;
    this.effectFXAA = null;
    this.outlinePass = null;
    this.selectedObjects = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.obj3d = new THREE.Object3D();
    this.group = new THREE.Group();
    this.params = {
      edgeStrength: 3.0,
      edgeGlow: 0.0,
      edgeThickness: 1.0,
      pulsePeriod: 0,
      rotate: true,
      usePatternTexture: false
    };
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.group.add(this.obj3d);
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(90, this.aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 10);

    // 灯光
    this.generateLight();
    // 渲染器
    this.createRenderer();
    // 效果合成器
    this.initComposer();
    // 模型加载
    this.loadModel(() => {
      this.generateMesh();
    });

    // 控制器
    this.createControls();

    this.bind();
    this.initGUI();
    this.initStats();
    this.resize();
    this.animate();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 初始化gui
  private initGUI() {
    this.gui.add(this.params, 'edgeStrength', 0.01, 10).onChange((value: number) => {
      this.outlinePass!.edgeStrength = Number(value);
    });

    this.gui.add(this.params, 'edgeGlow', 0.0, 1).onChange((value: number) => {
      this.outlinePass!.edgeGlow = Number(value);
    });

    this.gui.add(this.params, 'edgeThickness', 1, 4).onChange((value: number) => {
      this.outlinePass!.edgeThickness = Number(value);
    });

    this.gui.add(this.params, 'pulsePeriod', 0.0, 5).onChange((value: number) => {
      this.outlinePass!.pulsePeriod = Number(value);
    });

    this.gui.add(this.params, 'rotate');

    this.gui.add(this.params, 'usePatternTexture').onChange((value: boolean) => {
      this.outlinePass!.usePatternTexture = value;
    });

    const conf = {
      visibleEdgeColor: '#ffffff',
      hiddenEdgeColor: '#190a05',
    };

    this.gui.addColor(conf, 'visibleEdgeColor').onChange((value: string) => {
      this.outlinePass!.visibleEdgeColor.set(value);
    });

    this.gui.addColor(conf, 'hiddenEdgeColor').onChange((value: string) => {
      this.outlinePass!.hiddenEdgeColor.set(value);
    });
  }

  // 初始化 效果合成器
  private initComposer() {
    this.composer = new EffectComposer(this.renderer!);
    
    const renderPass = new RenderPass(this.scene, this.camera!);
    this.composer.addPass(renderPass);

    const v2 = new THREE.Vector2(this.width, this.height);
    this.outlinePass = new OutlinePass(v2, this.scene, this.camera!);
    this.composer.addPass(this.outlinePass);

    const loader = new THREE.TextureLoader();
    loader.load('/examples/textures/tri_pattern.jpg', (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      this.outlinePass!.patternTexture = texture;
    });

    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms['resolution'].value.set(1 / this.width, 1 / this.height);
    this.composer.addPass(this.effectFXAA);
  }

  private loadModel(fn?: () => void) {
    const loader = new OBJLoader();
    const url = "/examples/models/obj/tree.obj";

    const material = new THREE.MeshPhongMaterial({ 
      shininess: 5,
      color: 0xffffff, 
      specular: 0x111111, 
    });

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (object) => {
      toast.close();

      let scale = 1.0;
      object.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          // 根据边界矩形将几何体居中。
          item.geometry.center();
          // 计算当前几何体的的边界球形，该操作会更新已有 [param:.boundingSphere]。
          // 边界球形不会默认计算，需要调用该接口指定计算边界球形，否则保持默认值 null。
          item.geometry.computeBoundingSphere();

          scale = 0.2 * item.geometry.boundingSphere.radius;

          // 对象是否被渲染到阴影贴图中。默认值为false。
          item.castShadow = true;
          // 材质是否接收阴影。默认值为false。
          item.receiveShadow = true;
          // 由Material基类或者一个包含材质的数组派生而来的材质实例，
          // 定义了物体的外观。默认值是一个MeshBasicMaterial。
          item.material = material.clone();
        }
      });

      object.position.y = 1;
      // .divideScalar ( s : Float ) : this
      // 将该向量除以标量s。
      object.scale.divideScalar(scale);

      this.obj3d.add(object);
      fn && fn();
    }, undefined, () => {
      toast.close();
    });
  }

  // 圆球 地板 圆环
  private generateMesh() {
    {
      // 一批圆球
      const geometry = new THREE.SphereGeometry(3, 48, 24);
      for (let i = 0; i < 20; i++) {
        const material = new THREE.MeshLambertMaterial();
        material.color.setHSL(Math.random(), 1.0, 0.3);
  
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `sphere_${(i + 1)}`;
        mesh.position.set(
          Math.random() * 4 - 2,
          Math.random() * 4 - 2,
          Math.random() * 4 - 2,
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // 将该向量与所传入的标量s进行相乘。
        mesh.scale.multiplyScalar(Math.random() * 0.3 + 0.1);
        this.group.add(mesh);
      }
    }

    // 地板
    {
      const geometry = new THREE.PlaneGeometry(12000, 12000);
      const material = new THREE.MeshLambertMaterial({side: THREE.DoubleSide});
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = "floor";
      mesh.rotation.x -= Math.PI * 0.5;
      mesh.position.y -= 1.5;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }

    // 圆环
    {
      // 圆环缓冲几何体（TorusGeometry）
      // TorusGeometry(radius : Float, tube : Float, radialSegments : Integer, tubularSegments : Integer, arc : Float)
      // radius - 环面的半径，从环面的中心到管道横截面的中心。默认值是1。
      // tube — 管道的半径，默认值为0.4。
      // radialSegments — 管道横截面的分段数，默认值为8。
      // tubularSegments — 管道的分段数，默认值为6。
      // arc — 圆环的圆心角（单位是弧度），默认值为Math.PI * 2。
      const geometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
      const material = new THREE.MeshPhongMaterial({ color: 0xffaaff });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = "torus";
      mesh.position.z = -4;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  // 创建 光源
  private generateLight() {
    // 环境光 也称为 漫散射光
    // 环境光会均匀的照亮场景中的所有物体
    // 环境光不能用来投射阴影，因为它没有方向。
    const light1 = new THREE.AmbientLight(0xaaaaaa, 0.2);

    const light2 = new THREE.DirectionalLight(0xddffdd, 0.6);
    light2.position.set(1, 1, 1);
    light2.castShadow = true;
    light2.shadow.mapSize.set(1024, 1024);

    const d = 10;
    light2.shadow.camera.left = -d;
    light2.shadow.camera.right = d;
    light2.shadow.camera.top = d;
    light2.shadow.camera.bottom = -d;
    light2.shadow.camera.far = 1000;

    this.scene.add(light1, light2);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 创建控制器
  private createControls() {
    this.controls = new OrbitControls(this.camera!, this.renderer?.domElement);
    this.controls.minDistance = 5;
    this.controls.maxDistance = 20;

    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI/2;

    // 启用或禁用摄像机平移，默认为true。
    this.controls.enablePan = false;
    // 将其设置为true以启用阻尼（惯性），这将给控制器带来重量感。默认值为false。
    // 请注意，如果该值被启用，你将必须在你的动画循环里调用.update()。
    this.controls.enableDamping = true;
    // 当.enableDamping设置为true的时候，阻尼惯性有多大。 Default is 0.05.
    // 请注意，要使得这一值生效，你必须在你的动画循环里调用.update()。
    this.controls.dampingFactor = 0.05;
    this.controls.update();
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.begin();
    this.controls?.update();

    const timer = performance.now();
    if (this.params.rotate) {
      this.group.rotation.y = timer * 0.0001;
    }

    // 执行渲染
    this.composer?.render();
    this.stats?.end();
  }

  // 绑定事件
  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchstart = (event) => {
        const e = event.touches[0];
        const x = (e.clientX / this.width) * 2 - 1; 
        const y = -((e.clientY - 45) / this.height) * 2 + 1;

        this.mouse.set(x, y);
        this.checkIntersection();
      };

      window.ontouchmove = (event) => {
        const e = event.touches[0];
        const x = (e.clientX / this.width) * 2 - 1; 
        const y = -((e.clientY - 45) / this.height) * 2 + 1;

        this.mouse.set(x, y);
        this.checkIntersection();
      };
    } else {
      window.ontouchstart = null;
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        if (e.isPrimary) { return false; }

        const x = (e.clientX / this.width) * 2 - 1; 
        const y = -((e.clientY - 45) / this.height) * 2 + 1;

        this.mouse.set(x, y);
        this.checkIntersection();
      };
    }
  }

  private checkIntersection() {
    // 光线投射Raycaster
    // 这个类用于进行raycasting（光线投射）。 
    // 光线投射用于进行鼠标拾取（在三维空间中计算出鼠标移过了什么物体）。

    // .setFromCamera ( coords : Vector2, camera : Camera ) : undefined
    // coords —— 在标准化设备坐标中鼠标的二维坐标 —— X分量与Y分量应当在-1到1之间。
    // camera —— 射线所来源的摄像机。
    this.raycaster.setFromCamera(this.mouse, this.camera!);

    // .intersectObject ( object : Object3D, recursive : Boolean, optionalTarget : Array ) : Array
    // object —— 检查与射线相交的物体。
    // recursive —— 若为true，则同时也会检查所有的后代。
    // 否则将只会检查对象本身。默认值为true。

    // optionalTarget — （可选）设置结果的目标数组。
    // 如果不设置这个值，则一个新的Array会被实例化；
    // 如果设置了这个值，则在每次调用之前必须清空这个数组（例如：array.length = 0;）。

    // 检测所有在射线与物体之间，包括或不包括后代的相交部分。
    // 返回结果时，相交部分将按距离进行排序，最近的位于第一个。
    const intersects = this.raycaster.intersectObject(this.scene, true);
    if (intersects[0]) {
      const object = intersects[0].object;
      this.selectedObjects = [object];
    } else {
      this.selectedObjects = [];
    }
    this.outlinePass!.selectedObjects = this.selectedObjects;
  }

  // 消除 副作用
  dispose() {
    window.ontouchstart = null;
    window.ontouchmove = null;
    window.onpointermove = null;
    window.cancelAnimationFrame(this.animateNumber);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.bind();
      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      this.renderer?.setSize(this.width, this.height);
      this.composer?.setSize(this.width, this.height);
      this.effectFXAA!.uniforms['resolution'].value.set(1 / this.width, 1 / this.height);
    };
  }
}

export default THREE;

