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
  private readonly N: number;
  private geometry: THREE.SphereGeometry
  private meshes: THREE.Mesh[];
  private fragmentShader: string;
  private vertexShader: string;
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
    this.N = 100;
    this.geometry = new THREE.SphereGeometry(15, 64, 32);
    this.meshes = [];
    this.fragmentShader = `
      void main() {
        if ( mod ( gl_FragCoord.x, 4.0001 ) < 1.0 || mod ( gl_FragCoord.y, 4.0001 ) < 1.0 ) {
          gl_FragColor = vec4( XXX, 1.0 );
        } else {
          gl_FragColor = vec4( 1.0 );
        }
      }
    `;
    this.vertexShader = `
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 10000);
    this.camera.position.z = 2000;

    this.createMeshes();

    // 渲染器
    this.createRenderer();

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

  private createMeshes() {
    for (let i = 0; i < this.N; i++) {
      const material = new THREE.ShaderMaterial({ 
        vertexShader: this.vertexShader, 
        fragmentShader: this.generateFragmentShader()
      });
      const mesh = new THREE.Mesh(this.geometry, material);

      mesh.position.set(
        (0.5 - Math.random()) * 1000,
        (0.5 - Math.random()) * 1000,
        (0.5 - Math.random()) * 1000,
      );

      this.scene.add(mesh);
      this.meshes.push(mesh);
    }
  }

  private generateFragmentShader() {
    return this.fragmentShader.replace('XXX', Math.random() + ',' + Math.random() + ',' + Math.random());
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

  private render(fn: () => void) {
    if (this.meshes.length !== this.N) {
      fn && fn();
      return false;
    }

    this.meshes.forEach((mesh) => {
      mesh.material = new THREE.ShaderMaterial({ 
        vertexShader: this.vertexShader, 
        fragmentShader: this.generateFragmentShader()
      });
    });

    fn && fn();

    this.meshes.forEach((mesh) => {
      (mesh.material as THREE.ShaderMaterial).dispose();
    });
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    this.render(() => {
      // 执行渲染
      if (this.renderer && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    });
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
      }
    };
  }
}

export default THREE;

