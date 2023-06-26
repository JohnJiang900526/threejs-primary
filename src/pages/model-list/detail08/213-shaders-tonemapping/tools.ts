import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { AdaptiveToneMappingPass } from 'three/examples/jsm/postprocessing/AdaptiveToneMappingPass';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';
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
  private bloomPass: BloomPass;
  private adaptToneMappingPass: AdaptiveToneMappingPass;
  private ldrToneMappingPass: AdaptiveToneMappingPass;
  private hdrToneMappingPass: AdaptiveToneMappingPass
  private params: {
    bloomAmount:number,
    sunLight:number,
    enabled: boolean,
    avgLuminance:number,
    middleGrey: number,
    maxLuminance: number,
    adaptionRate: number,
  };
  private dynamicHdrEffectComposer: null | EffectComposer;
  private hdrEffectComposer: null | EffectComposer;
  private ldrEffectComposer: null | EffectComposer;
  private cameraCube: THREE.PerspectiveCamera;
  private sceneCube: THREE.Scene;
  private cameraBG: THREE.OrthographicCamera;
  private debugScene: THREE.Scene;
  private adaptiveLuminanceMat: THREE.ShaderMaterial;
  private currentLuminanceMat: THREE.ShaderMaterial;
  private directionalLight: THREE.DirectionalLight;
  private half: THREE.Vector2;
  private windowThirdX: number;
  private gui: GUI;
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
    this.bloomPass = new BloomPass();
    this.adaptToneMappingPass = new AdaptiveToneMappingPass();
    this.ldrToneMappingPass = new AdaptiveToneMappingPass();
    this.hdrToneMappingPass = new AdaptiveToneMappingPass();
    this.params = {
      bloomAmount: 1.0,
      sunLight: 4.0,
      enabled: true,
      avgLuminance: 0.7,
      middleGrey: 0.04,
      maxLuminance: 16,
      adaptionRate: 2.0,
    };
    this.dynamicHdrEffectComposer = null;
    this.hdrEffectComposer = null;
    this.ldrEffectComposer = null;
    this.cameraCube = new THREE.PerspectiveCamera();
    this.sceneCube = new THREE.Scene();
    this.cameraBG = new THREE.OrthographicCamera();
    this.debugScene = new THREE.Scene();
    this.adaptiveLuminanceMat = new THREE.ShaderMaterial();
    this.currentLuminanceMat = new THREE.ShaderMaterial();
    this.directionalLight = new THREE.DirectionalLight(0xffffff, this.params.sunLight);
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.windowThirdX = this.width/3;
    this.aspect = this.windowThirdX/this.height;
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
  }

  init() {
    const { x, y } = this.half;
    // 场景
    this.scene = new THREE.Scene();
    this.sceneCube = new THREE.Scene();
		this.debugScene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 0.1, 100000);
    this.camera.position.set(700, 400, 800);

    this.cameraCube = new THREE.PerspectiveCamera(70, this.aspect, 1, 100000);

    this.cameraBG = new THREE.OrthographicCamera(-x, x,  y, -y, -10000, 10000);
		this.cameraBG.position.z = 100;

    this.generateLight();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1;

    this.getBackground();
    // 创建mesh
    this.createMesh();
    this.createBGMesh();
    // Composer
    this.initComposer();

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
    const sceneGui = this.gui.addFolder('Scenes');
    const toneMappingGui = this.gui.addFolder('ToneMapping');
    const staticToneMappingGui = this.gui.addFolder('StaticOnly');
    const adaptiveToneMappingGui = this.gui.addFolder('AdaptiveOnly');

    sceneGui.add(this.params, 'bloomAmount', 0.0, 10.0);
    sceneGui.add(this.params, 'sunLight', 0.1, 12.0);

    toneMappingGui.add(this.params, 'enabled');
    toneMappingGui.add(this.params, 'middleGrey', 0, 12);
    toneMappingGui.add(this.params, 'maxLuminance', 1, 30);

    staticToneMappingGui.add(this.params, 'avgLuminance', 0.001, 2.0);
    adaptiveToneMappingGui.add(this.params, 'adaptionRate', 0.0, 10.0);
  }

  private initComposer() {
    const height = this.height || 1;

    const parameters: THREE.WebGLRenderTargetOptions = { 
      minFilter: THREE.LinearFilter, 
      magFilter: THREE.LinearFilter, 
      format: THREE.RGBAFormat,
      type: THREE.FloatType
    };
    const regularRenderTarget = new THREE.WebGLRenderTarget(this.windowThirdX, height, parameters);
    
    this.ldrEffectComposer = new EffectComposer(
      this.renderer as THREE.WebGLRenderer, 
      regularRenderTarget
    );

    if (this.renderer) {
      const isWebGL2 = this.renderer.capabilities.isWebGL2;
      const hasLinear = this.renderer.extensions.has('OES_texture_half_float_linear');
      if (isWebGL2 === false && hasLinear === false) {
        parameters.type = undefined;
      }
    }


    const hdrRenderTarget = new THREE.WebGLRenderTarget(this.windowThirdX, height, parameters);
    // 效果合成器（EffectComposer）
    // 用于在three.js中实现后期处理效果。该类管理了产生最终视觉效果的后期处理过程链。 
    // 后期处理过程根据它们添加/插入的顺序来执行，最后一个过程会被自动渲染到屏幕上。
    this.dynamicHdrEffectComposer = new EffectComposer(this.renderer as THREE.WebGLRenderer, hdrRenderTarget);
    // .setSize ( width : Integer, height : Integer ) : undefined
    // width -- EffectComposer的宽度。
    // height -- EffectComposer的高度。
    this.dynamicHdrEffectComposer.setSize(this.width, height);
    this.hdrEffectComposer = new EffectComposer(this.renderer as THREE.WebGLRenderer, hdrRenderTarget);

    const debugPass = new RenderPass(this.debugScene, this.cameraBG);
    debugPass.clear = false;
    const scenePass = new RenderPass(this.scene, this.camera as THREE.PerspectiveCamera, undefined, undefined, undefined);
    const skyboxPass = new RenderPass(this.sceneCube, this.cameraCube);
    scenePass.clear = false;

    this.adaptToneMappingPass = new AdaptiveToneMappingPass(true, 256);
    this.adaptToneMappingPass.needsSwap = true;
    this.ldrToneMappingPass = new AdaptiveToneMappingPass(false, 256);
    this.hdrToneMappingPass = new AdaptiveToneMappingPass(false, 256);
    this.bloomPass = new BloomPass();
    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);

    // .addPass ( pass : Pass ) : undefined
    // pass -- 将被添加到过程链的过程
    // 将传入的过程添加到过程链。
    this.dynamicHdrEffectComposer.addPass(skyboxPass);
    this.dynamicHdrEffectComposer.addPass(scenePass);
    this.dynamicHdrEffectComposer.addPass(this.adaptToneMappingPass);
    this.dynamicHdrEffectComposer.addPass(this.bloomPass);
    this.dynamicHdrEffectComposer.addPass(gammaCorrectionPass);

    this.hdrEffectComposer.addPass(skyboxPass);
    this.hdrEffectComposer.addPass(scenePass);
    this.hdrEffectComposer.addPass(this.hdrToneMappingPass);
    this.hdrEffectComposer.addPass(this.bloomPass);
    this.hdrEffectComposer.addPass(gammaCorrectionPass);

    this.ldrEffectComposer.addPass(skyboxPass);
    this.ldrEffectComposer.addPass(scenePass);
    this.ldrEffectComposer.addPass(this.ldrToneMappingPass);
    this.ldrEffectComposer.addPass(this.bloomPass);
    this.ldrEffectComposer.addPass(gammaCorrectionPass);
  }

  private getBackground() {
    const path = '/examples/textures/cube/MilkyWay/';
    const urls = [ 
      'dark-s_px.jpg', 'dark-s_nx.jpg',
      'dark-s_py.jpg', 'dark-s_ny.jpg',
      'dark-s_pz.jpg', 'dark-s_nz.jpg',
    ];

    const textureCube = (new THREE.CubeTextureLoader()).setPath(path).load(urls);
    textureCube.encoding = THREE.sRGBEncoding;
    this.sceneCube.background = textureCube;
    return textureCube;
  }

  private createBGMesh() {
    const vBGShader = [
      // "attribute vec2 uv;",
      'varying vec2 vUv;',
      'void main() {',
      'vUv = uv;',
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
      '}'
    ].join('\n');

    const pBGShader = [
      'uniform sampler2D map;',
      'varying vec2 vUv;',
      'void main() {',
      'vec2 sampleUV = vUv;',
      'vec4 color = texture2D( map, sampleUV, 0.0 );',
      'gl_FragColor = vec4( color.xyz, 1.0 );',
      '}'
    ].join('\n');

    // Skybox
    this.adaptiveLuminanceMat = new THREE.ShaderMaterial({
      uniforms: {
        'map': { value: null }
      },
      vertexShader: vBGShader,
      fragmentShader: pBGShader,
      depthTest: false,
      // color: 0xffffff
      blending: THREE.NoBlending
    });

    this.currentLuminanceMat = new THREE.ShaderMaterial({
      uniforms: {
        'map': { value: null }
      },
      vertexShader: vBGShader,
      fragmentShader: pBGShader,
      depthTest: false
      // color: 0xffffff
      // blending: THREE.NoBlending
    });

    {
      const quadBG = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), this.currentLuminanceMat);
      quadBG.position.z = -500;
      quadBG.position.x = -this.width * 0.5 + this.width * 0.05;
      quadBG.scale.set(this.width, this.height, 1);
      this.debugScene.add(quadBG);
    }

    {
      const quadBG = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), this.adaptiveLuminanceMat);
      quadBG.position.z = -500;
      quadBG.position.x = -this.width * 0.5 + this.width * 0.15;
      quadBG.scale.set(this.width, window.innerHeight, 1);
      this.debugScene.add(quadBG);
    }
  }

  private createMesh() {
    const atmoShader = {
      side: THREE.BackSide,
      // blending: THREE.AdditiveBlending,
      transparent: true,
      lights: true,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib['common'],
        THREE.UniformsLib['lights']
      ]),
      vertexShader: [
        'varying vec3 vViewPosition;',
        'varying vec3 vNormal;',
        'void main() {',
        THREE.ShaderChunk['beginnormal_vertex'],
        THREE.ShaderChunk['defaultnormal_vertex'],
        '	vNormal = normalize( transformedNormal );',
        'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
        'vViewPosition = -mvPosition.xyz;',
        'gl_Position = projectionMatrix * mvPosition;',
        '}'
      ].join('\n'),
      fragmentShader: [
        THREE.ShaderChunk['common'],
        THREE.ShaderChunk['bsdfs'],
        THREE.ShaderChunk['lights_pars_begin'],
        THREE.ShaderChunk['normal_pars_fragment'],
        THREE.ShaderChunk['lights_phong_pars_fragment'],
        'void main() {',
        'vec3 normal = normalize( -vNormal );',
        'vec3 viewPosition = normalize( vViewPosition );',
        '#if NUM_DIR_LIGHTS > 0',
        'vec3 dirDiffuse = vec3( 0.0 );',
        'for( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {',
        'vec4 lDirection = viewMatrix * vec4( directionalLights[i].direction, 0.0 );',
        'vec3 dirVector = normalize( lDirection.xyz );',
        'float dotProduct = dot( viewPosition, dirVector );',
        'dotProduct = 1.0 * max( dotProduct, 0.0 ) + (1.0 - max( -dot( normal, dirVector ), 0.0 ));',
        'dotProduct *= dotProduct;',
        'dirDiffuse += max( 0.5 * dotProduct, 0.0 ) * directionalLights[i].color;',
        '}',
        '#endif',
        //Fade out atmosphere at edge
        'float viewDot = abs(dot( normal, viewPosition ));',
        'viewDot = clamp( pow( viewDot + 0.6, 10.0 ), 0.0, 1.0);',
        'vec3 color = vec3( 0.05, 0.09, 0.13 ) * dirDiffuse;',
        'gl_FragColor = vec4( color, viewDot );',
        '}'
      ].join('\n')
    };

    const earthAtmoMat = new THREE.ShaderMaterial(atmoShader);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 200
    });

    const loader = new THREE.TextureLoader();
    loader.load('/examples/textures/planets/earth_atmos_4096.jpg', (tex) => {
      earthMat.map = tex;
      earthMat.map.encoding = THREE.sRGBEncoding;
      earthMat.needsUpdate = true;
    });
    loader.load('/examples/textures/planets/earth_specular_2048.jpg', (tex) => {
      earthMat.specularMap = tex;
      earthMat.specularMap.encoding = THREE.sRGBEncoding;
      earthMat.needsUpdate = true;
    });

    const earthLights = loader.load('/examples/textures/planets/earth_lights_2048.png');
    earthLights.encoding = THREE.sRGBEncoding;

    const earthLightsMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      map: earthLights,
    });

    const clouds = loader.load('/examples/textures/planets/earth_clouds_2048.png');
    clouds.encoding = THREE.sRGBEncoding;

    const earthCloudsMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      blending: THREE.NormalBlending,
      transparent: true,
      depthTest: false,
      map: clouds
    });

    // mesh
    {
      const earthGeo = new THREE.SphereGeometry(600, 24, 24);
      const sphereMesh = new THREE.Mesh(earthGeo, earthMat);
      this.scene.add(sphereMesh);

      const sphereLightsMesh = new THREE.Mesh(earthGeo, earthLightsMat);
      this.scene.add(sphereLightsMesh);

      const sphereCloudsMesh = new THREE.Mesh(earthGeo, earthCloudsMat);
      this.scene.add(sphereCloudsMesh);

      const sphereAtmoMesh = new THREE.Mesh(earthGeo, earthAtmoMat);
      sphereAtmoMesh.scale.set(1.05, 1.05, 1.05);
      this.scene.add(sphereAtmoMesh);
    }
  }

  private generateLight() {
    const ambient = new THREE.AmbientLight(0x050505);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, this.params.sunLight);
    this.directionalLight.position.set(2, 0, 10).normalize();
    this.scene.add(ambient, this.directionalLight);
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

  private render() {
    if (this.bloomPass) {
      // @ts-ignore
      this.bloomPass.combineUniforms['strength'].value = this.params.bloomAmount;
    }

    if (this.adaptToneMappingPass) {
      this.adaptToneMappingPass.setAdaptionRate(this.params.adaptionRate);
      this.adaptiveLuminanceMat.uniforms['map'].value = this.adaptToneMappingPass.luminanceRT;
      this.currentLuminanceMat.uniforms['map'].value = this.adaptToneMappingPass.currentLuminanceRT;

      this.adaptToneMappingPass.enabled = this.params.enabled;
      this.adaptToneMappingPass.setMaxLuminance(this.params.maxLuminance);
      this.adaptToneMappingPass.setMiddleGrey(this.params.middleGrey);

      this.hdrToneMappingPass.enabled = this.params.enabled;
      this.hdrToneMappingPass.setMaxLuminance(this.params.maxLuminance);
      this.hdrToneMappingPass.setMiddleGrey(this.params.middleGrey);
      if (this.hdrToneMappingPass.setAverageLuminance) {
        this.hdrToneMappingPass.setAverageLuminance(this.params.avgLuminance);
      }

      this.ldrToneMappingPass.enabled = this.params.enabled;
      this.ldrToneMappingPass.setMaxLuminance(this.params.maxLuminance);
      this.ldrToneMappingPass.setMiddleGrey(this.params.middleGrey);
      if (this.ldrToneMappingPass.setAverageLuminance) {
        this.ldrToneMappingPass.setAverageLuminance(this.params.avgLuminance);
      }
    }

    this.directionalLight.intensity = this.params.sunLight;
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.controls?.update();
    this.stats?.update();
    this.render();
    
    // 执行渲染
    if (this.renderer && this.camera) {
      this.camera.lookAt(this.scene.position );
      this.cameraCube.rotation.copy(this.camera.rotation);

      this.renderer.setViewport(0, 0, this.windowThirdX, this.height);
      this.ldrEffectComposer?.render(0.017);

      this.renderer.setViewport(this.windowThirdX, 0, this.windowThirdX, this.height);
      this.hdrEffectComposer?.render(0.017);

      this.renderer.setViewport(this.windowThirdX * 2, 0, this.windowThirdX, this.height);
      this.dynamicHdrEffectComposer?.render(0.017);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.half = new THREE.Vector2(this.width/2, this.height/2);
      this.windowThirdX = this.width/3;
      this.aspect = this.windowThirdX/this.height;

      if (this.camera && this.cameraCube) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();

        this.cameraCube.aspect = this.aspect;
        this.cameraCube.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

