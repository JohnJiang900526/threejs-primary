
import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export class Model {
  private width: number
  private height: number
  private container: HTMLDivElement
  private mixer: null | THREE.AnimationMixer
  private scene: null | THREE.Scene
  private renderer: null | THREE.WebGLRenderer
  private camera: null | THREE.PerspectiveCamera
  private controls: null | OrbitControls
  private clock: null | THREE.Clock
  private process: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.mixer = null;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.clock = null;
    this.process = 0;
  }

  init(fn?: (val: number) => void) {
    // 创建一个时钟
    const clock = new THREE.Clock();
    this.clock = clock;

    // 创建一个webgl 构造器
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.width, this.height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer = renderer;
    this.container.appendChild(renderer.domElement);

    // 创建一个PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    // 创建一个场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#bfe3dd");
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.4).texture;
    this.scene = scene;

    // 创建一个相机
    const camera = new THREE.PerspectiveCamera(80, this.width/this.height, 0.1, 100);
    camera.position.set(5, 2, 8);
    this.camera = camera;

    // 创建一个控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.update();
    controls.enablePan = false;
    controls.enableDamping = true;

    // 创建一个DRACOLoader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/examples/js/libs/draco/gltf/");

    // 创建一个GLTFLoader
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load("/examples/models/gltf/LittlestTokyo.glb", (gltf) => {
      const model = gltf.scene;

      model.position.set(1, 1, 0);
      model.scale.set(0.01, 0.01, 0.01);
      scene.add(model);

      this.mixer = new THREE.AnimationMixer(model);
      this.mixer.clipAction(gltf.animations[0]).play();
    }, ({loaded, total}) => {
      this.process = (loaded / total);
      fn && fn(this.process * 100);
    }, (error) => {
      console.log(error);
    });

    this.resize();

    this.animate();
  }

  animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    const delta = this.clock?.getDelta();

    if (this.mixer) {
      this.mixer?.update(delta as number);
    }

    if (this.controls) {
      this.controls?.update();
    }

    if (this.scene && this.camera) {
      this.renderer?.render(this.scene, this.camera);
    }
  }

  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        this.camera.aspect = this.width/this.height;
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;
