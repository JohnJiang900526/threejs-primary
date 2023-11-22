import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
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
  private clock: THREE.Clock;
  private group: THREE.Group;
  private composer1: EffectComposer | null;
  private composer2: EffectComposer | null;
  private fxaaPass: ShaderPass | null;
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
    this.group = new THREE.Group();
    this.composer1 = null;
    this.composer2 = null;
    this.fxaaPass = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.add(this.group);

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 2000);
    this.camera.position.z = 500;

    this.createLight();
    this.createMesh();
    // 渲染器
    this.createRenderer();
    this.generatePass();

    // 轨道控制器
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

  // 创建pass
  private generatePass() {
    const renderPass = new RenderPass(this.scene, this.camera!);
    renderPass.clearColor = new THREE.Color(0, 0, 0);
    renderPass.clearAlpha = 0;

    this.fxaaPass = new ShaderPass(FXAAShader);
    const copyPass = new ShaderPass(CopyShader);
    
    // 效果合成器（EffectComposer）
    // 用于在three.js中实现后期处理效果。该类管理了产生最终视觉效果的后期处理过程链。 
    // 后期处理过程根据它们添加/插入的顺序来执行，最后一个过程会被自动渲染到屏幕上。
    this.composer1 = new EffectComposer(this.renderer!);
    this.composer1.addPass(renderPass);
    this.composer1.addPass(copyPass);

    const pixelRatio = this.renderer?.getPixelRatio() as number;
    Object.assign(this.fxaaPass.material.uniforms['resolution'].value || {}, {
      x: 1 / (this.width * pixelRatio ),
      y: 1 / (this.height * pixelRatio),
    });

    this.composer2 = new EffectComposer(this.renderer!);
    this.composer2.addPass(renderPass);
    this.composer2.addPass(this.fxaaPass);
  }

  // 创建需要渲染的mesh
  private createMesh() {
    const geometry = new THREE.TetrahedronGeometry(10);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xee0808,
      // 定义材质是否使用平面着色进行渲染。默认值为false
      flatShading: true,
    });

    for (let i = 0; i < 100; i++) {
      const mesh = new THREE.Mesh(geometry, material);

      // 设置mesh位置
      mesh.position.set(
        Math.random() * 500 - 250,
        Math.random() * 500 - 250,
        Math.random() * 500 - 250,
      );
      // 设置缩放
      mesh.scale.setScalar(Math.random() * 2 + 1);

      // 设置旋转角度
      // 物体的局部旋转，以弧度来表示。（请参阅Euler angles-欧拉角）
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );

      this.group.add(mesh);
    }
  }

  // 创建灯光
  private createLight() {
    // 半球光（HemisphereLight）
    // 光源直接放置于场景之上，光照颜色从天空光线颜色渐变到地面光线颜色。
    // 半球光不能投射阴影。
    const light1 = new THREE.HemisphereLight(0xffffff, 0x444444);
    light1.position.set(0, 1000, 0);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(-3000, 1000, -1000);
    this.scene.add(light2);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // 定义渲染器是否在渲染每一帧之前自动清除其输出
    this.renderer.autoClear = false;
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

    const halfWidth = this.width / 2;
    this.group.rotation.y += this.clock.getDelta() * 0.1;

    if (this.renderer && this.composer1 && this.composer2) {
      // 启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响
      this.renderer?.setScissorTest(true);
  
      // .setScissor ( x : Integer, y : Integer, width : Integer, height : Integer )
      // 将剪裁区域设为(x, y)到(x + width, y + height) Sets the scissor area from
      this.renderer?.setScissor(0, 0, halfWidth - 2, this.height);
      this.composer1?.render();
  
      // .setScissor ( x : Integer, y : Integer, width : Integer, height : Integer )
      // 将剪裁区域设为(x, y)到(x + width, y + height) Sets the scissor area from
      this.renderer?.setScissor(halfWidth, 0, halfWidth, this.height);
      this.composer2?.render();
  
      // 启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响
      this.renderer?.setScissorTest(false);
    }
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

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
        this.composer1?.setSize(this.width, this.height);
				this.composer2?.setSize(this.width, this.height);

				const pixelRatio = this.renderer?.getPixelRatio() as number;
        if (this.fxaaPass) {
          Object.assign(this.fxaaPass.material.uniforms['resolution'].value || {}, {
            x: 1 / (this.width * pixelRatio ),
            y: 1 / (this.height * pixelRatio),
          });
        }
      }
    };
  }
}

export default THREE;
