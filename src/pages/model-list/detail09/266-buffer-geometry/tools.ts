import * as THREE from 'three';
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
  private animateNumber: number;

  private controls: null | OrbitControls;
  private mesh: THREE.Mesh;
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
    this.mesh = new THREE.Mesh();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.Fog(0x050505, 2000, 3500);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 3500);
    this.camera.position.z = 2750;

    // 灯光
    this.generateLight();
    // 模型
    this.generateMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateLight() {
    const light1 = new THREE.AmbientLight(0x444444);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light1.position.set(1, 1, 1);

    const light3 = new THREE.DirectionalLight(0xffffff, 1.5);
    light3.position.set(0, -1, 0);
    
    this.scene.add(light1, light2, light3);
  }

  // 核心
  private generateMesh() {
    const triangles = 160000;
    const geometry = new THREE.BufferGeometry();

    const positions: number[] = [];
    const normals: number[] = [];
    const colors: number[] = [];

    const color = new THREE.Color();
    const n = 800, n2 = n / 2;
    const d = 12, d2 = d / 2;

    const pA = new THREE.Vector3();
    const pB = new THREE.Vector3();
    const pC = new THREE.Vector3();

    const cb = new THREE.Vector3();
    const ab = new THREE.Vector3();

    for (let i = 0; i < triangles; i++) {
      // 位置
      const x = Math.random() * n - n2;
      const y = Math.random() * n - n2;
      const z = Math.random() * n - n2;

      const ax = x + Math.random() * d - d2;
      const ay = y + Math.random() * d - d2;
      const az = z + Math.random() * d - d2;

      const bx = x + Math.random() * d - d2;
      const by = y + Math.random() * d - d2;
      const bz = z + Math.random() * d - d2;

      const cx = x + Math.random() * d - d2;
      const cy = y + Math.random() * d - d2;
      const cz = z + Math.random() * d - d2;

      positions.push(ax, ay, az);
      positions.push(bx, by, bz);
      positions.push(cx, cy, cz);

      // 平面法线
      pA.set(ax, ay, az);
      pB.set(bx, by, bz);
      pC.set(cx, cy, cz);

      cb.subVectors(pC, pB);
      ab.subVectors(pA, pB);

      // 将该向量设置为它本身与传入的v的叉积（cross product）。
      cb.cross(ab);
      // 将该向量转换为单位向量（unit vector）， 也就是说，将该向量的方向设置为和原向量相同，但是其长度（length）为1。
      cb.normalize();

      const nx = cb.x;
      const ny = cb.y;
      const nz = cb.z;

      normals.push(nx, ny, nz);
      normals.push(nx, ny, nz);
      normals.push(nx, ny, nz);

      // 颜色
      color.setRGB(
        (x / n) + 0.5,
        (y / n) + 0.5,
        (z / n) + 0.5,
      );
      const alpha = Math.random();
      colors.push(color.r, color.g, color.b, alpha);
      colors.push(color.r, color.g, color.b, alpha);
      colors.push(color.r, color.g, color.b, alpha);
    }

    const positionsAttr = new THREE.Float32BufferAttribute(positions, 3).onUpload(function() {
      // @ts-ignore
      this.array = [];
    });
    geometry.setAttribute('position', positionsAttr);

    const normalAttr = new THREE.Float32BufferAttribute(normals, 3).onUpload(function() {
      // @ts-ignore
      this.array = [];
    });
    geometry.setAttribute('normal', normalAttr);

    const colorAttr = new THREE.Float32BufferAttribute(colors, 4).onUpload(function() {
      // @ts-ignore
      this.array = [];
    });
    geometry.setAttribute('color', colorAttr);

    // 计算当前几何体的的边界球形，该操作会更新已有 [param:.boundingSphere]。
    // 边界球形不会默认计算，需要调用该接口指定计算边界球形，否则保持默认值 null
    geometry.computeBoundingSphere();
    const material = new THREE.MeshPhongMaterial({
      color: 0xaaaaaa, 
      // 材质的高光颜色。默认值为0x111111（深灰色）的颜色Color
      specular: 0xffffff, 
      // .specular高亮的程度，越高的值越闪亮。默认值为 30。
      shininess: 250,
      // 定义将要渲染哪一面 - 正面，背面或两者。 默认为THREE.FrontSide。
      // 其他选项有THREE.BackSide和THREE.DoubleSide。
      side: THREE.DoubleSide, 
      // 是否使用顶点着色。默认值为false。
      vertexColors: true, 
      // 定义此材质是否透明。这对渲染有影响，因为透明对象需要特殊处理，并在非透明对象之后渲染。
      // 设置为true时，通过设置材质的opacity属性来控制材质透明的程度。
      // 默认值为false。
      transparent: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    // 如果渲染目标已经使用 .setRenderTarget、之后将直接使用renderTarget.texture.encoding
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

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      const time = Date.now() * 0.001 / 5;
      this.mesh.rotation.x = time * 0.25;
      this.mesh.rotation.y = time * 0.5;
    }

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

