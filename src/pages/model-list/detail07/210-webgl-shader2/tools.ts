import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';

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
  private vertexShader: string;
  private fragment_shader1: string;
  private fragment_shader2: string;
  private fragment_shader3: string;
  private fragment_shader4: string;
  private clock: THREE.Clock
  private uniforms1: {
    'time': { value: number }
  }
  private uniforms2:  {
    'time': { value: number },
    'colorTexture': { value: THREE.Texture }
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

    this.controls = null;
    this.vertexShader = `
      varying vec2 vUv;
			void main() {
				vUv = uv;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;
			}
    `;
    this.fragment_shader1 = `
      uniform float time;
      varying vec2 vUv;
      void main(void) {
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
    this.fragment_shader2 = `
      uniform float time;
      uniform sampler2D colorTexture;
      varying vec2 vUv;
      void main( void ) {
        vec2 position = - 1.0 + 2.0 * vUv;

        float a = atan( position.y, position.x );
        float r = sqrt( dot( position, position ) );

        vec2 uv;
        uv.x = cos( a ) / r;
        uv.y = sin( a ) / r;
        uv /= 10.0;
        uv += time * 0.05;

        vec3 color = texture2D( colorTexture, uv ).rgb;

        gl_FragColor = vec4( color * r * 1.5, 1.0 );

      }
    `;
    this.fragment_shader3 = `
      uniform float time;
      varying vec2 vUv;
      void main( void ) {

        vec2 position = vUv;

        float color = 0.0;
        color += sin( position.x * cos( time / 15.0 ) * 80.0 ) + cos( position.y * cos( time / 15.0 ) * 10.0 );
        color += sin( position.y * sin( time / 10.0 ) * 40.0 ) + cos( position.x * sin( time / 25.0 ) * 40.0 );
        color += sin( position.x * sin( time / 5.0 ) * 10.0 ) + sin( position.y * sin( time / 35.0 ) * 80.0 );
        color *= sin( time / 10.0 ) * 0.5;

        gl_FragColor = vec4( vec3( color, color * 0.5, sin( color + time / 3.0 ) * 0.75 ), 1.0 );

      }
    `;
    this.fragment_shader4 = `
      uniform float time;
      varying vec2 vUv;
      void main( void ) {
        vec2 position = - 1.0 + 2.0 * vUv;

        float red = abs( sin( position.x * position.y + time / 5.0 ) );
        float green = abs( sin( position.x * position.y + time / 4.0 ) );
        float blue = abs( sin( position.x * position.y + time / 3.0 ) );
        gl_FragColor = vec4( red, green, blue, 1.0 );

      }
    `;
    this.clock = new THREE.Clock();
    this.uniforms1 = {
      time: { value: 1.0 }
    };
    this.uniforms2 = {
      time: { value: 1.0 },
      colorTexture: { value: new THREE.Texture }
    }
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 3000);
    this.camera.position.z = 6;

    // model
    this.createModel();

    // 渲染器
    this.createRenderer();
    // 控制器
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

  private createModel() {
    const loader = new THREE.TextureLoader();
    const geometry = new THREE.BoxGeometry(0.75, 0.75, 0.75);

    this.uniforms2.colorTexture.value = loader.load("/examples/textures/disturb.jpg");
    this.uniforms2.colorTexture.value.wrapS = THREE.RepeatWrapping;
    this.uniforms2.colorTexture.value.wrapT = THREE.RepeatWrapping;

    const params: [string, any][] = [
      ['fragment_shader1', this.uniforms1],
      ['fragment_shader2', this.uniforms2],
      ['fragment_shader3', this.uniforms1],
      ['fragment_shader4', this.uniforms1]
    ];

    const getFragmentShader = (key: string) => {
      switch(key) {
        case "fragment_shader1":
          return this.fragment_shader1;
        case "fragment_shader2":
          return this.fragment_shader2;
        case "fragment_shader3":
          return this.fragment_shader3;
        case "fragment_shader4":
          return this.fragment_shader4;
        default:
          return this.fragment_shader1;
      }
    };

    params.forEach((item, i) => {
      const material = new THREE.ShaderMaterial({
        uniforms: item[1],
        vertexShader: this.vertexShader,
        fragmentShader: getFragmentShader(item[0])
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = i - (params.length - 1) / 2;
      mesh.position.y = i % 2 - 0.5;
      this.scene.add(mesh);
    });
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

    const delta = this.clock.getDelta();
    this.uniforms1['time'].value += delta * 5;
    this.uniforms2['time'].value = this.clock.elapsedTime;

    this.scene.children.forEach((object, i) => {
      object.rotation.y += delta * 0.5 * (i % 2 ? 1 : - 1);
      object.rotation.x += delta * 0.5 * (i % 2 ? -1 : 1);
    });

    this.stats?.update();
    this.controls?.update();

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

