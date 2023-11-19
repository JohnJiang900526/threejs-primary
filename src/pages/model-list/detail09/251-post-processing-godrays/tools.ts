import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { 
  GodRaysFakeSunShader, 
  GodRaysDepthMaskShader, 
  GodRaysCombineShader, 
  GodRaysGenerateShader,
 } from 'three/examples/jsm/shaders/GodRaysShader';
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
  private materialDepth: THREE.MeshDepthMaterial;
  private sphereMesh: THREE.Mesh;
  private sunPosition: THREE.Vector3;
  private clipPosition: THREE.Vector4;
  private screenSpacePosition: THREE.Vector3;
  private postprocessing: {
    enabled: boolean,
    [key: string]: any
  };
  private orbitRadius: number;
  private bgColor: number;
  private sunColor: number;
  private renderTargetResolutionMultiplier: number;
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
    this.materialDepth = new THREE.MeshDepthMaterial();
    this.sphereMesh = new THREE.Mesh();
    this.sunPosition = new THREE.Vector3(0, 1000, -1000);
    this.clipPosition = new THREE.Vector4();
    this.screenSpacePosition = new THREE.Vector3();
    this.postprocessing = { enabled: true };
    this.orbitRadius = 200;
    this.bgColor = 0x000511;
    this.sunColor = 0xffee00;
    this.renderTargetResolutionMultiplier = 1.0 / 4.0;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(100, this.aspect, 1, 3000);
    this.camera.position.z = 200;

    this.createMesh();
    // 渲染器
    this.createRenderer();
    // init Process
    this.initProcess(this.width, this.height);

    // 轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 50;
    this.controls.maxDistance = 500;
    // 以下两个属性可控制轨道控制器水平旋转
    this.controls.minPolarAngle = Math.PI/2;
    this.controls.maxPolarAngle = Math.PI/2;

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private initProcess(renderTargetWidth: number, renderTargetHeight: number) {
    this.postprocessing.scene = new THREE.Scene();
    this.postprocessing.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
    this.postprocessing.camera.position.z = 100;
    this.postprocessing.scene.add(this.postprocessing.camera);

    this.postprocessing.rtTextureColors = new THREE.WebGLRenderTarget(
      renderTargetWidth, 
      renderTargetHeight
    );

    this.postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget(
      renderTargetWidth, 
      renderTargetHeight
    );
    this.postprocessing.rtTextureDepthMask = new THREE.WebGLRenderTarget(
      renderTargetWidth, 
      renderTargetHeight
    );

    // 乒乓渲染目标可以使用调整后的分辨率来最小化成本
    const adjustedWidth = renderTargetWidth * this.renderTargetResolutionMultiplier;
    const adjustedHeight = renderTargetHeight * this.renderTargetResolutionMultiplier;
    this.postprocessing.rtTextureGodRays1 = new THREE.WebGLRenderTarget(adjustedWidth, adjustedHeight);
    this.postprocessing.rtTextureGodRays2 = new THREE.WebGLRenderTarget(adjustedWidth, adjustedHeight);

    // god-ray shaders
    const godraysMaskShader = GodRaysDepthMaskShader;
    this.postprocessing.godrayMaskUniforms = THREE.UniformsUtils.clone(godraysMaskShader.uniforms);
    this.postprocessing.materialGodraysDepthMask = new THREE.ShaderMaterial({
      uniforms: this.postprocessing.godrayMaskUniforms,
      vertexShader: godraysMaskShader.vertexShader,
      fragmentShader: godraysMaskShader.fragmentShader
    });

    const godraysGenShader = GodRaysGenerateShader;
    this.postprocessing.godrayGenUniforms = THREE.UniformsUtils.clone(godraysGenShader.uniforms);
    this.postprocessing.materialGodraysGenerate = new THREE.ShaderMaterial({
      uniforms: this.postprocessing.godrayGenUniforms,
      vertexShader: godraysGenShader.vertexShader,
      fragmentShader: godraysGenShader.fragmentShader
    });

    const godraysCombineShader = GodRaysCombineShader;
    this.postprocessing.godrayCombineUniforms = THREE.UniformsUtils.clone(godraysCombineShader.uniforms);
    this.postprocessing.materialGodraysCombine = new THREE.ShaderMaterial({
      uniforms: this.postprocessing.godrayCombineUniforms,
      vertexShader: godraysCombineShader.vertexShader,
      fragmentShader: godraysCombineShader.fragmentShader
    });

    const godraysFakeSunShader = GodRaysFakeSunShader;
    this.postprocessing.godraysFakeSunUniforms = THREE.UniformsUtils.clone(godraysFakeSunShader.uniforms);
    this.postprocessing.materialGodraysFakeSun = new THREE.ShaderMaterial({
      uniforms: this.postprocessing.godraysFakeSunUniforms,
      vertexShader: godraysFakeSunShader.vertexShader,
      fragmentShader: godraysFakeSunShader.fragmentShader
    });

    this.postprocessing.godraysFakeSunUniforms.bgColor.value.setHex(this.bgColor);
    this.postprocessing.godraysFakeSunUniforms.sunColor.value.setHex(this.sunColor);
    this.postprocessing.godrayCombineUniforms.fGodRayIntensity.value = 0.75;

    this.postprocessing.quad = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 1.0),
      this.postprocessing.materialGodraysGenerate
    );
    this.postprocessing.quad.position.z = -9900;
    this.postprocessing.scene.add(this.postprocessing.quad);
  }

  // 创建模型
  private async createMesh() {
    // 材质
    this.materialDepth = new THREE.MeshDepthMaterial();
    const materialScene = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // 树模型
    const loader = new OBJLoader();
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.load('/examples/models/obj/tree.obj', (object) => {
      toast.close();
      // @ts-ignore
      object.material = materialScene;
      object.position.set(0, -150, -150);
      object.scale.multiplyScalar(400);

      this.scene.add(object);
    }, undefined, () => { toast.close(); });

    // 球模型
    const geometry = new THREE.SphereGeometry(1, 20, 10);
    this.sphereMesh = new THREE.Mesh(geometry, materialScene);
    this.sphereMesh.scale.multiplyScalar(20);
    this.scene.add(this.sphereMesh);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setClearColor(0xffffff);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.autoClear = false;
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

  private getStepSize(filterLen: number, tapsPerPass: number, pass: number) {
    return filterLen * Math.pow(tapsPerPass, -pass);
  }

  private filterGodRays(inputTex: THREE.Texture, renderTarget: THREE.WebGLRenderTarget, stepSize: number) {
    this.postprocessing.scene.overrideMaterial = this.postprocessing.materialGodraysGenerate;

    this.postprocessing.godrayGenUniforms['fStepSize'].value = stepSize;
    this.postprocessing.godrayGenUniforms['tInput'].value = inputTex;

    this.renderer?.setRenderTarget(renderTarget);
    this.renderer?.render(this.postprocessing.scene, this.postprocessing.camera);
    this.postprocessing.scene.overrideMaterial = null;
  }

  private render() {
    const time = Date.now() / 4000;
    this.sphereMesh.position.x = this.orbitRadius * Math.cos(time);
    this.sphereMesh.position.z = this.orbitRadius * Math.sin(time) - 100;

    if (!this.postprocessing.enabled) {
      this.renderer?.setRenderTarget(null);
      this.renderer?.clear();
      this.renderer?.render(this.scene, this.camera!);
    } else {
      this.clipPosition.set(
        this.sunPosition.x,
        this.sunPosition.y,
        this.sunPosition.z,
        1,
      );
      this.clipPosition.applyMatrix4(this.camera!.matrixWorldInverse ).applyMatrix4(this.camera!.projectionMatrix);

      // perspective divide (produce NDC space)
      this.clipPosition.x /= this.clipPosition.w;
      this.clipPosition.y /= this.clipPosition.w;

      // transform from [-1,1] to [0,1]
      this.screenSpacePosition.x = (this.clipPosition.x + 1) / 2;
      // transform from [-1,1] to [0,1]
      this.screenSpacePosition.y = (this.clipPosition.y + 1) / 2;
      // needs to stay in clip space for visibilty checks
      this.screenSpacePosition.z = this.clipPosition.z; 

      // Give it to the god-ray and sun shaders
      this.postprocessing.godrayGenUniforms['vSunPositionScreenSpace'].value.copy(this.screenSpacePosition);
      this.postprocessing.godraysFakeSunUniforms['vSunPositionScreenSpace'].value.copy(this.screenSpacePosition);

      // -- Draw sky and sun --
      // Clear colors and depths, will clear to sky color
      this.renderer?.setRenderTarget(this.postprocessing.rtTextureColors);
      this.renderer?.clear(true, true, false);

      // Sun render. Runs a shader that gives a brightness based on the screen
      // space distance to the sun. Not very efficient, so i make a scissor
      // rectangle around the suns position to avoid rendering surrounding pixels.
      const sunsqH = 0.74 * this.height; // 0.74 depends on extent of sun from shader
      const sunsqW = 0.74 * this.height; // both depend on height because sun is aspect-corrected

      this.screenSpacePosition.x *= this.width;
      this.screenSpacePosition.y *= this.height;

      this.renderer?.setScissor(
        this.screenSpacePosition.x - sunsqW / 2, 
        this.screenSpacePosition.y - sunsqH / 2, 
        sunsqW, sunsqH,
      );
      this.renderer?.setScissorTest(true);

      this.postprocessing.godraysFakeSunUniforms['fAspect'].value = (this.width / this.height);
      this.postprocessing.scene.overrideMaterial = this.postprocessing.materialGodraysFakeSun;
      this.renderer?.setRenderTarget(this.postprocessing.rtTextureColors);
      this.renderer?.render(this.postprocessing.scene, this.postprocessing.camera);

      this.renderer?.setScissorTest(false);

      // -- Draw scene objects --
      // Colors
      this.scene.overrideMaterial = null;
      this.renderer?.setRenderTarget(this.postprocessing.rtTextureColors);
      this.renderer?.render(this.scene, this.camera!);

      // Depth
      this.scene.overrideMaterial = this.materialDepth;
      this.renderer?.setRenderTarget(this.postprocessing.rtTextureDepth);
      this.renderer?.clear();
      this.renderer?.render(this.scene, this.camera!);

      this.postprocessing.godrayMaskUniforms['tInput'].value = this.postprocessing.rtTextureDepth.texture;
      this.postprocessing.scene.overrideMaterial = this.postprocessing.materialGodraysDepthMask;
      this.renderer?.setRenderTarget(this.postprocessing.rtTextureDepthMask);
      this.renderer?.render(this.postprocessing.scene, this.postprocessing.camera);

      // -- Render god-rays --
      // Maximum length of god-rays (in texture space [0,1]X[0,1])

      const filterLen = 1.0;
      // Samples taken by filter
      const TAPS_PER_PASS = 6.0;

      // Pass order could equivalently be 3,2,1 (instead of 1,2,3), which
      // would start with a small filter support and grow to large. however
      // the large-to-small order produces less objectionable aliasing artifacts that
      // appear as a glimmer along the length of the beams

      // pass 1 - render into first ping-pong target
      this.filterGodRays( 
        this.postprocessing.rtTextureDepthMask.texture, 
        this.postprocessing.rtTextureGodRays2, 
        this.getStepSize(filterLen, TAPS_PER_PASS, 1.0)
      );

      // pass 2 - render into second ping-pong target
      this.filterGodRays(
        this.postprocessing.rtTextureGodRays2.texture, 
        this.postprocessing.rtTextureGodRays1, 
        this.getStepSize(filterLen, TAPS_PER_PASS, 2.0)
      );

      // pass 3 - 1st RT
      this.filterGodRays(
        this.postprocessing.rtTextureGodRays1.texture, 
        this.postprocessing.rtTextureGodRays2, 
        this.getStepSize(filterLen, TAPS_PER_PASS, 3.0)
      );

      // final pass - composite god-rays onto colors
      this.postprocessing.godrayCombineUniforms['tColors'].value = this.postprocessing.rtTextureColors.texture;
      this.postprocessing.godrayCombineUniforms['tGodRays'].value = this.postprocessing.rtTextureGodRays2.texture;
      this.postprocessing.scene.overrideMaterial = this.postprocessing.materialGodraysCombine;

      this.renderer?.setRenderTarget(null);
      this.renderer?.render(this.postprocessing.scene, this.postprocessing.camera);
      this.postprocessing.scene.overrideMaterial = null;
    }
  }

  // 持续动画
  private animate() {
    this.animateNumber && cancelAnimationFrame(this.animateNumber);
    this.animateNumber = requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    // 执行渲染
    if (this.renderer && this.camera) {
      this.render();
    }
  }

  // 消除 副作用
  dispose() {
    cancelAnimationFrame(this.animateNumber);
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

      this.renderer?.setSize(this.width, this.height);
      this.postprocessing.rtTextureColors?.setSize(this.width, this.height);
      this.postprocessing.rtTextureDepth?.setSize(this.width, this.height);
      this.postprocessing.rtTextureDepthMask?.setSize(this.width, this.height);

      const adjustedWidth = this.width * this.renderTargetResolutionMultiplier;
      const adjustedHeight = this.height * this.renderTargetResolutionMultiplier;
      this.postprocessing.rtTextureGodRays1?.setSize(adjustedWidth, adjustedHeight);
      this.postprocessing.rtTextureGodRays2?.setSize(adjustedWidth, adjustedHeight);
    };
  }
}

export default THREE;

