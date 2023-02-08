import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private cameraTarget: THREE.Vector3
  private stats: null | Stats
  private hex: string
  private group: THREE.Group
  private textMesh1: THREE.Mesh
  private textMesh2: THREE.Mesh
  private textGeometry: null|TextGeometry
  private materials: THREE.MeshPhongMaterial[]
  private text: string
  private bevelEnabled: boolean
  private font: undefined | Font
  private fontName: "helvetiker" | "optimer" | "gentilis" | "droid sans"| "droid serif"
  private fontWeight: "regular" | "bold"
  private textParams: {
    height : number
    size : number
    hover : number
    curveSegments: number
    bevelThickness: number
    bevelSize: number
  }
  private mirror: boolean
  private fontMap: {
    'helvetiker': number
    'optimer': number
    'gentilis': number
    'droid/droid_sans': number
    'droid/droid_serif': number
  }
  private weightMap: {
    'regular': number
    'bold': number
  }
  private reverseFontMap: number[]
  private reverseWeightMap: number[]
  private targetRotation: number
  private targetRotationOnPointerDown: number
  private pointerX: number
  private pointerXOnPointerDown: number
  private halfX: number
  private fontIndex: number
  private dirLight: null | THREE.DirectionalLight
  private pointLight: null | THREE.PointLight
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.cameraTarget = new THREE.Vector3();
    this.stats = null;
    this.hex = "";
    this.group = new THREE.Group();
    this.textMesh1 = new THREE.Mesh();
    this.textMesh2 = new THREE.Mesh();
    this.textGeometry = null;
    this.materials = [];
    this.text = "three.js";
    this.bevelEnabled = false;
    this.font = undefined;
    this.fontName = "optimer";
    this.fontWeight = "bold";
    this.textParams = {
      height: 20,
      size: 70,
      hover: 30,
      curveSegments: 4,
      bevelThickness: 2,
      bevelSize: 1.5,
    };
    this.mirror = true;
    this.fontMap = {
      'helvetiker': 0,
      'optimer': 1,
      'gentilis': 2,
      'droid/droid_sans': 3,
      'droid/droid_serif': 4
    };
    this.weightMap = {
      'regular': 0,
      'bold': 1
    };
    this.reverseFontMap = [];
    this.reverseWeightMap = [];

    Object.keys(this.fontMap).forEach((i) => {
      // @ts-ignore
      this.reverseFontMap[this.fontMap[i]] = i;
    });

    Object.keys(this.weightMap).forEach((i) => {
      // @ts-ignore
      this.reverseWeightMap[this.weightMap[i]] = i;
    });

    this.targetRotation = 0;
    this.targetRotationOnPointerDown = 0;
    this.pointerX = 0;
    this.pointerXOnPointerDown = 0;

    this.halfX = this.width / 2;
    this.fontIndex = 1;

    this.dirLight = null;
    this.pointLight = null;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 250, 1400);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(60, this.width/this.height, 1, 1500);
    this.camera.position.set(0, 400, 700);
    this.cameraTarget = new THREE.Vector3(0, 150, 0);

    // 创建光源
    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.125);
    this.dirLight.position.set(0, 0, 1).normalize();
    this.scene.add(this.dirLight);

    this.pointLight = new THREE.PointLight(0xffffff, 1.5);
    this.pointLight.position.set(0, 100, 90);
    this.scene.add(this.pointLight);

    // 创建分组
    this.group = new THREE.Group();
    this.group.position.y = 100;
    this.scene.add(this.group);

    // 创建平面
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(10000, 10000),
      new THREE.MeshBasicMaterial({color: 0xffffff, opacity: 0.5, transparent: true})
    );
    plane.position.y = 100;
    plane.rotation.x = -Math.PI / 2;
    this.scene.add(plane);

    // 创建几何
    this.createGeometry();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 绑定事件
    this.bind();
    // 性能统计
    this.initStats();
    // 动画
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 更新文字
  updateText(text: string) {
    this.text = text;
    this.refreshText();
  }

  // 更新颜色
  updateColor() {
    if (this.pointLight) {
      this.pointLight.color.setHSL(Math.random(), 1, 0.5);
      this.hex = this.decimalToHex(this.pointLight.color.getHex());
    }

    this.loadFont();
  }

  // 修改字体
  updateFont() {
    this.fontIndex++;
    // @ts-ignore
    this.fontName = this.reverseFontMap[this.fontIndex % this.reverseFontMap.length];
    this.loadFont();
  }

  // 修改粗细
  updateWeight() {
    if (this.fontWeight === "bold") {
      this.fontWeight = "regular";
    } else {
      this.fontWeight = "bold";
    }

    this.loadFont();
  }

  // 修改倒角
  updateBevel() {
    this.bevelEnabled = !this.bevelEnabled;
    this.refreshText();
  }

  // 去除倒影
  removeMirror() {
    this.mirror = false;

    this.group.remove(this.textMesh2);
    this.refreshText();
  }

  // 添加倒影
  addMirror() {
    this.mirror = true;

    this.refreshText();
  }

  // 绑定事件
  private bind() {
    if (this.isMobile()) {
      this.container.ontouchstart = (event) => {
        const e = event.touches[0];
        this.pointerXOnPointerDown = e.clientX - this.halfX;
        this.targetRotationOnPointerDown = this.targetRotation;
  
        this.container.ontouchmove = (event) => {
          const e = event.touches[0];
          this.pointerX = e.clientX - this.halfX;
          this.targetRotation = this.targetRotationOnPointerDown + (this.pointerX - this.pointerXOnPointerDown) * 0.02;
        };
  
        this.container.ontouchend = () => {
          this.container.onpointermove = null;
          this.container.onpointerup = null;
        };
      };
    } else {
      this.container.onpointerdown = (e) => {
        if ( e.isPrimary === false ) { return false; }
        this.pointerXOnPointerDown = e.clientX - this.halfX;
        this.targetRotationOnPointerDown = this.targetRotation;
  
        this.container.onpointermove = (e) => {
          if ( e.isPrimary === false ) { return false; }
          this.pointerX = e.clientX - this.halfX;
          this.targetRotation = this.targetRotationOnPointerDown + (this.pointerX - this.pointerXOnPointerDown) * 0.02;
        };
  
        this.container.onpointerup = (e) => {
          if (e.isPrimary === false) { return false; }
  
          this.container.onpointermove = null;
          this.container.onpointerup = null;
        };
      };
    }
  }

  // 创建几何
  private createGeometry() {
    this.materials = [
      new THREE.MeshPhongMaterial({color: 0xffffff, flatShading: true}),
			new THREE.MeshPhongMaterial({color: 0xffffff})
    ];

    this.formatColor();
    this.loadFont();
  }

  // 格式化颜色
  private formatColor() {
    if (this.hex) {
      const colorhash = this.hex.substring(0, 6);
      const fonthash = this.hex.substring(6, 7) || "0";
      const weighthash = this.hex.substring(7, 8) || "0";
      const bevelhash = this.hex.substring(8, 9) || "0";

      if (this.pointLight) {
        this.pointLight.color.setHex(parseInt(colorhash, 16));
        // @ts-ignore
        this.fontName = this.reverseFontMap[parseInt(fonthash)];
        // @ts-ignore
        this.fontWeight = this.reverseWeightMap[parseInt(weighthash)];
        // @ts-ignore
        this.bevelEnabled = parseInt(bevelhash);
      }
    } else {
      if (this.pointLight) {
        this.pointLight.color.setHSL(Math.random(), 1, 0.5);
        this.hex = this.decimalToHex(this.pointLight.color.getHex());
      }
    }
  }

  // 加载字体
  private loadFont() {
    const loader = new FontLoader();
    const url = `/examples/fonts/${this.fontName}_${this.fontWeight}.typeface.json`;
    loader.load(url, (font) => {
      this.font = font;
      this.refreshText();
    });
  }

  // 刷新字体
  private refreshText() {
    this.group.remove(this.textMesh1);
    if (this.mirror) {
      this.group.remove(this.textMesh2);
    }

    if (!this.text) {return false;}
    this.createText();
  }

  // 创建文字
  private createText() {
    this.textGeometry = new TextGeometry(this.text, {
      font: this.font as Font,
      size: this.textParams.size,
      height: this.textParams.height,
      curveSegments: this.textParams.curveSegments,
      bevelThickness: this.textParams.bevelThickness,
      bevelSize: this.textParams.bevelSize,
      bevelEnabled: this.bevelEnabled
    });

    // 计算当前几何体的的边界矩形，该操作会更新已有 [param:.boundingBox]。
    // 边界矩形不会默认计算，需要调用该接口指定计算边界矩形，否则保持默认值 null。
    this.textGeometry.computeBoundingBox();
    if (this.textGeometry && this.textGeometry.boundingBox) {
      const { max, min } = this.textGeometry.boundingBox;
      const centerOffset = (-0.5*(max.x - min.x));

      this.textMesh1 = new THREE.Mesh(this.textGeometry, this.materials);
      this.textMesh1.position.x = centerOffset;
      this.textMesh1.position.y = this.textParams.hover;
      this.textMesh1.position.z = 0;
      this.textMesh1.rotation.x = 0;
      this.textMesh1.rotation.y = Math.PI * 2;
      this.group.add(this.textMesh1);
  
      if (this.mirror) {
        this.textMesh2 = new THREE.Mesh(this.textGeometry, this.materials);
        this.textMesh2.position.x = centerOffset;
        this.textMesh2.position.y = -this.textParams.hover;
        this.textMesh2.position.z = this.textParams.height;
        this.textMesh2.rotation.x = Math.PI;
        this.textMesh2.rotation.y = Math.PI * 2;
        this.group.add(this.textMesh2);
      }
    }
  }

  // 转换
  private decimalToHex(d: number) {
    const hex = Number(d).toString(16);
    return `${'000000'.substring(0, 6 - hex.length) + hex}`;
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    this.group.rotation.y += (this.targetRotation - this.group.rotation.y) * 0.05;

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.camera.lookAt(this.cameraTarget);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      // 绑定事件
      this.bind();

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
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

