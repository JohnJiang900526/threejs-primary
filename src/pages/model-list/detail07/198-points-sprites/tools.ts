import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
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

  private parameters: [[number, number, number], THREE.Texture, number][]
  private mouse: THREE.Vector2
  private half: THREE.Vector2
  private materials: THREE.PointsMaterial[]
  private gui: GUI
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.parameters = [];
    this.mouse = new THREE.Vector2();
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.materials = [];
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 1, 2000);
    this.camera.position.z = 1000;

    // 创建点
    this.createPoints();
    
    // 渲染器
    this.createRenderer();

    this.bind();
    this.initStats();
    this.setUpGUI();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

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
        if (e.isPrimary) {return;  }

        const x = e.clientX - this.half.x;
				const y = e.clientY - 45 - this.half.y;

        this.mouse.set(x, y);
      };
    }
  }

  private setUpGUI() {
    const params = {
      texture: true
    };

    this.gui.add(params, "texture").onChange((value: boolean) => {
      this.materials.forEach((material, i) => {
        material.map = (value === true) ? this.parameters[i][1] : null;
        material.needsUpdate = true;
      });
    });
  }

  private createPoints() {
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const textureLoader = new THREE.TextureLoader();

    const sprite1 = textureLoader.load('/examples/textures/sprites/snowflake1.png');
    const sprite2 = textureLoader.load('/examples/textures/sprites/snowflake2.png');
    const sprite3 = textureLoader.load('/examples/textures/sprites/snowflake3.png');
    const sprite4 = textureLoader.load('/examples/textures/sprites/snowflake4.png');
    const sprite5 = textureLoader.load('/examples/textures/sprites/snowflake5.png');

    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * 2000 - 1000;
      const y = Math.random() * 2000 - 1000;
      const z = Math.random() * 2000 - 1000;

      vertices.push(x, y, z);
    }

    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute(vertices, 3));
    
    this.parameters = [
      [[1.0, 0.2, 0.5], sprite2, 20],
      [[0.95, 0.1, 0.5], sprite3, 15],
      [[0.90, 0.05, 0.5], sprite1, 10],
      [[0.85, 0, 0.5], sprite5, 8],
      [[0.80, 0, 0.5], sprite4, 5],
    ];

    this.parameters.forEach((parameter, i) => {
      const [color, sprite, size] = parameter;

      this.materials[i] = new THREE.PointsMaterial({ 
        size: size, 
        map: sprite, 
        blending: THREE.AdditiveBlending, 
        depthTest: false, 
        transparent: true,
        color: (new THREE.Color()).setHSL(color[0], color[1], color[2])
      });

      const particles = new THREE.Points(geometry, this.materials[i]);
      particles.rotation.set(
        Math.random() * 6,
        Math.random() * 6,
        Math.random() * 6,
      );
      this.scene.add(particles);
    });
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

  private render() {
    if (this.camera) {
      const time = Date.now() * 0.00005;
      this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.05;
      this.camera.position.y += (-this.mouse.y - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.scene.position);

      this.scene.children.forEach((object, i) => {
        if (object instanceof THREE.Points) {
          object.rotation.y = time * (i < 4 ? i + 1 : -(i + 1));
        }
      });

      this.materials.forEach((material, i) => {
        const color = this.parameters[i][0];
        const h = (360 * (color[0] + time) % 360) / 360;

        this.materials[i].color.setHSL(h, color[1], color[2]);
      });
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.render();
    
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
      this.half = new THREE.Vector2(this.width/2, this.height/2);

      this.bind();
      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

