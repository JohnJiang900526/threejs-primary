import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer1: null | THREE.WebGLRenderer;
  private renderer2: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;

  private mesh1: THREE.Mesh
  private mesh2: THREE.Mesh
  private mesh3: THREE.Mesh
  private color: THREE.Color
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/(this.height/2);
    this.scene = new THREE.Scene();
    this.renderer1 = null;
    this.renderer2 = null;
    this.camera = null;
    this.stats = null;

    this.mesh1 = new THREE.Mesh();
    this.mesh2 = new THREE.Mesh();
    this.mesh3 = new THREE.Mesh();
    this.color = new THREE.Color();
  }

  init() {
    this.createRenderer();

    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 相机
    this.camera = new THREE.PerspectiveCamera(35, this.aspect, 1, 10000);
    // 光线
    this.generateLight();

    // 阴影
    this.createShadow();
    
    // 模型
    this.createModel();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private createModel() {
    const radius = 200;
    const geometry1 = new THREE.IcosahedronGeometry(radius, 1);
    const count = geometry1.attributes.position.count;
    geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

    const geometry2 = geometry1.clone();
    const geometry3 = geometry1.clone();

    const positions1 = geometry1.attributes.position as THREE.BufferAttribute;
    const positions2 = geometry2.attributes.position as THREE.BufferAttribute;
    const positions3 = geometry3.attributes.position as THREE.BufferAttribute;
    const colors1 = geometry1.attributes.color as THREE.BufferAttribute;
    const colors2 = geometry2.attributes.color as THREE.BufferAttribute;
    const colors3 = geometry3.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      this.color.setHSL((positions1.getY( i ) / radius + 1 ) / 2, 1.0, 0.5 );
      colors1.setXYZ(i, this.color.r, this.color.g, this.color.b );

      this.color.setHSL(0, (positions2.getY( i ) / radius + 1 ) / 2, 0.5 );
      colors2.setXYZ(i, this.color.r, this.color.g, this.color.b );

      this.color.setRGB(1, 0.8 - (positions3.getY( i ) / radius + 1 ) / 2, 0 );
      colors3.setXYZ(i, this.color.r, this.color.g, this.color.b );
    }

    const material = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      flatShading: true,
      vertexColors: true,
      shininess: 0,
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      wireframe: true, 
      transparent: true,
    });

    {
      this.mesh1 = new THREE.Mesh(geometry1, material);
      this.mesh1.position.x = -400;
      this.mesh1.rotation.x = -1.87;
      this.scene.add(this.mesh1);

      const wireframe1 = new THREE.Mesh(geometry1, wireframeMaterial);
      this.mesh1.add(wireframe1);
    }

    {
      this.mesh2 = new THREE.Mesh( geometry2, material );
      this.mesh2.position.x = 400;
      this.scene.add( this.mesh2 );

      const wireframe2 = new THREE.Mesh( geometry2, wireframeMaterial );
      this.mesh2.add( wireframe2 );
    }

    {
      this.mesh3 = new THREE.Mesh( geometry3, material );
      this.scene.add( this.mesh3 );

      const wireframe3 = new THREE.Mesh( geometry3, wireframeMaterial );
      this.mesh3.add( wireframe3 );
    }
  }

  private createShadow() {
    const canvas = this.createCanvas();
    const shadowTexture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: shadowTexture });
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
      mesh.position.y = - 250;
      mesh.rotation.x = - Math.PI / 2;
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
    gradient.addColorStop(0.1, 'rgba(210,210,210,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,1)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    return canvas;
  }

  private generateLight() {
    const light1 = new THREE.DirectionalLight(0xffffff);
    light1.position.set(0, 0, 1);

    const light2 = new THREE.DirectionalLight(0xffff00, 0.75);
    light2.position.set(0, 0, -1);

    this.scene.add(light1, light2);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer1 = new THREE.WebGLRenderer({ antialias: true });
    this.renderer1.setPixelRatio(window.devicePixelRatio);
    this.renderer1.setSize(this.width, this.height / 2);
    this.container.appendChild(this.renderer1.domElement);

    this.renderer2 = new THREE.WebGLRenderer();
    this.renderer2.setPixelRatio(window.devicePixelRatio);
    this.renderer2.setSize(this.width, this.height / 2);
    this.container.appendChild(this.renderer2.domElement);
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

    this.mesh1.rotation.z += Math.PI / 500;
    this.mesh2.rotation.z += Math.PI / 500;
    this.mesh3.rotation.z += Math.PI / 500;

    const position = new THREE.Vector3();
    const color = new THREE.Color();

    let time = performance.now() / 500;
    const positions = this.mesh3.geometry.attributes.position as THREE.BufferAttribute;
    const colors = this.mesh3.geometry.attributes.color as THREE.BufferAttribute;
    for ( let i = 0; i < positions.count; i++) {
      position.fromArray(positions.array, i * 3);
      color.setRGB(1, Math.sin(time + position.x), Math.cos(time * 2.123 + position.x));
      colors.setXYZ(i, color.r, color.g, color.b);
    }
    colors.needsUpdate = true;

    if (this.camera) {
      time = performance.now() / 2000;
      this.camera.position.x = Math.sin(time) * 1800;
      this.camera.position.z = Math.cos(time) * 1800;

      this.camera.lookAt(this.scene.position);
      this.renderer1?.render(this.scene, this.camera);
      this.renderer2?.render(this.scene, this.camera);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/(this.height/2);

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer1 && this.renderer2) {
        this.renderer1.setSize(this.width, this.height/2);
        this.renderer2.setSize(this.width, this.height/2);
      }
    };
  }
}

export default THREE;