import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private raycaster: THREE.Raycaster
  private pointer: THREE.Vector2
  private INTERSECTED: null | number
  private PARTICLE_SIZE: number
  private particles: THREE.Points
  private vertexShader: string
  private fragmentShader: string
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.INTERSECTED = null;
    this.PARTICLE_SIZE = 20;
    this.particles = new THREE.Points();
    this.vertexShader = `
      attribute float size;
      attribute vec3 customColor;
      varying vec3 vColor;
      void main() {
        vColor = customColor;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 300.0 / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    this.fragmentShader = `
      uniform vec3 color;
      uniform sampler2D pointTexture;
      uniform float alphaTest;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4( color * vColor, 1.0 );
        gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
        if ( gl_FragColor.a < alphaTest ) discard;
      }
    `;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(45, this.width/this.height, 1, 10000);
    this.camera.position.z = 250;

    // 创建点
    this.createPoints();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 事件绑定
    this.bind();
    // 性能统计
    this.initStats();
    // 动画
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建点
  private createPoints() {
    let boxGeometry: THREE.BufferGeometry | THREE.BoxGeometry = new THREE.BoxGeometry(
      200, 200, 200, 
      16, 16, 16
    );

    boxGeometry.deleteAttribute('normal');
    boxGeometry.deleteAttribute('uv');
    boxGeometry = BufferGeometryUtils.mergeVertices(boxGeometry);

    const positionAttribute = boxGeometry.getAttribute('position');
    const colors: number[] = [];
    const sizes: number[] = [];
    const color = new THREE.Color();
    for (let i = 0, l = positionAttribute.count; i < l; i++) {
      color.setHSL(0.01 + 0.1 * ( i / l ), 1.0, 0.5);
      color.toArray(colors, i * 3);
      sizes[i] = this.PARTICLE_SIZE * 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff)},
        pointTexture: { 
          value: new THREE.TextureLoader().load('/examples/textures/sprites/disc.png') 
        },
        alphaTest: {  value: 0.9 }
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  // 事件绑定
  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchstart = (event) => {
        const e = event.touches[0];

        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = - ((e.clientY - 45) / this.height) * 2 + 1;
      };
    } else {
      window.ontouchstart = null;
      window.onpointermove = (e) => {
        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = - ((e.clientY - 45) / this.height) * 2 + 1;
      }
    }
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    if (this.camera) {
      // 执行场景旋转
      this.particles.rotation.x += 0.0005/2;
      this.particles.rotation.y += 0.001/2;

      // 获取目标
      const geometry = this.particles.geometry;
      const attributes = geometry.attributes;
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObject(this.particles);
      if (intersects.length > 0) {
        if (this.INTERSECTED != intersects[0].index) {
          // @ts-ignore
          attributes.size.array[this.INTERSECTED] = this.PARTICLE_SIZE;
          this.INTERSECTED = intersects[0].index as number;
          // @ts-ignore
          attributes.size.array[this.INTERSECTED] = this.PARTICLE_SIZE * 1.25;
          attributes.size.needsUpdate = true;
        }
      } else {
        if (this.INTERSECTED !== null) {
          // @ts-ignore
          attributes.size.array[this.INTERSECTED] = this.PARTICLE_SIZE;
					attributes.size.needsUpdate = true;
					this.INTERSECTED = null;
        }
      }
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      // 绑定事件
      this.bind();

      if (this.camera) {
        this.camera.aspect = this.width/this.height;
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

