import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

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
  private mesh1: THREE.Mesh
  private mesh2: THREE.Mesh
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
    this.mesh1 = new THREE.Mesh();
    this.mesh2 = new THREE.Mesh();
  }

  init() {
    // 场景
    this.scene1 = new THREE.Scene();
    this.scene1.background = new THREE.Color(0x000000);
    this.scene1.fog = new THREE.Fog(0x000000, 1500, 4000);

    this.scene2 = new THREE.Scene();
    this.scene2.background = new THREE.Color(0x000000);
    this.scene2.fog = new THREE.Fog(0x000000, 1500, 4000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(60, this.aspect, 1, 5000);
    this.camera.position.z = 1800;
    
    this.generateGround();
    this.generateTexture();
    this.createRenderer();

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

  private mipmap(size: number, color: string) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;

    canvas.width = size;
    canvas.height = size;

    context.fillStyle = '#444';
    context.fillRect(0, 0, size, size);

    context.fillStyle = color;
    context.fillRect(0, 0, size/2, size/2);
    context.fillRect(size/2, size/2, size/2, size/2);
    return canvas;
  }

  // 本次案例核心
  private generateMaterial() {
    const canvas = this.mipmap(128, '#f00');
    const texture1 = new THREE.CanvasTexture(canvas);
    texture1.mipmaps = [
      canvas,
      this.mipmap(64, '#0f0'),
      this.mipmap(32, '#00f'),
      this.mipmap(16, '#400'),
      this.mipmap(8, '#040'),
      this.mipmap(4, '#004'),
      this.mipmap(2, '#044'),
      this.mipmap(1, '#404'),
    ];
    
    texture1.repeat.set(1000, 1000);
    texture1.wrapS = THREE.RepeatWrapping;
    texture1.wrapT = THREE.RepeatWrapping;

    const texture2 = texture1.clone();
    texture2.magFilter = THREE.NearestFilter;
    texture2.minFilter = THREE.NearestMipmapNearestFilter;

    const	material1 = new THREE.MeshBasicMaterial({ map: texture1 });
    const material2 = new THREE.MeshBasicMaterial({ color: 0xffccaa, map: texture2 });

    return { material1, material2, texture1, texture2 };
  }

  private generateGround() {
    const scale = 1000;
    const { material1, material2 } = this.generateMaterial();
    const geometry = new THREE.PlaneGeometry(100, 100);

    this.mesh1 = new THREE.Mesh(geometry, material1);
    this.mesh1.rotation.x = -Math.PI / 2;
    this.mesh1.scale.set(scale, scale, scale);

    this.mesh2 = new THREE.Mesh(geometry, material2);
    this.mesh2.rotation.x = -Math.PI / 2;
    this.mesh2.scale.set(scale, scale, scale);

    this.scene1.add(this.mesh1);
    this.scene2.add(this.mesh2);
  }

  private generateTexture() {
    const loader = new THREE.TextureLoader();
    const url = "/examples/textures/758px-Canestra_di_frutta_(Caravaggio).jpg";
    const texture1 = loader.load(url, () => {
      const image = texture1.image as HTMLImageElement;
      const y = -1.117 * image.height / 2;

      texture2.image = image;
      texture2.needsUpdate = true;
      
			this.mesh1.position.y = y;
      this.mesh2.position.y = y;

      addPainting(this.scene1, paintMesh1, image);
      addPainting(this.scene2, paintMesh2, image);
    });

    const texture2 = new THREE.Texture();
    
    texture1.minFilter = THREE.LinearFilter;
    texture1.magFilter = THREE.LinearFilter;
    texture1.mapping = THREE.UVMapping;

    texture2.minFilter = THREE.NearestFilter;
    texture2.magFilter = THREE.NearestFilter;

    const material1 = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture1 });
    const material2 = new THREE.MeshBasicMaterial({ color: 0xffccaa, map: texture2 });

    const geometry = new THREE.PlaneGeometry(100, 100);
    const paintMesh1 = new THREE.Mesh(geometry, material1);
    const paintMesh2 = new THREE.Mesh(geometry, material2);

    const addPainting = (scene: THREE.Scene, mesh: THREE.Mesh, image: HTMLImageElement) => {
      const x = image.width / 100;
      const y = image.height / 100;

      mesh.scale.x = x;
      mesh.scale.y = y;
      scene.add(mesh);

      const frameMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const frame = new THREE.Mesh(geometry, frameMaterial);
      frame.position.z = -10.0;
      frame.scale.x = 1.1 * x;
      frame.scale.y = 1.1 * y;

      const shadowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        opacity: 0.75, 
        transparent: true 
      });
      const shadow = new THREE.Mesh(geometry, shadowMaterial);
      shadow.position.y = -1.1 * image.height / 2;
      shadow.position.z = -1.1 * image.height / 2;
      shadow.rotation.x = -Math.PI / 2;
      shadow.scale.x = 1.1 * x;
      shadow.scale.y = 1.1 * y;

      scene.add(frame, shadow);
    };
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
      this.camera.position.y += (-(this.mouse.y - 200) - this.camera.position.y) * 0.05;
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

