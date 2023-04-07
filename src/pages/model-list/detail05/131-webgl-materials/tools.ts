import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

type MaterialsType = THREE.MeshLambertMaterial | THREE.MeshPhongMaterial | THREE.MeshNormalMaterial | THREE.MeshBasicMaterial | THREE.MeshPhongMaterial | THREE.MeshDepthMaterial;

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private pointLight: THREE.PointLight
  private objects: THREE.Mesh[]
  private materials: MaterialsType[]
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.pointLight = new THREE.PointLight();
    this.objects = [];
    this.materials = [];
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 2000);
    this.camera.position.set(0, 200, 800);

    // help
    this.createHelper();

    // 创建光线
    this.createLight();

    // 创建材质
    this.createMaterials();

    // 创建球体
    this.createSpheres();

    // webgl渲染器
    this.createRenderer();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建球
  private createSpheres() {
    const geometry = new THREE.SphereGeometry(70, 32, 16);

    this.materials.forEach((material) => {
      this.addMesh(geometry, material);
    });
  }

  private addMesh(geometry: THREE.SphereGeometry, material: MaterialsType) {
    const { length } = this.objects;
    const mesh = new THREE.Mesh(geometry, material);

    const x = (length % 4) * 200 - 400;
    const { y } = mesh.position;
    const z = Math.floor(length / 4) * 200 - 200;

    mesh.position.set(x, y, z);
    mesh.rotation.set(
      Math.random() * 200 - 100,
      Math.random() * 200 - 100,
      Math.random() * 200 - 100,
    );

    this.objects.push(mesh);
    this.scene.add(mesh);
  }

  // 创建材质
  private createMaterials() {
    const texture = new THREE.Texture(this.generateTexture());
    texture.needsUpdate = true;

    this.materials = [];
    this.materials.push(new THREE.MeshLambertMaterial({ 
      map: texture, 
      transparent: true,
    }));

    this.materials.push(new THREE.MeshLambertMaterial({ 
      color: 0xdddddd 
    }));

    this.materials.push(new THREE.MeshPhongMaterial({ 
      color: 0xdddddd, 
      specular: 0x009900, 
      shininess: 30, 
      flatShading: true,
    }));

    this.materials.push(new THREE.MeshNormalMaterial());

    this.materials.push(new THREE.MeshBasicMaterial({ 
      color: 0xffaa00, 
      transparent: true, 
      blending: THREE.AdditiveBlending,
    }));

    this.materials.push(new THREE.MeshLambertMaterial({ 
      color: 0xdddddd,
    }));

    this.materials.push(new THREE.MeshPhongMaterial({ 
      color: 0xdddddd, 
      specular: 0x009900, 
      shininess: 30, 
      map: texture, 
      transparent: true,
    }));

    this.materials.push(new THREE.MeshNormalMaterial({ 
      flatShading: true,
    }));

    this.materials.push(new THREE.MeshBasicMaterial({ 
      color: 0xffaa00, 
      wireframe: true,
    }));

    this.materials.push(new THREE.MeshDepthMaterial());

    this.materials.push(new THREE.MeshLambertMaterial({ 
      color: 0x666666, 
      emissive: 0xff0000,
    }));

    this.materials.push(new THREE.MeshPhongMaterial({ 
      color: 0x000000, 
      specular: 0x666666, 
      emissive: 0xff0000, 
      shininess: 10, 
      opacity: 0.9, 
      transparent: true ,
    }));
    this.materials.push(new THREE.MeshBasicMaterial({ 
      map: texture, 
      transparent: true,
    }));
  }

  // 创建helper grid
  private createHelper() {
    const helper = new THREE.GridHelper(10000, 400, 0x303030, 0x303030);
    helper.position.y = -75;
    this.scene.add(helper);
  }

  // 创建灯光
  private createLight() {
    const ambient = new THREE.AmbientLight(0x111111);

    const dlight = new THREE.DirectionalLight(0xffffff, 0.125);
    dlight.position.x = Math.random() - 0.5;
    dlight.position.y = Math.random() - 0.5;
    dlight.position.z = Math.random() - 0.5;
    dlight.position.normalize();

    const geometry = new THREE.SphereGeometry(4, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mesh = new THREE.Mesh(geometry, material);
    this.pointLight = new THREE.PointLight(0xffffff, 1);
    this.pointLight.add(mesh);

    this.scene.add(ambient, dlight, this.pointLight);
  }

  // 创建canvas纹理
  private generateTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    const image = context?.getImageData(0, 0, 256, 256) as ImageData;

    let x = 0, y = 0;
    for (let i = 0, j = 0; i < image.data.length; i+= 4, j++) {
      x = j % 256;
      y = (x === 0) ? y + 1 : y;
      image.data[i] = 255;
      image.data[i + 1] = 255;
      image.data[i + 2] = 255;
      image.data[i + 3] = Math.floor(x ^ y);
    }
    context.putImageData(image, 0, 0);
    return canvas;
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

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    if (this.camera) {
      const timer = 0.0001 * Date.now();

      this.camera.position.x = Math.cos(timer) * 1000;
      this.camera.position.z = Math.sin(timer) * 1000;
      this.camera.lookAt(this.scene.position);

      this.objects.forEach((object) => {
        object.rotation.x += 0.01;
        object.rotation.y += 0.005;
      });

      // @ts-ignore
      this.materials[this.materials.length - 2].emissive.setHSL(
        0.54, 1, 0.35 * (0.5 + 0.5 * Math.sin(35 * timer))
      );
      // @ts-ignore
      this.materials[this.materials.length - 3].emissive.setHSL(
        0.04, 1, 0.35 * (0.5 + 0.5 * Math.cos(35 * timer))
      );

      this.pointLight.position.set(
        Math.sin( timer * 7 ) * 300,
        Math.cos( timer * 5 ) * 400,
        Math.cos( timer * 3 ) * 300,
      );
    }

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

