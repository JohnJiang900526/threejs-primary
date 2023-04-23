import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls
  private gui: GUI
  private mesh: THREE.Mesh
  private params: {
    color: number,
    transmission: number,
    opacity: number,
    metalness: number,
    roughness: number,
    ior: number,
    thickness: number,
    specularIntensity: number,
    specularColor: number,
    envMapIntensity: number,
    lightIntensity: number,
    exposure: number,
  }
  private hdrEquirect: THREE.DataTexture
  private material: THREE.MeshPhysicalMaterial
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
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.mesh = new THREE.Mesh();
    this.params = {
      color: 0xffffff,
      transmission: 1,
      opacity: 1,
      metalness: 0,
      roughness: 0,
      ior: 1.5,
      thickness: 0.01,
      specularIntensity: 1,
      specularColor: 0xffffff,
      envMapIntensity: 1,
      lightIntensity: 1,
      exposure: 1,
    };
    this.hdrEquirect = new THREE.DataTexture();
    this.material = new THREE.MeshPhysicalMaterial();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x929cc2);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 2000);
    this.camera.position.set(0, 0, 120);

    this.generateEquirect(() => {
      this.scene.background = this.hdrEquirect;
      this.scene.environment = this.hdrEquirect;
      this.generateSphere();
      this.render();
    });

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 10;
    this.controls.maxDistance = 150;
    this.controls.addEventListener("change", () => { this.render(); });

    this.setUpGUI();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateEquirect(fn?: () => void) {
    const loader = new RGBELoader();
    const path = "/examples/textures/equirectangular/";
    const url = "royal_esplanade_1k.hdr";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.setPath(path).load(url, (texture) => {
      toast.close();
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.hdrEquirect = texture;
      fn && fn();
    }, undefined, () => { toast.close(); });
  }

  private setUpGUI() {
    this.gui.addColor(this.params, "color").name("颜色").onChange(() => {
      this.material.color.set(this.params.color);
      this.render();
    });

    this.gui.add(this.params, "transmission", 0, 1, 0.01).name("变速").onChange(() => {
      this.material.transmission = this.params.transmission;
      this.render();
    });

    this.gui.add(this.params, "opacity", 0, 1, 0.01).name("透明度").onChange(() => {
      this.material.opacity = this.params.opacity;
      this.render();
    });

    this.gui.add(this.params, "metalness", 0, 1, 0.01).name("金属化").onChange(() => {
      this.material.metalness = this.params.metalness;
      this.render();
    });

    this.gui.add(this.params, "roughness", 0, 1, 0.01).name("粗糙度").onChange(() => {
      this.material.roughness = this.params.roughness;
      this.render();
    });

    this.gui.add(this.params, "ior", 0, 2, 0.01).name("折射率").onChange(() => {
      this.material.ior = this.params.ior;
      this.render();
    });

    this.gui.add(this.params, "thickness", 0, 5, 0.01).name("厚度").onChange(() => {
      this.material.thickness = this.params.thickness;
      this.render();
    });

    this.gui.add(this.params, "specularIntensity", 0, 1, 0.01).name("高光强度").onChange(() => {
      this.material.specularIntensity = this.params.specularIntensity;
      this.render();
    });

    this.gui.addColor(this.params, "specularColor").name("高光颜色").onChange(() => {
      this.material.specularColor.set(this.params.specularColor);
      this.render();
    });

    this.gui.add(this.params, "envMapIntensity", 0, 1, 0.01).name("贴图强度").onChange(() => {
      this.material.envMapIntensity = this.params.envMapIntensity;
      this.render();
    });

    this.gui.add(this.params, "exposure", 0, 5, 0.01).name("曝光强度").onChange(() => {
      if (this.renderer) {
        this.renderer.toneMappingExposure = this.params.exposure;
        this.render();
      }
    });
  }

  // 创建一个圆球
  private generateSphere() {
    const geometry = new THREE.SphereGeometry(15, 64, 32);

    const texture = new THREE.CanvasTexture(this.generateTexture());
    // 当一个纹素覆盖大于一个像素时，贴图将如何采样。默认值为THREE.LinearFilter， 
    // 它将获取四个最接近的纹素，并在他们之间进行双线性插值。 
    // 另一个选项是THREE.NearestFilter，它将使用最接近的纹素的值
    texture.magFilter = THREE.NearestFilter;
    texture.wrapT = THREE.RepeatWrapping;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(1, 3.5);

    this.material = new THREE.MeshPhysicalMaterial( {
      color: this.params.color,
      metalness: this.params.metalness,
      roughness: this.params.roughness,
      ior: this.params.ior,
      // 控制球形断层
      alphaMap: texture,
      envMap: this.hdrEquirect,
      envMapIntensity: this.params.envMapIntensity,
      transmission: this.params.transmission,
      specularIntensity: this.params.specularIntensity,
      specularColor: new THREE.Color(this.params.specularColor),
      opacity: this.params.opacity,
      side: THREE.DoubleSide,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  // 创建一个canvas Texture
  private generateTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 2;
    canvas.height = 2;

    const context = canvas.getContext("2d") as CanvasRenderingContext2D ;
    context.fillStyle = "white";
    context.fillRect(0, 1, 2, 1);

    return canvas;
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    // 色调 默认是NoToneMapping。查看Renderer constants以获取其它备选项
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 色调映射的曝光级别。默认是1
    this.renderer.toneMappingExposure = this.params.exposure;
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
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

  private render() {
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
      this.renderer.toneMappingExposure = this.params.exposure;
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });
    
    this.stats?.update();
    this.controls?.update();
    
    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
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
      this.render();
    };
  }
}

export default THREE;

