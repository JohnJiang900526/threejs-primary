import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.OrthographicCamera;
  private stats: null | Stats;
  private raycaster: THREE.Raycaster
  private pointer: THREE.Vector2
  private theta: number
  private INTERSECTED: null | THREE.Mesh
  private radius: number
  private frustumSize: number
  private aspect: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.theta = 0;
    this.INTERSECTED = null;
    this.radius = 500;
    this.frustumSize = 1000;
    this.aspect = this.width/this.height;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    this.camera = new THREE.OrthographicCamera(
      this.frustumSize * this.aspect / -2, 
      this.frustumSize * this.aspect / 2, 
      this.frustumSize / 2, 
      this.frustumSize / -2, 
      1, 1000
    );

    // 创建灯光
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    this.scene.add(light);

    // 创建几何
    this.createGeometry();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 事件绑定
    this.bind();
    // 性能统计
    this.initStats();
    // 动画
    this.animate();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建几何
  private createGeometry() {
    const geometry = new THREE.BoxGeometry(20, 20, 20);

    for (let i = 0; i < 2000; i++) {
      const object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
        color: Math.random() * 0xffffff
      }));

      // 控制位置
      object.position.x = Math.random() * 800 - 400;
      object.position.y = Math.random() * 800 - 400;
      object.position.z = Math.random() * 800 - 400;

      // 控制旋转朝向
      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      // 控制长宽高
      object.scale.x = Math.random() + 0.5;
      object.scale.y = Math.random() + 0.5;
      object.scale.z = Math.random() + 0.5;
      // 加入场景
      this.scene.add(object);
    }
  }


  // 事件绑定
  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchstart = (event) => {
        const e = event.touches[0];

        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = - ((e.clientY - 45) / this.height) * 2 + 1;
      };
    } else {
      window.ontouchstart = null;
      window.onpointermove = (e) => {
        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = - ((e.clientY - 45) / this.height) * 2 + 1;
      }
    }
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

    if (this.camera) {
      // 视角旋转
      this.theta += 0.1;
      // .degToRad ( degrees : Float ) : Float
      // 将度转化为弧度
      this.camera.position.x = this.radius * Math.sin(THREE.MathUtils.degToRad(this.theta));
      this.camera.position.y = this.radius * Math.sin(THREE.MathUtils.degToRad(this.theta));
      this.camera.position.z = this.radius * Math.cos(THREE.MathUtils.degToRad(this.theta));
      this.camera.lookAt(this.scene.position);
      this.camera.updateMatrixWorld();

      // 获取目标
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, false);
      if (intersects.length > 0) {
        if (this.INTERSECTED != intersects[0].object as THREE.Mesh) {
          if (this.INTERSECTED) {
            // @ts-ignore
            (this.INTERSECTED.material as THREE.Material).emissive.setHex(this.INTERSECTED.currentHex);
          }
          this.INTERSECTED = intersects[0].object as THREE.Mesh;
          // @ts-ignore
          this.INTERSECTED.currentHex = this.INTERSECTED.material.emissive.getHex();
          // @ts-ignore
          this.INTERSECTED.material.emissive.setHex(0xff0000);
        }
      } else {
        if (this.INTERSECTED) {
          // @ts-ignore
          (this.INTERSECTED.material as THREE.Material).emissive.setHex(this.INTERSECTED.currentHex);
        }
        
        this.INTERSECTED = null;
      }
    }

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      // 绑定事件
      this.bind();

      if (this.camera) {
				this.camera.left = -this.frustumSize * this.aspect / 2;
				this.camera.right = this.frustumSize * this.aspect / 2;
				this.camera.top = this.frustumSize / 2;
				this.camera.bottom = -this.frustumSize / 2;

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

