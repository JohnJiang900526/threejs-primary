import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import { GUI } from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';

import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader';
import { LDrawUtils } from 'three/examples/jsm/utils/LDrawUtils';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private stats: null | Stats;

  private model: null | THREE.Group
  private ldrawPath: string
  private modelFileList: {
    [key: string]: string
  };
  private data: {
    modelFileName: string,
    displayLines: boolean,
    conditionalLines: boolean,
    smoothNormals: boolean,
    buildingStep: number,
    noBuildingSteps: string,
    flatColors: boolean,
    mergeModel: boolean,
  }
  private gui: null | GUI
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.stats = null;

    this.model = null;
    this.ldrawPath = "/examples/models/ldraw/officialLibrary/";
    this.modelFileList = {
      'Car': 'models/car.ldr_Packed.mpd',
      'Lunar Vehicle': 'models/1621-1-LunarMPVVehicle.mpd_Packed.mpd',
      'Radar Truck': 'models/889-1-RadarTruck.mpd_Packed.mpd',
      'Trailer': 'models/4838-1-MiniVehicles.mpd_Packed.mpd',
      'Bulldozer': 'models/4915-1-MiniConstruction.mpd_Packed.mpd',
      'Helicopter': 'models/4918-1-MiniFlyers.mpd_Packed.mpd',
      'Plane': 'models/5935-1-IslandHopper.mpd_Packed.mpd',
      'Lighthouse': 'models/30023-1-Lighthouse.ldr_Packed.mpd',
      'X-Wing mini': 'models/30051-1-X-wingFighter-Mini.mpd_Packed.mpd',
      'AT-ST mini': 'models/30054-1-AT-ST-Mini.mpd_Packed.mpd',
      'AT-AT mini': 'models/4489-1-AT-AT-Mini.mpd_Packed.mpd',
      'Shuttle': 'models/4494-1-Imperial Shuttle-Mini.mpd_Packed.mpd',
      'TIE Interceptor': 'models/6965-1-TIEIntercep_4h4MXk5.mpd_Packed.mpd',
      'Star fighter': 'models/6966-1-JediStarfighter-Mini.mpd_Packed.mpd',
      'X-Wing': 'models/7140-1-X-wingFighter.mpd_Packed.mpd',
      'AT-ST': 'models/10174-1-ImperialAT-ST-UCS.mpd_Packed.mpd'
    };
    this.data = {
      modelFileName: this.modelFileList['Car'],
      displayLines: true,
      conditionalLines: true,
      smoothNormals: true,
      buildingStep: 0,
      noBuildingSteps: 'No steps.',
      flatColors: false,
      mergeModel: false
    };
    this.gui = null;
  }

  // 初始化方法入口
  init() {
    // 渲染器
    this.createRenderer();

    // 场景
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer as THREE.WebGLRenderer);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdeebed);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;

    // 相机
    this.camera = new THREE.PerspectiveCamera(65, this.aspect, 1, 10000);
		this.camera.position.set(150, 200, 250);

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);

    // 加载模型
    this.loadModel(true);
    
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建GUI 操作面板
  private createGUI() {
    if (this.gui) { this.gui.destroy(); }

    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    }).close();

    this.gui.add(this.data, "modelFileName", this.modelFileList).name("模型").onChange(() => {
      this.loadModel(true);
    });

    if (this.model && this.model.userData.numBuildingSteps > 1 ) {
      this.gui.add(this.data, 'buildingStep', 0, this.model.userData.numBuildingSteps - 1).step(1).name('构建步骤').onChange(() => {
        this.updateObjectsVisibility();
      });
    } else {
      this.gui.add(this.data, 'noBuildingSteps').name('构建步骤').onChange(() => {
        this.updateObjectsVisibility();
      });
    }

    this.gui.add(this.data, 'flatColors').name('平面颜色').onChange(() => {
      this.loadModel(false);
    });

    this.gui.add(this.data, 'mergeModel').name('合并模型').onChange(() => {
      this.loadModel(false);
    });

    this.gui.add(this.data, 'smoothNormals').name('光滑法线').onChange(() => {
      this.loadModel(false);
    });
    this.gui.add(this.data, 'displayLines').name('显示线条').onChange(() => {
      this.updateObjectsVisibility();
    });
    this.gui.add(this.data, 'conditionalLines').name('有条件的线条').onChange(() => {
      this.updateObjectsVisibility();
    });
  }

  // 加载模型
  private loadModel(reset: boolean = false) {
    const loader = new LDrawLoader();
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    loader.smoothNormals = (this.data.smoothNormals && !this.data.flatColors);
    loader.setPath(this.ldrawPath);
    loader.load(this.data.modelFileName, (group) => {
      toast.close();
      if (this.model) {
        this.scene.remove(this.model);
      }
      this.model = group;

      if (this.data.flatColors) {
        this.model.traverse((object) => {
          const obj = object as THREE.Mesh;
          if (obj.isMesh) {
            if (Array.isArray(obj.material)) {
              obj.material = obj.material.map((item) => {
                return this.convertMaterial(item as THREE.MeshBasicMaterial);
              })
            } else {
              obj.material = this.convertMaterial(obj.material as THREE.MeshBasicMaterial);
            }
          }
        });
      }

      if (this.data.mergeModel) {
        this.model = LDrawUtils.mergeObject(this.model);
      }
      this.model.rotation.x = Math.PI;
      this.scene.add(this.model);

      this.data.buildingStep = this.model.userData.numBuildingSteps - 1;
      this.updateObjectsVisibility();

      // .setFromObject ( object : Object3D ) : this
      // object - 用来计算包围盒的3D对象 Object3D
      // 计算和世界轴对齐的一个对象 Object3D （含其子对象）的包围盒，计算对象和子对象的世界坐标变换。
      // 该方法可能会导致一个比严格需要的更大的框
      const box = new THREE.Box3().setFromObject(this.model);
      const size = box.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, Math.max(size.y, size.z)) * 0.5;

      if (reset && this.controls) {
        // .target0 : Vector3
        // 由.saveState和.reset方法在内部使用

        // .getCenter ( target : Vector3 ) : Vector3
        // target — 如果指定了target ，结果将会被拷贝到target
        // 返回包围盒的中心点 Vector3
        this.controls.target0.copy(box.getCenter(new THREE.Vector3()));
        // .position0 : Vector3
        // 由.saveState和.reset方法在内部使用
        this.controls.position0.set(-2.3, 1, 2).multiplyScalar(radius).add(this.controls.target0);
        this.controls.reset();
      }
      this.createGUI();
    }, undefined, () => {
      toast.close();
    });
  }

  // 更新显示属性
  private updateObjectsVisibility() {
    if (this.model) {
      this.model.traverse((object) => {
        const obj = object as (THREE.LineSegments | THREE.Group);

        // @ts-ignore
        if (obj.isLineSegments) {
          // @ts-ignore
          if (obj.isConditionalLine) {
            obj.visible = this.data.conditionalLines;
          } else {
            obj.visible = this.data.displayLines;
          }
          // @ts-ignore
        } else if (obj.isGroup){
          obj.visible = obj.userData.buildingStep <= this.data.buildingStep;
        }
      });
    }
  }

  // 转换材质
  private convertMaterial(material: THREE.MeshBasicMaterial) {
    const newMaterial = new THREE.MeshBasicMaterial();
    newMaterial.color.copy(material.color);
    newMaterial.polygonOffset = material.polygonOffset;
    newMaterial.polygonOffsetUnits = material.polygonOffsetUnits;
    newMaterial.polygonOffsetFactor = material.polygonOffsetFactor;
    newMaterial.opacity = material.opacity;
    newMaterial.transparent = material.transparent;
    newMaterial.depthWrite = material.depthWrite;
    // @ts-ignore
    newMaterial.toneMapping = false;
    return newMaterial;
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.outputEncoding = THREE.sRGBEncoding;
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

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.camera && this.renderer) {
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

