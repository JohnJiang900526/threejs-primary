import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from 'three/examples/jsm/objects/Water';
import { Sky } from 'three/examples/jsm/objects/Sky';
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

  private controls: null | OrbitControls;
  private water: null | Water;
  private sun: THREE.Vector3;
  private sky: Sky;
  private mesh: THREE.Mesh;
  private parameters: {
    elevation: number,
    azimuth: number,
  };
  private pmremGenerator: null | THREE.PMREMGenerator;
  private renderTarget: undefined | THREE.WebGLRenderTarget;
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

    this.controls = null;
    this.water = null;
    this.sky = new Sky();
    this.sun = new THREE.Vector3();
    this.mesh = new THREE.Mesh();
    this.parameters = {
      elevation: 2,
      azimuth: 180,
    };
    this.pmremGenerator = null;
    this.renderTarget = undefined;
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(55, this.aspect, 1, 20000);
    this.camera.position.set(30, 30, 200);

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    // 你能够垂直旋转的角度的上限，范围是0到Math.PI，其默认值为Math.PI。
    this.controls.maxPolarAngle = Math.PI * 0.495;
    // 控制器的焦点，.object的轨道围绕它运行。 它可以在任何时候被手动更新，以更改控制器的焦点。
    this.controls.target.set(0, 10, 0);
    this.controls.minDistance = 40.0;
    this.controls.maxDistance = 200.0;
    this.controls.update();

    this.generateWater();
    this.generateSky();
    this.createModel();

    this.setUpGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    const folderSky = this.gui.addFolder('天空');
    folderSky.add(this.parameters, 'elevation', 0, 90, 0.1).name("太阳高度").onChange(() => {
      this.updateSun();
    });
    folderSky.add(this.parameters, 'azimuth', -180, 180, 0.1).name("方位").onChange(() => {
      this.updateSun();
    });

    const folderWater = this.gui.addFolder('水纹');
    const waterUniforms = (this.water as Water).material.uniforms;
    folderWater.add(waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name('失真比例');
    folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1 ).name('水纹大小');
  }

  private generateWater() {
    const loader = new THREE.TextureLoader();
    const url = "/examples/textures/waternormals.jpg";
    const geometry = new THREE.PlaneGeometry(10000, 10000);

    this.water = new Water(geometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: loader.load(url, (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: this.scene.fog !== undefined
    });
    this.water.rotation.x = -Math.PI / 2;
    this.scene.add(this.water);
  }

  private generateSky () {
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer as THREE.WebGLRenderer);

    this.sky = new Sky();
    this.sky.scale.setScalar(10000);
    this.scene.add(this.sky);

    const skyUniforms = this.sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    this.updateSun();
  }

  private updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - this.parameters.elevation);
    const theta = THREE.MathUtils.degToRad(this.parameters.azimuth);

    // 从球坐标中的radius、phi和theta设置该向量。
    this.sun.setFromSphericalCoords(1, phi, theta);

    this.sky.material.uniforms['sunPosition'].value.copy(this.sun);
    if (this.water) {
      this.water.material.uniforms['sunDirection'].value.copy(this.sun).normalize();
    }

    if (this.renderTarget) { this.renderTarget.dispose(); }

    // @ts-ignore
    this.renderTarget = this.pmremGenerator?.fromScene(this.sky);
    if (this.renderTarget) {
      this.scene.environment = this.renderTarget.texture;
    }
  }

  private createModel() {
    const geometry = new THREE.BoxGeometry(20, 20, 20);
    const material = new THREE.MeshStandardMaterial({ roughness: 0 });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
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

    const time = performance.now() * 0.001;
    this.mesh.position.y = Math.sin(time) * 15 + 5;
    this.mesh.rotation.x = time * 0.5;
    this.mesh.rotation.z = time * 0.51;

    if (this.water) {
      this.water.material.uniforms['time'].value += 1.0 / 60.0;
    }

    this.stats?.update();
    this.controls?.update();
    
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

