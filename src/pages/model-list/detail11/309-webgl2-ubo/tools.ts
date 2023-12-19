import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import { showFailToast } from 'vant';
import { fragmentShader1, fragmentShader2, vertexShader1, vertexShader2 } from './vars';

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
  private clock: THREE.Clock;
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
    this.clock = new THREE.Clock();
  }

  init() {
    if (!WebGL.isWebGL2Available()) {
      showFailToast(WebGL.getWebGL2ErrorMessage());
      return false;
    }
    
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.1, 2000);
    this.camera.position.z = 50;
    this.camera.lookAt(this.scene.position);

    // mesh
    this.createMesh();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;
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

  // 核心逻辑
  // 创建mesh
  private createMesh() {
    const geometry1 = new THREE.TetrahedronGeometry();
    const geometry2 = new THREE.BoxGeometry();
  
    const cameraUniformsGroup = new THREE.UniformsGroup();
    cameraUniformsGroup.setName('ViewData');
    cameraUniformsGroup.add(new THREE.Uniform(this.camera!.projectionMatrix));
    cameraUniformsGroup.add(new THREE.Uniform(this.camera!.matrixWorldInverse));

    const lightingUniformsGroup = new THREE.UniformsGroup();
    lightingUniformsGroup.setName('LightingData');
    lightingUniformsGroup.add(new THREE.Uniform(new THREE.Vector3(0, 0, 10)));
    lightingUniformsGroup.add(new THREE.Uniform(new THREE.Color(0x333333)));
    lightingUniformsGroup.add(new THREE.Uniform(new THREE.Color(0xaaaaaa)));
    lightingUniformsGroup.add(new THREE.Uniform(new THREE.Color(0xcccccc)));
    lightingUniformsGroup.add(new THREE.Uniform(64));

    const material1 = new THREE.RawShaderMaterial({
      uniforms: {
        modelMatrix: { value: null },
        normalMatrix: { value: null },
        color: { value: null }
      },
      vertexShader: vertexShader1,
      fragmentShader: fragmentShader1,
      glslVersion: THREE.GLSL3,
    });

    const material2 = new THREE.RawShaderMaterial({
      uniforms: {
        modelMatrix: { value: null },
        diffuseMap: { value: null },
      },
      vertexShader: vertexShader2,
      fragmentShader: fragmentShader2,
      glslVersion: THREE.GLSL3
    });

    const texture = new THREE.TextureLoader().load('/examples/textures/crate.gif');
    for (let i = 0; i < 200; i++) {
      let mesh;
      if (i % 2 === 0) {
        mesh = new THREE.Mesh(geometry1, material1.clone());
        // @ts-ignore
        mesh.material.uniformsGroups = [cameraUniformsGroup, lightingUniformsGroup];
        mesh.material.uniforms.modelMatrix.value = mesh.matrixWorld;
        mesh.material.uniforms.normalMatrix.value = mesh.normalMatrix;
        mesh.material.uniforms.color.value = new THREE.Color(0xffffff * Math.random());
      } else {
        mesh = new THREE.Mesh(geometry2, material2.clone());
        // @ts-ignore
        mesh.material.uniformsGroups = [cameraUniformsGroup];
        mesh.material.uniforms.modelMatrix.value = mesh.matrixWorld;
        mesh.material.uniforms.diffuseMap.value = texture;
      }

      const s = 1 + Math.random() * 0.5;
      mesh.scale.set(s, s, s);

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );

      mesh.position.set(
        Math.random() * 40 - 20,
        Math.random() * 40 - 20,
        Math.random() * 40 - 20,
      );

      this.scene.add(mesh);
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      const delta = this.clock.getDelta();
      this.scene.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          item.rotation.x += delta * 0.5;
          item.rotation.y += delta * 0.3;
        }
      });
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

