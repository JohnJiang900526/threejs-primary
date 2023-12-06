import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
import { 
  heightmapFragmentShader, 
  readWaterLevelFragmentShader, 
  smoothFragmentShader, 
  waterVertexShader, 
} from './vars';
import type { IUniform } from 'three';

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

  private gui: GUI;
  private readonly heightmapFragmentShader: string;
  private readonly smoothFragmentShader: string;
  private readonly readWaterLevelFragmentShader: string;
  private readonly waterVertexShader: string;

  private readonly WIDTH: number;
  private readonly BOUNDS: number;
  private readonly BOUNDS_HALF: number;
  private mouseMoved: boolean;
  private mouseCoords: THREE.Vector2;
  private raycaster: THREE.Raycaster;

  private waterNormal: THREE.Vector3;
  private NUM_SPHERES: number;
  private spheres: THREE.Mesh[];
  private spheresEnabled: boolean;
  private simplex: SimplexNoise;

  private waterMesh: THREE.Mesh;
  private meshRay: THREE.Mesh;
  private gpuCompute: null | GPUComputationRenderer;
  private heightmapVariable: any;
  private waterUniforms: { [uniform: string]: IUniform };
  private smoothShader: any;
  private readWaterLevelShader: any;
  private readWaterLevelRenderTarget: THREE.WebGLRenderTarget;
  private readWaterLevelImage: Uint8Array;

  private params: {
    mouseSize: number;
    viscosity: number;
    spheresEnabled: boolean;
  }
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

    this.gui = new GUI({
      title: "控制面板",
      autoPlace: false,
      container: this.container,
    });

    this.heightmapFragmentShader = heightmapFragmentShader;
    this.smoothFragmentShader = smoothFragmentShader
    this.readWaterLevelFragmentShader = readWaterLevelFragmentShader;
    this.waterVertexShader = waterVertexShader;

    this.WIDTH = 128;
    this.BOUNDS = 512;
    this.BOUNDS_HALF = this.BOUNDS / 2;
    this.mouseMoved = false;
    this.mouseCoords = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.waterNormal = new THREE.Vector3();
    this.NUM_SPHERES = 5;
    this.spheres = [];
    this.spheresEnabled = true;
    this.simplex = new SimplexNoise();

    this.waterMesh = new THREE.Mesh();
    this.meshRay = new THREE.Mesh();
    this.gpuCompute = null;
    this.heightmapVariable = {};
    this.waterUniforms = {};
    this.smoothShader = {};
    this.readWaterLevelShader = {};
    this.readWaterLevelRenderTarget = new THREE.WebGLRenderTarget(4, 1, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: false
    });
    this.readWaterLevelImage = new Uint8Array(4 * 1 * 4);

    this.params = {
      mouseSize: 20.0,
      viscosity: 0.98,
      spheresEnabled: this.spheresEnabled
    };
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();

    // 相机
    this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 1, 3000);
    this.camera.position.set(0, 200, 350);
    this.camera.lookAt(0, 0, 0);

    // 光线
    this.generateLight();
    // 渲染器
    this.createRenderer();
    // 初始化GpuCompute
    this.initGpuCompute();
    // 初始化水波
    this.initWater();
    this.changeHandle();
    this.createSpheres();

    this.bind();
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

  private bind() {
    if (this.isMobile()) {
      window.onpointermove = null;
      window.ontouchmove = (event) => {
        const e = event.touches[0];

        const x = e.clientX / this.width * 2 - 1;
        const y = -(e.clientY - 45) / this.height * 2 + 1;
  
        this.mouseCoords.set(x, y);
        this.mouseMoved = true;        
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        const x = e.clientX / this.width * 2 - 1;
        const y = -e.clientY / this.height * 2 + 1;
  
        this.mouseCoords.set(x, y);
        this.mouseMoved = true;
      };
    }
  }

  private changeHandle() {
    this.heightmapVariable.material.uniforms['mouseSize'].value = this.params.mouseSize;
    this.heightmapVariable.material.uniforms['viscosityConstant'].value = this.params.viscosity;
    this.spheresEnabled = this.params.spheresEnabled;

    for (let i = 0; i < this.NUM_SPHERES; i++) {
      if (this.spheres[i]) {
        this.spheres[i].visible = this.spheresEnabled;
      }
    }
  }

  private setGUI() {
    this.gui.add(this.params, 'mouseSize', 1.0, 100.0, 1.0).onChange(() => {
      this.changeHandle();
    });
    this.gui.add(this.params, 'viscosity', 0.9, 0.999, 0.001).onChange(() => {
      this.changeHandle();
    });
    this.gui.add(this.params, 'spheresEnabled', 0, 1, 1).onChange(() => {
      this.changeHandle();
    });
    const buttonSmooth = {
      smoothWater: () => {
        this.smoothWater();
      }
    };
    this.gui.add(buttonSmooth, 'smoothWater');
  }

  private smoothWater() {
    const currentRenderTarget = this.gpuCompute!.getCurrentRenderTarget(this.heightmapVariable);
    const alternateRenderTarget = this.gpuCompute!.getAlternateRenderTarget(this.heightmapVariable);

    for (let i = 0; i < 10; i++) {
      this.smoothShader.uniforms['smoothTexture'].value = currentRenderTarget.texture;
      this.gpuCompute!.doRenderTarget(this.smoothShader, alternateRenderTarget);

      this.smoothShader.uniforms['smoothTexture'].value = alternateRenderTarget.texture;
      this.gpuCompute!.doRenderTarget(this.smoothShader, currentRenderTarget);
    }
  }

  private generateLight() {
    const light1 = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light1.position.set(300, 400, 175);

    const light2 = new THREE.DirectionalLight(0x40A040, 0.6);
    light2.position.set(-100, 350, -200);

    this.scene.add(light1, light2);
  }

  private fillTexture(texture: THREE.DataTexture) {
    const waterMaxHeight = 10;

    const noise = (x: number, y: number) => {
      let multR = waterMaxHeight;
      let mult = 0.025;
      let r = 0;
      for (let i = 0; i < 15; i++) {
        r += multR * this.simplex.noise(x * mult, y * mult);
        multR *= 0.53 + 0.025 * i;
        mult *= 1.25;
      }
      return r;
    }

    const pixels = texture.image.data;

    let p = 0;
    for (let j = 0; j < this.WIDTH; j++) {
      for (let i = 0; i < this.WIDTH; i++) {
        const x = i * 128 / this.WIDTH;
        const y = j * 128 / this.WIDTH;

        pixels[p + 0] = noise(x, y);
        pixels[p + 1] = pixels[p + 0];
        pixels[p + 2] = 0;
        pixels[p + 3] = 1;
        p += 4;
      }
    }
  }

  private initGpuCompute() {
    this.gpuCompute = new GPUComputationRenderer(this.WIDTH, this.WIDTH, this.renderer!);
    if (this.renderer!.capabilities.isWebGL2 === false) {
      this.gpuCompute.setDataType(THREE.HalfFloatType);
    }
    const heightmap0 = this.gpuCompute.createTexture();

    this.fillTexture(heightmap0);

    this.heightmapVariable = this.gpuCompute.addVariable('heightmap', this.heightmapFragmentShader, heightmap0);

    this.gpuCompute.setVariableDependencies(this.heightmapVariable, [this.heightmapVariable]);

    this.heightmapVariable.material.uniforms['mousePos'] = { value: new THREE.Vector2(10000, 10000) };
    this.heightmapVariable.material.uniforms['mouseSize'] = { value: 20.0 };
    this.heightmapVariable.material.uniforms['viscosityConstant'] = { value: 0.98 };
    this.heightmapVariable.material.uniforms['heightCompensation'] = { value: 0 };
    this.heightmapVariable.material.defines.BOUNDS = this.BOUNDS.toFixed(1);

    const error = this.gpuCompute.init();
    if (error !== null) { console.error(error); }
  }

  private initWater() {
    const materialColor = 0x0040C0;
    const geometry = new THREE.PlaneGeometry(this.BOUNDS, this.BOUNDS, this.WIDTH - 1, this.WIDTH - 1);

    // ShaderMaterial克隆THREE。MeshPhongMaterial，带有自定义顶点着色器
    const material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([
        THREE.ShaderLib['phong'].uniforms,
        {
          'heightmap': { value: null }
        }
      ]),
      vertexShader: this.waterVertexShader,
      fragmentShader: THREE.ShaderChunk['meshphong_frag']
    });

    material.lights = true;

    Object.assign(material, {
      shininess: 50,
      color: new THREE.Color(materialColor),
      specular: new THREE.Color(0x111111),
    });

    // @ts-ignore
    material.uniforms['diffuse'].value = material.color;
    // @ts-ignore
    material.uniforms['specular'].value = material.specular;
    // @ts-ignore
    material.uniforms['shininess'].value = Math.max(material.shininess, 1e-4);
    material.uniforms['opacity'].value = material.opacity;

    // 定义
    material.defines.WIDTH = this.WIDTH.toFixed(1);
    material.defines.BOUNDS = this.BOUNDS.toFixed(1);

    {
      this.waterUniforms = material.uniforms;
      this.waterMesh = new THREE.Mesh(geometry, material);
      this.waterMesh.rotation.x = -Math.PI / 2;
      this.waterMesh.matrixAutoUpdate = false;
      this.waterMesh.updateMatrix();
      this.scene.add(this.waterMesh);
    }

    {
      const geometryRay = new THREE.PlaneGeometry(this.BOUNDS, this.BOUNDS, 1, 1);
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF, 
        visible: false,
      });
      this.meshRay = new THREE.Mesh(geometryRay, material);
      this.meshRay.rotation.x = -Math.PI / 2;
      this.meshRay.matrixAutoUpdate = false;
      this.meshRay.updateMatrix();
      this.scene.add(this.meshRay);
    }

    {
      this.smoothShader = this.gpuCompute!.createShaderMaterial(this.smoothFragmentShader, { 
        smoothTexture: { value: null } 
      });

      // 创建计算着色器读取水位
      this.readWaterLevelShader = this.gpuCompute!.createShaderMaterial(this.readWaterLevelFragmentShader, {
        point1: { value: new THREE.Vector2() },
        levelTexture: { value: null }
      });
      this.readWaterLevelShader.defines.WIDTH = this.WIDTH.toFixed(1);
      this.readWaterLevelShader.defines.BOUNDS = this.BOUNDS.toFixed(1);
    }
  }

  private createSpheres() {
    const geometry = new THREE.SphereGeometry(4, 24, 12);
    const material = new THREE.MeshPhongMaterial({ color: 0xFFFF00 });
    const mesh = new THREE.Mesh(geometry, material);

    for (let i = 0; i < this.NUM_SPHERES; i++) {
      let sphere = mesh;
      if (i < this.NUM_SPHERES - 1) {
        sphere = mesh.clone();
      }

      sphere.position.x = (Math.random() - 0.5) * this.BOUNDS * 0.7;
      sphere.position.z = (Math.random() - 0.5) * this.BOUNDS * 0.7;

      sphere.userData.velocity = new THREE.Vector3();
      this.scene.add(sphere);
      this.spheres[i] = sphere;
    }
  }

  private sphereDynamics() {
    const currentRenderTarget = this.gpuCompute!.getCurrentRenderTarget(this.heightmapVariable);

    this.readWaterLevelShader.uniforms['levelTexture'].value = currentRenderTarget.texture;

    for (let i = 0; i < this.NUM_SPHERES; i++) {
      const sphere = this.spheres[i];

      if (sphere) {
        const u = 0.5 * sphere.position.x / this.BOUNDS_HALF + 0.5;
        const v = 1 - (0.5 * sphere.position.z / this.BOUNDS_HALF + 0.5);

        this.readWaterLevelShader.uniforms['point1'].value.set(u, v);
        this.gpuCompute!.doRenderTarget(this.readWaterLevelShader, this.readWaterLevelRenderTarget);
        this.renderer!.readRenderTargetPixels(this.readWaterLevelRenderTarget, 0, 0, 4, 1, this.readWaterLevelImage);
        
        const pixels = new Float32Array(this.readWaterLevelImage.buffer);
        this.waterNormal.set(pixels[1], 0, - pixels[2]);

        const pos = sphere.position;
        pos.y = pixels[0];

        // 移动球体
        this.waterNormal.multiplyScalar(0.1);
        sphere.userData.velocity.add(this.waterNormal);
        sphere.userData.velocity.multiplyScalar(0.998);
        pos.add(sphere.userData.velocity);

        if (pos.x < -this.BOUNDS_HALF) {
          pos.x = -this.BOUNDS_HALF + 0.001;
          sphere.userData.velocity.x *= - 0.3;
        } else if (pos.x > this.BOUNDS_HALF) {
          pos.x = this.BOUNDS_HALF - 0.001;
          sphere.userData.velocity.x *= - 0.3;
        }

        if (pos.z < -this.BOUNDS_HALF) {
          pos.z = -this.BOUNDS_HALF + 0.001;
          sphere.userData.velocity.z *= - 0.3;
        } else if (pos.z > this.BOUNDS_HALF) {
          pos.z = this.BOUNDS_HALF - 0.001;
          sphere.userData.velocity.z *= - 0.3;
        }
      }
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

  private render() {
    const uniforms = this.heightmapVariable.material.uniforms;
    if (this.mouseMoved) {
      this.raycaster.setFromCamera(this.mouseCoords, this.camera!);
      const intersects = this.raycaster.intersectObject(this.meshRay);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        uniforms['mousePos'].value.set(point.x, point.z);
      } else {
        uniforms['mousePos'].value.set(10000, 10000);
      }
      this.mouseMoved = false;
    } else {
      uniforms['mousePos'].value.set(10000, 10000);
    }

    // 做gpu计算
    this.gpuCompute!.compute();
    if (this.spheresEnabled) {
      this.sphereDynamics();
    }

    // 获得自定义统一的计算输出
    this.waterUniforms['heightmap'].value = this.gpuCompute!.getCurrentRenderTarget(this.heightmapVariable).texture;

  }

  // 持续动画
  private animate() {
    this.animateNumber && window.cancelAnimationFrame(this.animateNumber);
    this.animateNumber = window.requestAnimationFrame(() => { this.animate(); });

    this.stats?.update();

    this.render();

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

      this.bind();

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

