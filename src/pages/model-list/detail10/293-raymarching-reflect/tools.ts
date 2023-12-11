import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { fragment_shader, vertex_shader } from './vars';

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
  private geometry: THREE.PlaneGeometry;
  private material: THREE.RawShaderMaterial;
  private mesh: THREE.Mesh;
  private dolly: THREE.Group;
  private clock: THREE.Clock;
  private config: {
    saveImage: () => void
    resolution: string,
  }
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
    this.geometry = new THREE.PlaneGeometry();
    this.material = new THREE.RawShaderMaterial();
    this.mesh = new THREE.Mesh();
    this.dolly = new THREE.Group();
    this.clock = new THREE.Clock();
    this.config = {
      saveImage: () => {
        this.renderer?.render(this.scene, this.camera!);
        
        const url = this.renderer?.domElement.toDataURL();
        const link = document.createElement("a");
        link.href = url || "";
        link.download = `${new Date().getTime()}.png`;

        if (link.href) { link.click(); }
      },
      resolution: "512",
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.add(this.dolly);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 2000);
    this.camera.position.z = 4;
    this.dolly.add(this.camera);

    // 创建mesh
    this.generateMesh();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableZoom = false;

    this.setGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setGUI() {
    this.gui.add(this.config, 'saveImage').name('保存图片');
    this.gui.close();
  }

  private generateMesh() {
    this.geometry = new THREE.PlaneGeometry(2.0, 2.0);

    this.material = new THREE.RawShaderMaterial({
      uniforms: {
        resolution: { 
          value: new THREE.Vector2(this.width, this.height) 
        },
        cameraWorldMatrix: { 
          value: this.camera!.matrixWorld
        },
        cameraProjectionMatrixInverse: { 
          value: this.camera!.projectionMatrixInverse.clone()
        }
      },
      vertexShader: vertex_shader,
      fragmentShader: fragment_shader,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    // 当设置此选项时，在渲染对象之前，它会检查每一帧对象是否在相机的截锥体中。
    // 如果设置为false，物体每一帧都会被渲染，即使它不在相机的视锥面上。
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
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

    {
      // 获取时钟启动后经过的秒数，并将.oldtime设置为当前时间。
      const timer = this.clock.getElapsedTime();
      this.dolly.position.z = -timer;
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

