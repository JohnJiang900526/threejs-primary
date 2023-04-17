import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes';
import {
  ToonShader1,
  ToonShader2, 
  ToonShaderHatching, 
  ToonShaderDotted
} from 'three/examples/jsm/shaders/ToonShader';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private stats: null | Stats;

  private gui: GUI;
  private clock: THREE.Clock;
  private materials: {[key: string]: any}
  private current: string
  private light: THREE.DirectionalLight
  private point: THREE.PointLight
  private ambient: THREE.AmbientLight
  private effect: MarchingCubes | null
  private resolution: number
  private effectController: {
    material: string,
    speed: number,
    numBlobs: number,
    resolution: number,
    isolation: number,
    floor: boolean,
    wallx: boolean,
    wallz: boolean,
    dummy: () => void,
    [key: string]: any
  }

  private time: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;

    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.clock = new THREE.Clock();
    this.materials = {};
    this.current = "shiny";
    this.light = new THREE.DirectionalLight();
    this.point = new THREE.PointLight();
    this.ambient = new THREE.AmbientLight();
    this.effect = null;
    this.resolution = 28;
    this.effectController = {
      material: 'shiny',
      speed: 1.0,
      numBlobs: 10,
      resolution: 28,
      isolation: 80,
      floor: true,
      wallx: false,
      wallz: false,
      dummy: () => {}
    };
    this.time = 0;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 10000);
    this.camera.position.set(-500, 500, 1500);

    // 创建光线
    this.createLight();

    // 材质
    this.materials = this.generateMaterials();
    this.current = 'shiny';

    // 创建模型
    this.createModel();

    // webgl渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 500;
    this.controls.maxDistance = 5000;

    this.setUpGui();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 设置GUI
  private setUpGui() {
    const material = this.gui.addFolder('材质').close();
    for (const m in this.materials) {
      this.effectController[m] = () => {
        const arr = ["colors", "multiColors"];
        if (this.effect) {
          this.current = m;
          this.effect.material = this.materials[m];
          this.effect.enableUvs = (this.current === 'textured') ? true : false;
          this.effect.enableColors = (arr.includes(this.current)) ? true : false;
        }
      };
      material.add(this.effectController, m).name(m);
    }

    const Simulation = this.gui.addFolder('仿真').close();
    Simulation.add(this.effectController, 'speed', 0.1, 8.0, 0.05).name("速度");
    Simulation.add(this.effectController, 'numBlobs', 1, 50, 1).name("数量");
    Simulation.add(this.effectController, 'resolution', 14, 100, 1).name("清晰度");
    Simulation.add(this.effectController, 'isolation', 10, 300, 1).name("隔离");
    Simulation.add(this.effectController, 'floor').name("地板");
    Simulation.add(this.effectController, 'wallx').name("墙x");
    Simulation.add(this.effectController, 'wallz').name("墙z");
  }

  // 创建 Shader 材质
  private createShaderMaterial(shader: THREE.ShaderMaterialParameters, light: THREE.DirectionalLight, ambient: THREE.AmbientLight) {
    const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    const { vertexShader, fragmentShader } = shader;

    const material = new THREE.ShaderMaterial({ 
      uniforms, 
      vertexShader, 
      fragmentShader,
    });

    material.uniforms['uDirLightPos'].value = light.position;
    material.uniforms['uDirLightColor'].value = light.color;
    material.uniforms['uAmbientLightColor'].value = ambient.color;

    return material;
  }

  // 创建材质
  private generateMaterials() {
    const path = '/examples/textures/cube/SwedishRoyalCastle/';
    const format = '.jpg';
    const urls = [
      path + 'px' + format, path + 'nx' + format,
      path + 'py' + format, path + 'ny' + format,
      path + 'pz' + format, path + 'nz' + format
    ];

    const cubeTextureLoader = new THREE.CubeTextureLoader();
    const reflectionCube = cubeTextureLoader.load(urls);
    const refractionCube = cubeTextureLoader.load(urls);
    refractionCube.mapping = THREE.CubeRefractionMapping;
    
    const toonMaterial1 = this.createShaderMaterial(ToonShader1, this.light, this.ambient);
    const toonMaterial2 = this.createShaderMaterial(ToonShader2, this.light, this.ambient);
    const hatchingMaterial = this.createShaderMaterial(ToonShaderHatching, this.light, this.ambient);
    const dottedMaterial = this.createShaderMaterial(ToonShaderDotted, this.light, this.ambient);

    const texture = new THREE.TextureLoader().load('/examples/textures/uv_grid_opengl.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const materials = {
      'shiny': new THREE.MeshStandardMaterial({ 
        color: 0x550000, 
        envMap: reflectionCube, 
        roughness: 0.1, 
        metalness: 1.0 
      }),
      'chrome': new THREE.MeshLambertMaterial({ 
        color: 0xffffff, 
        envMap: reflectionCube 
      }),
      'liquid': new THREE.MeshLambertMaterial({ 
        color: 0xffffff, 
        envMap: refractionCube, 
        refractionRatio: 0.85 
      }),
      'matte': new THREE.MeshPhongMaterial({ 
        specular: 0x111111, 
        shininess: 1 
      }),
      'flat': new THREE.MeshLambertMaterial({ 
        flatShading: true  
      }),
      'textured': new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        specular: 0x111111, 
        shininess: 1, 
        map: texture 
      }),
      'colors': new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        specular: 0xffffff, 
        shininess: 2, 
        vertexColors: true
      }),
      'multiColors': new THREE.MeshPhongMaterial({ 
        shininess: 2, 
        vertexColors: true 
      }),
      'plastic': new THREE.MeshPhongMaterial({ 
        specular: 0x888888, 
        shininess: 250 
      }),
      'toon1': toonMaterial1,
      'toon2': toonMaterial2,
      'hatching': hatchingMaterial,
      'dotted': dottedMaterial
    };

    return materials;
  }

  private createLight() {
    this.light = new THREE.DirectionalLight(0xffffff);
    this.light.position.set(0.5, 0.5, 1);

    this.point = new THREE.PointLight(0xff3300);
    this.point.position.set(0, 0, 100);

    this.ambient = new THREE.AmbientLight(0x080808);

    this.scene.add(this.light, this.point, this.ambient);
  }

  // 加载模型
  private createModel() {
    const material = this.materials[this.current];

    this.effect = new MarchingCubes(this.resolution, material, true, true, 100000);
    this.effect.position.set(0, 0, 0);
    this.effect.scale.set(400, 400, 400);
    // 在下面设置 不要在构造函数中设置
    this.effect.enableUvs = false;
		this.effect.enableColors = false;

    this.scene.add(this.effect);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

  private updateCubes(object: MarchingCubes, time: number, num: number, floor: boolean, wallx: boolean, wallz: boolean) {
    object.reset();

    const rainbow: THREE.Color[] = [
      new THREE.Color(0xff0000),
      new THREE.Color(0xff7f00),
      new THREE.Color(0xffff00),
      new THREE.Color(0x00ff00),
      new THREE.Color(0x0000ff),
      new THREE.Color(0x4b0082),
      new THREE.Color(0x9400d3),
    ];

    const strength = 1.2/((Math.sqrt(num) - 1)/4 + 1);
    for (let i = 0; i < num; i++) {
      const ballx = Math.sin(i + 1.26 * time * (1.03 + 0.5 * Math.cos(0.21 * i))) * 0.27 + 0.5;
      const bally = Math.abs(Math.cos(i + 1.12 * time * Math.cos(1.22 + 0.1424 * i))) * 0.77;
      const ballz = Math.cos(i + 1.32 * time * 0.1 * Math.sin((0.92 + 0.53 * i))) * 0.27 + 0.5;

      if (this.current === 'multiColors') {
        const color = rainbow[i % rainbow.length];
        object.addBall(ballx, bally, ballz, strength, 12, color);
      } else {
        object.addBall(ballx, bally, ballz, strength, 12);
      }
    }

    if (floor) { object.addPlaneY(2, 12); }
    if (wallz) { object.addPlaneZ(2, 12); }
    if (wallx) { object.addPlaneX(2, 12); }

    // 控制模型旋转
    object.rotation.y += 0.005;

    // @ts-ignore
    object.update && object.update();
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.renderer && this.scene && this.camera && this.effect) {
      const delta = this.clock.getDelta();
      // 清晰度 | 分辨率
      if (this.effectController.resolution !== this.resolution) {
				this.resolution = this.effectController.resolution;
				this.effect.init(Math.floor(this.resolution));
			}

      // 隔离
			if (this.effectController.isolation !== this.effect.isolation) {
				this.effect.isolation = this.effectController.isolation;
			}

      const { numBlobs: num, floor, wallx: x, wallz: z } = this.effectController;
      this.time += delta * this.effectController.speed * 0.5;
      this.updateCubes(this.effect, this.time, num, floor, x, z);
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

