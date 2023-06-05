import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

interface IViewType {
  left: number,
  bottom: number,
  width: number,
  height: number,
  background: THREE.Color,
  eye: [number, number, number],
  up: [number, number, number],
  fov: number,
  camera?: THREE.PerspectiveCamera,
  updateCamera: (camera: THREE.PerspectiveCamera, scene: THREE.Scene, mouseX: number) => void
}

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private mouse: THREE.Vector2
  private views: IViewType[];
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.mouse = new THREE.Vector2();
    this.views = [
      {
        left: 0,
        bottom: 0,
        width: 0.5,
        height: 1.0,
        background: new THREE.Color(0.5, 0.5, 0.7),
        eye: [0, 300, 1800],
        up: [0, 1, 0],
        fov: 30,
        updateCamera: (camera, scene, mouseX) => {
          camera.position.x += mouseX * 0.05;
          camera.position.x = Math.max(Math.min( camera.position.x, 2000 ), -2000);
          camera.lookAt(scene.position);
        }
      },
      {
        left: 0.5,
        bottom: 0,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color( 0.7, 0.5, 0.5 ),
        eye: [0, 1800, 0],
        up: [0, 0, 1],
        fov: 45,
        updateCamera: (camera, scene, mouseX) => {
          camera.position.x -= mouseX * 0.05;
          camera.position.x = Math.max(Math.min(camera.position.x, 2000), -2000);
          camera.lookAt(camera.position.clone().setY(0));
        }
      },
      {
        left: 0.5,
        bottom: 0.5,
        width: 0.5,
        height: 0.5,
        background: new THREE.Color( 0.5, 0.7, 0.7 ),
        eye: [1400, 800, 1400],
        up: [0, 1, 0],
        fov: 60,
        updateCamera: (camera, scene, mouseX) => {
          camera.position.y -= mouseX * 0.05;
          camera.position.y = Math.max(Math.min(camera.position.y, 1600), -1600);
          camera.lookAt(scene.position);
        }
      }
    ];
  }

  init() {
    // 渲染器
    this.createRenderer();

    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.views.forEach((view) => {
      const camera = new THREE.PerspectiveCamera(view.fov, this.aspect, 1, 10000);
      camera.position.fromArray(view.eye);
      camera.up.fromArray(view.up);
      view.camera = camera;
    });

    // 灯光
    this.generateLight();
    // 阴影
    this.generateShadow();
    // 模型
    this.generateMeshes();

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

  private generateMeshes() {
    const radius = 200;
    const geometry1 = new THREE.IcosahedronGeometry(radius, 1);
    const count = geometry1.attributes.position.count;
    geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

    const geometry2 = geometry1.clone();
    const geometry3 = geometry1.clone();

    const color = new THREE.Color();
    const positions1 = geometry1.attributes.position as THREE.BufferAttribute;
    const positions2 = geometry2.attributes.position as THREE.BufferAttribute;
    const positions3 = geometry3.attributes.position as THREE.BufferAttribute;
    const colors1 = geometry1.attributes.color as THREE.BufferAttribute;
    const colors2 = geometry2.attributes.color as THREE.BufferAttribute;
    const colors3 = geometry3.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < count; i ++) {
      color.setHSL((positions1.getY(i) / radius + 1) / 2, 1.0, 0.5);
      colors1.setXYZ(i, color.r, color.g, color.b);

      color.setHSL(0, (positions2.getY(i) / radius + 1) / 2, 0.5);
      colors2.setXYZ(i, color.r, color.g, color.b);

      color.setRGB(1, 0.8 - (positions3.getY(i) / radius + 1) / 2, 0);
      colors3.setXYZ(i, color.r, color.g, color.b);
    }

    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      flatShading: true,
      vertexColors: true,
      shininess: 0
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      wireframe: true, 
      transparent: true 
    });

    {
      const mesh = new THREE.Mesh(geometry1, material);
      const wireframe = new THREE.Mesh(geometry1, wireframeMaterial);
      mesh.add(wireframe);
      mesh.position.x = - 400;
      mesh.rotation.x = - 1.87;
      this.scene.add(mesh);
    }

    {
      const mesh = new THREE.Mesh(geometry2, material);
      const wireframe = new THREE.Mesh(geometry2, wireframeMaterial);
      mesh.add(wireframe);
      mesh.position.x = 400;
      this.scene.add(mesh);
    }

    {
      const mesh = new THREE.Mesh(geometry3, material);
      const wireframe = new THREE.Mesh(geometry3, wireframeMaterial);
      mesh.add(wireframe);
      this.scene.add(mesh);
    }
  }

  private generateShadow() {
    const canvas = this.createCanvas();
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(300, 300, 1, 1);

    {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = -250;
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
    }

    {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = -400;
      mesh.position.y = -250;
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
    }

    {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = 400;
      mesh.position.y = -250;
      mesh.rotation.x = -Math.PI / 2;
      this.scene.add(mesh);
    }
  }

  private createCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    const x0 = canvas.width / 2;
    const y0 = canvas.height / 2;
    const r0 = 0;
    const x1 = canvas.width / 2;
    const y1 = canvas.height / 2;
    const r1 = canvas.width / 2;

    const gradient = context.createRadialGradient(x0, y0, r0, x1, y1, r1);
    gradient.addColorStop(0.1, 'rgba(0,0,0,0.15)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    return canvas;
  }

  private generateLight() {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0, 1);

    this.scene.add(light);
  }

  private bind() {
    window.onpointermove = (e) => {
      const x = (e.clientX - this.width / 2);
			const y = (e.clientY - 45 - this.height / 2);
      this.mouse.set(x, y);
    };
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
    
    this.render();
  }

  private render() {
    this.views.forEach((view) => {
      const camera = view.camera as THREE.PerspectiveCamera;

      view.updateCamera(camera, this.scene, this.mouse.x);

      const left = Math.floor(this.width * view.left);
      const bottom = Math.floor(this.height * view.bottom);
      const width = Math.floor(this.width * view.width);
      const height = Math.floor(this.height * view.height);

      this.renderer?.setViewport(left, bottom, width, height);
      this.renderer?.setScissor(left, bottom, width, height);
      this.renderer?.setScissorTest(true);
      this.renderer?.setClearColor(view.background);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      this.renderer?.render(this.scene, camera);
    });
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

