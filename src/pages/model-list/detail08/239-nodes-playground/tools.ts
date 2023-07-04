import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import * as Nodes from 'three/examples/jsm/nodes/Nodes';
import { nodeFrame } from 'three/examples/jsm/renderers/webgl/nodes/WebGLNodes';
// @ts-ignore
import { NodeEditor } from 'three/examples/jsm/node-editor/NodeEditor';
// @ts-ignore
import { MeshEditor } from 'three/examples/jsm/node-editor/scene/MeshEditor';
// @ts-ignore
import { StandardMaterialEditor } from 'three/examples/jsm/node-editor/materials/StandardMaterialEditor';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

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
  private model: null | THREE.Mesh;
  private nodeEditor: null | NodeEditor;
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
    this.model = null;
    this.nodeEditor = null;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x333333);

    // 相机
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 0.01, 100);
    this.camera.position.set(0.0, 3, 12);

    this.createLight();
    // 渲染器
    this.createRenderer();

    this.initEditor();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;
    this.controls.update();

    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private async initEditor() {
    const reset = () => {
      const meshEditor = new MeshEditor(this.model);
      const materialEditor = new StandardMaterialEditor();

      this.nodeEditor.add(meshEditor);
      this.nodeEditor.add(materialEditor);
      this.nodeEditor.centralizeNode(meshEditor);

      const { x, y } = meshEditor.getPosition();
      meshEditor.setPosition(x + 250, y);
      materialEditor.setPosition(x - 250, y);
      meshEditor.material.connect(materialEditor);
    };

    this.nodeEditor = new NodeEditor(this.scene);
    this.nodeEditor.addEventListener('new', reset);
    this.container.appendChild(this.nodeEditor.domElement);

    const loaderFBX = new FBXLoader();
    const url = "/examples/models/fbx/stanford-bunny.fbx";
    const object = await loaderFBX.loadAsync(url);

    
    const defaultMaterial = new Nodes.MeshBasicNodeMaterial();
		defaultMaterial.colorNode = new Nodes.UniformNode(0);

    const defaultPointsMaterial = new Nodes.PointsNodeMaterial();
    defaultPointsMaterial.colorNode = new Nodes.UniformNode(0);
    // @ts-ignore
    defaultPointsMaterial.size = 0.01;

    {
      // sphere
      const geometry = new THREE.SphereGeometry(2, 32, 16);
      const sphere = new THREE.Mesh(geometry, defaultMaterial);
      sphere.name = 'Sphere';
      sphere.position.set(5, 0, -5);
      this.scene.add(sphere);
    }

    {
      // box
      const geometry = new THREE.BoxGeometry(2, 2, 2)
      const box = new THREE.Mesh(geometry, defaultMaterial);
      box.name = 'Box';
      box.position.set(-5, 0, -5);
      this.scene.add(box);
    }

    {
      // torusKnot
      const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16)
      const torusKnot = new THREE.Points(geometry, defaultPointsMaterial);
      torusKnot.name = 'Torus Knot ( Points )';
      torusKnot.position.set(0, 0, -5);
      this.scene.add(torusKnot);
    }
    
    {
      // model
      this.model = object.children[0] as THREE.Mesh;
      this.model.position.set(0, 0, 0.1);
      this.model.scale.setScalar(0.01);
      this.model.material = defaultMaterial;
      this.scene.add(this.model);
    }

    reset();
  }

  private createLight() {
    const topLight = new THREE.PointLight(0xF4F6F0, 1, 100);
    topLight.power = 4500;
    topLight.position.set(0, 10, 10);

    const backLight = new THREE.PointLight(0x0c1445, 1, 100);
    backLight.power = 1000;
    backLight.position.set(-1, .2, -2.6);

    this.scene.add(topLight, backLight);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 1;
    // @ts-ignore
    this.renderer.physicallyCorrectLights = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.domElement.className = 'renderer';
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

      if (this.nodeEditor) {
        this.nodeEditor.setSize(this.width, this.height);
      }
      
    };
  }
}

export default THREE;

