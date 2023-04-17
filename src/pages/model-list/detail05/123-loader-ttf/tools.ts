import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader';
import { Font } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
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

  private cameraTarget: THREE.Vector3
  private group: THREE.Group
  private textMesh1: THREE.Mesh
  private textMesh2: THREE.Mesh
  private textGeo: TextGeometry | null
  private material: THREE.MeshPhongMaterial
  private firstLetter: boolean
  private text: string
  private fontHeight: number
  private size: number
  private hover: number
  private curveSegments: number
  private bevelThickness: number
  private bevelSize: number
  private font: Font | null
  private mirror: boolean
  private targetRotation: number
  private targetRotationOnPointerDown: number
  private pointerX: number
  private pointerXOnPointerDown: number
  private halfX: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.cameraTarget = new THREE.Vector3(0, 100, 0);
    this.group = new THREE.Group();
    this.textMesh1 = new THREE.Mesh();
    this.textMesh2 = new THREE.Mesh();
    this.textGeo = null
    this.material = new THREE.MeshPhongMaterial({ 
      color: 0xffffff, 
      flatShading: true 
    });
    this.firstLetter = true
    this.text = "three.js";
    this.fontHeight = 20;
    this.size = 70;
    this.hover = 30;
    this.curveSegments = 4;
    this.bevelThickness = 2;
    this.bevelSize = 1.5;
    this.font = null;
    this.mirror = true;
    this.targetRotation = 0;
    this.targetRotationOnPointerDown = 0;
    this.pointerX = 0;
    this.pointerXOnPointerDown = 0;
    this.halfX = this.width/2;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 250, 1400);

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 1500);
    this.camera.position.set(0, 400, 700);

    // group
    this.group = new THREE.Group();
    this.group.position.y = 100;
    this.scene.add(this.group);

    // 创建光线
    this.createLight();
    // 创建模糊镜面
    this.createPlane();

    // 创建模型
    this.createModel();

    // webgl渲染器
    this.createRenderer();

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
    if (this.isMobile()) {
      window.onpointerdown = null;
      window.onpointermove = null;
      window.onpointerup = null;

      window.ontouchstart = (event) => {
        const e = event.touches[0];

        this.pointerXOnPointerDown = e.clientX - this.halfX;
				this.targetRotationOnPointerDown = this.targetRotation;

        window.ontouchmove = (event) => {
          const e = event.touches[0];

          this.pointerX = e.clientX - this.halfX;
          this.targetRotation = this.targetRotationOnPointerDown + (this.pointerX - this.pointerXOnPointerDown) * 0.02;
        };

        window.ontouchend = () => {
          window.ontouchmove = null;
          window.ontouchend = null;
        };
      };

    } else {
      window.ontouchstart = null;
      window.ontouchmove = null;
      window.ontouchend = null;

      window.onpointerdown = (e) => {
        if (e.isPrimary === false) {
          return false;
        }

				this.pointerXOnPointerDown = e.clientX - this.halfX;
				this.targetRotationOnPointerDown = this.targetRotation;

        window.onpointermove = (e) => {
          if (e.isPrimary === false) {
            return false;
          }
          this.pointerX = e.clientX - this.halfX;
          this.targetRotation = this.targetRotationOnPointerDown + (this.pointerX - this.pointerXOnPointerDown) * 0.02;
        };

        window.onpointerup = (e) => {
          if (e.isPrimary === false) {
            return false;
          }

          window.onpointermove = null;
          window.onpointerup = null;
        };
      };
    }

    window.onkeydown = (e) => {
      const keyCode = e.which;

      if (this.firstLetter) {
        this.text = "";
        this.firstLetter = false;
      }

      switch(keyCode) {
        case 8:
          e.preventDefault();
          this.text = this.text.substring(0, this.text.length - 1);
          this.refreshText();
          break;
        default:
          this.text += String.fromCharCode(keyCode);
          this.refreshText();
      }
    };
    
  }

  private createPlane() {
    const geometry = new THREE.PlaneGeometry(10000, 10000);
    const material = new THREE.MeshBasicMaterial({ 
      opacity: 0.3,
      color: 0xffffff, 
      transparent: true,
    });
    const plane = new THREE.Mesh(geometry, material);

    plane.position.y = 100;
    plane.rotation.x = -Math.PI/2;
    this.scene.add(plane);
  }

  private createLight() {
    {
      const light = new THREE.DirectionalLight(0xffffff, 0.125);
      light.position.set(0, 0, 1).normalize();
      this.scene.add(light);
    }

    {
      const light = new THREE.PointLight(0xffffff, 1.5);
      light.position.set(0, 100, 90);
      light.color.setHSL(Math.random(), 1, 0.5);
      this.scene.add(light);
    }
  }

  // 加载模型
  private createModel() {
    const loader = new TTFLoader();
    const url = "/public/examples/fonts/ttf/kenpixel.ttf";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (json) => {
      toast.close();

      this.font = new Font(json);
      this.createText();
    }, undefined, () => {
      toast.close();
    });
  }

  private createText() {
    this.textGeo = new TextGeometry(this.text, {
      font: this.font as Font,
      size: this.size,
      height: this.fontHeight,
      curveSegments: this.curveSegments,
      bevelThickness: this.bevelThickness,
      bevelSize: this.bevelSize,
      bevelEnabled: true
    });
    // 计算当前几何体的的边界矩形，该操作会更新已有 [param:.boundingBox]。
    // 边界矩形不会默认计算，需要调用该接口指定计算边界矩形，否则保持默认值 null
    this.textGeo.computeBoundingBox();
    // 通过面片法向量的平均值计算每个顶点的法向量
    this.textGeo.computeVertexNormals();

    const boundingBox = this.textGeo.boundingBox as THREE.Box3;
    const centerOffset = -0.5 * (boundingBox.max.x - boundingBox.min.x);

    this.textMesh1 = new THREE.Mesh(this.textGeo, this.material);
    this.textMesh1.position.set(centerOffset, this.hover, 0);
    this.textMesh1.rotation.x = 0;
    this.textMesh1.rotation.y = Math.PI * 2;
    this.group.add(this.textMesh1);

    if (this.mirror) {
      this.textMesh2 = new THREE.Mesh(this.textGeo, this.material);
      this.textMesh2.position.set(centerOffset, -this.hover, this.fontHeight);
      this.textMesh2.rotation.x = Math.PI;
      this.textMesh2.rotation.y = Math.PI * 2;
      this.group.add(this.textMesh2);
    }
  }

  private refreshText() {
    this.group.remove(this.textMesh1);
    if (this.mirror) {
      this.group.remove(this.textMesh2);
    }
    if (!this.text) { return false; }

    this.createText();
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

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    if (this.renderer && this.scene && this.camera) {
      this.group.rotation.y += (this.targetRotation - this.group.rotation.y) * 0.05;
      this.camera.lookAt(this.cameraTarget);
      this.renderer.render(this.scene, this.camera);
    }
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

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

