import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';

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

  private singleMaterial: boolean;
  private zmaterial: THREE.MeshBasicMaterial[];
  private parameters: THREE.MeshBasicMaterialParameters;
  private nobjects: number;
  private cubeMaterial: THREE.MeshBasicMaterial;
  private mouse: THREE.Vector2;
  private half: THREE.Vector2;
  private materials: THREE.MeshBasicMaterial[];
  private objects: THREE.Mesh[];
  private postprocessing: {
    composer?: EffectComposer
    bokeh?: BokehPass
  };
  private effectController: {
    focus: number,
    aperture: number,
    maxblur: number,
  };
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

    this.singleMaterial = false;
    this.zmaterial = [];
    this.parameters = {};
    this.nobjects = 0;
    this.cubeMaterial = new THREE.MeshBasicMaterial();
    this.mouse = new THREE.Vector2();
    this.half = new THREE.Vector2(this.width/2, this.height/2);
    this.materials = [];
    this.objects = [];
    this.postprocessing = {};
    this.effectController = {
      focus: 500.0,
      aperture: 5,
      maxblur: 0.01,
    };
    this.gui = new GUI({
      title: "控制器",
      container: this.container,
      autoPlace: false
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(70, this.aspect, 1, 3000);
    this.camera.position.z = 200;

    this.createMesh();
    // 渲染器
    this.createRenderer();

    this.initPostprocessing();
    this.bind();
    this.setUpGUI();
    this.initStats();
    this.animate();
    this.resize();
    this.matChanger();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.effectController, 'focus', 10.0, 3000.0, 10 ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'aperture', 0, 10, 0.1 ).onChange(() => {
      this.matChanger();
    });
    this.gui.add(this.effectController, 'maxblur', 0.0, 0.01, 0.001 ).onChange(() => {
      this.matChanger();
    });
  }

  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        event.stopPropagation();
        const e = event.touches[0];
        const x = e.clientX - this.half.x;
        const y = e.clientY - 45 - this.half.y;
        
        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        e.stopPropagation();
        const x = e.clientX - this.half.x;
        const y = e.clientY - 45 - this.half.y;
        
        this.mouse.set(x, y);
      };
    }
  }

  // 创建mesh es
  private createMesh() {
    const path = '/examples/textures/cube/SwedishRoyalCastle/';
    const format = '.jpg';
    const urls = [
      `${path}px${format}`, `${path}nx${format}`,
      `${path}py${format}`, `${path}ny${format}`,
      `${path}pz${format}`, `${path}nz${format}`,
    ];
    const textureCube = new THREE.CubeTextureLoader().load(urls);
    this.parameters = { color: 0xff1100, envMap: textureCube };
    this.cubeMaterial = new THREE.MeshBasicMaterial(this.parameters);
    this.singleMaterial = false;
    if (this.singleMaterial) { this.zmaterial = [this.cubeMaterial]; }

    const geo = new THREE.SphereGeometry(1, 20, 10);
    const xgrid = 14, ygrid = 9, zgrid = 14;
    this.nobjects = xgrid * ygrid * zgrid;

    const s = 60;
    let count = 0;

    for(let i = 0; i < xgrid; i++) {
      for(let j = 0; j < ygrid; j++) {
        for(let k = 0; k < zgrid; k++) {
          let mesh;

          if (this.singleMaterial) {
            mesh = new THREE.Mesh(geo, this.zmaterial);
          } else {
            mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial(this.parameters));
            this.materials[count] = mesh.material;
          }

          const x = 200 * (i - xgrid / 2);
          const y = 200 * (j - ygrid / 2);
          const z = 200 * (k - zgrid / 2);

          mesh.position.set( x, y, z );
          mesh.scale.set( s, s, s );

          mesh.matrixAutoUpdate = false;
          mesh.updateMatrix();

          this.scene.add(mesh);
          this.objects.push(mesh);
          count ++;
        }
      }
    }
  }

  private initPostprocessing() {
    const scene = this.scene;
    const camera = this.camera as THREE.PerspectiveCamera;
    const renderer = this.renderer as THREE.WebGLRenderer;

    const renderPass = new RenderPass(scene, camera);
    const bokehPass = new BokehPass(scene, camera, {
      focus: 1.0,
      aperture: 0.025,
      maxblur: 0.01
    });

    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bokehPass);

    this.postprocessing.composer = composer;
    this.postprocessing.bokeh = bokehPass;
  }

  private matChanger() {
    if (this.postprocessing.bokeh) {
      // @ts-ignore
      this.postprocessing.bokeh.uniforms['focus'].value = this.effectController.focus;
      // @ts-ignore
      this.postprocessing.bokeh.uniforms['aperture'].value = this.effectController.aperture * 0.00001;
      // @ts-ignore
      this.postprocessing.bokeh.uniforms['maxblur'].value = this.effectController.maxblur;
    }
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 性能统计
  private initStats() {
    // @ts-ignore
    this.stats = new Stats();
    // @ts-ignore
    this.stats.domElement.style.position = "absolute";
    // @ts-ignore
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    const time = Date.now() * 0.00005;

    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });
    this.stats?.update();


    if (this.camera) {
      this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.036;
      this.camera.position.y += (-(this.mouse.y) - this.camera.position.y) * 0.036;
      this.camera.lookAt(this.scene.position);
  
      if (!this.singleMaterial) {
        for (let i = 0; i < this.nobjects; i++) {
          const h = (360 * (i / this.nobjects + time) % 360) / 360;
          this.materials[i].color.setHSL(h, 1, 0.5);
        }
      }
      this.postprocessing?.composer?.render(0.1);
    }
  }

  // 消除 副作用
  dispose() {
    window.cancelAnimationFrame(this.animateNumber);
    window.onpointermove = null;
    window.ontouchmove = null;
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;
      this.half = new THREE.Vector2(this.width/2, this.height/2);

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      this.renderer?.setSize(this.width, this.height);
      this.postprocessing?.composer?.setSize(this.width, this.height);
      this.bind();
    };
  }
}

export default THREE;

