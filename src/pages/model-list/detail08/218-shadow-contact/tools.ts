import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader';
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

  private controls: null | OrbitControls;
  private meshes: THREE.Mesh[];
  private PLANE_WIDTH: number;
  private PLANE_HEIGHT: number;
  private CAMERA_HEIGHT: number;
  private state: {
    shadow: {
      blur: number,
      darkness: number,
      opacity: number,
    },
    plane: {
      color: string,
      opacity: number
    },
    showWireframe: boolean,
  }
  private shadowGroup: THREE.Group;
  private renderTarget: THREE.WebGLRenderTarget;
  private renderTargetBlur: THREE.WebGLRenderTarget;
  private shadowCamera: null | THREE.OrthographicCamera;
  private cameraHelper: null | THREE.CameraHelper
  private depthMaterial: THREE.MeshDepthMaterial;
  private horizontalBlurMaterial: THREE.ShaderMaterial;
  private verticalBlurMaterial: THREE.ShaderMaterial;
  private plane: THREE.Mesh;
  private blurPlane: THREE.Mesh;
  private fillPlane: THREE.Mesh;
  private gui: GUI;
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
    this.meshes = [];
    this.PLANE_WIDTH = 2.5;
    this.PLANE_HEIGHT = 2.5;
    this.CAMERA_HEIGHT = 0.3;
    this.state = {
      shadow: {
        blur: 3.5,
        darkness: 1,
        opacity: 1,
      },
      plane: {
        color: '#ffffff',
        opacity: 1,
      },
      showWireframe: false,
    };
    this.shadowGroup = new THREE.Group();
    this.renderTarget = new THREE.WebGLRenderTarget();
    this.renderTargetBlur = new THREE.WebGLRenderTarget();
    this.shadowCamera = null;
    this.cameraHelper = null;
    this.depthMaterial = new THREE.MeshDepthMaterial();
    this.horizontalBlurMaterial = new THREE.ShaderMaterial();
    this.verticalBlurMaterial = new THREE.ShaderMaterial();
    this.plane = new THREE.Mesh();
    this.blurPlane = new THREE.Mesh();
    this.fillPlane = new THREE.Mesh();
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.1, 100);
    this.camera.position.set(0.5, 1, 4);

    // mesh
    this.createMeshes();
    // plane
    this.createPlane();

    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);

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

  private setUpGUI() {
    const shadowFolder = this.gui.addFolder('阴影');
    const planeFolder = this.gui.addFolder('地板');

    shadowFolder.add(this.state.shadow, 'blur', 0, 15, 0.1).name("模糊度")

    shadowFolder.add(this.state.shadow, 'darkness', 1, 5, 0.1).name("明亮度").onChange(() => {
      this.depthMaterial.userData.darkness.value = this.state.shadow.darkness;
    });

    shadowFolder.add(this.state.shadow, 'opacity', 0, 1, 0.01 ).name("透明度").onChange(() => {
      // @ts-ignore
      this.plane.material.opacity = this.state.shadow.opacity;
    });

    planeFolder.addColor(this.state.plane, 'color').name("颜色").onChange(() => {
      // @ts-ignore
      this.fillPlane.material.color = new THREE.Color(this.state.plane.color);
    });

    planeFolder.add(this.state.plane, 'opacity', 0, 1, 0.01).name("透明度").onChange(() => {
      // @ts-ignore
      this.fillPlane.material.opacity = this.state.plane.opacity;
    });

    this.gui.add(this.state, 'showWireframe').name("显示线框").onChange(() => {
      if (this.state.showWireframe) {
        this.scene.add(this.cameraHelper as THREE.CameraHelper);
      } else {
        this.scene.remove(this.cameraHelper as THREE.CameraHelper);
      }
    });
  }

  private createPlane() {
    this.shadowGroup.position.y = -0.3;
    this.scene.add(this.shadowGroup);

    // render target是一个缓冲，就是在这个缓冲中，视频卡为正在后台渲染的场景绘制像素。 
    // 它用于不同的效果，例如用于在一个图像显示在屏幕上之前先做一些处理
    this.renderTarget = new THREE.WebGLRenderTarget(512, 512);
    // 是否为纹理生成mipmap（如果可用）。默认为true。 如果你手动生成mipmap，请将其设为false
    this.renderTarget.texture.generateMipmaps = false;

    this.renderTargetBlur = new THREE.WebGLRenderTarget(512, 512);
    // 是否为纹理生成mipmap（如果可用）。默认为true。 如果你手动生成mipmap，请将其设为false
    this.renderTargetBlur.texture.generateMipmaps = false;

    const planeGeometry = new THREE.PlaneGeometry(this.PLANE_WIDTH, this.PLANE_HEIGHT).rotateX(Math.PI / 2);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: this.renderTarget.texture,
      opacity: this.state.shadow.opacity,
      transparent: true,
      depthWrite: false,
    } );
    this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.plane.renderOrder = 1;
    this.shadowGroup.add(this.plane);

    this.plane.scale.y = -1;
    this.blurPlane = new THREE.Mesh(planeGeometry);
    this.blurPlane.visible = false;
    this.shadowGroup.add(this.blurPlane);

    const fillPlaneMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      color: this.state.plane.color,
      opacity: this.state.plane.opacity,
    });
    this.fillPlane = new THREE.Mesh(planeGeometry, fillPlaneMaterial);
    this.fillPlane.rotateX(Math.PI);
    this.shadowGroup.add(this.fillPlane);

    this.shadowCamera = new THREE.OrthographicCamera(
      -this.PLANE_WIDTH / 2, this.PLANE_WIDTH / 2, 
      this.PLANE_HEIGHT / 2, - this.PLANE_HEIGHT / 2, 
      0, this.CAMERA_HEIGHT
    );
    this.shadowCamera.rotation.x = Math.PI / 2;
    this.shadowGroup.add(this.shadowCamera);
    this.cameraHelper = new THREE.CameraHelper(this.shadowCamera);

    this.depthMaterial = new THREE.MeshDepthMaterial();
    this.depthMaterial.userData.darkness = { 
      value: this.state.shadow.darkness 
    };
    this.depthMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.darkness = this.depthMaterial.userData.darkness;
      shader.fragmentShader = `
        uniform float darkness;
        ${shader.fragmentShader.replace(
          'gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );',
          'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'
        )}
      `;
    };

    // 是否在渲染此材质时启用深度测试。默认为 true。
    this.depthMaterial.depthTest = false;
    // 渲染此材质是否对深度缓冲区有任何影响。默认为true。
    this.depthMaterial.depthWrite = false;

    this.horizontalBlurMaterial = new THREE.ShaderMaterial(HorizontalBlurShader);
    this.horizontalBlurMaterial.depthTest = false;

    this.verticalBlurMaterial = new THREE.ShaderMaterial(VerticalBlurShader);
    this.verticalBlurMaterial.depthTest = false;
  }

  private createMeshes() {
    const material = new THREE.MeshNormalMaterial();
    const geometries = [
      new THREE.BoxGeometry(0.4, 0.4, 0.4),
      new THREE.IcosahedronGeometry(0.3),
      new THREE.TorusKnotGeometry(0.4, 0.05, 256, 24, 1, 3)
    ];

    geometries.forEach((geometry, i) => {
      const angle = (i / geometries.length) * Math.PI * 2;
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.set(
        Math.cos(angle) / 2.0,
        0.1,
        Math.sin(angle) / 2.0
      );
      this.scene.add(mesh);
      this.meshes.push(mesh);
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

  private blurShadow(amount: number = 0) {
    this.blurPlane.visible = true;

    
    if (this.renderer && this.shadowCamera) {
      {
        this.blurPlane.material = this.horizontalBlurMaterial;
        // @ts-ignore
        this.blurPlane.material.uniforms.tDiffuse.value = this.renderTarget.texture;
        this.horizontalBlurMaterial.uniforms.h.value = amount * 1 / 256;
        this.renderer.setRenderTarget(this.renderTargetBlur);
        this.renderer.render(this.blurPlane, this.shadowCamera);
      }
  
     {
        this.blurPlane.material = this.verticalBlurMaterial;
        // @ts-ignore
        this.blurPlane.material.uniforms.tDiffuse.value = this.renderTargetBlur.texture;
        this.verticalBlurMaterial.uniforms.v.value = amount * 1 / 256;
    
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.blurPlane, this.shadowCamera);
     }
    }
    this.blurPlane.visible = false;
  }

  private render() {
    this.meshes.forEach((mesh) => {
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.02;
    });

    if (this.cameraHelper && this.renderer && this.shadowCamera) {

      const initialBackground = this.scene.background;
      this.scene.background = null;
  
      this.cameraHelper.visible = false;
      this.scene.overrideMaterial = this.depthMaterial;
  
      const initialClearAlpha = this.renderer.getClearAlpha();
      this.renderer.setClearAlpha(0);
  
      this.renderer.setRenderTarget(this.renderTarget);
      this.renderer.render(this.scene, this.shadowCamera);
  
      this.scene.overrideMaterial = null;
      this.cameraHelper.visible = true;
  
      this.blurShadow(this.state.shadow.blur);
      this.blurShadow(this.state.shadow.blur * 0.4);
  
      this.renderer.setRenderTarget(null);
      this.renderer.setClearAlpha(initialClearAlpha);
      this.scene.background = initialBackground;
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.render();
    this.stats?.update();
    
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

