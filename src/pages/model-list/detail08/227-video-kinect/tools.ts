import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import GUI from 'lil-gui';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private video: HTMLVideoElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private controls: null | OrbitControls;
  private geometry: THREE.BufferGeometry;
  private mesh: THREE.Points;
  private material: THREE.ShaderMaterial;
  private mouse: THREE.Vector3;
  private center: THREE.Vector3;
  private vertexShader: string;
  private fragmentShader: string;
  private gui: GUI;
  constructor(container: HTMLDivElement, video: HTMLVideoElement) {
    this.container = container;
    this.video = video;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.animateNumber = 0;

    this.controls = null;
    this.geometry = new THREE.BufferGeometry();
    this.mesh = new THREE.Points();
    this.material = new THREE.ShaderMaterial();
    this.mouse = new THREE.Vector3(0, 0, 1);
    this.center = new THREE.Vector3(0, 0, -1000);
    this.vertexShader = `
      uniform sampler2D map;

      uniform float width;
      uniform float height;
      uniform float nearClipping, farClipping;

      uniform float pointSize;
      uniform float zOffset;

      varying vec2 vUv;

      const float XtoZ = 1.11146; // tan( 1.0144686 / 2.0 ) * 2.0;
      const float YtoZ = 0.83359; // tan( 0.7898090 / 2.0 ) * 2.0;

      void main() {
        vUv = vec2( position.x / width, position.y / height );
        vec4 color = texture2D( map, vUv );
        float depth = ( color.r + color.g + color.b ) / 3.0;

        // Projection code by @kcmic
        float z = ( 1.0 - depth ) * (farClipping - nearClipping) + nearClipping;
        vec4 pos = vec4(
          ( position.x / width - 0.5 ) * z * XtoZ,
          ( position.y / height - 0.5 ) * z * YtoZ,
          - z + zOffset,
          1.0);

        gl_PointSize = pointSize;
        gl_Position = projectionMatrix * modelViewMatrix * pos;
      }
    `;
    this.fragmentShader = `
      uniform sampler2D map;

      varying vec2 vUv;

      void main() {
        vec4 color = texture2D( map, vUv );
        gl_FragColor = vec4( color.r, color.g, color.b, 0.2 );
      }
    `;
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 10000);
    this.camera.position.set(0, 0, 5000);

    this.createMesh();
    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.bind();
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
    this.gui.add(this.material.uniforms.nearClipping, 'value', 1, 10000, 1.0).name('nearClipping');
    this.gui.add(this.material.uniforms.farClipping, 'value', 1, 10000, 1.0).name('farClipping');
    this.gui.add(this.material.uniforms.pointSize, 'value', 1, 10, 1.0).name('pointSize');
    this.gui.add(this.material.uniforms.zOffset, 'value', 0, 4000, 1.0).name('zOffset');
  }

  private bind() {
    if (this.isMobile()) {
      this.container.onmousemove = null;
      this.container.ontouchstart = (event) => {
        const e = event.touches[0];
        this.mouse.x = (e.clientX - this.width / 2) * 8;
				this.mouse.y = (e.clientY - 45 - this.height / 2) * 8;
      };

      this.container.ontouchmove = (event) => {
        const e = event.touches[0];
        this.mouse.x = (e.clientX - this.width / 2) * 8;
				this.mouse.y = (e.clientY - 45 - this.height / 2) * 8;
      };
    } else {
      this.container.ontouchmove = null;
      this.container.onmousemove = (e) => {
        this.mouse.x = (e.clientX - this.width / 2) * 8;
				this.mouse.y = (e.clientY - 45 - this.height / 2) * 8;
      };
    }
  }

  private createMesh() {
    const texture = new THREE.VideoTexture(this.video);
    texture.minFilter = THREE.NearestFilter;

    const width = 640, height = 480;
    const nearClipping = 850, farClipping = 4000;

    const vertices = new Float32Array( width * height * 3 );
    for ( let i = 0, j = 0; i < vertices.length; i += 3, j++) {
      vertices[i] = j % width;
      vertices[i + 1] = Math.floor(j / width);
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    if(this.material) { this.material.dispose(); }
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        'map': { value: texture },
        'width': { value: width },
        'height': { value: height },
        'nearClipping': { value: nearClipping },
        'farClipping': { value: farClipping },
        'pointSize': { value: 2 },
        'zOffset': { value: 1000 }
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      blending: THREE.AdditiveBlending,
      depthTest: false, depthWrite: false,
      transparent: true
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
    this.video.play();
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


    if (this.camera) {
      this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.05;
      this.camera.position.y += (-this.mouse.y - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.center);
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
    this.container.onmousemove = null;
    this.container.ontouchstart = null;
    this.container.ontouchmove = null;
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.bind();
      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

