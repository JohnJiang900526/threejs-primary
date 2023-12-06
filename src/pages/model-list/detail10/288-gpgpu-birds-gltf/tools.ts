import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';
import type { IUniform } from 'three';
import { showLoadingToast } from 'vant';
import { fragmentPosition, fragmentVelocity, vertexShader } from './vars';

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
  private WIDTH: number;
  private BIRDS: number;
  private BirdGeometry: THREE.BufferGeometry;
  private textureAnimation: THREE.DataTexture;
  private durationAnimation: number;
  private birdMesh: THREE.Mesh;
  private materialShader: any;
  private indicesPerBird: number;

  private gltfs: string[];
  private colors: number[];
  private sizes: number[];
  private selectModel: number;

  private mouse: THREE.Vector2;
  private half: THREE.Vector2;
  private BOUNDS: number;
  private BOUNDS_HALF: number;
  private last: number;
  private gpuCompute: null | GPUComputationRenderer;
  private velocityVariable: any;
  private positionVariable: any;
  private positionUniforms: { [uniform: string]: IUniform };
  private velocityUniforms: { [uniform: string]: IUniform };

  private params: {
    separation: number;
    alignment: number;
    cohesion: number;
    freedom: number;
    size: number;
    count: number;
  }

  private fragmentPosition: string;
  private fragmentVelocity: string;
  private vertexShader: string;
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
    this.WIDTH = 64;
    this.BIRDS = this.WIDTH * this.WIDTH;
    this.BirdGeometry = new THREE.BufferGeometry();
    this.textureAnimation = new THREE.DataTexture();
    this.durationAnimation = 0;
    this.birdMesh = new THREE.Mesh();
    this.materialShader = null;
    this.indicesPerBird = 0;

    this.gltfs = ['/examples/models/gltf/Parrot.glb', '/examples/models/gltf/Flamingo.glb'];
    this.colors = [0xccFFFF, 0xffdeff];
    this.sizes = [0.2, 0.1];
    this.selectModel = Math.floor(Math.random() * this.gltfs.length);

    this.mouse = new THREE.Vector2();
    this.half = new THREE.Vector2();
    this.BOUNDS = 800;
    this.BOUNDS_HALF = this.BOUNDS/2;
    this.last = performance.now();
    this.gpuCompute = null;
    this.velocityVariable = {};
    this.positionVariable = {}
    this.positionUniforms = {};
    this.velocityUniforms = {};

    this.params = {
      separation: 20.0,
      alignment: 20.0,
      cohesion: 20.0,
      freedom: 0.75,
      size: this.sizes[this.selectModel],
      count: Math.floor(this.BIRDS / 4)
    };

    this.fragmentPosition = fragmentPosition;
    this.fragmentVelocity = fragmentVelocity;
    this.vertexShader = vertexShader;
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.colors[this.selectModel]);
    this.scene.fog = new THREE.Fog(this.colors[this.selectModel], 100, 1000);

    // 相机
    this.camera = new THREE.PerspectiveCamera(75, this.aspect, 1, 3000);
    this.camera.position.z = 350;

    // 灯光
    this.generateLight();
    // 渲染器
    this.createRenderer();
    // 初始化
    this.initComputeRenderer();
    // 加载
    this.loadHandle();

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

  private loadHandle() {
    const toast = showLoadingToast({
      message: '加载中...',
      forbidClick: true,
      loadingType: 'spinner',
    });
    this.setBirdGeometry().then(() => {
      toast.close();

      this.initBirds();
      // 执行默认函数
      this.velocityHandle();

      this.setGUI();
    }).catch(() => {
      toast.close();
    });
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

  private velocityHandle() {
    this.velocityUniforms['separationDistance'].value = this.params.separation;
    this.velocityUniforms['alignmentDistance'].value = this.params.alignment;
    this.velocityUniforms['cohesionDistance'].value = this.params.cohesion;
    this.velocityUniforms['freedomFactor'].value = this.params.freedom;

    if (this.materialShader) {
      this.materialShader.uniforms['size'].value = this.params.size;
    }
    this.BirdGeometry.setDrawRange(0, this.indicesPerBird * this.params.count);
  }

  private setGUI() {
    this.gui.add(this.params, 'separation', 0.0, 100.0, 1.0).onChange(() => {
      this.velocityHandle();
    });
    this.gui.add(this.params, 'alignment', 0.0, 100, 0.001).onChange(() => {
      this.velocityHandle();
    });
    this.gui.add(this.params, 'cohesion', 0.0, 100, 0.025).onChange(() => {
      this.velocityHandle();
    });
    this.gui.add(this.params, 'size', 0, 1, 0.01).onChange(() => {
      this.velocityHandle();
    });
    this.gui.add(this.params, 'count', 0, this.BIRDS, 1).onChange(() => {
      this.velocityHandle();
    });
    this.gui.close();
  }

  private generateLight() {
    const light1 = new THREE.HemisphereLight(this.colors[this.selectModel], 0xffffff, 1.6);
    light1.color.setHSL(0.6, 1, 0.6);
    light1.groundColor.setHSL(0.095, 1, 0.75);
    light1.position.set(0, 50, 0);

    const light2 = new THREE.DirectionalLight(0x00CED1, 0.6);
    light2.color.setHSL(0.1, 1, 0.95);
    light2.position.set(- 1, 1.75, 1);
    light2.position.multiplyScalar(30);
   
    this.scene.add(light1, light2);
  }

  // 2次幂
  private nextPowerOf2(n: number) {
    return Math.pow(2, Math.ceil(Math.log(n) / Math.log(2)));
  }

  private lerp(value1: number, value2: number, amount: number) {
    const num = Math.max(Math.min(amount, 1), 0);
    return value1 + (value2 - value1) * num;
  }

  // 初始化 BirdGeometry 核心
  private async setBirdGeometry() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(this.gltfs[this.selectModel]);

    const animations = gltf.animations;
    this.durationAnimation = Math.round(animations[0].duration * 60);

    const birdGeo = (gltf.scene.children[0] as THREE.Mesh).geometry;
    const morphAttributes = birdGeo.morphAttributes.position;
    const h = this.nextPowerOf2(this.durationAnimation);
    const w = this.nextPowerOf2(birdGeo.getAttribute('position').count);

    this.indicesPerBird = birdGeo.index!.count;
    const data = new Float32Array(4 * w * h);

    for (let i = 0; i < w; i++) {
      for (let j = 0; j < h; j++) {
        const offset = j * w * 4;
        const curMorph = Math.floor(j / this.durationAnimation * morphAttributes.length);
        const nextMorph = (Math.floor(j / this.durationAnimation * morphAttributes.length) + 1) % morphAttributes.length;
        const lerpAmount = j / this.durationAnimation * morphAttributes.length % 1;

        if (j < this.durationAnimation) {
          let d0: undefined | number, d1: undefined | number;
          d0 = morphAttributes[curMorph].array[i * 3 + 0];
          d1 = morphAttributes[nextMorph].array[i * 3 + 0];

          if (d0 !== undefined && d1 !== undefined) {
            data[offset + i * 4 + 0] = this.lerp(d0, d1, lerpAmount);
          }

          d0 = morphAttributes[curMorph].array[i * 3 + 1];
          d1 = morphAttributes[nextMorph].array[i * 3 + 1];

          if (d0 !== undefined && d1 !== undefined) {
            data[offset + i * 4 + 1] = this.lerp(d0, d1, lerpAmount);
          }

          d0 = morphAttributes[curMorph].array[i * 3 + 2];
          d1 = morphAttributes[nextMorph].array[i * 3 + 2];

          if (d0 !== undefined && d1 !== undefined) {
            data[offset + i * 4 + 2] = this.lerp(d0, d1, lerpAmount);
          }

          data[offset + i * 4 + 3] = 1;
        }
      }
    }

    this.textureAnimation = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
    this.textureAnimation.needsUpdate = true;

    // 顶点
    const vertices: number[] = [];
    // 颜色
    const colors: number[] = [];
    // 参照
    const reference: number[] = [];
    // 种子
    const seeds: number[] = [];
    // 索引
    const indices: number[] = [];

    const position = birdGeo.getAttribute('position') as THREE.BufferAttribute;
    const color = birdGeo.getAttribute('color') as THREE.BufferAttribute;
    {
      // 顶点和颜色
      const totalVertices = position.count * 3 * this.BIRDS;
      for (let i = 0; i < totalVertices; i++) {
        const index = i % (position.count * 3);

        vertices.push(position.array[index]);
        colors.push(color.array[index]);
      }
    }

    {
      // 参照和种子
      const num = position.count * this.BIRDS;
      let r = Math.random();
      for (let i = 0; i < num; i++) {
        const bIndex = i % (position.count);
        const bird = Math.floor(i / position.count);
        if (bIndex === 0) {
          r = Math.random();
        }
        const x = (bird % this.WIDTH) / this.WIDTH;
        const y = (bird / this.WIDTH) / this.WIDTH;

        reference.push(x, y, bIndex / w, this.durationAnimation / h);
        seeds.push(bird, r, Math.random(), Math.random());
      }
    }

    {
      // 索引
      const index = birdGeo.index as THREE.BufferAttribute;
      const num = index!.array.length * this.BIRDS;
      for (let i = 0; i < num; i++) {
        const offset = Math.floor(i /index.array.length) * (position.count);
        indices.push(index.array[i % index.array.length] + offset);
      }
    }

    const positionAttr = new THREE.BufferAttribute(new Float32Array(vertices), 3);
    this.BirdGeometry.setAttribute('position', positionAttr);

    const birdColorAttr = new THREE.BufferAttribute(new Float32Array(colors), 3);
    this.BirdGeometry.setAttribute('birdColor', birdColorAttr);

    const colorAttr = new THREE.BufferAttribute(new Float32Array(colors), 3);
    this.BirdGeometry.setAttribute('color', colorAttr);

    const referenceAttr = new THREE.BufferAttribute(new Float32Array(reference), 4);
    this.BirdGeometry.setAttribute('reference', referenceAttr);

    const seedsAttr = new THREE.BufferAttribute(new Float32Array(seeds), 4);
    this.BirdGeometry.setAttribute('seeds', seedsAttr);

    this.BirdGeometry.setIndex(indices);
  }

  private fillPositionTexture(texture: THREE.DataTexture) {
    const array = texture.image.data;

    for (let k = 0; k < array.length; k += 4) {
      const x = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      const y = Math.random() * this.BOUNDS - this.BOUNDS_HALF;
      const z = Math.random() * this.BOUNDS - this.BOUNDS_HALF;

      array[k + 0] = x;
      array[k + 1] = y;
      array[k + 2] = z;
      array[k + 3] = 1;
    }
  }

  private fillVelocityTexture(texture: THREE.DataTexture) {
    const array = texture.image.data;

    for (let k = 0; k < array.length; k += 4) {
      const x = Math.random() - 0.5;
      const y = Math.random() - 0.5;
      const z = Math.random() - 0.5;

      array[k + 0] = x * 10;
      array[k + 1] = y * 10;
      array[k + 2] = z * 10;
      array[k + 3] = 1;
    }
  }

  private initComputeRenderer() {
    this.gpuCompute = new GPUComputationRenderer(this.WIDTH, this.WIDTH, this.renderer!);

    if (this.renderer!.capabilities.isWebGL2 === false) {
      this.gpuCompute.setDataType(THREE.HalfFloatType);
    }

    const dtPosition = this.gpuCompute.createTexture();
    const dtVelocity = this.gpuCompute.createTexture();

    this.fillPositionTexture(dtPosition);
    this.fillVelocityTexture(dtVelocity);

    this.positionVariable = this.gpuCompute.addVariable('texturePosition', this.fragmentPosition, dtPosition);
    this.velocityVariable = this.gpuCompute.addVariable('textureVelocity', this.fragmentVelocity, dtVelocity);

    this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);

    this.positionUniforms = this.positionVariable.material.uniforms;
    this.velocityUniforms = this.velocityVariable.material.uniforms;

    this.positionUniforms['time'] = { value: 0.0 };
    this.positionUniforms['delta'] = { value: 0.0 };

    this.velocityUniforms['time'] = { value: 1.0 };
    this.velocityUniforms['delta'] = { value: 0.0 };
    this.velocityUniforms['testing'] = { value: 1.0 };
    this.velocityUniforms['separationDistance'] = { value: 1.0 };
    this.velocityUniforms['alignmentDistance'] = { value: 1.0 };
    this.velocityUniforms['cohesionDistance'] = { value: 1.0 };
    this.velocityUniforms['freedomFactor'] = { value: 1.0 };
    this.velocityUniforms['predator'] = { value: new THREE.Vector3() };

    this.velocityVariable.material.defines.BOUNDS = this.BOUNDS.toFixed(2);

    this.positionVariable.wrapS = THREE.RepeatWrapping;
    this.positionVariable.wrapT = THREE.RepeatWrapping;

    this.velocityVariable.wrapS = THREE.RepeatWrapping;
    this.velocityVariable.wrapT = THREE.RepeatWrapping;

    const error = this.gpuCompute.init();
    if (error !== null) { console.error(error); }
  }

  private initBirds() {
    const geometry = this.BirdGeometry;

    const material = new THREE.MeshStandardMaterial({
      // 材质的粗糙程度。0.0表示平滑的镜面反射，1.0表示完全漫反射。
      // 默认值为1.0。如果还提供roughnessMap，则两个值相乘。
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      // 定义材质是否使用平面着色进行渲染。默认值为false。
      flatShading: true,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.texturePosition = { value: null };
      shader.uniforms.textureVelocity = { value: null };
      shader.uniforms.textureAnimation = { value: this.textureAnimation };
      shader.uniforms.time = { value: 1.0 };
      shader.uniforms.size = { value: this.params.size };
      shader.uniforms.delta = { value: 0.0 };
      shader.vertexShader = this.vertexShader;

      this.materialShader = shader;
    };

    this.birdMesh = new THREE.Mesh(geometry, material);
    this.birdMesh.rotation.y = Math.PI / 2;
    this.birdMesh.castShadow = true;
    this.birdMesh.receiveShadow = true;
    this.scene.add(this.birdMesh);
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

    {
      const now = performance.now();
      let delta = (now - this.last) / 1000;

      if (delta > 1) { delta = 1; }
      this.last = now;

      this.positionUniforms['time'].value = now;
      this.positionUniforms['delta'].value = delta;
      this.velocityUniforms['time'].value = now;
      this.velocityUniforms['delta'].value = delta;

      if (this.materialShader) {
        this.materialShader.uniforms['time'].value = now / 1000;
        this.materialShader.uniforms['delta'].value = delta;
      }

      const x = 0.5 * this.mouse.x / this.half.x;
      const y = -0.5 * this.mouse.y / this.half.y;
      this.velocityUniforms['predator'].value.set(x, y, 0);
      this.mouse.set(10000, 10000);

      this.gpuCompute!.compute();
      if (this.materialShader) {
        this.materialShader.uniforms['texturePosition'].value = this.gpuCompute!.getCurrentRenderTarget(this.positionVariable).texture;
        this.materialShader.uniforms['textureVelocity'].value = this.gpuCompute!.getCurrentRenderTarget(this.velocityVariable).texture;
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
      this.half.set(this.width/2, this.height/2);

      this.bind();

      this.camera!.aspect = this.aspect;
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
      this.camera!.updateProjectionMatrix();

      this.renderer!.setSize(this.width, this.height);
    };
  }
}

export default THREE;

