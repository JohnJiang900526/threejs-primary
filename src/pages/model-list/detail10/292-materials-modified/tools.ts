import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
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
  private animateNumber: number;

  private controls: null | OrbitControls;
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
    this.animateNumber = 0;

    this.controls = null;
    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });
    this.gui.hide();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.01, 100);
    this.camera.position.z = 35;

    // 加载模型
    this.loadModel();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.enableDamping = true;
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

  private buildTwistMaterial(amount: number) {
    // 法线网格材质(MeshNormalMaterial)
    // 一种把法向量映射到RGB颜色的材质。
    const material = new THREE.MeshNormalMaterial();

    // .onBeforeCompile ( shader : Shader, renderer : WebGLRenderer ) : undefined
    // 在编译shader程序之前立即执行的可选回调。此函数使用shader源码作为参数。用于修改内置材质。
    // 和其他属性不一样的是，这个回调在.clone()，.copy() 和 .toJSON() 中不支持。
    material.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        float theta = sin( time + position.y ) / ${amount.toFixed(1)};
        float c = cos( theta );
        float s = sin( theta );
        mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );
        vec3 transformed = vec3( position ) * m;
        vNormal = vNormal * m;
        `
      );

      material.userData.shader = shader;
    };

    // 确保WebGLRenderer不重用单个程序
    // .customProgramCacheKey () : String
    // 当用到onBeforeCompile回调的时候，这个回调函数可以用来定义在onBeforeCompile中使用的配置项，
    // 这样three.js就可以根据这个回调返回的字符串来判定使用一个缓存的编译好的着色器代码还是根据需求
    // 重新编译一个新的着色器代码。
    material.customProgramCacheKey = () => `${amount}`;
    return material;
  }

  private loadModel() {
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });

    const loader = new GLTFLoader();
    const url = "/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb";
    loader.load(url, (gltf) => {
      toast.close();

      const mesh = gltf.scene.children[0] as THREE.Mesh;
      const geometry = mesh.geometry;

      {
        const mesh = new THREE.Mesh(geometry, this.buildTwistMaterial(2.0));
        mesh.name = "left_model";
        mesh.position.x = -3.5;
        mesh.position.y = -0.5;
        this.scene.add(mesh);
      }

      {
        const mesh = new THREE.Mesh(geometry, this.buildTwistMaterial(-2.0));
        mesh.name = "right_model"
        mesh.position.x = 3.5;
        mesh.position.y = -0.5;
        this.scene.add(mesh);
      }
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

    this.stats?.update();
    this.controls?.update();

    {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const timer = performance.now() / 1000;
          const shader = obj.material.userData.shader;

          if (shader) {
            shader.uniforms.time.value = timer;
          }
        }
      });
    }

    // 执行渲染
    this.renderer?.render(this.scene, this.camera!);
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

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

