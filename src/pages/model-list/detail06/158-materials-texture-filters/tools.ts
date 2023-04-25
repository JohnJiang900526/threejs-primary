import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { showLoadingToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene1: THREE.Scene;
  private scene2: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private mouse: THREE.Vector2
  private half: THREE.Vector2
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene1 = new THREE.Scene();
    this.scene2 = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.mouse = new THREE.Vector2(0, 0);
    this.half=  new THREE.Vector2(this.width/2, this.height/2);
  }

  init(fn?: (num1: number, num2: number) => void) {
    // 场景
    this.scene1 = new THREE.Scene();
    this.scene1.background = new THREE.Color(0xf2f7ff);
    this.scene1.fog = new THREE.Fog(0xf2f7ff, 1, 25000);

    this.scene2 = new THREE.Scene();
    this.scene2.background = new THREE.Color(0xf2f7ff);
    this.scene2.fog = new THREE.Fog(0xf2f7ff, 1, 25000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(35, this.aspect, 1, 25000);
    this.camera.position.z = 1500;
    
    this.createRenderer();
    this.generateLight();
    this.generateGround(fn);


    this.bind();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];

        const x = e.clientX - this.half.x;
        const y = e.clientY - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        const x = e.clientX - this.half.x;
        const y = e.clientY - 45 - this.half.y;
        this.mouse.set(x, y);
      };
    }
  }

  private generateGround(fn?: (num1: number, num2: number) => void) {
    const { material1, material2, texture1, texture2 } = this.generateMaterial();
    const geometry = new THREE.PlaneGeometry(100, 100);

    const mesh1 = new THREE.Mesh(geometry, material1);
    mesh1.rotation.x = -Math.PI / 2;
    mesh1.scale.set(1000, 1000, 1000);

    const mesh2 = new THREE.Mesh(geometry, material2);
    mesh2.rotation.x = -Math.PI / 2;
    mesh2.scale.set(1000, 1000, 1000);

    this.scene1.add(mesh1);
    this.scene2.add(mesh2);

    fn && fn(texture1.anisotropy, texture2.anisotropy);
  }

  private generateMaterial() {
    const loader = new THREE.TextureLoader();
    const maxAnisotropy = this.renderer?.capabilities.getMaxAnisotropy() || 0;

    const texture1 = loader.load("/examples/textures/crate.gif");
    const material1 = new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture1});
    texture1.anisotropy = maxAnisotropy;
    texture1.wrapS = THREE.RepeatWrapping;
    texture1.wrapT = THREE.RepeatWrapping;
    texture1.repeat.set(512, 512);

    const texture2 = loader.load('/examples/textures/crate.gif');
    const material2 = new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture2 });
    texture2.anisotropy = 1;
    texture2.wrapS = THREE.RepeatWrapping;
    texture2.wrapT = THREE.RepeatWrapping;
    texture2.repeat.set(512, 512);

    return { material1, material2, texture1, texture2 };
  }

  private generateLight() {
    const ambient1 = new THREE.AmbientLight(0xeef0ff);
    const ambient2 = new THREE.AmbientLight(0xeef0ff);

    const light1 = new THREE.DirectionalLight(0xffffff, 2);
    light1.position.set(1, 1, 1);

    const light2 = new THREE.DirectionalLight(0xffffff, 2);
    light2.position.set(1, 1, 1);

    this.scene1.add(ambient1, light1);
    this.scene2.add(ambient2, light2);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.autoClear = true;
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
    
    // 执行渲染
    if (this.renderer && this.camera) {
      this.camera.position.x += (this.mouse.x - this.camera.position.x) * 0.05;
      this.camera.position.y = THREE.MathUtils.clamp(
        this.camera.position.y + (-(this.mouse.y - 200) - this.camera.position.y) * 0.05, 
        50, 1000
      );
      this.camera.lookAt(this.scene1.position);

      // .clear ( color : Boolean, depth : Boolean, stencil : Boolean ) : undefined
      // 告诉渲染器清除颜色、深度或模板缓存. 此方法将颜色缓存初始化为当前颜色。参数们默认都是true
      this.renderer.clear();
      // .setScissorTest ( boolean : Boolean ) : undefined
      // 启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响
      this.renderer.setScissorTest(true);

      // 场景1
      // .setScissor ( x : Integer, y : Integer, width : Integer, height : Integer ) : undefined
      // 将剪裁区域设为(x, y)到(x + width, y + height) 
      this.renderer.setScissor(0, 0, this.width/2 - 2, this.height);
			this.renderer.render(this.scene1, this.camera);

      // 场景2
      // .setScissor ( x : Integer, y : Integer, width : Integer, height : Integer ) : undefined
      // 将剪裁区域设为(x, y)到(x + width, y + height) 
      this.renderer.setScissor(this.width/2, 0, this.width/2 - 2, this.height);
			this.renderer.render(this.scene2, this.camera);

      // .setScissorTest ( boolean : Boolean ) : undefined
      // 启用或禁用剪裁检测. 若启用，则只有在所定义的裁剪区域内的像素才会受之后的渲染器影响
      this.renderer.setScissorTest(false);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      this.bind();
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

