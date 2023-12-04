import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GUI from 'lil-gui';

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
  private sphere: THREE.Points;
  private vertexShader: string;
  private fragmentShader: string;
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
    this.gui.hide();
    this.sphere = new THREE.Points();
    // 顶点着色
    this.vertexShader = `
      attribute float size;
      attribute vec3 customColor;

      varying vec3 vColor;

      void main() {
        vColor = customColor;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 300.0 / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    // 片段着色
    this.fragmentShader = `
      uniform vec3 color;
      uniform sampler2D pointTexture;

      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4( color * vColor, 1.0 );
        gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 10000);
    this.camera.position.z = 300;

    // 模型
    this.generateModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enabled = false;
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

  private generateModel() {
    const amount = 100000;
    const radius = 200;

    const positions = new Float32Array(amount * 3);
    const colors = new Float32Array(amount * 3);
    const sizes = new Float32Array(amount);

    const vertex = new THREE.Vector3();
    const color = new THREE.Color(0xffffff);

    for (let i = 0; i < amount; i++) {
      vertex.set(
        (Math.random() * 2 - 1) * radius,
        (Math.random() * 2 - 1) * radius,
        (Math.random() * 2 - 1) * radius,
      );
      // .toArray ( array : Array, offset : Integer ) : Array
      // array - （可选）被用于存储向量的数组。如果这个值没有传入，则将创建一个新的数组。
      // offset - （可选） 数组中元素的偏移量。
      // 返回一个数组[x, y ,z]，或者将x、y和z复制到所传入的array中。
      vertex.toArray(positions, i * 3);

      if (vertex.x < 0) {
        color.setHSL(0.5 + 0.1 * (i / amount), 0.7, 0.5);
      } else {
        color.setHSL(0.0 + 0.1 * (i / amount), 0.9, 0.5);
      }
      // .toArray ( array : Array, offset : Integer ) : Array
      // array - 存储颜色的可选数组
      // offset - 数组的可选偏移量
      color.toArray(colors, i * 3);
      sizes[i] = 10;
    }

    const geometry = new THREE.BufferGeometry();
    
    const positionAttr = new THREE.BufferAttribute(positions, 3);
    geometry.setAttribute('position', positionAttr);

    const customColorAttr = new THREE.BufferAttribute(colors, 3);
    geometry.setAttribute('customColor', customColorAttr);

    const sizeAttr = new THREE.BufferAttribute(sizes, 1);
    geometry.setAttribute('size', sizeAttr);

    const loader = new THREE.TextureLoader();
    const material = new THREE.ShaderMaterial({
      depthTest: false,
      transparent: true,
      // 混合模式
      blending: THREE.AdditiveBlending,
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        pointTexture: { value: loader.load('/examples/textures/sprites/spark1.png') }
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    // 实例化 并且加入场景中
    this.sphere = new THREE.Points(geometry, material);
    this.scene.add(this.sphere);
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      const timer = Date.now() * 0.005;
      this.sphere!.rotation.z = 0.01 * timer;

      // 随着时间的推移 设置size的大小
      const geometry = this.sphere!.geometry;
      const attributes = geometry.attributes;
      const size = attributes.size as THREE.BufferAttribute;
      const array = size.array as Float32Array;
      for (let i = 0; i < array.length; i++) {
        array[i] = (14 + 13 * Math.sin(0.1 * i + timer));
      }
      attributes.size.needsUpdate = true;
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

