import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { ShadowMapViewer } from 'three/examples/jsm/utils/ShadowMapViewer';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | FirstPersonControls;
  private SHADOW_MAP_WIDTH: number;
  private SHADOW_MAP_HEIGHT: number;
  private FLOOR: number;
  private NEAR: number;
  private FAR: number;
  private mixer: null | THREE.AnimationMixer;
  private morphs: THREE.Mesh[];
  private light: THREE.SpotLight;
  private lightShadowMapViewer: null | ShadowMapViewer
  private clock: THREE.Clock;
  private showHUD: boolean;
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
    this.SHADOW_MAP_WIDTH = 2048;
    this.SHADOW_MAP_HEIGHT = 1024;
    this.FLOOR = -250;
    this.NEAR = 10;
    this.FAR = 3000;
    this.mixer = null;
    this.morphs = [];
    this.light = new THREE.SpotLight();
    this.lightShadowMapViewer = null;
    this.clock = new THREE.Clock();
    this.showHUD = false;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x59472b);
		this.scene.fog = new THREE.Fog(0x59472b, 1000, this.FAR);

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, this.NEAR, this.FAR);
    this.camera.position.set(700, 50, 1900);

    // lights
    this.generateLight();

    // 渲染器
    this.createRenderer();

    this.createHUD();
    this.createScene();

    // 控制器
    this.controls = new FirstPersonControls(this.camera, this.renderer?.domElement);
    this.controls.lookSpeed = 0.0125;
    this.controls.movementSpeed = 50;
    // @ts-ignore
    this.controls.noFly = false;
    this.controls.lookVertical = true;
    this.controls.lookAt(this.scene.position);

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
      window.onkeydown = null;
      window.ontouchmove = () => {
        this.showHUD = true;
      };

      window.ontouchend = () => {
        this.showHUD = false;
      };
    } else {
      window.ontouchmove = null;
      window.ontouchend = null;
      window.onkeydown = (e) => {
        switch (e.keyCode) {
          case 84:
            this.showHUD = !this.showHUD
            break;
          default:
            this.showHUD = false;
        }
      };
    }
  }

  private createHUD () {
    this.lightShadowMapViewer = new ShadowMapViewer(this.light);
    this.lightShadowMapViewer.position.x = 0;
    this.lightShadowMapViewer.position.y = this.height - (this.SHADOW_MAP_HEIGHT / 4) - 10;
    this.lightShadowMapViewer.size.width = this.SHADOW_MAP_WIDTH / 4;
    this.lightShadowMapViewer.size.height = this.SHADOW_MAP_HEIGHT / 4;
    this.lightShadowMapViewer.update();
  }
  private createScene () {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshPhongMaterial({color: 0xffb851});
    // 地板
    {
      const ground = new THREE.Mesh(geometry, planeMaterial);

      ground.position.set(0, this.FLOOR, 0);
      ground.rotation.x = -Math.PI / 2;
      ground.scale.set(100, 100, 100);

      ground.castShadow = false;
      ground.receiveShadow = true;
      this.scene.add(ground);
    }

    // 文字
    {
      const loader = new FontLoader();
      const url = "/examples/fonts/helvetiker_bold.typeface.json";

      loader.load(url, (font) => {
        const geometry = new TextGeometry('THREE.JS', {
          font: font,
          size: 200,
          height: 50,
          curveSegments: 12,
          bevelThickness: 2,
          bevelSize: 5,
          bevelEnabled: true
        });
        geometry.computeBoundingBox();

        const boundingBox = geometry.boundingBox as THREE.Box3;
        const centerOffset = -0.5 * (boundingBox.max.x - boundingBox.min.x );
        const textMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xff0000, 
          specular: 0xffffff 
        });
        const mesh = new THREE.Mesh(geometry, textMaterial);

        mesh.position.x = centerOffset;
        mesh.position.y = this.FLOOR + 67;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        this.scene.add(mesh);
      });
    }

    // cube
    {
      const cubes1 = new THREE.Mesh(new THREE.BoxGeometry(1500, 220, 150), planeMaterial);
      cubes1.position.y = this.FLOOR - 50;
      cubes1.position.z = 20;
      cubes1.castShadow = true;
      cubes1.receiveShadow = true;
      this.scene.add(cubes1);

      const cubes2 = new THREE.Mesh(new THREE.BoxGeometry(1600, 170, 250), planeMaterial);
      cubes2.position.y = this.FLOOR - 50;
      cubes2.position.z = 20;
      cubes2.castShadow = true;
      cubes2.receiveShadow = true;
      this.scene.add(cubes2);
    }

    // MORPHS
    const gltfloader = new GLTFLoader();
    this.mixer = new THREE.AnimationMixer(this.scene);
    const addMorph = (Mesh: THREE.Mesh, clip: THREE.AnimationClip, speed: number, duration: number, x: number, y: number, z: number, fudgeColor: boolean = false) => {
      const mesh = Mesh.clone();
      mesh.material = (mesh.material as THREE.MeshBasicMaterial).clone();

      if ( fudgeColor ) {
        (mesh.material as THREE.MeshBasicMaterial).color.offsetHSL(
          0, Math.random() * 0.5 - 0.25, 
          Math.random() * 0.5 - 0.25
        );
      }

      // @ts-ignore
      mesh.speed = speed;
      this.mixer?.clipAction(clip, mesh).setDuration(duration).startAt(-duration * Math.random()).play();
      mesh.position.set(x, y, z);
      mesh.rotation.y = Math.PI / 2;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      this.scene.add(mesh);
      this.morphs.push(mesh);
    };

    {
      gltfloader.load('/examples/models/gltf/Horse.glb', (gltf) => {
        const mesh = gltf.scene.children[ 0 ] as THREE.Mesh;
        const clip = gltf.animations[0];

        addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, this.FLOOR, 300, true);
        addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, this.FLOOR, 450, true);
        addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, this.FLOOR, 600, true);

        addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, this.FLOOR, - 300, true);
        addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, this.FLOOR, - 450, true);
        addMorph(mesh, clip, 550, 1, 100 - Math.random() * 1000, this.FLOOR, - 600, true);
      });

      gltfloader.load('/examples/models/gltf/Flamingo.glb', (gltf) => {
        const mesh = gltf.scene.children[0] as THREE.Mesh;
        const clip = gltf.animations[0];
        addMorph(mesh, clip, 500, 1, 500 - Math.random() * 500, this.FLOOR + 350, 40);
      });

      gltfloader.load('/examples/models/gltf/Stork.glb', (gltf) => {
        const mesh = gltf.scene.children[0] as THREE.Mesh;
        const clip = gltf.animations[0];
        addMorph(mesh, clip, 350, 1, 500 - Math.random() * 500, this.FLOOR + 350, 340);
      });

      gltfloader.load('/examples/models/gltf/Parrot.glb', ( gltf ) => {
        const mesh = gltf.scene.children[0] as THREE.Mesh;
        const clip = gltf.animations[0];
        addMorph(mesh, clip, 450, 0.5, 500 - Math.random() * 500, this.FLOOR + 300, 700);
      });
    }

  }

  private generateLight() {
    const ambient = new THREE.AmbientLight(0x444444);

    if (this.light) { this.light.dispose() }
    this.light = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 5, 0.3);
    this.light.position.set(0, 1500, 1000);
    this.light.target.position.set(0, 0, 0);

    this.light.castShadow = true;
    this.light.shadow.camera.near = 1200;
    this.light.shadow.camera.far = 2500;
    this.light.shadow.bias = 0.0001;

    this.light.shadow.mapSize.width = this.SHADOW_MAP_WIDTH;
    this.light.shadow.mapSize.height = this.SHADOW_MAP_HEIGHT;

    this.scene.add(ambient, this.light);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
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
    const delta = this.clock.getDelta();

    this.mixer?.update(delta);
    this.stats?.update();
    this.controls?.update(delta);

    this.morphs.forEach((morph, i) => {
      // @ts-ignore
      morph.position.x += morph.speed * delta;
      if (morph.position.x > 2000) {
        morph.position.x = -1000 - Math.random() * 500;
      }
    });
    
    // 执行渲染
    if (this.renderer && this.camera) {
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);

      if (this.showHUD && this.lightShadowMapViewer) {
        this.lightShadowMapViewer.render(this.renderer);
      }
    }
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

      this.controls?.handleResize();
    };
  }
}

export default THREE;

