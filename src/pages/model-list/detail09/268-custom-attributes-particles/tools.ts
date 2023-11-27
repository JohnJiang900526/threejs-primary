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
  private particleSystem: THREE.Points;
  private uniforms: {
    pointTexture: {
      value: THREE.Texture;
    }
  };
  private geometry: THREE.BufferGeometry;
  private particles: number;
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
    this.particleSystem = new THREE.Points();
    this.uniforms = {
      pointTexture: {
        value: new  THREE.Texture()
      }
    };
    this.geometry = new THREE.BufferGeometry();
    this.particles = 100000;
    this.vertexShader = `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 300.0 / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    this.fragmentShader = `
      uniform sampler2D pointTexture;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4( vColor, 1.0 );
        gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 10000);
    this.camera.position.z = 300;

    // 模型
    this.generateModel();

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

  private generateModel() {
    const loader = new THREE.TextureLoader();
    this.uniforms.pointTexture.value = loader.load('/examples/textures/sprites/spark1.png')

    const radius = 200;
    const positions = [];
    const colors = [];
    const sizes = [];

    const color = new THREE.Color();
    for (let i = 0; i < this.particles; i++) {
      positions.push(
        (Math.random() * 2 - 1) * radius,
        (Math.random() * 2 - 1) * radius,
        (Math.random() * 2 - 1) * radius,
      );

      color.setHSL(i / this.particles, 1.0, 0.5);
      colors.push(color.r, color.g, color.b);
      sizes.push(20);
    }

    const positionsAttr = new THREE.Float32BufferAttribute(positions, 3);
    const colorsAttr = new THREE.Float32BufferAttribute(colors, 3);
    const sizesAttr = new THREE.Float32BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage);

    this.geometry.setAttribute('position', positionsAttr);
    this.geometry.setAttribute('color', colorsAttr);
    this.geometry.setAttribute('size', sizesAttr);

    // 着色器材质(ShaderMaterial)
    // 使用自定义shader渲染的材质。 shader是一个用GLSL编写的小程序 ，在GPU上运行
    const material = new THREE.ShaderMaterial({
      // 是否在渲染此材质时启用深度测试。默认为 true
      depthTest: false,
      // 定义此材质是否透明。这对渲染有影响，因为透明对象需要特殊处理，并在非透明对象之后渲染。
      // 设置为true时，通过设置材质的opacity属性来控制材质透明的程度。默认值为false
      transparent: true,
      // 是否使用顶点着色。默认值为false。
      vertexColors: true,
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      // 在使用此材质显示对象时要使用何种混合。
      // 必须将其设置为CustomBlending才能使用自定义blendSrc, blendDst 或者 [page:Constant blendEquation]。 
      // 混合模式所有可能的取值请参阅constants。默认值为NormalBlending
      blending: THREE.AdditiveBlending,
    });
    this.particleSystem = new THREE.Points(this.geometry, material);
    this.scene.add(this.particleSystem);
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
      // 设置旋转
      this.particleSystem.rotation.z = 0.01 * timer;

      const sizes = (this.geometry.attributes.size as THREE.BufferAttribute).array;
      for (let i = 0; i < this.particles; i++) {
        // @ts-ignore
        sizes[i] = 10 * (1 + Math.sin(0.1 * i + timer));
      }
      this.geometry.attributes.size.needsUpdate = true;
    }

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
  }

  // 消除 副作用
  dispose() {
    window.onresize = null;
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
      this.renderer?.setSize(this.width, this.height);
    };
  }
}

export default THREE;

