import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
  private gui: GUI;
  private sphere: THREE.Mesh;
  private uniforms: {
    amplitude: { value: number },
    color: { value: THREE.Color },
    colorTexture: { value: THREE.Texture },
  };
  private displacement: Float32Array;
  private noise: Float32Array;
  private vertexShader: string;
  private fragmentShader: string;
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
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.gui.hide();
    this.sphere = new THREE.Mesh();
    this.uniforms = {
      amplitude: { value: 1.0, },
      color: { value: new THREE.Color, },
      colorTexture: { value: new THREE.Texture(), }
    };
    this.displacement = new Float32Array(100);
    this.noise = new Float32Array(100);
    this.vertexShader = `
      uniform float amplitude;
      attribute float displacement;

      varying vec3 vNormal;
      varying vec2 vUv;

      void main() {
        vNormal = normal;
        vUv = ( 0.5 + amplitude ) * uv + vec2( amplitude );

        vec3 newPosition = position + amplitude * normal * vec3( displacement );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
      }
    `;
    this.fragmentShader = `
      varying vec3 vNormal;
      varying vec2 vUv;

      uniform vec3 color;
      uniform sampler2D colorTexture;

      void main() {
        vec3 light = vec3( 0.5, 0.2, 1.0 );
        light = normalize( light );
        float dProd = dot( vNormal, light ) * 0.5 + 0.5;

        vec4 tcolor = texture2D( colorTexture, vUv );
        vec4 gray = vec4( vec3( tcolor.r * 0.3 + tcolor.g * 0.59 + tcolor.b * 0.11 ), 1.0 );

        gl_FragColor = gray * vec4( vec3( dProd ) * vec3( color ), 1.0 );
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 10000);
    this.camera.position.z = 300;

    // 创建 模型
    this.generageModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    // 将其设置为true以启用阻尼（惯性），这将给控制器带来重量感。默认值为false
    // 请注意，如果该值被启用，你将必须在你的动画循环里调用.update()
    this.controls.enableDamping = true;
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

  private generageModel() {
    const loader = new THREE.TextureLoader();
    const color = new THREE.Color(0xff2200);
    this.uniforms = {
      // 振幅
      'amplitude': { value: 1.0 },
      // 颜色
      'color': { value: color },
      // 颜色纹理
      'colorTexture': { value: loader.load('/examples/textures/water.jpg') }
    };

    this.uniforms['colorTexture'].value.wrapS = THREE.RepeatWrapping;
    this.uniforms['colorTexture'].value.wrapT = THREE.RepeatWrapping;

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    const radius = 50, segments = 128, rings = 64;
    // 球缓冲几何体（SphereGeometry）
    // SphereGeometry(radius : Float, widthSegments : Integer, heightSegments : Integer, phiStart : Float, phiLength : Float, thetaStart : Float, thetaLength : Float)
    // radius — 球体半径，默认为1。
    // widthSegments — 水平分段数（沿着经线分段），最小值为3，默认值为32。
    // heightSegments — 垂直分段数（沿着纬线分段），最小值为2，默认值为16。
    // phiStart — 指定水平（经线）起始角度，默认值为0。。
    // phiLength — 指定水平（经线）扫描角度的大小，默认值为 Math.PI * 2。
    // thetaStart — 指定垂直（纬线）起始角度，默认值为0。
    // thetaLength — 指定垂直（纬线）扫描角度大小，默认值为 Math.PI。
    const geometry = new THREE.SphereGeometry(radius, segments, rings);

    this.displacement = new Float32Array(geometry.attributes.position.count);
    console.log(geometry);
    this.noise = new Float32Array(geometry.attributes.position.count);

    for (let i = 0; i < this.displacement.length; i++) {
      this.noise[i] = Math.random() * 5;
    }

    // 位移
    const displacementAttr =  new THREE.BufferAttribute(this.displacement, 1);
    geometry.setAttribute('displacement', displacementAttr);

    // 网格 模型
    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);
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

    this.stats?.update();
    this.controls?.update();

    {
      const timer = Date.now() * 0.01;
      this.sphere.rotation.y = 0.01 * timer;
      this.sphere.rotation.z = 0.01 * timer;

      // 振幅
      // 按照固定频率震动
      this.uniforms!['amplitude'].value = 2.5 * Math.sin(this.sphere.rotation.y * 0.125);
      // 根据时间 颜色逐渐发生渐变
      // .offsetHSL ( h : Float, s : Float, l : Float ) : this
      // 将给定的 h, s, 和 l值加到当前颜色值。 
      // 内部的机制为：先将该颜色的 r, g 和 b 值转换为HSL，
      // 然后与传入的h, s, 和 l 相加，最后再将结果转成RGB值
      this.uniforms!['color'].value.offsetHSL(0.0005, 0, 0);

      // 根据时间 位移不断发生变化
      for (let i = 0; i < this.displacement.length; i++) {
        this.displacement[i] = Math.sin(0.1 * i + timer);
        this.noise[i] += 0.5 * (0.5 - Math.random());
        this.noise[i] = THREE.MathUtils.clamp(this.noise[i], -5, 5);
        this.displacement[i] += this.noise[i];
      }
      this.sphere.geometry.attributes.displacement.needsUpdate = true;
    }

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
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

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

