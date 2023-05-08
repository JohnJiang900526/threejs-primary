import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { Flow } from 'three/examples/jsm/modifiers/CurveModifier';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry, type TextGeometryParameters } from 'three/examples/jsm/geometries/TextGeometry';
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

  private controls: null | TransformControls;
  private readonly ACTION_SELECT: number;
  private readonly ACTION_NONE: number;
  private readonly curveHandles: THREE.Mesh[];
  private readonly mouse: THREE.Vector2;
  private raycaster: THREE.Raycaster
  private flow: Flow | null;
  private action: number
  private curve: THREE.CatmullRomCurve3
  private line: THREE.LineLoop
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
    this.ACTION_SELECT = 1;
    this.ACTION_NONE = 0;
    this.curveHandles = [];
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.flow = null;
    this.action = this.ACTION_NONE;
    this.curve = new THREE.CatmullRomCurve3();
    this.line = new THREE.LineLoop();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 1000);
    this.camera.position.set(2, 2, 4);
    this.camera.lookAt(this.scene.position);

    this.loadFont();
    this.generateLight();
    this.generatePoint();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new TransformControls(this.camera, this.renderer?.domElement);
    this.controls.addEventListener("dragging-changed", (e) => {
      if (e.value) { return false; }

      // .getPoints ( divisions : Integer ) : Array
      // divisions -- 要将曲线划分为的分段数。默认是 5.
      // 使用getPoint（t）返回一组divisions+1的点
      const points = this.curve.getPoints(50);
      this.line.geometry.setFromPoints(points);
      this.flow?.updateCurve(0, this.curve);
    });

    this.bind();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private bind() {
    window.onpointerdown = (e) => {
      this.action = this.ACTION_SELECT;
      this.mouse.x = (e.clientX / this.width) * 2 - 1;
      this.mouse.y = - ((e.clientY - 45) / this.height) * 2 + 1;
    };
  }

  private loadFont() {
    const loader = new FontLoader();
    const url = "/examples/fonts/helvetiker_regular.typeface.json";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (font) => {
      toast.close();
      const option: TextGeometryParameters  = {
        font: font,
        size: 0.2,
        height: 0.05,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.01,
        bevelOffset: 0,
        bevelSegments: 5,
      };

      const geometry = (new TextGeometry("Hello three.js!", option)).rotateX(Math.PI);
      const material = new THREE.MeshStandardMaterial({ color: 0x99ffff });
      const mesh = new THREE.Mesh(geometry, material);

      this.flow = new Flow(mesh);
      this.flow.updateCurve(0, this.curve);
      this.scene.add(this.flow.object3D);
    }, undefined, () => { toast.close(); });
  }

  private generateLight() {
    const light1 = new THREE.DirectionalLight(0xffaa33);
    light1.position.set(-10, 10, 10);
    light1.intensity = 1.0;

    const light2 = new THREE.AmbientLight(0x003973);
    light2.intensity = 1.0;
    
    this.scene.add(light1, light2);
  }

  private generatePoint() {
    const positions = [
      { x: 1, y: 0, z: -1 },
      { x: 1, y: 0, z: 1 },
      { x: -1, y: 0, z: 1 },
      { x: -1, y: 0, z: -1 },
    ];

    const geometry = new THREE.BoxGeometry(0.075, 0.075, 0.075);
    const material = new THREE.MeshBasicMaterial();

    positions.forEach((point) => {
      const { x, y, z } = point;
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.copy(new THREE.Vector3(x, y, z));
      this.curveHandles.push(mesh);
      this.scene.add(mesh);
    });

    const points = this.curveHandles.map((item) => item.position);
    this.curve = new THREE.CatmullRomCurve3(points, true);
    {
      const points = this.curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      this.line = new THREE.LineLoop(geometry, material);
      this.scene.add(this.line);
    }
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

    if (this.action === this.ACTION_SELECT) {
      this.raycaster.setFromCamera(this.mouse, this.camera as THREE.PerspectiveCamera);
      this.action = this.ACTION_NONE;

      const intersects = this.raycaster.intersectObjects(this.curveHandles, false);
      if (intersects[0]) {
        const target = intersects[0].object;
        this.controls?.attach(target);
        this.scene.add(this.controls as TransformControls);
      } else {
        this.scene.remove(this.controls as TransformControls);
      }
    }

    if (this.flow) {
      this.flow.moveAlongCurve(0.001);
    }

    this.stats?.update();
    
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

