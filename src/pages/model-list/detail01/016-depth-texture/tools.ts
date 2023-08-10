import * as THREE from 'three';
import { showDialog } from "vant";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private controls: null | OrbitControls;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private notSupport: boolean
  private params: {
    format: THREE.PixelFormat,
		type: THREE.TextureDataType
  }
  private target: null | THREE.WebGLRenderTarget
  private postCamera: null | THREE.OrthographicCamera
  private postMaterial: null | THREE.ShaderMaterial
  private postScene: null | THREE.Scene
  private vertexShader: string
  private fragmentShader: string
  private readonly formats: {
    DepthFormat: THREE.PixelFormat, 
    DepthStencilFormat: THREE.PixelFormat
  }
  private readonly types: {
    UnsignedShortType: THREE.TextureDataType,
    UnsignedIntType: THREE.TextureDataType, 
    UnsignedInt248Type: THREE.TextureDataType
  }
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.controls = null;
    this.camera = null;
    this.stats = null;
    this.notSupport = false;
    this.params = {
      format: THREE.DepthFormat,
      type: THREE.UnsignedShortType
    };
    this.target = null;
    this.postCamera = null;
    this.postMaterial = null;
    this.postScene = null;
    this.formats = {
      DepthFormat: THREE.DepthFormat, 
      DepthStencilFormat: THREE.DepthStencilFormat
    };
    this.types = {
      UnsignedShortType: THREE.UnsignedShortType, 
      UnsignedIntType: THREE.UnsignedIntType, 
      UnsignedInt248Type: THREE.UnsignedInt248Type
    };

    this.vertexShader = `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    this.fragmentShader = `
    #include <packing>

    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform float cameraNear;
    uniform float cameraFar;


    float readDepth( sampler2D depthSampler, vec2 coord ) {
      float fragCoordZ = texture2D( depthSampler, coord ).x;
      float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
      return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
    }

    void main() {
      //vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
      float depth = readDepth( tDepth, vUv );

      gl_FragColor.rgb = 1.0 - vec3( depth );
      gl_FragColor.a = 1.0;
    }`;
  }

  // 初始化方法入口
  init() {
    const message = "Your browser does not support <strong>WEBGL_depth_texture</strong>.<br/><br/>This demo will not work."
    // 创建一个渲染器
    this.renderer = new THREE.WebGLRenderer();
    // .setPixelRatio ( value : number ) : undefined
    // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
    this.renderer.setPixelRatio(window.devicePixelRatio);
    // .setSize ( width : Integer, height : Integer, updateStyle : Boolean ) : undefined
    // 将输出canvas的大小调整为(width, height)并考虑设备像素比，且将视口从(0, 0)开始调整到适合大小 
    // 将updateStyle设置为false以阻止对canvas的样式做任何改变
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
    this.notSupport = (
      this.renderer.capabilities.isWebGL2 === false
      &&
      this.renderer.extensions.has("WEBGL_depth_texture") === false
    );
    if (this.notSupport) { 
      showDialog({title: "提示", message});
      return false;
    }

    // 创建一个相机
    this.camera = new THREE.PerspectiveCamera(70, this.width/this.height, 0.01, 50);
    this.camera.position.z = 20;

    // 创建一个控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // .enableDamping : Boolean
    // 将其设置为true以启用阻尼（惯性），这将给控制器带来重量感。默认值为false
    // 请注意，如果该值被启用，你将必须在你的动画循环里调用.update()
    this.controls.enableDamping = true;
    // .autoRotate : Boolean
    // 将其设为true，以自动围绕目标旋转
    // 请注意，如果它被启用，你必须在你的动画循环里调用.update()
    this.controls.autoRotate = true;

    // 创建深度纹理的渲染目标
    this.setupRenderTarget();
    // 创建一个渲染场景
    this.setupScene();
    // 设置后处理步骤
    this.setupPost();

    // 初始化 性能统计
    this.initStats();
    // 持续渲染
    this.animate();
    // 窗口自适应
    this.resize();
  }

  
  setFormat(val: "DepthFormat" | "DepthStencilFormat") {
    switch(val) {
      case "DepthFormat":
        this.params.format = this.formats[val];
        break;
      case "DepthStencilFormat":
        this.params.format = this.formats[val];
        break;
      default:
        this.params.format = this.formats["DepthFormat"];
    }

    this.setupRenderTarget();
  }

  setTypes(val: "UnsignedShortType" | "UnsignedIntType" | "UnsignedInt248Type") {
    switch(val) {
      case "UnsignedShortType":
        this.params.type = this.types[val];
        break;
      case "UnsignedIntType":
        this.params.type = this.types[val];
        break;
      case "UnsignedInt248Type":
        this.params.type = this.types[val];
        break;
      default:
        this.params.type = this.types["UnsignedShortType"];
    }
    this.setupRenderTarget();
  }

  // 创建深度纹理的渲染目标
  private setupRenderTarget() {
    if (this.target) { this.target.dispose(); }

    // @ts-ignore
    const format = parseFloat(this.params.format);
    // @ts-ignore
    const type = parseFloat(this.params.type);

    // render target是一个缓冲，就是在这个缓冲中，视频卡为正在后台渲染的场景绘制像素。 
    // 它用于不同的效果，例如用于在一个图像显示在屏幕上之前先做一些处理
    // WebGLRenderTarget(width : Number, height : Number, options : Object)
    // width -renderTarget的宽度. Default is 1.
    // height - renderTarget的高度. Default is 1.
    // options - (可选)一个保存着自动生成的目标纹理的纹理参数以及表示是否使用深度缓存/模板缓存的布尔值的对象
    this.target = new THREE.WebGLRenderTarget(this.width, this.height);
    // 当一个纹素覆盖小于一个像素时，贴图将如何采样。 其默认值为THREE.NearestFilter
    this.target.texture.minFilter = THREE.NearestFilter;
    // 当一个纹素覆盖大于一个像素时，贴图将如何采样。 其默认值为THREE.NearestFilter
    this.target.texture.magFilter = THREE.NearestFilter;
    // .stencilBuffer : Boolean
    // 渲染到模板缓冲区。默认为false
    this.target.stencilBuffer = (format === THREE.DepthStencilFormat) ? true: false;
    // .depthTexture : DepthTexture
    // 如果设置，那么场景的深度将会被渲染到此纹理上。默认为null
    this.target.depthTexture = new THREE.DepthTexture(5, 5);
    // 深度纹理（DepthTexture）
    // format -- 这个值必须是DepthFormat（默认值）或者DepthStencilFormat。 
    // 请参阅format constants（格式常量）来了解详细信息。
    // @ts-ignore
    this.target.depthTexture.format = format;
    // @ts-ignore
    this.target.depthTexture.type = type;
  }

  // 创建渲染场景
  private setupScene() {
    const count = 50;
    const scale = 5;
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 64);
    const material = new THREE.MeshBasicMaterial({color: "blue"});

    this.scene = new THREE.Scene();

    for (let i = 0; i < count; i ++) {
      const mesh = new THREE.Mesh(geometry, material);

      const r = Math.random() * 2 * Math.PI;
      const z = (Math.random() * 2.0) - 1.0;
      const zScale = Math.sqrt(1.0 - z * z) * scale;

      mesh.position.set(Math.cos(r) * zScale, Math.sin(r) * zScale, z * scale);
      // .rotation : Euler
      // 物体的局部旋转，以弧度来表示
      mesh.rotation.set(Math.random(), Math.random(), Math.random());
      this.scene.add(mesh);
    }
  }

  // 设置Post
  private setupPost() {
    // 正交相机（OrthographicCamera）
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    // 着色器材质(ShaderMaterial)
    this.postMaterial = new THREE.ShaderMaterial({
      // 顶点着色器的GLSL代码。这是shader程序的实际代码
      vertexShader: this.vertexShader.trim(),
      // 片元着色器的GLSL代码。这是shader程序的实际代码
      fragmentShader: this.fragmentShader.trim(),
      uniforms: {
        cameraNear: { value: (this.camera as THREE.PerspectiveCamera).near },
        cameraFar: { value: (this.camera as THREE.PerspectiveCamera).far },
        tDiffuse: { value: null },
        tDepth: { value: null }
      }
    });

    const postPlane = new THREE.PlaneGeometry(2, 2);
    const postQuad = new THREE.Mesh(postPlane, this.postMaterial);

    this.postScene = new THREE.Scene();
    this.postScene.add(postQuad);
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

  // 开启动画
  private animate() {
    if (this.notSupport) { return false; }
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) {
      this.stats.update();
    }

    // 执行渲染
    if (this.renderer && this.scene && this.camera && this.target) {
      this.renderer.setRenderTarget(this.target);
      this.renderer.render(this.scene, this.camera);

      // render post FX
      if (this.postMaterial) {
        this.postMaterial.uniforms.tDiffuse.value = this.target.texture;
        this.postMaterial.uniforms.tDepth.value = this.target.depthTexture;
      }

      if (this.postScene && this.postCamera) {
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.postScene, this.postCamera);
      }
    }

    // 控制器更新
    if (this.controls) {
      this.controls.update();
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer && this.target) {
        const dpr = this.renderer.getPixelRatio();
				this.target.setSize(this.width * dpr, this.height * dpr);
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

