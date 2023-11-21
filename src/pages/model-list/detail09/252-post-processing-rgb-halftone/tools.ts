import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { HalftonePass, type HalftonePassParameters } from 'three/examples/jsm/postprocessing/HalftonePass';
import { GUI } from 'lil-gui';

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
  private clock: THREE.Clock;
  private rotationSpeed: number;
  private composer: null | EffectComposer;
  private group: THREE.Group;
  private material: THREE.ShaderMaterial;
  private params: HalftonePassParameters
  private gui: GUI;
  private halftonePass: HalftonePass;
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
    this.clock = new THREE.Clock();
    this.rotationSpeed = Math.PI / 64;
    this.composer = null;
    this.group = new THREE.Group();
    this.material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec2 vUV;
        varying vec3 vNormal;
        void main() {
          vUV = uv;
          vNormal = vec3( normal );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        varying vec2 vUV;
        varying vec3 vNormal;
        void main() {
          vec4 c = vec4( abs( vNormal ) + vec3( vUV, 0.0 ), 0.0 );
          gl_FragColor = c;
        }
      `
    });
    this.params = {
      shape: 1,
      radius: 4,
      rotateR: Math.PI / 12,
      rotateB: Math.PI / 12 * 2,
      rotateG: Math.PI / 12 * 3,
      scatter: 0,
      blending: 1,
      blendingMode: 1,
      greyscale: false,
      disable: false,
    };
    this.gui = new GUI({
      container: this.container,
      title: "控制面板",
      autoPlace: false,
    });
    this.halftonePass = new HalftonePass(0, 0, {});
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x444444);
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 1, 1000);
    this.camera.position.z = 20;

    // 灯光
    this.generateLight();
    // 地板
    this.generateFloor();
    // 创建模型网格
    this.generateMesh();
    // 渲染器
    this.createRenderer();
    // 初始化
    this.initComposer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(0, 0, 0);
    // 垂直方向 只允许在0-90度之间旋转
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.update();

    this.initGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建模型mesh
  private generateMesh() {
    for (let i = 0; i < 50; ++i) {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const mesh = new THREE.Mesh(geometry, this.material);

      mesh.position.set(
        Math.random() * 16 - 8,
        Math.random() * 16 - 8,
        Math.random() * 16 - 8,
      );
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );

      this.group.add(mesh);
    }
  }

  // 创建地板mesh
  private generateFloor() {
    const geometry = new THREE.BoxGeometry(100, 1, 100);
    const material = new THREE.MeshPhongMaterial({});
    const floor = new THREE.Mesh(geometry, material);

    floor.position.y = -10;
    this.scene.add(floor);
  }

  // 创建光源
  private generateLight() {
    // 创建点光源
    const light = new THREE.PointLight(0xffffff, 1.0, 50, 2);
    light.position.y = 2;
    this.scene.add(light);
  }

  // 初始化作曲家
  private initComposer() {
    const renderPass = new RenderPass(this.scene, this.camera!);
    this.halftonePass = new HalftonePass(this.width, this.height, this.params);
    
    this.composer = new EffectComposer(this.renderer!);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.halftonePass);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  private initGUI() {
    const uniforms: any = this.halftonePass.uniforms || {};

    const controller = {
      radius: uniforms['radius'].value,
      rotateR: uniforms['rotateR'].value / ( Math.PI / 180 ),
      rotateG: uniforms['rotateG'].value / ( Math.PI / 180 ),
      rotateB: uniforms['rotateB'].value / ( Math.PI / 180 ),
      scatter: uniforms['scatter'].value,
      shape: uniforms['shape'].value,
      greyscale: uniforms['greyscale'].value,
      blending: uniforms['blending'].value,
      blendingMode: uniforms['blendingMode'].value,
      disable: uniforms['disable'].value
    };

    const changeHandle = () => {
      const uniforms: any = this.halftonePass.uniforms || {};

      uniforms['radius'].value = controller.radius;
      uniforms['rotateR'].value = controller.rotateR * (Math.PI / 180);
      uniforms['rotateG'].value = controller.rotateG * (Math.PI / 180);
      uniforms['rotateB'].value = controller.rotateB * (Math.PI / 180);
      uniforms['scatter'].value = controller.scatter;
      uniforms['shape'].value = controller.shape;
      uniforms['greyscale'].value = controller.greyscale;
      uniforms['blending'].value = controller.blending;
      uniforms['blendingMode'].value = controller.blendingMode;
      uniforms['disable'].value = controller.disable;

      this.halftonePass.uniforms = uniforms;
    };
   
    const shapeParams = {
      'Dot': 1, 'Ellipse': 2, 'Line': 3, 'Square': 4
    };
    this.gui.add(controller, 'shape', shapeParams).name("形状").onChange(changeHandle);
    this.gui.add(controller, 'radius', 1, 25).name("半径").onChange(changeHandle);
    this.gui.add(controller, 'rotateR', 0, 90).name("旋转R").onChange(changeHandle);
    this.gui.add(controller, 'rotateG', 0, 90).name("旋转G").onChange(changeHandle);
    this.gui.add(controller, 'rotateB', 0, 90).name("旋转B").onChange(changeHandle);
    this.gui.add(controller, 'scatter', 0, 1, 0.01).name("散射程度").onChange(changeHandle);
    this.gui.add(controller, 'greyscale').name("缩放").onChange(changeHandle);
    this.gui.add(controller, 'blending', 0, 1, 0.01).name("混合").onChange(changeHandle);
    const blendingModeParams = {
      'Linear': 1, 'Multiply': 2, 'Add': 3, 'Lighter': 4, 'Darker': 5
    };
    this.gui.add(controller, 'blendingMode', blendingModeParams).name("混合模式").onChange(changeHandle);
    this.gui.add(controller, 'disable').name("是否禁用").onChange(changeHandle);
  }

  // 性能统计
  private initStats() {
    this.stats = new Stats();
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

    const delta = this.clock.getDelta();
    this.group.rotation.y += delta * this.rotationSpeed;
    this.composer?.render(delta);
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

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      this.renderer?.setSize(this.width, this.height);
      this.composer?.setSize(this.width, this.height);
    };
  }
}

export default THREE;

