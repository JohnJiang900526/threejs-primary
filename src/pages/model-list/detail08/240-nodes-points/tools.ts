import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as Nodes from 'three/examples/jsm/nodes/Nodes';
import { nodeFrame } from 'three/examples/jsm/renderers/webgl/nodes/WebGLNodes';
import { TeapotGeometry } from 'three/examples/jsm/geometries/TeapotGeometry';
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
  private material: Nodes.PointsNodeMaterial;
  private gui: GUI;
  private lerpPosition: Nodes.UniformNode
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
    this.material = new Nodes.PointsNodeMaterial({
      depthWrite: false,
      transparent: true,
      // @ts-ignore
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板",
    });
    this.lerpPosition = new Nodes.UniformNode(0);
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.001);

    // 相机
    this.camera = new THREE.PerspectiveCamera(55, this.aspect, 1, 2000);
    this.camera.position.set(0, 100, -300);

    this.createPoints();
    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.maxDistance = 1000;
    this.controls.update();

    this.initStats();
    this.setUpGUI();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 核心
  private createPoints() {
    const teapotGeometry = new TeapotGeometry(50, 7);
    const sphereGeometry = new THREE.SphereGeometry(50, 130, 16);
    const geometry = new THREE.BufferGeometry();

    // buffers
    const speed: number[] = [];
    const intensity: number[] = [];
    const size: number[] = [];

    const positionAttribute = teapotGeometry.getAttribute('position');
    const particleCount = positionAttribute.count;

    for (let i = 0; i < particleCount; i ++) {
      speed.push(20 + Math.random() * 50);
      intensity.push(Math.random() * .15);
      size.push(30 + Math.random() * 230);
    }
    geometry.setAttribute('position', positionAttribute);
    geometry.setAttribute('targetPosition', sphereGeometry.getAttribute('position'));
    geometry.setAttribute('particleSpeed', new THREE.Float32BufferAttribute(speed, 1));
    geometry.setAttribute('particleIntensity', new THREE.Float32BufferAttribute(intensity, 1));
    geometry.setAttribute('particleSize', new THREE.Float32BufferAttribute(size, 1));

    const fireMap = new THREE.TextureLoader().load('/examples/textures/sprites/firetorch_1.jpg');
    // nodes
    const targetPosition = new Nodes.AttributeNode('targetPosition', 'vec3');
    const particleSpeed = new Nodes.AttributeNode('particleSpeed', 'float');
    const particleIntensity = new Nodes.AttributeNode('particleIntensity', 'float');
    const particleSize = new Nodes.AttributeNode('particleSize', 'float');
    const time = new Nodes.TimerNode();
    const spriteSheetCount = new Nodes.ConstNode(new THREE.Vector2(6, 6));
    const fireUV = new Nodes.SpriteSheetUVNode(
      spriteSheetCount, // count
      new Nodes.PointUVNode(), // uv
      new Nodes.OperatorNode('*', time, particleSpeed) // current frame
    );
    const fireSprite = new Nodes.TextureNode(fireMap, fireUV);
    const fire = new Nodes.OperatorNode('*', fireSprite, particleIntensity);

    this.lerpPosition = new Nodes.UniformNode(0);
    const positionNode = new Nodes.MathNode(
      Nodes.MathNode.MIX, new Nodes.PositionNode(Nodes.PositionNode.LOCAL), 
      targetPosition, this.lerpPosition
    );

    this.material.colorNode = fire;
    this.material.sizeNode = particleSize;
    this.material.positionNode = positionNode;

    const particles = new THREE.Points(geometry, this.material);
    this.scene.add(particles);
  }

  private setUpGUI() {
    const guiNode = { lerpPosition: 0 };

    this.gui.add( this.material, 'sizeAttenuation' ).onChange(() => {
      this.material.needsUpdate = true;
    });

    this.gui.add( guiNode, 'lerpPosition', 0, 1 ).onChange(() => {
      this.lerpPosition.value = guiNode.lerpPosition;
    });
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

