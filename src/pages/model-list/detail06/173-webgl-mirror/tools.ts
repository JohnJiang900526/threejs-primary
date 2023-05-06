import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Reflector } from 'three/examples/jsm/objects/Reflector';

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
  private sphereGroup: THREE.Object3D
  private smallSphere: THREE.Mesh
  private groundMirror: Reflector
  private verticalMirror: Reflector
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
    this.sphereGroup = new THREE.Object3D();
    this.smallSphere = new THREE.Mesh();
    this.groundMirror = new Reflector()
    this.verticalMirror = new Reflector();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 1, 500);
    this.camera.position.set(0, 75, 160);

    this.generateLight();
    this.generateMirrors();
    this.generateWalls();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.target.set(0, 40, 0);
    this.controls.maxDistance = 400;
    this.controls.minDistance = 10;
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

  private generateLight() {
    const mainLight = new THREE.PointLight(0xcccccc, 1.5, 250);
    mainLight.position.y = 60;

    const greenLight = new THREE.PointLight(0x00ff00, 0.25, 1000);
    greenLight.position.set(550, 50, 0);

    const redLight = new THREE.PointLight(0xff0000, 0.25, 1000);
    redLight.position.set(-550, 50, 0);

    const blueLight = new THREE.PointLight(0x7f7fff, 0.25, 1000);
    blueLight.position.set(0, 50, 550);

    this.scene.add(mainLight, greenLight, redLight, blueLight);
  }
  // 核心
  private generateMirrors() {
    {
      const geometry = new THREE.CircleGeometry(40, 64);
      this.groundMirror = new Reflector(geometry, {
        clipBias: 0.003,
        color: 0x777777,
        textureWidth: this.width * window.devicePixelRatio,
        textureHeight: this.height * window.devicePixelRatio,
      });
      this.groundMirror.position.y = 0.5;
      this.groundMirror.rotateX(-Math.PI / 2);
      this.scene.add(this.groundMirror);
    }

    {
      const geometry = new THREE.PlaneGeometry(100, 100);
      this.verticalMirror = new Reflector(geometry, {
        clipBias: 0.003,
        color: 0x889999,
        textureWidth: this.width * window.devicePixelRatio,
        textureHeight: this.height * window.devicePixelRatio,
      });
      this.verticalMirror.position.y = 50;
      this.verticalMirror.position.z = -50;
      this.scene.add(this.verticalMirror);
    }

    {
      this.sphereGroup = new THREE.Object3D();
			this.scene.add(this.sphereGroup);
    }

    {
      const geometry1 = new THREE.CylinderGeometry(0.1, 15 * Math.cos( Math.PI / 180 * 30 ), 0.1, 24, 1);
      const material1 = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        emissive: 0x444444 
      });
      const sphereCap = new THREE.Mesh(geometry1, material1);
      sphereCap.position.y = -15 * Math.sin(Math.PI / 180 * 30) - 0.05;
      sphereCap.rotateX(-Math.PI);

      const geometry2 = new THREE.SphereGeometry(15, 24, 24, Math.PI / 2, Math.PI * 2, 0, Math.PI / 180 * 120 );
      const halfSphere = new THREE.Mesh(geometry2, material1);
      halfSphere.add(sphereCap);
      halfSphere.rotateX(-Math.PI / 180 * 135);
      halfSphere.rotateZ(-Math.PI / 180 * 20);
      halfSphere.position.y = 7.5 + 15 * Math.sin(Math.PI / 180 * 30);
      this.sphereGroup.add(halfSphere);

      // 二十面缓冲几何体（IcosahedronGeometry）
      const geometry3 = new THREE.IcosahedronGeometry(5, 0);
      const material3 = new THREE.MeshPhongMaterial({ 
        color: 0xffffff, 
        // 材质的放射（光）颜色，基本上是不受其他光照影响的固有颜色。默认为黑色
        emissive: 0x333333, 
        // 定义材质是否使用平面着色进行渲染。默认值为false
        flatShading: true,
      });
      this.smallSphere = new THREE.Mesh(geometry3, material3);
      this.scene.add(this.smallSphere);
    }
  }
  // 核心
  private generateWalls() {
    const geometry = new THREE.PlaneGeometry(100.1, 100.1);

    {
      const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
      const planeTop = new THREE.Mesh(geometry, material);
      planeTop.position.y = 100;
      planeTop.rotateX(Math.PI / 2);
      this.scene.add(planeTop);
    }

    {
      const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
      const planeBottom = new THREE.Mesh(geometry, material);
      planeBottom.rotateX(-Math.PI / 2);
      this.scene.add(planeBottom);
    }

    {
      const material = new THREE.MeshPhongMaterial({ color: 0x7f7fff });
      const planeFront = new THREE.Mesh(geometry, material);
      planeFront.position.z = 50;
      planeFront.position.y = 50;
      planeFront.rotateY(Math.PI);
      this.scene.add(planeFront);
    }

    {
      const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
      const planeRight = new THREE.Mesh(geometry, material);
      planeRight.position.x = 50;
      planeRight.position.y = 50;
      planeRight.rotateY(-Math.PI / 2);
      this.scene.add(planeRight);
    }

    {
      const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
      const planeLeft = new THREE.Mesh(geometry, material);
      planeLeft.position.x = -50;
      planeLeft.position.y = 50;
      planeLeft.rotateY(Math.PI / 2);
      this.scene.add(planeLeft);
    }
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

    const timer = Date.now() * 0.01;
    this.sphereGroup.rotation.y -= 0.002;
    this.smallSphere.position.set(
      Math.cos(timer * 0.1) * 30,
      Math.abs(Math.cos(timer * 0.2)) * 20 + 5,
      Math.sin(timer * 0.1) * 30
    );
    this.smallSphere.rotation.y = (Math.PI / 2) - timer * 0.1;
    this.smallSphere.rotation.z = timer * 0.8;

    this.stats?.update();
    this.controls?.update();
    
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

        this.groundMirror.getRenderTarget().setSize(
					this.width * window.devicePixelRatio,
					this.height * window.devicePixelRatio,
				);
				this.verticalMirror.getRenderTarget().setSize(
					this.width * window.devicePixelRatio,
					this.height * window.devicePixelRatio,
				);
      }
    };
  }
}

export default THREE;

