import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.OrthographicCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private proceduralVert: string;
  private noiseRandom1DFrag: string;
  private noiseRandom2DFrag: string;
  private noiseRandom3DFrag: string;
  private postMaterial: THREE.ShaderMaterial
  private noiseRandom1DMaterial: THREE.ShaderMaterial;
  private noiseRandom2DMaterial: THREE.ShaderMaterial;
  private noiseRandom3DMaterial: THREE.ShaderMaterial;
  private postQuad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private params: { 
    procedure: string
  };
  private gui: GUI;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.proceduralVert = `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    this.noiseRandom1DFrag = `
      #include <common>
      varying vec2 vUv;
      void main() {
        gl_FragColor.xyz = vec3( rand( vUv ) );
        gl_FragColor.w = 1.0;
      }
    `;
    this.noiseRandom2DFrag = `
      #include <common>
      varying vec2 vUv;
      void main() {
        vec2 rand2 = vec2( rand( vUv ), rand( vUv + vec2( 0.4, 0.6 ) ) );
        gl_FragColor.xyz = mix( mix( vec3( 1.0, 1.0, 1.0 ), vec3( 0.0, 0.0, 1.0 ), rand2.x ), vec3( 0.0 ), rand2.y );
        gl_FragColor.w = 1.0;
      }
    `;
    this.noiseRandom3DFrag = `
      #include <common>

      varying vec2 vUv;
      void main() {
        vec3 rand3 = vec3( rand( vUv ), rand( vUv + vec2( 0.4, 0.6 ) ), rand( vUv + vec2( 0.6, 0.4 ) ) );
        gl_FragColor.xyz = rand3;
        gl_FragColor.w = 1.0;
      }
    `;

    this.params = {
      procedure: 'noiseRandom3D'
    };

    this.noiseRandom1DMaterial = new THREE.ShaderMaterial({
      vertexShader: this.proceduralVert,
      fragmentShader: this.noiseRandom1DFrag,
    });
    this.noiseRandom2DMaterial = new THREE.ShaderMaterial({
      vertexShader: this.proceduralVert,
      fragmentShader: this.noiseRandom2DFrag,
    });
    this.noiseRandom3DMaterial = new THREE.ShaderMaterial({
      vertexShader: this.proceduralVert,
      fragmentShader: this.noiseRandom3DFrag,
    });
    this.postMaterial = this.noiseRandom3DMaterial;
    this.postQuad = new THREE.Mesh(new THREE.PlaneGeometry( 2, 2), this.postMaterial);
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.add(this.postQuad);

    // 相机
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 渲染器
    this.createRenderer();

    this.setGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setGUI() {
    const values = ['noiseRandom1D', 'noiseRandom2D', 'noiseRandom3D'];
    this.gui.add(this.params, "procedure", values);
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

    switch (this.params.procedure) {
      case 'noiseRandom1D': 
        this.postMaterial = this.noiseRandom1DMaterial; 
        break;
      case 'noiseRandom2D': 
        this.postMaterial = this.noiseRandom2DMaterial; 
        break;
      case 'noiseRandom3D': 
        this.postMaterial = this.noiseRandom3DMaterial; 
        break;
    }

    this.postQuad.material = this.postMaterial;
    // 执行渲染
    this.renderer!.render(this.scene, this.camera!);
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

      this.camera?.updateProjectionMatrix();
      this.renderer?.setSize(this.width, this.height);
    };
  }
}

export default THREE;

