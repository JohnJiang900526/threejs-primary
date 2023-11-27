import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

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
  private bloomComposer: null | EffectComposer;
  private finalComposer: null | EffectComposer;
  private bloomPass: null | UnrealBloomPass;
  private ENTIRE_SCENE: number;
  private BLOOM_SCENE: number;
  private bloomLayer: THREE.Layers;
  private params: {
    exposure: number;
    bloomStrength: number;
    bloomThreshold: number;
    bloomRadius: number;
    scene: string;
  }
  private darkMaterial: THREE.MeshBasicMaterial;
  private materials: {
    [key: string]: any;
  }
  private vertexShader: string;
  private fragmentShader: string;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private gui: GUI;
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
    this.bloomComposer = null;
    this.finalComposer = null;
    this.bloomPass = null;
    this.ENTIRE_SCENE = 0;
    this.BLOOM_SCENE = 1;
    this.bloomLayer = new THREE.Layers();
    this.bloomLayer.set(this.BLOOM_SCENE);
    this.params = {
      exposure: 1,
      bloomStrength: 5,
      bloomThreshold: 0,
      bloomRadius: 0,
      scene: 'Scene with Glow'
    };
    this.darkMaterial = new THREE.MeshBasicMaterial({color: "black"});
    this.materials = {};
    this.vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `;
    this.fragmentShader = `
      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;
      varying vec2 vUv;
      void main() {
        gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
      }
    `;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 1, 200);
    this.camera.position.set(0, 0, 20);
    this.camera.lookAt(0, 0, 0);

    // light
    this.generateLight();
    // 模型
    this.generateMesh();
    // 渲染器
    this.createRenderer();
    // 效果合成器
    this.initComposer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.maxPolarAngle = Math.PI * 0.5;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 100;
    this.controls.update();

    this.bind();
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
    const sceneValues = ['Scene with Glow', 'Glow only', 'Scene only']
    this.gui.add(this.params, 'scene', sceneValues).onChange((value: string) =>  {
      switch ( value ) 	{
        case 'Scene with Glow':
          this.bloomComposer!.renderToScreen = false;
          break;
        case 'Glow only':
          this.bloomComposer!.renderToScreen = true;
          break;
        case 'Scene only':
          break;
      }
    });

    const folder = this.gui.addFolder('Bloom Parameters');
    folder.add(this.params, 'exposure', 0.1, 2).onChange((value: number) => {
      this.renderer!.toneMappingExposure = Math.pow(Number(value), 4.0);
    });

    folder.add(this.params, 'bloomThreshold', 0.0, 1.0, 0.01).onChange((value: number) => {
      this.bloomPass!.threshold = Number(value);
    });

    folder.add(this.params, 'bloomStrength', 0.0, 10.0, 0.01).onChange((value: number) => {
      this.bloomPass!.strength = Number(value);
    });

    folder.add(this.params, 'bloomRadius', 0.0, 1.0, 0.01).onChange((value: number) => {
      this.bloomPass!.radius = Number(value);
    });
  }

  private bind () {
    this.container.onclick = null;
    this.container.onclick = (e) => {
      const x = (e.clientX / this.width) * 2 - 1;
      const y = -((e.clientY - 45) / this.height) * 2 + 1;
      this.mouse.set(x, y);

      this.raycaster.setFromCamera(this.mouse, this.camera!);
      const intersects = this.raycaster.intersectObjects(this.scene.children, false);
      if (intersects[0] && intersects[0].object) {
        const object = intersects[0].object;
        object.layers.toggle(this.BLOOM_SCENE);
      }
    };
  }

  private generateLight() {
    const light = new THREE.AmbientLight(0x404040);
    this.scene.add(light);
  }

  private generateMesh() {
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material) {
        obj.material.dispose();
      }
    });
    this.scene.children = [];

    const geometry = new THREE.IcosahedronGeometry(1, 15);
    for (let i = 0; i < 50; i++) {
      // 颜色
      const color = new THREE.Color();
      color.setHSL(Math.random(), 0.7, Math.random() * 0.2 + 0.05);

      // 材质 & 几何 && mesh
      const material = new THREE.MeshBasicMaterial({ color: color });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
        Math.random() * 10 - 5,
      );
      // .normalize () : this
      // 将该向量转换为单位向量（unit vector）， 
      // 也就是说，将该向量的方向设置为和原向量相同，但是其长度（length）为1。

      // .multiplyScalar ( s : Float ) : this
      // 将该向量与所传入的标量s进行相乘。
      sphere.position.normalize().multiplyScalar(Math.random() * 4.0 + 2.0);
      // .setScalar ( scalar : Float ) : this
      // 将该向量的x、y和z值同时设置为等于传入的scalar。
      sphere.scale.setScalar(Math.random() * Math.random() + 0.5);
      this.scene.add(sphere);

      if (Math.random() < 0.25) {
        // .layers : Layers
        // 物体的层级关系。 物体只有和一个正在使用的Camera至少在同一个层时才可见。
        // This property can also be used to filter out unwanted objects in ray-intersection tests when using Raycaster.
        sphere.layers.enable(this.BLOOM_SCENE);
      }
    }
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // 默认是NoToneMapping。查看Renderer constants以获取其它备选项
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  private initComposer() {
    const renderPass = new RenderPass(this.scene, this.camera!);

    const v2 = new THREE.Vector2(this.width, this.height);
    this.bloomPass = new UnrealBloomPass(v2, 1.5, 0.4, 0.85);
    this.bloomPass.threshold = this.params.bloomThreshold;
    this.bloomPass.strength = this.params.bloomStrength;
    this.bloomPass.radius = this.params.bloomRadius;

    this.bloomComposer = new EffectComposer(this.renderer!);
    this.bloomComposer.renderToScreen = false;
    this.bloomComposer.addPass(renderPass);
    this.bloomComposer.addPass(this.bloomPass);

    const material = new THREE.ShaderMaterial({
      defines: {},
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });
    this.finalComposer = new EffectComposer(this.renderer!);
    this.finalComposer.addPass(renderPass);
    const finalPass = new ShaderPass(material, 'baseTexture');
    finalPass.needsSwap = true;
    this.finalComposer.addPass(finalPass);
  }

  private renderBloom(mask: boolean) {
    if (mask === true) {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && this.bloomLayer.test(obj.layers) === false) {
					this.materials[obj.uuid] = obj.material;
					obj.material = this.darkMaterial;
				}
      });
      this.bloomComposer!.render();
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && this.materials[obj.uuid]) {
					obj.material = this.materials[obj.uuid];
					delete this.materials[obj.uuid];
				}
      });
    } else {
      // 摄像机是一个layers的成员. 这是一个从Object3D继承而来的属性
      this.camera!.layers.set(this.BLOOM_SCENE);
      this.bloomComposer!.render();
      this.camera!.layers.set(this.ENTIRE_SCENE);
    }
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
    switch(this.params.scene) {
      case 'Scene only':
        this.renderer!.render(this.scene, this.camera!);
        break;
      case 'Glow only':
        this.renderBloom(false);
        break;
      case 'Scene with Glow':
        this.renderBloom(true);
        this.finalComposer!.render();
        break;
      default:
        this.renderBloom(true);
        this.finalComposer!.render();
    }
  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();
    this.controls?.update();

    // 执行渲染
    this.render();
  }

  // 消除 副作用
  dispose() {
    this.container.onclick = null;
    window.cancelAnimationFrame(this.animateNumber);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.bind();
      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer?.setSize(this.width, this.height);
      this.bloomComposer?.setSize(this.width, this.height);
      this.finalComposer?.setSize(this.width, this.height);
    };
  }
}

export default THREE;

