import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private raycaster: THREE.Raycaster
  private pointer: THREE.Vector2
  private mesh: THREE.Mesh
  private line: THREE.Line
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
    this.mesh = new THREE.Mesh();
    this.line = new THREE.Line();
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.Fog(0x050505, 2000, 3500);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(50, this.width/this.height, 1, 35000);
    this.camera.position.z = 2500;

    // 创建光源
    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(1, 1, 1);
    this.scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
    light2.position.set(0, -1, 0);
    this.scene.add(light2);

    this.scene.add(new THREE.AmbientLight(0x444444));

    // 创建几何 核心
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

  // 创建几何 核心
  private createGeometry() {
    const triangles = 5000;
    let geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(triangles * 3 * 3);
    const normals = new Float32Array(triangles * 3 * 3);
    const colors = new Float32Array(triangles * 3 * 3);

    const color = new THREE.Color();

    const n = 800, n2 = n / 2;
    const d = 120, d2 = d / 2;

    const pA = new THREE.Vector3();
    const pB = new THREE.Vector3();
    const pC = new THREE.Vector3();

    const cb = new THREE.Vector3();
    const ab = new THREE.Vector3();

    for (let i = 0; i < positions.length; i += 9) {
      // 位置
      const x = Math.random() * n - n2;
      const y = Math.random() * n - n2;
      const z = Math.random() * n - n2;

      const ax = x + Math.random() * d - d2;
      const ay = y + Math.random() * d - d2;
      const az = z + Math.random() * d - d2;

      const bx = x + Math.random() * d - d2;
      const by = y + Math.random() * d - d2;
      const bz = z + Math.random() * d - d2;

      const cx = x + Math.random() * d - d2;
      const cy = y + Math.random() * d - d2;
      const cz = z + Math.random() * d - d2;

      positions[i ] = ax;
      positions[i + 1] = ay;
      positions[i + 2] = az;

      positions[i + 3] = bx;
      positions[i + 4] = by;
      positions[i + 5] = bz;

      positions[i + 6] = cx;
      positions[i + 7] = cy;
      positions[i + 8] = cz;

      // 平面法线
      pA.set(ax, ay, az);
      pB.set(bx, by, bz);
      pC.set(cx, cy, cz);

      cb.subVectors(pC, pB);
      ab.subVectors(pA, pB);
      cb.cross(ab);

      cb.normalize();

      const nx = cb.x;
      const ny = cb.y;
      const nz = cb.z;

      normals[i] = nx;
      normals[i + 1] = ny;
      normals[i + 2] = nz;

      normals[i + 3] = nx;
      normals[i + 4] = ny;
      normals[i + 5] = nz;

      normals[i + 6] = nx;
      normals[i + 7] = ny;
      normals[i + 8] = nz;

      // 颜色
      const vx = (x / n) + 0.5;
      const vy = (y / n) + 0.5;
      const vz = (z / n) + 0.5;

      color.setRGB(vx, vy, vz);

      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;

      colors[i + 3] = color.r;
      colors[i + 4] = color.g;
      colors[i + 5] = color.b;

      colors[i + 6] = color.r;
      colors[i + 7] = color.g;
      colors[i + 8] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeBoundingSphere();

    let material: THREE.MeshPhongMaterial| THREE.LineBasicMaterial = new THREE.MeshPhongMaterial({
      color: 0xaaaaaa, 
      specular: 0xffffff, 
      shininess: 250,
      side: THREE.DoubleSide, 
      vertexColors: true
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute( new Float32Array(4 * 3), 3));
    material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true});
    this.line = new THREE.Line(geometry, material);
    this.scene.add(this.line);
  }

  // 事件绑定
  private bind() {
    if (this.isMobile()) {
      this.container.onmousemove = null;
      this.container.ontouchmove = (event) => {
        const e = event.touches[0];

        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = - ((e.clientY - 45) / this.height) * 2 + 1;
      };
    } else {
      this.container.ontouchmove = null;
      this.container.onmousemove = (e) => {
        this.pointer.x = (e.clientX / this.width) * 2 - 1;
				this.pointer.y = - ((e.clientY - 45) / this.height) * 2 + 1;
      }
    }
  } 

  // 性能统计
  private initStats() {
    this.stats = Stats();
    this.stats.domElement.style.position = "absolute";
    this.container.appendChild(this.stats.domElement);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    if (this.camera) {
      const time = Date.now() * 0.001;
      this.mesh.rotation.x = time * 0.15;
      this.mesh.rotation.y = time * 0.25;
      this.raycaster.setFromCamera(this.pointer, this.camera);
    }
    const intersects = this.raycaster.intersectObject(this.mesh);

    if ( intersects.length > 0 ) {
      const intersect = intersects[ 0 ];
      const face = intersect.face as THREE.Face;

      const linePosition = this.line.geometry.attributes.position as THREE.BufferAttribute;
      const meshPosition = this.mesh.geometry.attributes.position as THREE.BufferAttribute;

      linePosition.copyAt(0, meshPosition, face.a);
      linePosition.copyAt(1, meshPosition, face.b);
      linePosition.copyAt(2, meshPosition, face.c);
      linePosition.copyAt(3, meshPosition, face.a);

      this.mesh.updateMatrix();
      this.line.geometry.applyMatrix4(this.mesh.matrix);
      this.line.visible = true;
    } else {
      this.line.visible = false;
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
      // 事件绑定
      this.bind();

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
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

