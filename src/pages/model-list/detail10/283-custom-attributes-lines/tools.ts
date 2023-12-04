import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

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
  private line: THREE.Line;
  private uniforms: {
    amplitude: { value:number },
    opacity: { value: number },
    color: { value: THREE.Color },
  }
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
    this.line = new THREE.Line();
    this.uniforms = {
      // 振幅
      amplitude: { value: 5.0 },
      // 透明度
      opacity: { value: 0.3 },
      // 颜色
      color: { value: new THREE.Color(0xffffff) }
    };
    this.vertexShader = `
      uniform float amplitude;

      attribute vec3 displacement;
      attribute vec3 customColor;

      varying vec3 vColor;
      void main() {
        vec3 newPosition = position + amplitude * displacement;
        vColor = customColor;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
      }
    `;
    this.fragmentShader = `
      uniform vec3 color;
      uniform float opacity;

      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4( vColor * color, opacity );
      }
    `;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 10000);
    this.camera.position.z = 400;

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    // 创建模型
    this.generateModel().then(() => {
      this.initStats();
      this.animate();
      this.resize();
    });
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private async generateModel() {
    const loader = new FontLoader();
    const shaderMaterial = new THREE.ShaderMaterial({
      // 是否在渲染此材质时启用深度测试。默认为 true。
      depthTest: false,
      // 透明度
      transparent: true,
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      // 在使用此材质显示对象时要使用何种混合。
      // 必须将其设置为CustomBlending才能使用自定义blendSrc, blendDst 或者 [page:Constant blendEquation]。 
      // 混合模式所有可能的取值请参阅constants。默认值为NormalBlending
      blending: THREE.AdditiveBlending,
    });

    const font = await loader.loadAsync("/examples/fonts/helvetiker_bold.typeface.json");
    const geometry = new TextGeometry('three.js', {
      // font — THREE.Font的实例。
      font: font,
      // size — Float。字体大小，默认值为100。
      size: 50,
      // height — Float。挤出文本的厚度。默认值为50。
      height: 15,
      // curveSegments — Integer。（表示文本的）曲线上点的数量。默认值为12。
      curveSegments: 10,
      // bevelThickness — Float。文本上斜角的深度，默认值为20。
      bevelThickness: 5,
      // bevelSize — Float。斜角与原始文本轮廓之间的延伸距离。默认值为8。
      bevelSize: 1.5,
      // bevelEnabled — Boolean。是否开启斜角，默认为false。
      bevelEnabled: true,
      // bevelSegments — Integer。斜角的分段数。默认值为3
      bevelSegments: 10,
    });
    geometry.center();

    const count = geometry.attributes.position.count;
    // 位移量
    const displacement = new THREE.Float32BufferAttribute(count * 3, 3);
    geometry.setAttribute('displacement', displacement);

    // 自定义颜色
    const customColor = new THREE.Float32BufferAttribute(count * 3, 3);
    geometry.setAttribute('customColor', customColor);

    const color = new THREE.Color(0xffffff);
    for (let i = 0, l = customColor.count; i < l; i++) {
      color.setHSL(i / l, 0.5, 0.5);
      color.toArray(customColor.array, i * customColor.itemSize);
    }

    this.line = new THREE.Line(geometry, shaderMaterial);
    this.line.rotation.x = 0.2;
    this.scene.add(this.line);
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
      const timer = Date.now() * 0.001;
      this.line.rotation.y = 0.25 * timer;

      // 振幅
      this.uniforms.amplitude.value = Math.sin(0.5 * timer);
      // 颜色
      this.uniforms.color.value.offsetHSL(0.0005, 0, 0);
      // 位移量 随着时间进行更新
      const displacement = this.line.geometry.attributes.displacement as THREE.BufferAttribute;
      const array = displacement.array as Float32Array;
      for (let i = 0; i < array.length; i += 3) {
        array[i + 0] += 0.3 * (0.5 - Math.random());
        array[i + 1] += 0.3 * (0.5 - Math.random());
        array[i + 2] += 0.3 * (0.5 - Math.random());
      }
      this.line.geometry.attributes.displacement.needsUpdate = true;
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

