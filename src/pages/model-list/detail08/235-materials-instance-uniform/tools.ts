import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { 
  MeshStandardNodeMaterial, Node, 
  NodeUpdateType, uniform, 
  cubeTexture, add, mul, type Swizzable, NodeBuilder 
} from 'three/examples/jsm/nodes/Nodes';
import { nodeFrame } from 'three/examples/jsm/renderers/webgl/nodes/WebGLNodes';

class InstanceUniformNode extends Node {
  uniformNode: Swizzable;
  constructor() {
    super('vec3');
    this.updateType = NodeUpdateType.OBJECT;
    this.uniformNode = uniform(new THREE.Color());
  }

  update(frame: any) {
    // @ts-ignore
    this.uniformNode.value.copy(frame.object.color);
  }

  generate(builder: NodeBuilder, output: string) {
    return this.uniformNode.build(builder, output);
  }
}

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
  private pointLight: THREE.PointLight;
  private objects: THREE.Mesh[];
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
    this.pointLight = new THREE.PointLight();
    this.objects = [];
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 4000);
    this.camera.position.set(0, 600, 1500);

    this.createLight();
    this.createGrid();
    this.createMesh();
    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
		this.controls.maxDistance = 2000;
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

  private createLight() {
    const ambient = new THREE.AmbientLight(0x111111);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.125);

    dirLight.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    dirLight.position.normalize();

    const geometry = new THREE.SphereGeometry(4, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const meth = new THREE.Mesh(geometry, material);

    if (this.pointLight) { this.pointLight.dispose(); }
    this.pointLight = new THREE.PointLight(0xffffff, 1);
    this.pointLight.add(meth);
    
    this.scene.add(ambient, dirLight, this.pointLight);
  }

  private createMesh () {
    const path = '/examples/textures/cube/SwedishRoyalCastle/';
    const urls = [
      'px.jpg', 'nx.jpg',
      'py.jpg', 'ny.jpg',
      'pz.jpg', 'nz.jpg',
    ];
    const cubeMap = (new THREE.CubeTextureLoader()).setPath(path).load(urls);
    const instanceUniform = new InstanceUniformNode();
    const cubeTextureNode = cubeTexture(cubeMap);

    const material = new MeshStandardNodeMaterial();
    material.colorNode = add(instanceUniform, cubeTextureNode);
    material.emissiveNode = mul(instanceUniform, cubeTextureNode);

    const geometry = new THREE.SphereGeometry(70, 32, 16);
    for (let i = 0; i < 12; i++) {
      this.addMesh(geometry, material);
    }
  }

  private addMesh(geometry: THREE.SphereGeometry, material: MeshStandardNodeMaterial) {
    const mesh = new THREE.Mesh(geometry, material);

    // @ts-ignore
    mesh.color = new THREE.Color(Math.random() * 0xffffff);
    mesh.position.x = (this.objects.length % 4 ) * 200 - 300;
    mesh.position.z = Math.floor(this.objects.length / 4 ) * 200 - 200;

    mesh.rotation.set(
      Math.random() * 200 - 100,
      Math.random() * 200 - 100,
      Math.random() * 200 - 100,
    );

    this.objects.push(mesh);
    this.scene.add(mesh);
  }

  private createGrid() {
    const helper = new THREE.GridHelper(1000, 40, 0x303030, 0x303030);
    helper.position.y = -75;
    this.scene.add(helper);
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

    {
      const timer = 0.0001 * Date.now();

      this.objects.forEach((object) => {
        object.rotation.x += 0.01;
        object.rotation.y += 0.005;
      });

      this.pointLight.position.set(
        Math.sin( timer * 7 ) * 300,
        Math.cos( timer * 5 ) * 400,
        Math.cos( timer * 3 ) * 300,
      );
    }

    nodeFrame.update();
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

