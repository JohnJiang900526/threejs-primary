import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass';
import { MaskPass, ClearMaskPass } from 'three/examples/jsm/postprocessing/MaskPass';
import { TexturePass } from 'three/examples/jsm/postprocessing/TexturePass';

import { BleachBypassShader } from 'three/examples/jsm/shaders/BleachBypassShader';
import { ColorifyShader } from 'three/examples/jsm/shaders/ColorifyShader';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader';
import { SepiaShader } from 'three/examples/jsm/shaders/SepiaShader';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
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
  private animateNumber: number;

  private controls: null | OrbitControls;
  private composerScene: null | EffectComposer;
  private composer1: null | EffectComposer;
  private composer2: null | EffectComposer;
  private composer3: null | EffectComposer;
  private composer4: null | EffectComposer;
  private cameraOrtho: null | THREE.OrthographicCamera;
  private sceneModel: THREE.Scene;
  private sceneBG: THREE.Scene;
  private mesh: THREE.Mesh;
  private directionalLight: THREE.DirectionalLight;
  private half: THREE.Vector2;
  private quadBG: THREE.Mesh;
  private quadMask: THREE.Mesh;
  private renderScene: null | TexturePass;
  private delta: number;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth / 2;
    this.height = this.container.offsetHeight / 2;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.composerScene = null;
    this.composer1 = null;
    this.composer2 = null;
    this.composer3 = null;
    this.composer4 = null;
    this.cameraOrtho = null;
    this.sceneModel = new THREE.Scene();
    this.sceneBG = new THREE.Scene();
    this.mesh = new THREE.Mesh();
    this.directionalLight = new THREE.DirectionalLight();
    this.half = new THREE.Vector2(this.container.offsetWidth/2, this.container.offsetHeight/2);
    this.quadBG = new THREE.Mesh();
    this.quadMask = new THREE.Mesh();
    this.renderScene = null;
    this.delta = 0.05;
  }

  init() {
    // 渲染器
    this.createRenderer();

    // 场景
    this.sceneModel = new THREE.Scene();
		this.sceneBG = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 10000);
    this.camera.position.z = 1200;

    const {x, y} = this.half;
    this.cameraOrtho = new THREE.OrthographicCamera( -x, x, y, -y, -10000, 10000);
		this.cameraOrtho.position.z = 100;

    this.createLight();
    this.loadModel();
    this.createQuad();
    this.initComposer();

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

  // 核心 不好理解
  private initComposer() {
    const shaderBleach = BleachBypassShader;
    const shaderSepia = SepiaShader;
    const shaderVignette = VignetteShader;

    const effectBleach = new ShaderPass(shaderBleach);
    const effectSepia = new ShaderPass(shaderSepia);
    const effectVignette = new ShaderPass(shaderVignette);
    const gammaCorrection = new ShaderPass(GammaCorrectionShader);

    effectBleach.uniforms['opacity'].value = 0.95;
    effectSepia.uniforms['amount'].value = 0.9;
    effectVignette.uniforms['offset'].value = 0.95;
    effectVignette.uniforms['darkness'].value = 1.6;

    const effectBloom = new BloomPass(0.5);
    const effectFilm = new FilmPass(0.35, 0.025, 648, 0);
    const effectFilmBW = new FilmPass(0.35, 0.5, 2048, 1);
    const effectDotScreen = new DotScreenPass(new THREE.Vector2(0, 0), 0.5, 0.8);

    const effectHBlur = new ShaderPass(HorizontalBlurShader);
    const effectVBlur = new ShaderPass(VerticalBlurShader);
    effectHBlur.uniforms['h'].value = 2 / (this.width / 2);
    effectVBlur.uniforms['v'].value = 2 / (this.height / 2);

    const effectColorify1 = new ShaderPass(ColorifyShader);
    const effectColorify2 = new ShaderPass(ColorifyShader);
    effectColorify1.uniforms['color'] = new THREE.Uniform(new THREE.Color(1, 0.8, 0.8));
    effectColorify2.uniforms['color'] = new THREE.Uniform(new THREE.Color(1, 0.75, 0.5));

    const clearMask = new ClearMaskPass();
    const renderMask = new MaskPass(this.sceneModel, this.camera as THREE.PerspectiveCamera);
    const renderMaskInverse = new MaskPass(this.sceneModel, this.camera as THREE.PerspectiveCamera);
    renderMaskInverse.inverse = true;

    const rtParameters = {
      stencilBuffer: true
    };
    const rtWidth = this.width / 2;
    const rtHeight = this.height / 2;

    const renderBackground = new RenderPass( this.sceneBG, this.cameraOrtho as THREE.OrthographicCamera);
    const renderModel = new RenderPass(this.sceneModel, this.camera as THREE.PerspectiveCamera);
    renderModel.clear = false;

    this.composerScene = new EffectComposer(
      this.renderer as THREE.WebGLRenderer, 
      new THREE.WebGLRenderTarget(rtWidth * 2, rtHeight * 2, rtParameters) 
    );
    this.composerScene.addPass(renderBackground);
    this.composerScene.addPass(renderModel);
    this.composerScene.addPass(renderMaskInverse);
    this.composerScene.addPass(effectHBlur);
    this.composerScene.addPass(effectVBlur);
    this.composerScene.addPass(clearMask);


    this.renderScene = new TexturePass(this.composerScene.renderTarget2.texture );

    this.composer1 = new EffectComposer( 
      this.renderer as THREE.WebGLRenderer, 
      new THREE.WebGLRenderTarget( rtWidth, rtHeight, rtParameters ) 
    );
    this.composer1.addPass(this.renderScene);
    this.composer1.addPass(gammaCorrection);
    this.composer1.addPass(effectFilmBW);
    this.composer1.addPass(effectVignette);

    this.composer2 = new EffectComposer( 
      this.renderer as THREE.WebGLRenderer, 
      new THREE.WebGLRenderTarget(rtWidth, rtHeight, rtParameters) 
    );
    this.composer2.addPass(this.renderScene);
    this.composer2.addPass(gammaCorrection);
    this.composer2.addPass(effectDotScreen);
    this.composer2.addPass(renderMask);
    this.composer2.addPass(effectColorify1);
    this.composer2.addPass(clearMask);
    this.composer2.addPass(renderMaskInverse);
    this.composer2.addPass(effectColorify2);
    this.composer2.addPass(clearMask);
    this.composer2.addPass(effectVignette);

    this.composer3 = new EffectComposer( 
      this.renderer as THREE.WebGLRenderer, 
      new THREE.WebGLRenderTarget(rtWidth, rtHeight, rtParameters) 
    );
    this.composer3.addPass(this.renderScene);
    this.composer3.addPass(gammaCorrection);
    this.composer3.addPass(effectSepia);
    this.composer3.addPass(effectFilm);
    this.composer3.addPass(effectVignette);

    this.composer4 = new EffectComposer( 
      this.renderer as THREE.WebGLRenderer, 
      new THREE.WebGLRenderTarget(rtWidth, rtHeight, rtParameters) 
    );
    this.composer4.addPass(this.renderScene);
    this.composer4.addPass(gammaCorrection);
    this.composer4.addPass(effectBloom);
    this.composer4.addPass(effectFilm);
    this.composer4.addPass(effectBleach);
    this.composer4.addPass(effectVignette);
    // @ts-ignore
    this.renderScene.uniforms['tDiffuse'].value = this.composerScene.renderTarget2.texture;
  }

  private createQuad() {
    const url = "/examples/textures/cube/SwedishRoyalCastle/pz.jpg";
    const diffuseMap = new THREE.TextureLoader().load(url);
    diffuseMap.encoding = THREE.sRGBEncoding;

    const materialColor = new THREE.MeshBasicMaterial({
      map: diffuseMap,
      depthTest: false
    });

    this.quadBG = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialColor);
    this.quadBG.position.z = -500;
    this.quadBG.scale.set(this.width, this.height, 1);
    this.sceneBG.add(this.quadBG);

    const sceneMask = new THREE.Scene();
    this.quadMask = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({color: 0xffaa00}));
    this.quadMask.position.z = -300;
    this.quadMask.scale.set(this.width / 2, this.height / 2, 1);
    sceneMask.add(this.quadMask);
  }

  private loadModel() {
    const loader = new GLTFLoader();
    const url = "/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load(url, (gltf) => {
      toast.close();

      const mesh = gltf.scene.children[0] as THREE.Mesh;
      this.createMesh(mesh.geometry, this.sceneModel, 100);
    }, undefined, () => { toast.close(); });
  }

  private createMesh(geometry: THREE.BufferGeometry, scene: THREE.Scene, scale: number) {
    const url1 = "/examples/models/gltf/LeePerrySmith/Map-COL.jpg";
    const url2 = "/examples/models/gltf/LeePerrySmith/Infinite-Level_02_Tangent_SmoothUV.jpg";

    const diffuseMap = new THREE.TextureLoader().load(url1);
    diffuseMap.encoding = THREE.sRGBEncoding;

    const material = new THREE.MeshPhongMaterial({
      color: 0x999999,
      specular: 0x080808,
      shininess: 20,
      map: diffuseMap,
      normalMap: new THREE.TextureLoader().load(url2),
      normalScale: new THREE.Vector2(0.75, 0.75)
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, -50, 0);
    this.mesh.scale.set(scale, scale, scale);
    scene.add(this.mesh);
  }

  private createLight() {
    this.directionalLight = new THREE.DirectionalLight(0xffffff);
    this.directionalLight.position.set(0, -0.1, 1).normalize();
    this.sceneModel.add(this.directionalLight);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
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
      const time = Date.now() * 0.0004;

      if (this.mesh) { this.mesh.rotation.y = -time; }

      this.renderer?.setViewport(0, 0, this.half.x, this.half.y);
      this.composerScene?.render(this.delta);

      this.renderer?.setViewport(0, 0, this.half.x, this.half.y);
      this.composer1?.render(this.delta);

      this.renderer?.setViewport(this.half.x, 0, this.half.x, this.half.y);
      this.composer2?.render(this.delta);

      this.renderer?.setViewport(0, this.half.y, this.half.x, this.half.y);
      this.composer3?.render(this.delta);

      this.renderer?.setViewport(this.half.x, this.half.y, this.half.x, this.half.y);
      this.composer4?.render(this.delta);
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
      this.width = this.container.offsetWidth / 2;
      this.height = this.container.offsetHeight / 2;
      this.aspect = this.width/this.height;
      this.half = new THREE.Vector2(this.container.offsetWidth/2, this.container.offsetHeight/2);

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.cameraOrtho) {
        this.cameraOrtho.left = -this.half.x;
				this.cameraOrtho.right = this.half.x;
				this.cameraOrtho.top = this.half.y;
				this.cameraOrtho.bottom = -this.half.y;
				this.cameraOrtho.updateProjectionMatrix();
      }

      this.renderer?.setSize(this.container.offsetWidth, this.container.offsetHeight);
      this.composerScene?.setSize(this.container.offsetWidth, this.container.offsetHeight);

      this.composer1?.setSize(this.half.x, this.half.y);
      this.composer2?.setSize(this.half.x, this.half.y);
      this.composer3?.setSize(this.half.x, this.half.y);
      this.composer4?.setSize(this.half.x, this.half.y);

      if (this.composerScene && this.renderScene) {
        // @ts-ignore
        this.renderScene.uniforms['tDiffuse'].value = this.composerScene.renderTarget2.texture;
        this.quadBG.scale.set(this.container.offsetWidth, this.container.offsetHeight, 1);
        this.quadMask.scale.set(this.container.offsetWidth / 2, this.container.offsetHeight / 2, 1);
      }
    };
  }
}

export default THREE;

