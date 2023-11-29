import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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
  private geometry: THREE.InstancedBufferGeometry;
  private vertexShader: string;
  private fragmentShader: string;
  private instances: number;
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
    this.geometry = new THREE.InstancedBufferGeometry();
    this.vertexShader = `
      precision highp float;

      uniform float sineTime;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;

      attribute vec3 position;
      attribute vec3 offset;
      attribute vec4 color;
      attribute vec4 orientationStart;
      attribute vec4 orientationEnd;

      varying vec3 vPosition;
      varying vec4 vColor;

      void main(){
        vPosition = offset * max( abs( sineTime * 2.0 + 1.0 ), 0.5 ) + position;
        vec4 orientation = normalize( mix( orientationStart, orientationEnd, sineTime ) );
        vec3 vcV = cross( orientation.xyz, vPosition );
        vPosition = vcV * ( 2.0 * orientation.w ) + ( cross( orientation.xyz, vcV ) * 2.0 + vPosition );

        vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
      }
    `;
    this.fragmentShader = `
      precision highp float;

      uniform float time;
      
      varying vec3 vPosition;
      varying vec4 vColor;

      void main() {
        vec4 color = vec4( vColor );
        color.r += sin( vPosition.x * 10.0 + time ) * 0.5;

        gl_FragColor = color;
      }
    `;
    this.instances = 5000;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 0.01, 100);
    this.camera.position.z = 2;

    // 模型
    this.generateMesh();
    // 渲染器
    this.createRenderer();

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.setGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setGUI() {
    this.gui.add(this.geometry, 'instanceCount', 0, this.instances);
  }

  // 核心模块
  private generateMesh() {
    const vector = new THREE.Vector4();

    const positions = [];
    const offsets = [];
    const colors = [];
    const orientationsStart = [];
    const orientationsEnd = [];

    positions.push(0.025, -0.025, 0);
    positions.push(-0.025, 0.025, 0);
    positions.push(0, 0, 0.025);

    for (let i = 0; i < this.instances; i++) {
      // 偏移量
      offsets.push(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
      // 颜色
      colors.push(Math.random(), Math.random(), Math.random(), Math.random());

      // orientationStart 朝向 开始
      vector.set(
        Math.random() * 2 - 1, 
        Math.random() * 2 - 1, 
        Math.random() * 2 - 1, 
        Math.random() * 2 - 1,
      );
      vector.normalize();
      orientationsStart.push(vector.x, vector.y, vector.z, vector.w);

      // orientationEnd 朝向 结束
      vector.set(
        Math.random() * 2 - 1, 
        Math.random() * 2 - 1, 
        Math.random() * 2 - 1, 
        Math.random() * 2 - 1,
      );
      vector.normalize();
      orientationsEnd.push(vector.x, vector.y, vector.z, vector.w);
    }

    this.geometry.dispose();
    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.instanceCount = this.instances;

    const positionAttr = new THREE.Float32BufferAttribute(positions, 3);
    this.geometry.setAttribute('position', positionAttr);

    const offsetAttr = new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3);
    this.geometry.setAttribute('offset', offsetAttr);

    const colorAttr = new THREE.InstancedBufferAttribute(new Float32Array(colors), 4);
    this.geometry.setAttribute('color', colorAttr);

    const orientationStartAttr = new THREE.InstancedBufferAttribute(new Float32Array(orientationsStart), 4); 
    this.geometry.setAttribute('orientationStart', orientationStartAttr);

    const orientationEndAttr = new THREE.InstancedBufferAttribute(new Float32Array(orientationsEnd), 4); 
    this.geometry.setAttribute('orientationEnd', orientationEndAttr);

    const material = new THREE.RawShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        'time': { value: 1.0 },
        'sineTime': { value: 1.0 },
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });

    const mesh = new THREE.Mesh(this.geometry, material);
    mesh.name = "target_mesh";
    this.scene.add(mesh);
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
      const time = performance.now();

			const object = this.scene.getObjectByName("target_mesh") as THREE.Mesh;
      if (object) {
        object.rotation.y = time * 0.0005;

        const material = object.material as THREE.RawShaderMaterial;
        material.uniforms['time'].value = time * 0.005;
        material.uniforms['sineTime'].value = Math.sin(material.uniforms['time'].value * 0.05);
        object.material = material;
      }
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

