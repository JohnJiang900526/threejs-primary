import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import GUI from 'lil-gui';
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

  private gui: GUI
  private controls: null | OrbitControls
  private ninjaMeshRaw: THREE.Mesh
  private curvatureAttribute: Float32Array
  private bufferGeo: THREE.BufferGeometry
  private vertexShader: string
  private fragmentShader: string
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });

    this.controls = null;
    this.ninjaMeshRaw = new THREE.Mesh();
    this.curvatureAttribute = new Float32Array();
    this.bufferGeo = new THREE.BufferGeometry();
    this.vertexShader = `
      attribute float curvature;
      varying float vCurvature;
      void main() {
        vec3 p = position;
        vec4 modelViewPosition = modelViewMatrix * vec4( p , 1.0 );
        gl_Position = projectionMatrix * modelViewPosition;
        vCurvature = curvature;
      }
    `;
    this.fragmentShader = `
      varying vec3 vViewPosition;
      varying float vCurvature;
      void main() {
        gl_FragColor = vec4( vCurvature * 2.0, 0.0, 0.0, 1.0 );
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 0.1, 1000);
    this.camera.position.set(-23, 2, 40);

    // 加载模型
    this.loadModel();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 20;
    this.controls.maxDistance = 100;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 平均数
  private average(dict: {[key: string]: number}) {
    let sum = 0;
    let length = 0;

    Object.keys(dict).forEach((key) => {
      sum += dict[key];
      length ++;
    });

    return sum / length;
  }

  // 最大值
  private clamp(number: number, min: number, max: number) {
    return Math.max(min, Math.min(number, max));
  }

  // 过滤器凹
  private filterConcave(curvature: Float32Array) {
    curvature.forEach((cur, i) => {
      curvature[i] = Math.abs(this.clamp(cur, -1, 0));
    });
  }
  // 过滤器凸
  private filterConvex(curvature:Float32Array) {
    curvature.forEach((cur, i) => {
      curvature[i] = this.clamp(cur, 0, 1);
    });
  }

  // 过滤器凹凸
  private filterBoth(curvature: Float32Array) {
    curvature.forEach((cur, i) => {
      curvature[i] = Math.abs(cur);
    });
  }

  // 核心 但是不好看明白
  private generateGeometry(object: THREE.Group) {
    const child = object.children[0] as THREE.Mesh;

    this.bufferGeo = child.geometry;
    this.bufferGeo.center();
    const dict:{[key: string]: {[key: string]: number}} = {};

    const count = this.bufferGeo.attributes.position.count;
    const array = this.bufferGeo.attributes.position.array;
    const normArray = this.bufferGeo.attributes.normal.array;

    for (let i = 0; i < count; i += 3) {
      const posA = new THREE.Vector3(
        array[3 * i], 
        array[3 * i + 1], 
        array[3 * i + 2],
      );
      const posB = new THREE.Vector3(
        array[3 * (i + 1)], 
        array[3 * (i + 1) + 1], 
        array[3 * (i + 1) + 2],
      );
      const posC = new THREE.Vector3(
        array[3 * (i + 2)], 
        array[3 * (i + 2) + 1], 
        array[3 * (i + 2) + 2],
      );

      const normA = new THREE.Vector3(
        normArray[3 * i], 
        normArray[3 * i + 1], 
        normArray[3 * i + 2],
      ).normalize();
      const normB = new THREE.Vector3(
        normArray[3 * (i + 1)], 
        normArray[3 * (i + 1) + 1], 
        normArray[3 * (i + 1) + 2],
      ).normalize();
      const normC = new THREE.Vector3(
        normArray[3 * (i + 2)], 
        normArray[3 * (i + 2) + 1], 
        normArray[3 * (i + 2) + 2],
      ).normalize();

      const strA = posA.toArray().toString();
      const strB = posB.toArray().toString();
      const strC = posC.toArray().toString();

      const posB_A = new THREE.Vector3().subVectors(posB, posA);
      const posB_C = new THREE.Vector3().subVectors(posB, posC);
      const posC_A = new THREE.Vector3().subVectors(posC, posA);

      // .dot ( v : Vector3 ) : Float
      // 计算该vector和所传入v的点积（dot product）
      const b2a = normB.dot(posB_A.normalize());
      const b2c = normB.dot(posB_C.normalize());
      const c2a = normC.dot(posC_A.normalize());

      const a2b = -normA.dot(posB_A.normalize());
      const c2b = -normC.dot(posB_C.normalize());
      const a2c = -normA.dot(posC_A.normalize());

      if (!dict[strA]) { dict[strA] = {}; }
      if (!dict[strB]) { dict[strB] = {}; }
      if (!dict[strC]) { dict[strC] = {}; }

      dict[strA][strB] = a2b;
      dict[strA][strC] = a2c;
      dict[strB][strA] = b2a;
      dict[strB][strC] = b2c;
      dict[strC][strA] = c2a;
      dict[strC][strB] = c2b;
    }

    let curvatureDict: {[key: string]: number} = {};
    let min = 10, max = 0;

    Object.keys(dict).forEach((key) => {
      curvatureDict[key] = this.average(dict[key]);
    });


    const smoothCurvatureDict = Object.create(curvatureDict);
    Object.keys(dict).forEach((key) => {
      let count = 0;
      let sum = 0;
      Object.keys(dict[key]).forEach((key2) => {
        sum += smoothCurvatureDict[key2];
        count++;
      });
      smoothCurvatureDict[key] = sum / count;
    });
    curvatureDict = smoothCurvatureDict;

    Object.keys(curvatureDict).forEach((key) => {
      const val = Math.abs(curvatureDict[key]);
      if (val < min) { min = val; }
      if (val > max) { max = val; }
    });

    const range = (max - min);
    Object.keys(curvatureDict).forEach((key) => {
      const val = Math.abs(curvatureDict[key]);
      if (curvatureDict[key] < 0) {
        curvatureDict[key] = (min - val) / range;
      } else {
        curvatureDict[key] = (val - min) / range;
      }
    });
    this.curvatureAttribute = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const pos = new THREE.Vector3(
        array[3 * i], 
        array[3 * i + 1], 
        array[3 * i + 2],
      );
      const key = pos.toArray().toString();
      this.curvatureAttribute[i] = curvatureDict[key];
    }
    this.bufferGeo.setAttribute(
      'curvature', 
      new THREE.BufferAttribute(this.curvatureAttribute, 1)
    );

    console.log(this.bufferGeo);

    const curvatureFiltered = new Float32Array(this.curvatureAttribute);
    this.filterBoth(curvatureFiltered);
    const materialRaw = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    });
    this.ninjaMeshRaw = new THREE.Mesh(this.bufferGeo, materialRaw);

    this.scene.add(this.ninjaMeshRaw);
    this.setUpGUI();
  }

  private setUpGUI() {
    const option = {
      filterConvex: () => {
        const curvatureFiltered = new Float32Array(this.curvatureAttribute);
        this.filterConvex(curvatureFiltered);
        // @ts-ignore
        this.bufferGeo.attributes.curvature.array = curvatureFiltered;
        this.bufferGeo.attributes.curvature.needsUpdate = true;
      },
      filterConcave: () => {
        const curvatureFiltered = new Float32Array(this.curvatureAttribute);
        this.filterConcave(curvatureFiltered);
        // @ts-ignore
        this.bufferGeo.attributes.curvature.array = curvatureFiltered;
        this.bufferGeo.attributes.curvature.needsUpdate = true;
      },
      filterBoth: () => {
        const curvatureFiltered = new Float32Array(this.curvatureAttribute);
        this.filterBoth(curvatureFiltered);
        // @ts-ignore
        this.bufferGeo.attributes.curvature.array = curvatureFiltered;
        this.bufferGeo.attributes.curvature.needsUpdate = true;
      },
    };

    this.gui.add(option, 'filterConvex').name("过滤器凸");
    this.gui.add(option, 'filterConcave').name("过滤器凹");
    this.gui.add(option, 'filterBoth').name("过滤凹凸");
  }

  private loadModel() {
    const loader = new OBJLoader();
    const url = "/examples/models/obj/ninja/ninjaHead_Low.obj";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (obj) => {
      toast.close();
      this.generateGeometry(obj);
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.autoClear = false;
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

