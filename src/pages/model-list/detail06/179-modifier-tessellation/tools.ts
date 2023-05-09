import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | TrackballControls;
  private mesh: THREE.Mesh;
  private uniforms: {
    amplitude: { value: number }
  };
  private vertexShader: string
  private fragmentShader: string
  private geometry: TextGeometry | null;
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
    this.mesh = new THREE.Mesh();
    this.uniforms = {
      amplitude: { value: 0.0 }
    };
    this.vertexShader = `
      uniform float amplitude;
      attribute vec3 customColor;
      attribute vec3 displacement;
      varying vec3 vNormal;
      varying vec3 vColor;
      void main() {
        vNormal = normal;
        vColor = customColor;
        vec3 newPosition = position + normal * amplitude * displacement;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
      }
    `;
    this.fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vColor;
      void main() {
        const float ambient = 0.4;
        vec3 light = vec3( 1.0 );
        light = normalize( light );
        float directional = max( dot( vNormal, light ), 0.0 );
        gl_FragColor = vec4( ( directional + ambient ) * vColor, 1.0 );
      }
    `;
    this.geometry = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 10000);
    this.camera.position.set(0, 0, 400);

    this.loadFont(() => {
      this.generateMesh();
    });

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new TrackballControls(this.camera, this.renderer?.domElement);

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateMesh() {
    const {vertexShader, fragmentShader} = this;
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
    });

    this.mesh = new THREE.Mesh(this.geometry as TextGeometry , material);
    this.scene.add(this.mesh);
  }

  private loadFont(fn?: () => void) {
    const loader = new FontLoader();
    const url = "/examples/fonts/helvetiker_bold.typeface.json";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (font) => {
      toast.close();
      this.generateGeometry(font);
      fn && fn();
    }, undefined, () => { toast.close(); })
  }

  private generateGeometry(font: Font) {
    this.geometry = new TextGeometry('THREE.JS', {
      // font — THREE.Font的实例
      font: font,
      // size — Float。字体大小，默认值为100
      size: 40,
      // height — Float。挤出文本的厚度。默认值为50
      height: 5,
      // curveSegments — Integer。（表示文本的）曲线上点的数量。默认值为12
      curveSegments: 3,
      // bevelThickness — Float。文本上斜角的深度，默认值为20
      bevelThickness: 2,
      // bevelSize — Float。斜角与原始文本轮廓之间的延伸距离。默认值为8
      bevelSize: 1,
      // bevelEnabled — Boolean。是否开启斜角，默认为false
      bevelEnabled: true,
    });

    this.geometry.center();

    const tessellateModifier = new TessellateModifier(8, 6);
    this.geometry = tessellateModifier.modify(this.geometry);

    const num = this.geometry.attributes.position.count / 3;
    const colors = new Float32Array(num * 3 * 3);
    const displacement = new Float32Array(num * 3 * 3);
    const color = new THREE.Color();

    for (let f = 0; f < num; f++) {
      const index = 9 * f;
      color.setHSL(
        0.2 * Math.random(), 
        0.5 + 0.5 * Math.random(), 
        0.5 + 0.5 * Math.random(),
      );

      const d = 10 * (0.5 - Math.random());
      for (let i = 0; i < 3; i++) {
        colors[index + (3 * i)] = color.r;
        colors[index + (3 * i) + 1] = color.g;
        colors[index + (3 * i) + 2] = color.b;

        displacement[index + (3 * i)] = d;
        displacement[index + (3 * i) + 1] = d;
        displacement[index + (3 * i) + 2] = d;
      }
    }

    this.geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('displacement', new THREE.BufferAttribute(displacement, 3));
    return this.geometry;
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

    const time = Date.now() * 0.001;
    this.uniforms.amplitude.value = 1.0 + Math.sin(time * 0.5);
    this.mesh.rotation.y += 0.005;

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

