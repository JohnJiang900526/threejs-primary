import * as THREE from 'three';
import { showLoadingToast } from 'vant';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { VelocityShader } from 'three/examples/jsm/shaders/VelocityShader';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private stats: null | Stats;
  
  private gui: GUI
  private params: {
    material: string,
    camera: string,
    side: string
  };

  private sides:  {
    'front': THREE.Side,
    'back': THREE.Side,
    'double': THREE.Side,
  };

  private cameraOrtho: null | THREE.OrthographicCamera
  private cameraPerspective: null | THREE.PerspectiveCamera
  private controlsOrtho: null | OrbitControls
  private controlsPerspective: null | OrbitControls
  private mesh: THREE.Mesh
  private materialStandard: THREE.MeshStandardMaterial
  private materialDepthBasic: THREE.MeshDepthMaterial
  private materialDepthRGBA: THREE.MeshDepthMaterial
  private materialNormal: THREE.MeshNormalMaterial
  private materialVelocity: THREE.ShaderMaterial
  private SCALE: number
  private BIAS: number

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    
    this.gui = new GUI({
      container: this.container,
      autoPlace: true,
      title: "控制面板",
    });

    this.params = {
      material: 'normal',
      camera: 'perspective',
      side: 'double'
    };

    this.sides = {
      'front': THREE.FrontSide,
      'back': THREE.BackSide,
      'double': THREE.DoubleSide
    };

    this.cameraOrtho = null;
    this.cameraPerspective = null;
    this.controlsOrtho = null;
    this.controlsPerspective = null;
    this.mesh = new THREE.Mesh();
    this.materialStandard = new THREE.MeshStandardMaterial();
    this.materialDepthBasic = new THREE.MeshDepthMaterial();
    this.materialDepthRGBA = new THREE.MeshDepthMaterial();
    this.materialNormal = new THREE.MeshNormalMaterial();
    this.materialVelocity = new THREE.ShaderMaterial();
    this.SCALE = 2.436143;
    this.BIAS = -0.428408;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.generateCameras();
    // 材质
    this.generateMaterials();
    // 光线
    this.generateLights();
    // 模型
    this.loadModel();
    // webgl渲染器
    this.createRenderer();
    // 控制器
    this.generateControls();

    this.initGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private generateControls() {
    const cameraPerspective = this.cameraPerspective as THREE.PerspectiveCamera;
    const cameraOrtho = this.cameraOrtho as THREE.OrthographicCamera;

    this.controlsPerspective = new OrbitControls(cameraPerspective, this.renderer?.domElement);
    // 你能够将相机向内移动多少（仅适用于PerspectiveCamera），其默认值为0
    this.controlsPerspective.minDistance = 1000;
    // 你能够将相机向外移动多少（仅适用于PerspectiveCamera），其默认值为Infinity
    this.controlsPerspective.maxDistance = 2400;
    // 启用或禁用摄像机平移，默认为true
    this.controlsPerspective.enablePan = false;
    // 将其设置为true以启用阻尼（惯性），这将给控制器带来重量感。默认值为false
    // 请注意，如果该值被启用，你将必须在你的动画循环里调用.update()
    this.controlsPerspective.enableDamping = true;

    this.controlsOrtho = new OrbitControls(cameraOrtho, this.renderer?.domElement);
    // 你能够将相机放大多少（仅适用于OrthographicCamera），其默认值为0
    this.controlsOrtho.minZoom = 0.5;
    // 你能够将相机缩小多少（仅适用于OrthographicCamera），其默认值为Infinity
    this.controlsOrtho.maxZoom = 1.5;
    // 启用或禁用摄像机平移，默认为true
    this.controlsOrtho.enablePan = false;
    // 将其设置为true以启用阻尼（惯性），这将给控制器带来重量感。默认值为false
    // 请注意，如果该值被启用，你将必须在你的动画循环里调用.update()
    this.controlsOrtho.enableDamping = true;
  }

  private generateCameras() {
    this.cameraPerspective = new THREE.PerspectiveCamera(60, this.aspect, 500, 3000);
    this.cameraPerspective.position.z = 1500;
    this.scene.add(this.cameraPerspective);

    const { height = 500 } = this;
    const left = -height * this.aspect;
    const right = height * this.aspect;
    const top = height;
    const bottom = -height;
    const near = 1000;
    const far = 2500;

    this.cameraOrtho = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    this.cameraOrtho.position.z = 1500;
    this.scene.add(this.cameraOrtho);
    this.camera = this.cameraPerspective;
  }

  private generateLights() {
    const light1 = new THREE.AmbientLight(0xffffff, 0.1);

    const light2 = new THREE.PointLight(0xff0000, 0.5);
    light2.position.z = 2500;

    const light3 = new THREE.PointLight(0xff6666, 1);
    this.camera && this.camera.add(light3);

    const light4 = new THREE.PointLight(0x0000ff, 0.5);
    light4.position.x = -1000;
    light4.position.z = 1000;
    this.scene.add(light1, light2, light4);
  }

  private generateMaterials() {
    const { SCALE, BIAS } = this;
    const textureLoader = new THREE.TextureLoader();
    const normalMap = textureLoader.load('/examples/models/obj/ninja/normal.png');
    const aoMap = textureLoader.load('/examples/models/obj/ninja/ao.jpg');
    const displacementMap = textureLoader.load('/examples/models/obj/ninja/displacement.jpg');

    this.materialStandard = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      // 材质与金属的相似度。非金属材质，如木材或石材，使用0.0，金属使用1.0，通常没有中间值。 默认值为0.0
      // 0.0到1.0之间的值可用于生锈金属的外观。如果还提供了metalnessMap，则两个值相乘
      metalness: 0.5,
      // 材质的粗糙程度。0.0表示平滑的镜面反射，1.0表示完全漫反射。默认值为1.0
      // 如果还提供roughnessMap，则两个值相乘
      roughness: 0.6,
      // 位移贴图会影响网格顶点的位置，与仅影响材质的光照和阴影的其他贴图不同，
      // 移位的顶点可以投射阴影，阻挡其他对象， 以及充当真实的几何体。
      // 位移纹理是指：网格的所有顶点被映射为图像中每个像素的值（白色是最高的），并且被重定位
      displacementMap: displacementMap,
      // 位移贴图对网格的影响程度（黑色是无位移，白色是最大位移）。如果没有设置位移贴图，则不会应用此值。默认值为1
      displacementScale: SCALE,
      // 位移贴图在网格顶点上的偏移量。如果没有设置位移贴图，则不会应用此值。默认值为0
      displacementBias: BIAS,
      // 该纹理的红色通道用作环境遮挡贴图。默认值为null。aoMap需要第二组UV
      aoMap: aoMap,
      // 用于创建法线贴图的纹理。RGB值会影响每个像素片段的曲面法线，并更改颜色照亮的方式。法线贴图不会改变曲面的实际形状，只会改变光照
      normalMap: normalMap,
      // 法线贴图对材质的影响程度。典型范围是0-1。默认值是Vector2设置为（1,1）
      normalScale: new THREE.Vector2(1, -1),
      // 定义材质是否使用平面着色进行渲染。默认值为false
      // flatShading: true,
      // 定义将要渲染哪一面 - 正面，背面或两者。 默认为THREE.FrontSide。
      // 其他选项有THREE.BackSide和THREE.DoubleSide
      side: THREE.DoubleSide
    });

    this.materialDepthBasic = new THREE.MeshDepthMaterial({
      // depth packing的编码。默认为BasicDepthPacking
      depthPacking: THREE.BasicDepthPacking,
      // 位移贴图会影响网格顶点的位置，与仅影响材质的光照和阴影的其他贴图不同，
      // 移位的顶点可以投射阴影，阻挡其他对象，以及充当真实的几何体。 
      // 位移纹理是指：网格的所有顶点被映射为图像中每个像素的值（白色是最高的），并且被重定位
      displacementMap: displacementMap,
      // 位移贴图对网格的影响程度（黑色是无位移，白色是最大位移）。如果没有设置位移贴图，则不会应用此值。默认值为1
      displacementScale: SCALE,
      // 位移贴图在网格顶点上的偏移量。如果没有设置位移贴图，则不会应用此值。默认值为0
      displacementBias: BIAS,
      // 定义材质是否使用平面着色进行渲染。默认值为false
      // flatShading: true,
      // 定义将要渲染哪一面 - 正面，背面或两者。 默认为THREE.FrontSide。
      // 其他选项有THREE.BackSide和THREE.DoubleSide
      side: THREE.DoubleSide
    });

    this.materialDepthRGBA = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      displacementMap: displacementMap,
      displacementScale: SCALE,
      displacementBias: BIAS,
      side: THREE.DoubleSide
    });

    this.materialNormal = new THREE.MeshNormalMaterial({
      displacementMap: displacementMap,
      displacementScale: SCALE,
      displacementBias: BIAS,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(1, -1),
      //flatShading: true,
      side: THREE.DoubleSide
    });

    // 着色器材质(ShaderMaterial) 
    // 使用自定义shader渲染的材质。 shader是一个用GLSL编写的小程序 ，在GPU上运行
    this.materialVelocity = new THREE.ShaderMaterial({
      // Uniforms是所有顶点都具有相同的值的变量。 比如灯光，雾，和阴影贴图就是被储存在uniforms中的数据。 
      // uniforms可以通过顶点着色器和片元着色器来访问
      uniforms: THREE.UniformsUtils.clone(VelocityShader.uniforms),
      // 顶点着色器的GLSL代码。这是shader程序的实际代码。 
      // 在上面的例子中，vertexShader 和 fragmentShader 代码是从DOM（HTML文档）中获取的； 
      // 它也可以作为一个字符串直接传递或者通过AJAX加载
      vertexShader: VelocityShader.vertexShader,
      // 片元着色器的GLSL代码。这是shader程序的实际代码。
      // 在上面的例子中， vertexShader 和 fragmentShader 代码是从DOM（HTML文档）中获取的； 
      // 它也可以作为一个字符串直接传递或者通过AJAX加载
      fragmentShader: VelocityShader.fragmentShader,
      side: THREE.DoubleSide
    });
    this.materialVelocity.uniforms.displacementMap.value = displacementMap;
    this.materialVelocity.uniforms.displacementScale.value = SCALE;
    this.materialVelocity.uniforms.displacementBias.value = BIAS;
    // 一个有如下属性的对象
    // {
    //   derivatives: false, // set to use derivatives
    //   fragDepth: false, // set to use fragment depth values
    //   drawBuffers: false, // set to use draw buffers
    //   shaderTextureLOD: false // set to use shader texture LOD
    // }
    this.materialVelocity.extensions.derivatives = true;
  }

  private initGUI() {
    const materials = [
      'normal', 'standard', 
      'velocity', 'depthBasic', 'depthRGBA',
    ];

    this.gui.add(this.params, 'material', materials).name("切换材质");
    this.gui.add(this.params, 'camera', ['perspective', 'ortho']).name("相机切换");
    this.gui.add(this.params, 'side', ['front', 'back', 'double']).name("面的选择");
  }

  // 加载模型
  private loadModel() {
    const loader = new OBJLoader();
    const url = "/examples/models/obj/ninja/ninjaHead_Low.obj";

    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    loader.load(url, (group) => {
      toast.close();

      const geometry = (group.children[0] as THREE.Mesh).geometry;
      geometry.attributes.uv2 = geometry.attributes.uv;
      geometry.center();

      this.mesh = new THREE.Mesh(geometry, this.materialNormal);
      this.mesh.scale.multiplyScalar(25);
      this.mesh.userData.matrixWorldPrevious = new THREE.Matrix4();
      this.scene.add(this.mesh);
    }, undefined, () => { toast.close(); });
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
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  private setMaterial() {
    if (this.mesh) {
      let material = this.mesh.material;
      switch (this.params.material) {
        case 'standard': 
          material = this.materialStandard;
          break;
        case 'depthBasic': 
          material = this.materialDepthBasic; 
          break;
        case 'depthRGBA': 
          material = this.materialDepthRGBA; 
          break;
        case 'normal': 
          material = this.materialNormal; 
          break;
        case 'velocity': 
          material = this.materialVelocity; 
          break;
        default:
          material = this.materialNormal; 
      }

      // @ts-ignore
      if (this.sides[this.params.side] !== material.side) {
        switch ( this.params.side ) {
          case 'front': 
            material.side = THREE.FrontSide; 
            break;
          case 'back': 
            material.side = THREE.BackSide; 
            break;
          case 'double': 
            material.side = THREE.DoubleSide; 
            break;
          default:
            material.side = THREE.DoubleSide;
        }
        material.needsUpdate = true;
      }

      this.mesh.material = material;
      this.mesh.rotation.y += 0.005;
    }
  }

  // 切换相机
  private switchCamera() {
    switch (this.params.camera) {
      case 'perspective':
        this.camera = this.cameraPerspective;
        break;
      case 'ortho':
        this.camera = this.cameraOrtho;
        break;
      default:
        this.camera = this.cameraPerspective;
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    // 使用不同的材质
    this.setMaterial();
    this.switchCamera();

    // 控制更新
    this.stats && this.stats.update();
    this.controlsPerspective && this.controlsPerspective.update();
    this.controlsOrtho && this.controlsOrtho.update();

    // 执行渲染
    if (this.renderer && this.scene && this.camera && this.mesh) {
      const { projectionMatrix, matrixWorldInverse } = this.camera;

      const {
        previousProjectionViewMatrix: previous,
        currentProjectionViewMatrix: current,
        modelMatrixPrev
      } = this.materialVelocity.uniforms;

      previous.value.copy(current.value);
      current.value.multiplyMatrices(projectionMatrix, matrixWorldInverse);

      const matrixWorldPrevious = this.mesh?.userData?.matrixWorldPrevious;
      matrixWorldPrevious && modelMatrixPrev.value.copy(matrixWorldPrevious);

      this.scene.traverse((obj) => {
        const object = obj as THREE.Mesh;
        if (object.isMesh) {
          object?.userData?.matrixWorldPrevious?.copy(object.matrixWorld);
        }
      });

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
        if (this.camera.type === "PerspectiveCamera") {
          this.camera.aspect = this.aspect;
        } else if (this.camera.type === "OrthographicCamera") {
          this.camera.left = -this.height * this.aspect;
          this.camera.right = this.height * this.aspect;
          this.camera.top = this.height;
          this.camera.bottom = -this.height;
        }

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

