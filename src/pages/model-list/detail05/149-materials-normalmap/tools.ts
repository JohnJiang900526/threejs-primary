import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { showLoadingToast } from 'vant';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { BleachBypassShader } from 'three/examples/jsm/shaders/BleachBypassShader';
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private loader: GLTFLoader
  private mesh: THREE.Mesh
  private directionalLight: THREE.DirectionalLight
  private pointLight: THREE.PointLight
  private ambientLight: THREE.AmbientLight
  private mouse: THREE.Vector2
  private target: THREE.Vector2
  private half: THREE.Vector2
  private composer: null | EffectComposer
  private effectFXAA: null | ShaderPass
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.loader = new GLTFLoader();
    this.mesh = new THREE.Mesh();
    this.directionalLight = new THREE.DirectionalLight();
    this.pointLight = new THREE.PointLight();
    this.ambientLight = new THREE.AmbientLight();
    this.mouse = new THREE.Vector2(0, 0);
    this.target = new THREE.Vector2(0, 0);
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.composer = null;
    this.effectFXAA = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    // 相机
    this.camera = new THREE.PerspectiveCamera(30, this.aspect, 1, 10000);
    this.camera.position.set(0, 0, 1200);

    this.generateLight();
    this.loadModel();
    // 渲染器
    this.createRenderer();
    this.generateComposer();

    this.bind();
    this.initStats();
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
      window.onmousemove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];

        const x = ( e.clientX - this.half.x);
        const y = ( e.clientY - 45 - this.half.y);
        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onmousemove = (e) => {
        const x = ( e.clientX - this.half.x);
        const y = ( e.clientY - 45 - this.half.y);
        this.mouse.set(x, y);
      };
    }
  }

  // 创建 composer 核心 但是看不懂
  private generateComposer() {
    const renderModel = new RenderPass(this.scene, this.camera as THREE.PerspectiveCamera);
    const effectBleach = new ShaderPass(BleachBypassShader);
    const effectColor = new ShaderPass(ColorCorrectionShader);
    const gammaCorrection = new ShaderPass(GammaCorrectionShader);

    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms['resolution'].value.set(1/this.width, 1/this.height);

    effectBleach.uniforms['opacity'].value = 0.2;
    effectColor.uniforms['powRGB'].value.set(1.4, 1.45, 1.45);
    effectColor.uniforms['mulRGB'].value.set(1.1, 1.1, 1.1);

    const depthTexture = new THREE.DepthTexture(this.width, this.height);
    const type = THREE.HalfFloatType;
    const renderTarget = new THREE.WebGLRenderTarget(
      this.width, this.height, { 
      type,
      depthTexture,
    });

    this.composer = new EffectComposer(this.renderer as THREE.WebGLRenderer, renderTarget);
    this.composer.addPass(renderModel);
    this.composer.addPass(this.effectFXAA);
    this.composer.addPass(effectBleach);
    this.composer.addPass(effectColor);
    this.composer.addPass(gammaCorrection);
  }

  private generateLight() {
    this.ambientLight = new THREE.AmbientLight(0x444444);

    this.pointLight = new THREE.PointLight(0xffffff, 2, 1000);
    this.pointLight.position.set(0, 0, 600);

    this.directionalLight = new THREE.DirectionalLight(0xffffff);
    this.directionalLight.position.set(1, -0.5, -1);

    this.scene.add(this.ambientLight, this.pointLight, this.directionalLight);
  }

  private loadModel() {
    const textureLoader = new THREE.TextureLoader();
    const mapUrl = "/examples/models/gltf/LeePerrySmith/Map-COL.jpg";
    const map = textureLoader.load(mapUrl);
    map.encoding = THREE.sRGBEncoding;

    const specularMapUrl = "/examples/models/gltf/LeePerrySmith/Map-SPEC.jpg";
    const specularMap = textureLoader.load(specularMapUrl);
    specularMap.encoding = THREE.sRGBEncoding;

    const normalMapUrl = "/examples/models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg";
    const normalMap = textureLoader.load(normalMapUrl);

    const material = new THREE.MeshPhongMaterial({
      color: 0xdddddd,
      specular: 0x222222,
      shininess: 35,
      map,
      // .specularMap : Texture
      // 镜面反射贴图值会影响镜面高光以及环境贴图对表面的影响程度。默认值为null
      specularMap,
      // .normalMap : Texture
      // 用于创建法线贴图的纹理。RGB值会影响每个像素片段的曲面法线，并更改颜色照亮的方式。
      // 法线贴图不会改变曲面的实际形状，只会改变光照
      normalMap,
      // .normalScale : Vector2
      // 法线贴图对材质的影响程度。典型范围是0-1。默认值是Vector2设置为（1,1）
      normalScale: new THREE.Vector2(0.8, 0.8)
    });

    // toast
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    const url = "/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb";
    this.loader.load(url, (gltf) => {
      toast.close();

      const geometry = (gltf.scene.children[0] as THREE.Mesh).geometry;
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.scale.set(75, 75, 75);
      this.mesh.position.y = -50;
      this.scene.add(this.mesh);
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
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
    window.requestAnimationFrame(() => { this.animate(); });

    this.target.set(this.mouse.x * 0.001, this.mouse.y * 0.001);
    this.mesh.rotation.x += 0.05 * (this.target.y - this.mesh.rotation.x);
    this.mesh.rotation.y += 0.05 * (this.target.x - this.mesh.rotation.y);

    this.stats?.update();

    // 执行渲染
    if (this.renderer && this.scene && this.camera && this.composer) {
      this.renderer.render(this.scene, this.camera);
      this.composer.render();
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;
      this.half.set(this.width/2, this.height/2);

      this.bind();
      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer && this.composer && this.effectFXAA) {
        this.renderer.setSize(this.width, this.height);
        this.composer.setSize(this.width, this.height);
        this.effectFXAA.uniforms['resolution'].value.set(1 / this.width, 1 / this.height);
      }
    };
  }
}

export default THREE;

