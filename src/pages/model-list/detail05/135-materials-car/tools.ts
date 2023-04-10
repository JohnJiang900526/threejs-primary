import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  
  private controls: null | OrbitControls
  private loader: GLTFLoader
  private grid: THREE.GridHelper
  private wheels: any[]
  private bodyMaterial: THREE.MeshPhysicalMaterial
  private detailsMaterial: THREE.MeshStandardMaterial
  private glassMaterial: THREE.MeshPhysicalMaterial
  private gui: GUI
  private params: {
    bodyColor: number,
    glassColor: number,
    detailsColor: number
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
    this.loader = new GLTFLoader();
    this.grid = new THREE.GridHelper();
    this.wheels = [];
    this.bodyMaterial = new THREE.MeshPhysicalMaterial();
    this.detailsMaterial = new THREE.MeshStandardMaterial();
    this.glassMaterial = new THREE.MeshPhysicalMaterial();
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板"
    });
    this.params = {
      bodyColor: 0xff0000,
      glassColor: 0xffffff,
      detailsColor: 0xffffff
    }
  }

  init() {
    // webgl渲染器
    this.createRenderer();

    // 场景
    const url = '/examples/textures/equirectangular/venice_sunset_1k.hdr';
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x333333);
    this.scene.environment = (new RGBELoader()).load(url);
    this.scene.environment.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.fog = new THREE.Fog(0x333333, 10, 15);

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 0.1, 1000);
    this.camera.position.set(4.25, 1.4, -4.5);

    this.generateMaterials();
    this.createGrid();
    this.loadModel();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;
    this.controls.maxDistance = 9;
    this.controls.target.set(0, 0.5, 0);
    this.controls.update();

    this.initGUI();
    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private initGUI() {
    this.gui.addColor(this.params, "bodyColor").name("车身颜色").onChange((val: number) => {
      this.bodyMaterial.color.set(val);
    });

    this.gui.addColor(this.params, "glassColor").name("玻璃颜色").onChange((val: number) => {
      this.glassMaterial.color.set(val);
    });

    this.gui.addColor(this.params, "detailsColor").name("细节颜色").onChange((val: number) => {
      this.detailsMaterial.color.set(val);
    });
  }

  private generateMaterials() {
    // 物理网格材质(MeshPhysicalMaterial)
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff0000, 
      // 材质与金属的相似度。非金属材质，如木材或石材，使用0.0，金属使用1.0，通常没有中间值
      // 默认值为0.0。0.0到1.0之间的值可用于生锈金属的外观。如果还提供了metalnessMap，则两个值相乘
      metalness: 1.0, 
      // 材质的粗糙程度。0.0表示平滑的镜面反射，1.0表示完全漫反射。默认值为1.0
      // 如果还提供roughnessMap，则两个值相乘。
      roughness: 0.5, 
      // 表示clear coat层的强度，范围从0.0到1.0m，
      // 当需要在表面加一层薄薄的半透明材质的时候，可以使用与clear coat相关的属性，默认为0.0
      clearcoat: 1.0, 
      // clear coat层的粗糙度，由0.0到1.0。 默认为0.0
      clearcoatRoughness: 0.03, 
      // 光泽层的强度,范围是0.0到1.0。默认为0.0
      sheen: 0.5,
    });

    this.detailsMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, 
      metalness: 1.0, 
      roughness: 0.5,
    });

    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, 
      metalness: 0.25, 
      roughness: 0, 
      // 透光率（或者说透光性），范围从0.0到1.0。默认值是0.0
      // 很薄的透明或者半透明的塑料、玻璃材质即便在几乎完全透明的情况下仍旧会保留反射的光线，透光性属性用于这种类型的材质
      // 当透光率不为0的时候, opacity透明度应设置为1
      transmission: 1.0,
    });
  }

  private createGrid() {
    // 坐标格辅助对象. 坐标格实际上是2维线数组.
    // GridHelper( size : number, divisions : Number, colorCenterLine : Color, colorGrid : Color )
    // size -- 坐标格尺寸. 默认为 10
    // divisions -- 坐标格细分次数. 默认为 10
    // colorCenterLine -- 中线颜色. 值可以为 Color 类型, 16进制 和 CSS 颜色名. 默认为 0x444444
    // colorGrid -- 坐标格网格线颜色. 值可以为 Color 类型, 16进制 和 CSS 颜色名. 默认为 0x888888
    // 创建一个尺寸为 'size' 和 每个维度细分 'divisions' 次的坐标格. 颜色可选
    this.grid = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);
    const material = this.grid.material as THREE.Material;

    // 在0.0 - 1.0的范围内的浮点数，表明材质的透明度。值0.0表示完全透明，1.0表示完全不透明。
    // 如果材质的transparent属性未设置为true，则材质将保持完全不透明，此值仅影响其颜色。 默认值为1.0
    material.opacity = 0.2;
    // 渲染此材质是否对深度缓冲区有任何影响。默认为true
    material.depthWrite = false;
    // 定义此材质是否透明。这对渲染有影响，因为透明对象需要特殊处理，并在非透明对象之后渲染
    // 设置为true时，通过设置材质的opacity属性来控制材质透明的程度。默认值为false
    material.transparent = true;
    this.scene.add(this.grid);
  }

  // 加载模型
  private loadModel() {
    const shadow = (new THREE.TextureLoader()).load('/examples/models/gltf/ferrari_ao.png');
    // .setDecoderPath ( value : String ) : this
    // value -包含JS和WASM解码器库的文件夹路径
    const dracoLoader = (new DRACOLoader()).setDecoderPath('/examples/js/libs/draco/gltf/');
    // .setDRACOLoader ( dracoLoader : DRACOLoader ) : this
    // dracoLoader — THREE.DRACOLoader的实例，用于解码使用KHR_draco_mesh_compression扩展压缩过的文件
    const loader = (new GLTFLoader()).setDRACOLoader(dracoLoader);
    const url = "/examples/models/gltf/ferrari.glb";

    // 平面缓冲几何体（PlaneGeometry）一个用于生成平面几何体的类
    // PlaneGeometry(width : Float, height : Float, widthSegments : Integer, heightSegments : Integer)
    // width — 平面沿着X轴的宽度。默认值是1
    // height — 平面沿着Y轴的高度。默认值是1
    // widthSegments — （可选）平面的宽度分段数，默认值是1
    // heightSegments — （可选）平面的高度分段数，默认值是1
    const geometry = new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4);
    // 基础网格材质(MeshBasicMaterial) 一个以简单着色（平面或线框）方式来绘制几何体的材质
    // 这种材质不受光照的影响
    const material = new THREE.MeshBasicMaterial({
      // .map : Texture
      // 颜色贴图。可以选择包括一个alpha通道，通常与.transparent 或.alphaTest。默认为null
      map: shadow,
      // .toneMapped : Boolean
      // 定义这个材质是否会被渲染器的toneMapping设置所影响，默认为 true
      toneMapped: false,
      // .transparent : Boolean
      // 定义此材质是否透明。这对渲染有影响，因为透明对象需要特殊处理，并在非透明对象之后渲染。
      // 设置为true时，通过设置材质的opacity属性来控制材质透明的程度, 默认值为false
      transparent: true,
      // .blending : Blending
      // 在使用此材质显示对象时要使用何种混合
      // 必须将其设置为CustomBlending才能使用自定义blendSrc, blendDst 或者 [page:Constant blendEquation]
      // 默认值为NormalBlending
      blending: THREE.MultiplyBlending,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    // .renderOrder : Number
    // 这个值将使得scene graph（场景图）中默认的的渲染顺序被覆盖， 
    // 即使不透明对象和透明对象保持独立顺序。 渲染顺序是由低到高来排序的，默认值为0
    mesh.renderOrder = 2;

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (gltf) => {
      toast.close();
      const car = gltf.scene.children[0] as THREE.Object3D;

      const body = car.getObjectByName('body') as THREE.Mesh;
      const rim_fl = car.getObjectByName('rim_fl') as THREE.Mesh;
      const rim_fr = car.getObjectByName('rim_fr') as THREE.Mesh;
      const rim_rr = car.getObjectByName('rim_rr') as THREE.Mesh;
      const rim_rl = car.getObjectByName('rim_rl') as THREE.Mesh;
      const trim = car.getObjectByName('trim') as THREE.Mesh;
      const glass = car.getObjectByName('glass') as THREE.Mesh;

      body.material = this.bodyMaterial;
      rim_fl.material = this.detailsMaterial;
      rim_fr.material = this.detailsMaterial;
      rim_rr.material = this.detailsMaterial;
      rim_rl.material = this.detailsMaterial;
      trim.material = this.detailsMaterial;
      glass.material = this.glassMaterial;

      this.wheels.push(
        car.getObjectByName('wheel_fl') as THREE.Mesh,
        car.getObjectByName('wheel_fr') as THREE.Mesh,
        car.getObjectByName('wheel_rl') as THREE.Mesh,
        car.getObjectByName('wheel_rr') as THREE.Mesh,
      );

      car.add(mesh);
      this.scene.add(car);
    }, undefined, () => { toast.close(); });
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    // .toneMappingExposure : Number
    // 色调映射的曝光级别。默认是1
    this.renderer.toneMappingExposure = 0.85;
    // .outputEncoding : number
    // 定义渲染器的输出编码。默认为THREE.LinearEncoding
    // 如果渲染目标已经使用 .setRenderTarget、之后将直接使用renderTarget.texture.encoding
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    // .toneMapping : Constant
    // 色调映射 默认是NoToneMapping
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // .setAnimationLoop ( callback : Function ) : undefined
    // callback — 每个可用帧都会调用的函数。 如果传入‘null’,所有正在进行的动画都会停止
    // 可用来代替requestAnimationFrame的内置函数. 对于WebXR项目，必须使用此函数
    this.renderer.setAnimationLoop(() => { this.render(); })
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  private render() {
    if (this.wheels.length > 0) {
      const time = -performance.now() / 1000;
      // 车轮滚动
      this.wheels.forEach((wheel) => {
        wheel.rotation.x = time * Math.PI * 2;
      });
      // 地板滑行
      this.grid.position.z = -(time) % 1;
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }
    // 控制器
    if (this.controls) { this.controls.update(); }

    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.renderer && this.scene && this.camera) {
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

