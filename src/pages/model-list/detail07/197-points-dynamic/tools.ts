<<<<<<< HEAD
import GUI from 'lil-gui';
=======
>>>>>>> 72d66f2cbd49278f1e6fb4539434a6d03b7671b6
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

<<<<<<< HEAD
  private mouse: THREE.Vector2;
  private half: THREE.Vector2;
  private material: THREE.PointsMaterial
  private gui: GUI
=======
>>>>>>> 72d66f2cbd49278f1e6fb4539434a6d03b7671b6
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

<<<<<<< HEAD
    this.mouse = new THREE.Vector2();
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.material = new THREE.PointsMaterial();
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
=======
>>>>>>> 72d66f2cbd49278f1e6fb4539434a6d03b7671b6
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.001);

    // 相机
    this.camera = new THREE.PerspectiveCamera(55, this.aspect, 2, 2000);
    this.camera.position.z = 1000;

    // 创建模型
    this.loadModel();

    // 渲染器
    this.createRenderer();

<<<<<<< HEAD
    this.bind();
    this.setUpGUI();
=======
>>>>>>> 72d66f2cbd49278f1e6fb4539434a6d03b7671b6
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

<<<<<<< HEAD
  // 核心事件
  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];
        const x = e.clientX - this.half.x;
        const y = e.clientY - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        if (e.isPrimary) { return; }

        const x = e.clientX - this.half.x;
        const y = e.clientY - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    }
  }

  private setUpGUI() {
    this.gui.add(this.material, "sizeAttenuation").onChange(() => {
      this.material.needsUpdate = true;
    });
  }

  private loadModel() {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const sprite = new THREE.TextureLoader().load('/examples/textures/sprites/disc.png');
    for (let i = 0; i < 10000; i++) {
      const x = 2000 * Math.random() - 1000;
      const y = 2000 * Math.random() - 1000;
      const z = 2000 * Math.random() - 1000;
      vertices.push( x, y, z );
    }

    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

    this.material = new THREE.PointsMaterial({ 
      size: 35, 
      sizeAttenuation: true, 
      map: sprite, 
      alphaTest: 0.5, 
      transparent: true,
      color: (new THREE.Color()).setHSL(1.0, 0.3, 0.7)
    });

    const particles = new THREE.Points(geometry, this.material);
    this.scene.add(particles);
=======
  private loadModel() {
    
>>>>>>> 72d66f2cbd49278f1e6fb4539434a6d03b7671b6
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
    window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
<<<<<<< HEAD

    if (this.camera) {
      const time = Date.now() * 0.00005;
      this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.05;
      this.camera.position.y += (-this.mouse.y - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.scene.position);

      const h = (360 * (1.0 + time) % 360) / 360;
      this.material.color.setHSL(h, 0.5, 0.5);
    }
=======
>>>>>>> 72d66f2cbd49278f1e6fb4539434a6d03b7671b6
    
    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;
<<<<<<< HEAD
      this.half = new THREE.Vector2(this.width/2, this.height/2);

      this.bind();
=======

>>>>>>> 72d66f2cbd49278f1e6fb4539434a6d03b7671b6
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

