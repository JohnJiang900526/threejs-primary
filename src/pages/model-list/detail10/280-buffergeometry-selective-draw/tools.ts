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
  private geometry: THREE.BufferGeometry;
  private mesh: null | THREE.LineSegments;
  private readonly lat: number;
  private readonly lng: number;
  private numLinesCulled: number;
  private readonly vertexShader: string;
  private readonly fragmentShader: string;
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
    this.geometry = new THREE.BufferGeometry();
    this.mesh = null;
    this.lat = 100;
    this.lng = 200;
    this.numLinesCulled = 0;
    this.vertexShader = `
      attribute float visible;
      varying float vVisible;
      attribute vec3 vertColor;
      varying vec3 vColor;

      void main() {
        vColor = vertColor;
        vVisible = visible;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `;
    this.fragmentShader = `
      varying float vVisible;
      varying vec3 vColor;

      void main() {
        if ( vVisible > 0.0 ) {
          gl_FragColor = vec4( vColor, 1.0 );
        } else {
          discard;
        }
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 0.01, 10);
    this.camera.position.z = 3.5;

    // 添加线条
    this.addLines(1.0);
    // 灯光
    this.generateLight();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

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
    const params = {
      hideLines: () => {
        this.hideLines();
      },
      showAllLines: () => {
        this.showAllLines();
      },
    };

    this.gui.add(params, "hideLines").name("隐藏部分线");
    this.gui.add(params, "showAllLines").name("显示所有线");
  }

  private generateLight() {
    const light = new THREE.AmbientLight(0x444444);
    this.scene.add(light);
  }

  // 添加线条 核心逻辑
  private addLines(radius: number) {
    const product = this.lat * this.lng;

    const positions = new Float32Array(product * 3 * 2);
    const colors = new Float32Array(product * 3 * 2);
    const visibles = new Float32Array(product * 2);

    for (let i = 0; i < this.lat; i++) {
      for (let j = 0; j < this.lng; j++) {
        const lat = (Math.random() * Math.PI) / 50.0 + i / this.lat * Math.PI;
        const lng = (Math.random() * Math.PI) / 50.0 + j / this.lng * 2 * Math.PI;
        const index = i * this.lng + j;

        // 位置
        positions[index * 6 + 0] = 0;
        positions[index * 6 + 1] = 0;
        positions[index * 6 + 2] = 0;
        positions[index * 6 + 3] = radius * Math.sin(lat) * Math.cos(lng);
        positions[index * 6 + 4] = radius * Math.cos(lat);
        positions[index * 6 + 5] = radius * Math.sin(lat) * Math.sin(lng);

        // 颜色
        const color = new THREE.Color(0xffffff);
        color.setHSL(lat / Math.PI, 1.0, 0.2);
        colors[index * 6 + 0] = color.r;
        colors[index * 6 + 1] = color.g;
        colors[index * 6 + 2] = color.b;

        color.setHSL(lat / Math.PI, 1.0, 0.7);
        colors[index * 6 + 3] = color.r;
        colors[index * 6 + 4] = color.g;
        colors[index * 6 + 5] = color.b;

        // 可见属性
        visibles[index * 2 + 0] = 1.0;
        visibles[index * 2 + 1] = 1.0;
      }
    }

    const positionAttr = new THREE.BufferAttribute(positions, 3);
    this.geometry.setAttribute('position', positionAttr);

    const vertColorAttr = new THREE.BufferAttribute(colors, 3);
    this.geometry.setAttribute('vertColor', vertColorAttr);

    const visibleAttr = new THREE.BufferAttribute(visibles, 1);
    this.geometry.setAttribute('visible', visibleAttr);
    // 计算球形边界
    this.geometry.computeBoundingSphere();

    const material = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });
    this.mesh = new THREE.LineSegments(this.geometry, material);
    this.scene.add(this.mesh);
  }

  // 隐藏线条
  private hideLines() {
    const visible = this.geometry.getAttribute("visible") as THREE.BufferAttribute;
    const array = visible.array;

    for (let i = 0; i < array.length; i += 2) {
      if (Math.random() > 0.25) {
        if (array[i + 0]) { this.numLinesCulled++; }
        // @ts-ignore
        array[i + 0] = 0;
        // @ts-ignore
        array[i + 1] = 0;
      }
    }
    this.geometry.attributes.visible.needsUpdate = true;
  }

  // 显示所有的线
  private showAllLines() {
    this.numLinesCulled = 0;

    const visible = this.geometry.getAttribute("visible") as THREE.BufferAttribute;
    const array = visible.array;
    
    for (let i = 0; i < array.length; i += 2) {
      // @ts-ignore
      array[i + 0] = 1;
      // @ts-ignore
      array[i + 1] = 1;
    }
    this.geometry.attributes.visible.needsUpdate = true;
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
      const time = Date.now() * 0.001;
      if (this.mesh) {
        this.mesh.rotation.x = time * 0.25;
        this.mesh.rotation.y = time * 0.5;
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

