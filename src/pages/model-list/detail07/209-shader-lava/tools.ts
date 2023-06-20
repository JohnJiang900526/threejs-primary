import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private composer: null | EffectComposer
  private clock: THREE.Clock
  private mesh: THREE.Mesh
  private vertexShader: string;
  private fragmentShader: string;
  private uniforms: {
    'fogDensity': { value: number },
    'fogColor': { value: THREE.Vector3 },
    'time': { value: number},
    'uvScale': { value: THREE.Vector2 },
    'texture1': { value: THREE.Texture },
    'texture2': { value: THREE.Texture }
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

    this.composer = null;
    this.clock = new THREE.Clock();
    this.mesh = new THREE.Mesh();
    this.vertexShader = `
      uniform vec2 uvScale;
      varying vec2 vUv;

      void main()
      {
        vUv = uvScale * uv;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    this.fragmentShader = `
      uniform float time;

      uniform float fogDensity;
      uniform vec3 fogColor;

      uniform sampler2D texture1;
      uniform sampler2D texture2;

      varying vec2 vUv;

      void main( void ) {

        vec2 position = - 1.0 + 2.0 * vUv;

        vec4 noise = texture2D( texture1, vUv );
        vec2 T1 = vUv + vec2( 1.5, - 1.5 ) * time * 0.02;
        vec2 T2 = vUv + vec2( - 0.5, 2.0 ) * time * 0.01;

        T1.x += noise.x * 2.0;
        T1.y += noise.y * 2.0;
        T2.x -= noise.y * 0.2;
        T2.y += noise.z * 0.2;

        float p = texture2D( texture1, T1 * 2.0 ).a;

        vec4 color = texture2D( texture2, T2 * 2.0 );
        vec4 temp = color * ( vec4( p, p, p, p ) * 2.0 ) + ( color * color - 0.1 );

        if( temp.r > 1.0 ) { temp.bg += clamp( temp.r - 2.0, 0.0, 100.0 ); }
        if( temp.g > 1.0 ) { temp.rb += temp.g - 1.0; }
        if( temp.b > 1.0 ) { temp.rg += temp.b - 1.0; }

        gl_FragColor = temp;

        float depth = gl_FragCoord.z / gl_FragCoord.w;
        const float LOG2 = 1.442695;
        float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );
        fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );

        gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );
      }
    `;
    this.uniforms = {
      'fogDensity': { value: 0.45 },
      'fogColor': { value: new THREE.Vector3( 0, 0, 0 ) },
      'time': { value: 1.0 },
      'uvScale': { value: new THREE.Vector2( 3.0, 1.0 ) },
      'texture1': { value: new THREE.Texture() },
      'texture2': { value: new THREE.Texture() }
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 10000);
    this.camera.position.z = 4;

    // 创建模型
    this.createModel();
    // 渲染器
    this.createRenderer();
    this.createComposer();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createModel() {
    const loader = new THREE.TextureLoader();

    this.uniforms.texture1.value = loader.load("/examples/textures/lava/cloud.png");
    this.uniforms.texture2.value = loader.load("/examples/textures/lava/lavatile.jpg");

    this.uniforms['texture1'].value.wrapS = THREE.RepeatWrapping;
    this.uniforms['texture1'].value.wrapT = THREE.RepeatWrapping;

    this.uniforms['texture2'].value.wrapS = THREE.RepeatWrapping;
    this.uniforms['texture2'].value.wrapT = THREE.RepeatWrapping;

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    });

    this.mesh = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.3, 30, 30), material);
    this.mesh.rotation.x = 0.3;
    this.scene.add(this.mesh);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.autoClear = false;
    this.container.appendChild(this.renderer.domElement);
  }

  private createComposer() {
    const renderModel = new RenderPass(this.scene, this.camera as THREE.PerspectiveCamera);
    const effectBloom = new BloomPass( 1.25 );
    const effectFilm = new FilmPass(0.35, 0.95, 2048, 0);

    this.composer = new EffectComposer(this.renderer as THREE.WebGLRenderer);
    this.composer.addPass(renderModel);
    this.composer.addPass(effectBloom);
    this.composer.addPass(effectFilm);
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

    const delta = 5 * this.clock.getDelta();
    this.uniforms['time'].value += 0.2 * delta;

    this.mesh.rotation.y += 0.0125 * delta;
    this.mesh.rotation.x += 0.05 * delta;

    this.stats?.update();
    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    this.renderer?.clear();
    this.composer?.render(0.01);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      if (this.camera) {
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.composer?.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

