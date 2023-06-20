import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.OrthographicCamera;
  private stats: null | Stats;

  private vertexShader: string;
  private fragmentShader: string;
  private uniforms: {
    time: {
      value: number
    }
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

    this.vertexShader = `
      varying vec2 vUv;
      void main()	{
        vUv = uv;
        gl_Position = vec4( position, 1.0 );
      }
    `;
    this.fragmentShader = `
      varying vec2 vUv;
      uniform float time;
      void main()	{
        vec2 p = - 1.0 + 2.0 * vUv;
        float a = time * 40.0;
        float d, e, f, g = 1.0 / 40.0 ,h ,i ,r ,q;

        e = 400.0 * ( p.x * 0.5 + 0.5 );
        f = 400.0 * ( p.y * 0.5 + 0.5 );
        i = 200.0 + sin( e * g + a / 150.0 ) * 20.0;
        d = 200.0 + cos( f * g / 2.0 ) * 18.0 + cos( e * g ) * 7.0;
        r = sqrt( pow( abs( i - e ), 2.0 ) + pow( abs( d - f ), 2.0 ) );
        q = f / r;
        e = ( r * cos( q ) ) - a / 2.0;
        f = ( r * sin( q ) ) - a / 2.0;
        d = sin( e * g ) * 176.0 + sin( e * g ) * 164.0 + r;
        h = ( ( f + d ) + a / 2.0 ) * g;
        i = cos( h + r * p.x / 1.3 ) * ( e + e + a ) + cos( q * g * 6.0 ) * ( r + h / 3.0 );
        h = sin( f * g ) * 144.0 - sin( e * g ) * 212.0 * p.x;
        h = ( h + ( f - e ) * q + sin( r - ( a + h ) / 7.0 ) * 10.0 + i / 4.0 ) * g;
        i += cos( h * 2.3 * sin( a / 350.0 - q ) ) * 184.0 * sin( q - ( r * 4.3 + a / 12.0 ) * g ) + tan( r * g + h ) * 184.0 * cos( r * g + h );
        i = mod( i / 5.6, 256.0 ) / 64.0;
        if ( i < 0.0 ) i += 4.0;
        if ( i >= 2.0 ) i = 4.0 - i;
        d = r / 350.0;
        d += sin( d * d * 8.0 ) * 0.52;
        f = ( sin( a * g ) + 1.0 ) / 2.0;
        gl_FragColor = vec4( vec3( f * i / 1.6, i / 2.0 + d / 13.0, i ) * d * p.x + vec3( i / 1.3 + d / 8.0, i / 2.0 + d / 18.0, i ) * d * ( 1.0 - p.x ), 1.0 );
      }
    `;
    this.uniforms = {
      time: { value: 1.0 }
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // 创建模型
    this.createModel();
    // 渲染器
    this.createRenderer();

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
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
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
    window.requestAnimationFrame(() => { this.animate(); });

    this.uniforms.time.value = (performance.now() / 1000);
    this.stats?.update();
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
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

