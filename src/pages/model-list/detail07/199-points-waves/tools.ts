import * as THREE from 'three';
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

  private readonly SEPARATION: number
  private readonly AMOUNTX: number
  private readonly AMOUNTY: number
  private particles: THREE.Points
  private count: number
  private mouse: THREE.Vector2
  private half: THREE.Vector2
  private vertexShader: string
  private fragmentShader: string
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.mouse = new THREE.Vector2();
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.SEPARATION = 100;
    this.AMOUNTX = 50;
    this.AMOUNTY = 50;
    this.particles = new THREE.Points();
    this.count = 0;
    this.vertexShader = `
      attribute float scale;
			void main() {
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_PointSize = scale * ( 300.0 / - mvPosition.z );
				gl_Position = projectionMatrix * mvPosition;
			}
    `;
    this.fragmentShader = `
      uniform vec3 color;
      void main() {
        if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;
        gl_FragColor = vec4( color, 1.0 );
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 1, 10000);
    this.camera.position.z = 1000;

    // 创建点
    this.createPoints();
    
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
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];

        const x = e.clientX - this.half.x;
				const y = e.clientY - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        if (e.isPrimary) {return;  }

        const x = e.clientX - this.half.x;
				const y = e.clientY - 45 - this.half.y;

        this.mouse.set(x, y);
      };
    }
  }

  // 核心算法
  private createPoints() {
    const num = this.AMOUNTX * this.AMOUNTY;
    const positions = new Float32Array(num * 3);
    const scales = new Float32Array(num);
    let i = 0, j = 0;
    
    for (let ix = 0; ix < this.AMOUNTX; ix++) {
      for (let iy = 0; iy < this.AMOUNTY; iy++) {
        positions[i] = ix * this.SEPARATION - ((this.AMOUNTX * this.SEPARATION) / 2);
        positions[i + 1] = 0;
        positions[i + 2] = iy * this.SEPARATION - ((this.AMOUNTY * this.SEPARATION) / 2);
        scales[j] = 1;
        i += 3;
        j ++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
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

  // 核心算法
  private render() {
    if (this.camera) {
      this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.05;
      this.camera.position.y += (-this.mouse.y - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.scene.position);

      const position = this.particles.geometry.attributes.position as THREE.BufferAttribute;
      const scale = this.particles.geometry.attributes.scale as THREE.BufferAttribute;
      const positions = position.array;
			const scales = scale.array;

      let i = 0, j = 0;
      for (let ix = 0; ix < this.AMOUNTX; ix ++) {
        for (let iy = 0; iy < this.AMOUNTY; iy ++) {
          // @ts-ignore
          positions[i + 1] = (Math.sin((ix + this.count) * 0.3) * 50) +  (Math.sin((iy + this.count) * 0.5) * 50);
          // @ts-ignore
          scales[j] = (Math.sin((ix + this.count) * 0.3) + 1) * 20 +  (Math.sin((iy + this.count) * 0.5) + 1) * 20;
          i += 3;
          j ++;
        }
      }

      position.needsUpdate = true;
			scale.needsUpdate = true;
      this.count += 0.1/2;
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.render();
    
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

