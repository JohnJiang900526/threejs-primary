import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private stats: null | Stats;

  private fragment_shader_screen: string;
  private fragment_shader_pass_1: string;
  private vertexShader: string;
  private cameraRTT: null | THREE.OrthographicCamera;
  private sceneRTT: THREE.Scene;
  private sceneScreen: THREE.Scene;
  private zmesh1: THREE.Mesh;
  private zmesh2: THREE.Mesh;
  private mouse: THREE.Vector2;
  private half: THREE.Vector2;
  private rtTexture: THREE.WebGLRenderTarget;
  private material: THREE.ShaderMaterial;
  private quad: THREE.Mesh;
  private delta: number;
  private getRPG?: (r: number, b: number, g: number) => void
  constructor(container: HTMLDivElement, getRPG?: (r: number, b: number, g: number) => void) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = new THREE.PerspectiveCamera();
    this.stats = null;

    this.fragment_shader_screen = `
      varying vec2 vUv;
			uniform sampler2D tDiffuse;
			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );
			}
    `;
    this.fragment_shader_pass_1 = `
      varying vec2 vUv;
			uniform float time;
			void main() {
				float r = vUv.x;
				if( vUv.y < 0.5 ) r = 0.0;
				float g = vUv.y;
				if( vUv.x < 0.5 ) g = 0.0;
				gl_FragColor = vec4( r, g, time, 1.0 );
			}
    `;
    this.vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `;
    this.cameraRTT = null;
    this.sceneRTT = new THREE.Scene();
    this.sceneScreen = new THREE.Scene();
    this.zmesh1 = new THREE.Mesh();
    this.zmesh2 = new THREE.Mesh();
    this.mouse = new THREE.Vector2(0, 0);
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.rtTexture = new THREE.WebGLRenderTarget(this.width, this.height);
    this.material = new THREE.ShaderMaterial();
    this.quad = new THREE.Mesh();
    this.delta = 0.01;
    this.getRPG = getRPG;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.sceneRTT = new THREE.Scene();
		this.sceneScreen = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(30, this.aspect, 1, 10000);
    this.camera.position.z = 100;

    this.cameraRTT = new THREE.OrthographicCamera(
      this.width / -2, this.width / 2, 
      this.height / 2, this.height / -2, 
      -10000, 10000
    );
    this.cameraRTT.position.z = 100;

    // light
    this.generateLight();
    // model
    this.createModel();

    // 渲染器
    this.createRenderer();

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
    window.onclick = (e) => {
      const x = (e.clientX - this.half.x);
      const y = (e.clientY - 45 - this.half.y);
      this.mouse.set(x, y);
    };

    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];

        const x = (e.clientX - this.half.x);
				const y = (e.clientY - 45 - this.half.y);
        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        const x = (e.clientX - this.half.x);
				const y = (e.clientY - 45 - this.half.y);
        this.mouse.set(x, y);
      };
    }
  }

  private createModel() {
    this.rtTexture = new THREE.WebGLRenderTarget(this.width, this.height);

    this.material = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0.0 } },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragment_shader_pass_1
    });

    const materialScreen = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: this.rtTexture.texture } },
      vertexShader:this.vertexShader,
      fragmentShader: this.fragment_shader_screen,
      depthWrite: false
    });
    const plane = new THREE.PlaneGeometry(this.width, this.height);
    this.quad = new THREE.Mesh(plane, this.material);
    this.quad.position.z = -100;
    this.sceneRTT.add(this.quad);

    const torusGeometry = new THREE.TorusGeometry(100, 25, 15, 30);
    const mat1 = new THREE.MeshPhongMaterial({ 
      color: 0x555555, 
      specular: 0xffaa00, 
      shininess: 5 
    });
    const mat2 = new THREE.MeshPhongMaterial({ 
      color: 0x550000, 
      specular: 0xff2200, 
      shininess: 5 
    });

    this.zmesh1 = new THREE.Mesh(torusGeometry, mat1);
    this.zmesh1.position.set(0, 0, 100);
    this.zmesh1.scale.set(1.5, 1.5, 1.5);
    this.sceneRTT.add(this.zmesh1);

    this.zmesh2 = new THREE.Mesh(torusGeometry, mat2);
    this.zmesh2.position.set(0, 150, 100);
    this.zmesh2.scale.set(0.75, 0.75, 0.75);
    this.sceneRTT.add(this.zmesh2);

    this.quad = new THREE.Mesh(plane, materialScreen);
    this.quad.position.z = -100;
    this.sceneScreen.add(this.quad);
  }

  private generateLight() {
    {
      const light = new THREE.DirectionalLight(0xffffff);
      light.position.set(0, 0, 1).normalize();
      this.sceneRTT.add(light);
    }

    {
      const light = new THREE.DirectionalLight(0xffaaaa, 1.5);
      light.position.set(0, 0, -1).normalize();
      this.sceneRTT.add(light);
    }
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
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

  private render() {
    const time = Date.now() * 0.0015;
    this.zmesh1.rotation.y = -time;
    this.zmesh2.rotation.y = -time + Math.PI / 2;

    if (this.material.uniforms['time'].value > 1 || this.material.uniforms['time'].value < 0) {
      this.delta *= -1;
    }
    this.material.uniforms['time'].value += this.delta;
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.render();
    this.stats?.update();
    
    // 执行渲染
    if (this.renderer && this.camera && this.cameraRTT && this.rtTexture) {
      this.renderer.clear();

      // Render first scene into texture
      this.renderer.setRenderTarget(this.rtTexture);
      this.renderer.clear();
      this.renderer.render(this.sceneRTT, this.cameraRTT);

      // Render full screen quad with generated texture
      this.renderer.setRenderTarget(null);
      this.renderer.clear();
      this.renderer.render(this.sceneScreen, this.cameraRTT);

      // 默认渲染
      this.renderer.render(this.scene, this.camera);

      const read = new Uint8Array(4);
			this.renderer.readRenderTargetPixels( 
        this.rtTexture, 
        this.half.x + this.mouse.x, 
        this.half.y - this.mouse.y, 
        1, 1, read
      );
      this.getRPG && this.getRPG(read[0], read[1], read[2]);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;
      this.half = new THREE.Vector2(this.width/2, this.height/2);

      this.bind();
      if (this.camera) {
        this.camera.aspect = this.aspect;
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

