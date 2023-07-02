import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from 'three/examples/jsm/objects/Water2';
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
  private water: null | Water;
  private gui: GUI
  private clock: THREE.Clock;
  private torusKnot: THREE.Mesh;
  private params: {
    color: string,
    scale: number,
    flowX: number,
    flowY: number,
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
    this.water = null;
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
    this.clock = new THREE.Clock();
    this.torusKnot = new THREE.Mesh();
    this.params = {
      color: '#ffffff',
      scale: 4,
      flowX: 1,
      flowY: 1,
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 0.1, 200);
    this.camera.position.set(-15, 7, 15);

    this.createLight();
    this.createMesh();
    this.createGround();
    this.createWater();
    this.createSkybox();

    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.update();

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

  private setUpGUI() {
    this.gui.addColor(this.params, 'color').onChange((value: number) => {
      if (this.water) {
        this.water.material.uniforms['color'].value.set(value);
      }
    });

    this.gui.add(this.params, 'scale', 1, 10 ).onChange((value: number) => {
      if (this.water) {
        this.water.material.uniforms[ 'config' ].value.w = value;
      }
    });

    this.gui.add(this.params, 'flowX', - 1, 1 ).step( 0.01 ).onChange((value: number) => {
      if (this.water) {
        this.water.material.uniforms[ 'flowDirection' ].value.x = value;
        this.water.material.uniforms[ 'flowDirection' ].value.normalize();
      }
    });

    this.gui.add(this.params, 'flowY', -1, 1).step(0.01).onChange((value: number) => {
      if (this.water) {
        this.water.material.uniforms[ 'flowDirection' ].value.y = value;
        this.water.material.uniforms[ 'flowDirection' ].value.normalize();
      }
    });
  }

  private createLight() {
    const ambient = new THREE.AmbientLight(0xcccccc, 0.4);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(-1, 1, 1);

    this.scene.add(ambient, dirLight);
  }

  private createSkybox() {
    const loader = new THREE.CubeTextureLoader();
    loader.setPath('/examples/textures/cube/Park2/');

    const texture = loader.load([
      'posx.jpg', 'negx.jpg',
      'posy.jpg', 'negy.jpg',
      'posz.jpg', 'negz.jpg',
    ]);
    this.scene.background = texture;
  }

  private createWater() {
    const waterGeometry = new THREE.PlaneGeometry(20, 20);

    this.water = new Water(waterGeometry, {
      color: this.params.color,
      scale: this.params.scale,
      flowDirection: new THREE.Vector2(this.params.flowX, this.params.flowY),
      textureWidth: 1024,
      textureHeight: 1024
    });
    this.water.position.y = 1;
    this.water.rotation.x = Math.PI * -0.5;
    this.scene.add(this.water);
  }

  private createGround() {
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      roughness: 0.8, 
      metalness: 0.4,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI * -0.5;
    this.scene.add(ground);

    const loader = new THREE.TextureLoader();
    loader.load('/examples/textures/hardwood2_diffuse.jpg', (map) => {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.anisotropy = 16;
      map.repeat.set(4, 4);

      groundMaterial.map = map;
      groundMaterial.needsUpdate = true;
    });
  }

  private createMesh() {
    const torusKnotGeometry = new THREE.TorusKnotGeometry( 3, 1, 256, 32 );
    const torusKnotMaterial = new THREE.MeshNormalMaterial();

    this.torusKnot = new THREE.Mesh(torusKnotGeometry, torusKnotMaterial);
    this.torusKnot.position.y = 4;
    this.torusKnot.scale.set(0.5, 0.5, 0.5);
    this.scene.add(this.torusKnot);
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

    {
      const delta = this.clock.getDelta();
      this.torusKnot.rotation.x += delta;
      this.torusKnot.rotation.y += delta * 0.5;
    }

    this.stats?.update();
    this.controls?.update();

    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
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
      }
    };
  }
}

export default THREE;

