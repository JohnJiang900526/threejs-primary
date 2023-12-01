import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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
  private animateNumber: number;

  private controls: null | OrbitControls;
  private gui: GUI;
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
    this.vertexShader = `
      precision mediump float;
      precision mediump int;

      uniform mat4 modelViewMatrix; // optional
      uniform mat4 projectionMatrix; // optional

      attribute vec3 position;
      attribute vec4 color;

      varying vec3 vPosition;
      varying vec4 vColor;

      void main()	{
        vPosition = position;
        vColor = color;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `;
    this.fragmentShader = `
      precision mediump float;
      precision mediump int;

      uniform float time;

      varying vec3 vPosition;
      varying vec4 vColor;

      void main()	{
        vec4 color = vec4( vColor );
        color.r += sin( vPosition.x * 10.0 + time ) * 0.5;
        gl_FragColor = color;
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101010);

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 1, 10);
    this.camera.position.z = 2;

    // 模型
    this.generateModel();
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

  private generateModel() {
    const count = 200 * 3;
    const geometry = new THREE.BufferGeometry();

    const positions = [];
    const colors = [];

    for (let i = 0; i < count; i++) {
      // 位置
      positions.push(Math.random() - 0.5);
      positions.push(Math.random() - 0.5);
      positions.push(Math.random() - 0.5);

      // 颜色 r,g,b,a
      colors.push(Math.random() * 255);
      colors.push(Math.random() * 255);
      colors.push(Math.random() * 255);
      colors.push(Math.random() * 255);
    }

    const positionAttr = new THREE.Float32BufferAttribute(positions, 3);
    const colorAttr = new THREE.Uint8BufferAttribute(colors, 4);

    // 在着色器中将缓冲值映射为0.0f - +1.0f
    colorAttr.normalized = true;

    geometry.setAttribute('position', positionAttr);
    geometry.setAttribute('color', colorAttr);

    const material = new THREE.RawShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        time: { value: 1.0 }
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "target";
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
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    {
      const time = performance.now();
      const obj = this.scene.getObjectByName("target");

      if (obj && obj instanceof THREE.Mesh) {
        obj.rotation.y = time * 0.0005;
        obj.material.uniforms.time.value = time * 0.005;
      }
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

