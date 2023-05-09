import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from 'lil-gui';
// @ts-ignore
import { LoopSubdivision } from 'three-subdivide';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
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

  private controls: null | OrbitControls;
  private gui: GUI;
  private texture: THREE.Texture
  private meshNormal: THREE.Mesh
  private meshSmooth: THREE.Mesh
  private wireNormal: THREE.Mesh
  private wireSmooth: THREE.Mesh
  private wireMaterial: THREE.MeshBasicMaterial
  private params: {
    geometry: string,
    iterations: number,
    split: boolean,
    uvSmooth: boolean,
    preserveEdges: boolean,
    flatOnly: boolean,
    maxTriangles: number,
    flatShading: boolean,
    textured: boolean,
    wireframe: boolean,
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
    this.texture = new THREE.Texture();
    this.meshNormal = new THREE.Mesh();
    this.meshSmooth = new THREE.Mesh();
    this.wireNormal = new THREE.Mesh();
    this.wireSmooth = new THREE.Mesh();
    this.wireMaterial = new THREE.MeshBasicMaterial();
    this.params = {
      geometry: 'Box',
      iterations: 3,
      split: true,
      uvSmooth: false,
      preserveEdges: false,
      flatOnly: false,
      maxTriangles: 25000,
      flatShading: false,
      textured: true,
      wireframe: false,
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 0.1, 2000);
    this.camera.position.set(0, 0.7, 5.1);

    this.generateTexture();
    this.generateLight();
    this.generateMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.rotateSpeed = 0.5;
    this.controls.minZoom = 1;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

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
    const types = [
      'Box', 'Capsule', 'Circle', 'Cone', 'Cylinder', 'Dodecahedron', 
      'Icosahedron', 'Lathe', 'Octahedron', 'Plane', 'Ring', 'Sphere', 
      'Tetrahedron', 'Torus', 'TorusKnot'
    ];

    const paramsFolder = this.gui.addFolder('细分参数');
    const geomController = paramsFolder.add(this.params, 'geometry', types).name("形状").onFinishChange(() => {
      const geom = this.params.geometry.toLowerCase();
      this.params.split = (geom === 'box' || geom === 'ring' || geom === 'plane');
      this.params.uvSmooth = (geom === 'circle' || geom === 'plane' || geom === 'ring');

      refreshDisplay();
    });

    paramsFolder.add( this.params, 'iterations', 0, 5).onFinishChange(() => {
      this.updateMeshes();
    });

    const splitController = paramsFolder.add(this.params, 'split').onFinishChange(() => {
      this.updateMeshes();
    });

    const uvSmoothController = paramsFolder.add(this.params, 'uvSmooth').onFinishChange(() => {
      this.updateMeshes();
    });

    const preserveController = paramsFolder.add(this.params, 'preserveEdges').onFinishChange(() => {
      this.updateMeshes();
    });

    paramsFolder.add(this.params, 'flatOnly').onFinishChange(() => {
      this.updateMeshes();
    });
    paramsFolder.add(this.params, 'maxTriangles', 500, 50000).onFinishChange(() => {
      this.updateMeshes();
    });

    const aterialFolder = this.gui.addFolder("材质");
    aterialFolder.add(this.params, 'flatShading').name("平面着色").onFinishChange(() => {
      this.updateMaterial();
    });
    aterialFolder.add(this.params, 'textured').name("纹理").onFinishChange(() => {
      this.updateMaterial();
    });
    aterialFolder.add(this.params, 'wireframe').name("网格").onFinishChange(() => {
      this.updateWireframe();
    });

    const refreshDisplay = () => {
      geomController.updateDisplay();
      splitController.updateDisplay();
      uvSmoothController.updateDisplay();
      preserveController.updateDisplay();
      this.updateMeshes();
    };
  }

  private generateMesh() {
    {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.MeshBasicMaterial();

      this.meshNormal = new THREE.Mesh(geometry, material);
      this.meshNormal.position.set(-0.7, 0.5, 0);
      this.scene.add(this.meshNormal);
    }

    {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.MeshBasicMaterial();

      this.meshSmooth = new THREE.Mesh(geometry, material);
      this.meshSmooth.position.set(0.7, 0.5, 0);
      this.scene.add(this.meshSmooth);
    }

    this.wireMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      depthTest: true,
      wireframe: true,
    });

    {
      this.wireNormal = new THREE.Mesh(new THREE.BufferGeometry(), this.wireMaterial);
      this.wireNormal.visible = false;
      this.wireNormal.position.copy(this.meshNormal.position);
      this.scene.add(this.wireNormal);
    }

    {
      this.wireSmooth = new THREE.Mesh(new THREE.BufferGeometry(), this.wireMaterial);
      this.wireSmooth.visible = false;
      this.wireSmooth.position.copy(this.meshSmooth.position);
      this.scene.add(this.wireSmooth);
    }

    this.updateMeshes();
  }

  private updateMeshes() {
    const { iterations } = this.params;
    const normalGeometry = this.getGeometry();

    // 核心
    const smoothGeometry = LoopSubdivision.modify(normalGeometry, iterations, this.params);

    this.meshNormal.geometry.dispose();
    this.meshSmooth.geometry.dispose();
    this.meshNormal.geometry = normalGeometry;
    this.meshSmooth.geometry = smoothGeometry;

    this.wireNormal.geometry.dispose();
    this.wireSmooth.geometry.dispose();
    this.wireNormal.geometry = normalGeometry.clone();
    this.wireSmooth.geometry = smoothGeometry.clone();

    this.updateMaterial();
  }

  private getGeometry() {
    const { geometry } = this.params;
    const type = geometry.toLowerCase();

    switch (type) {
      case 'box':
        return new THREE.BoxGeometry();
      case 'capsule':
        return new THREE.CapsuleGeometry(0.5, 0.5, 3, 5);
      case 'circle':
        return new THREE.CircleGeometry(0.6, 10);
      case 'cone':
        return new THREE.ConeGeometry(0.6, 1.5, 5, 3);
      case 'cylinder':
        return new THREE.CylinderGeometry(0.5, 0.5, 1, 5, 4);
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(0.6);
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(0.6);
      case 'lathe':
        {
          const points = [];
          for ( let i = 0; i < 65; i += 5 ) {
            const x = ( Math.sin( i * 0.2 ) * Math.sin( i * 0.1 ) * 15 + 50 ) * 1.2;
            const y = ( i - 5 ) * 3;
            points.push( new THREE.Vector2( x * 0.0075, y * 0.005 ) );
          }

          const latheGeometry = new THREE.LatheGeometry(points, 4);
          latheGeometry.center();
          return latheGeometry;
        }
      case 'octahedron':
        return new THREE.OctahedronGeometry(0.7);
      case 'plane':
        return new THREE.PlaneGeometry();
      case 'ring':
        return new THREE.RingGeometry(0.3, 0.6, 10);
      case 'sphere':
        return new THREE.SphereGeometry(0.6, 8, 4);
      case 'tetrahedron':
        return new THREE.TetrahedronGeometry(0.8);
      case 'torus':
        return new THREE.TorusGeometry(0.48, 0.24, 4, 6);
      case 'torusknot':
        return new THREE.TorusKnotGeometry(0.38, 0.18, 20, 4);
      default:
        return new THREE.BoxGeometry();
    }
  }

  private disposeMaterial(material: (THREE.MeshBasicMaterial | THREE.MeshBasicMaterial[])) {
    const materials = Array.isArray(material) ? material : [material];
    materials.forEach((item) => { item.dispose(); });
  }

  private updateWireframe() {
    this.wireNormal.visible = this.params.wireframe;
    this.wireSmooth.visible = this.params.wireframe;
  }

  private updateMaterial() {
    const { geometry } = this.params;
    const type = geometry.toLowerCase();
    
    const params: THREE.MeshStandardMaterialParameters = {
      color: (this.params.textured) ? 0xffffff : 0x808080,
      flatShading: this.params.flatShading,
      map: (this.params.textured) ? this.texture : null,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    };

    this.disposeMaterial(this.meshNormal.material as THREE.MeshBasicMaterial);
    this.disposeMaterial(this.meshSmooth.material as THREE.MeshBasicMaterial);

    switch (type) {
      case 'circle':
      case 'lathe':
      case 'plane':
      case 'ring':
        params.side = THREE.DoubleSide;
        break;
      case 'box':
      case 'capsule':
      case 'cone':
      case 'cylinder':
      case 'dodecahedron':
      case 'icosahedron':
      case 'octahedron':
      case 'sphere':
      case 'tetrahedron':
      case 'torus':
      case 'torusknot':
        params.side = THREE.FrontSide;
        break;
    }

    const material = new THREE.MeshStandardMaterial(params);
    this.meshNormal.material = material;
    this.meshSmooth.material = material;
  }

  private generateTexture() {
    const loader = new THREE.TextureLoader();
    const url = "/examples/textures/uv_grid_opengl.jpg";
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    this.texture = loader.load(url, () => {
      toast.close();
      this.texture.wrapS = THREE.RepeatWrapping;
      this.texture.wrapT = THREE.RepeatWrapping;
    }, undefined, () => { toast.close(); });
  }

  private generateLight() {
    const light1 = new THREE.HemisphereLight(0xffffff, 0x737373, 1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(0, 1, 1);


    const light3 = new THREE.DirectionalLight(0xffffff, 0.5);
    light3.position.set(0, 1, -1);

    this.scene.add(light1, light2, light3);
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

