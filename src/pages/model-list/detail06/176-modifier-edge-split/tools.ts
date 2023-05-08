import * as THREE from 'three';
import GUI from 'lil-gui';
import { showLoadingToast } from 'vant';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { EdgeSplitModifier } from 'three/examples/jsm/modifiers/EdgeSplitModifier';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private controls: null | OrbitControls;
  private gui: GUI;
  private modifier: EdgeSplitModifier
  private mesh: THREE.Mesh
  private baseGeometry: THREE.BufferGeometry
  private map: THREE.Texture
  private params: {
    smoothShading: boolean,
    edgeSplit: boolean,
    cutOffAngle: number,
    showMap: boolean,
    tryKeepNormals: boolean,
  }
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
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板",
    });
    this.modifier = new EdgeSplitModifier();
    this.mesh = new THREE.Mesh();
    this.baseGeometry = new THREE.BufferGeometry();
    this.map = new THREE.Texture();
    this.params = {
      showMap: false,
      smoothShading: true,
      edgeSplit: true,
      cutOffAngle: 20,
      tryKeepNormals: true,
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444));

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect);
    this.camera.position.set(0, 0, 10);

    this.loadModel();
    this.loadTexture();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.rotateSpeed = 0.35;
    this.controls.minZoom = 1;

    this.setUpGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.params, 'showMap').onFinishChange(() => {
      this.updateMesh();
    });
    this.gui.add(this.params, 'smoothShading').onFinishChange(() => {
      this.updateMesh();
    });
    this.gui.add(this.params, 'edgeSplit').onFinishChange(() => {
      this.updateMesh();
    });
    this.gui.add(this.params, 'cutOffAngle', 0, 180).onFinishChange(() => {
      this.updateMesh();
    });
    this.gui.add(this.params, 'tryKeepNormals').onFinishChange(() => {
      this.updateMesh();
    });
  }

  private updateMesh() {
    this.mesh.geometry = this.getGeometry();
    const material = this.mesh.material as THREE.MeshStandardMaterial

    let needsUpdate = material.flatShading === this.params.smoothShading;
    material.flatShading = !this.params.smoothShading;

    if ( this.map !== undefined ) {
      needsUpdate = needsUpdate || material.map !== (this.params.showMap ? this.map : null);
      material.map = this.params.showMap ? this.map : null;
    }

    material.needsUpdate = needsUpdate;
    this.mesh.material = material;
  }

  private loadModel() {
    const loader = new OBJLoader();
    const url = "/examples/models/obj/cerberus/Cerberus.obj";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (group) => {
      toast.close();
      const cerberus = group.children[0] as THREE.Mesh;
      const modelGeometry = cerberus.geometry;

      this.modifier = new EdgeSplitModifier();
      this.baseGeometry = BufferGeometryUtils.mergeVertices(modelGeometry);

      this.mesh = new THREE.Mesh(this.getGeometry(), new THREE.MeshStandardMaterial());
      (this.mesh.material as THREE.MeshStandardMaterial).flatShading = !this.params.smoothShading;
      this.mesh.rotateY(-Math.PI / 2);
      this.mesh.scale.set(3.5, 3.5, 3.5);
      this.mesh.translateZ(1.5);
      this.scene.add(this.mesh);

      if (this.params.showMap) {
        (this.mesh.material as THREE.MeshStandardMaterial).map = this.map;
        (this.mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
      }
    }, undefined, () => { toast.close(); });
  }

  private loadTexture() {
    const loader = new THREE.TextureLoader();
    const url = "/examples/models/obj/cerberus/Cerberus_A.jpg";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (texture) => {
      toast.close();

      this.map = texture;
      if (this.params.showMap) {
        (this.mesh.material as THREE.MeshStandardMaterial).map = this.map;
        (this.mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
      }
    }, undefined, () => {toast.close();});
  }

  private getGeometry() {
    let geometry;
    if ( this.params.edgeSplit ) {
      geometry = this.modifier.modify(
        this.baseGeometry,
        this.params.cutOffAngle * Math.PI / 180,
        this.params.tryKeepNormals
      );
    } else {
      geometry = this.baseGeometry;
    }
    return geometry;
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

