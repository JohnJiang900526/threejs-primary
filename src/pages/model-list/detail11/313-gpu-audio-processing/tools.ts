import * as THREE from 'three';
import GUI from 'lil-gui';
import Stats from 'three/examples/jsm/libs/stats.module';
import {
  ShaderNode, compute,
  uniform, element, storage, instanceIndex,
  float, assign, add, sub, div, mul, texture, viewportTopLeft, color
} from 'three/examples/jsm/nodes/Nodes';
// @ts-ignore
import WebGPU from 'three/examples/jsm/capabilities/WebGPU';
// @ts-ignore
import WebGPURenderer from 'three/examples/jsm/renderers/webgpu/WebGPURenderer';
import { showFailToast } from 'vant';


export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | WebGPURenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private gui: GUI;
  private computeNode: any;
  private waveBuffer: Float32Array;
  private sampleRate: number;
  private waveGPUBuffer: THREE.InstancedBufferAttribute;
  private currentAudio: null | AudioBufferSourceNode;
  private currentAnalyser: null | AnalyserNode;
  private analyserBuffer: Uint8Array;
  private analyserTexture: THREE.DataTexture;

  private pitch: any;
  private delayVolume: any;
  private delayOffset: any;
  private initBgNode: boolean;
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
    this.computeNode = {};
    this.waveBuffer = new Float32Array();
    this.sampleRate = 0;
    this.waveGPUBuffer = new THREE.InstancedBufferAttribute(new Float32Array(), 0);
    this.currentAudio = null;
    this.currentAnalyser = null;
    this.analyserBuffer = new Uint8Array(1024);
    this.analyserTexture = new THREE.DataTexture();

    this.pitch = uniform(1.5);
    this.delayVolume = uniform(0.20);
    this.delayOffset = uniform(0.55);
    this.initBgNode = false;
  }

  init() {
    if (!WebGPU.isAvailable()) {
      showFailToast(WebGPU.getErrorMessage());
      return false;
    }

    // 场景
    this.scene = new THREE.Scene();
    this.initNodes();

    // 相机
    this.camera = new THREE.PerspectiveCamera(45, this.aspect, 0.01, 30);

    // 渲染器
    this.createRenderer();

    this.setGUI();
    this.initStats();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  startHandle() {
    this.initBuffer().then(() => {
      this.playAudio();
    });
  }

  private setGUI() {
    this.gui.add(this.pitch, 'value', 0.5, 2, 0.01).name('pitch');
    this.gui.add(this.delayVolume, 'value', 0, 1, 0.01).name('delayVolume');
    this.gui.add(this.delayOffset, 'value', 0.1, 1, 0.01).name('delayOffset');

    this.gui.add(this, "startHandle").name("开始执行");
  }

  private initNodes() {
    this.analyserTexture = new THREE.DataTexture(
      this.analyserBuffer, 
      this.analyserBuffer.length, 
      1, THREE.RedFormat,
    );

    if (this.initBgNode) {
      const spectrum = mul(texture(this.analyserTexture, viewportTopLeft.x).x, viewportTopLeft.y);
      const backgroundNode = mul(color(0x0000FF), spectrum);
      Object.assign(this.scene, { backgroundNode: backgroundNode });
    }
  }

  // 核心
  private async initBuffer() {
    const url = "/examples/sounds/webgpu-audio-processing.mp3";
    const soundBuffer = await fetch(url).then((data) => {
      return data.arrayBuffer();
    });
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(soundBuffer);

    this.waveBuffer = audioBuffer.getChannelData(0);
    this.waveBuffer = new Float32Array([...this.waveBuffer, ...new Float32Array(200000)]);
    this.sampleRate = audioBuffer.sampleRate / audioBuffer.numberOfChannels;

    this.waveGPUBuffer = new THREE.InstancedBufferAttribute(this.waveBuffer, 1);
    // @ts-ignore
    const waveStorageNode = storage(this.waveGPUBuffer, 'float', this.waveBuffer.length);
    const tempBuffer = new THREE.InstancedBufferAttribute(this.waveBuffer, 1)
    // @ts-ignore
    const waveNode = storage(tempBuffer, 'float', this.waveBuffer.length);

    // @ts-ignore
    const computeShaderNode = new ShaderNode((inputs, builder) => {
      const index = float(instanceIndex);
      const time = mul(index, this.pitch);

      let wave = element(waveNode, time);

      for (let i = 1; i < 7; i++) {
        const indexNode = mul(sub(index, mul(mul(this.delayOffset, this.sampleRate), i)), this.pitch);
        const offset = element(waveNode, indexNode);
        const offsetVolume = mul(offset, div(this.delayVolume, i * i));
        wave = add(wave, offsetVolume);
      }
      // store
      const waveStorageElementNode = element(waveStorageNode, instanceIndex);
      assign(waveStorageElementNode, wave).build(builder);
    });

    // @ts-ignore
    this.computeNode = compute(computeShaderNode, this.waveBuffer.length);
  }

  // 核心
  private async playAudio() {
    if (this.currentAudio) { 
      this.currentAudio.stop(); 
    }

    this.renderer.compute(this.computeNode);

    const waveArray = await this.renderer.getArrayFromBuffer(this.waveGPUBuffer);
    const audioOutputContext = new AudioContext({sampleRate: this.sampleRate});
    const audioOutputBuffer = audioOutputContext.createBuffer(1, waveArray.length, this.sampleRate);
    audioOutputBuffer.copyToChannel(waveArray, 0);

    const source = audioOutputContext.createBufferSource();
    source.connect(audioOutputContext.destination);
    source.buffer = audioOutputBuffer;
    // 开始播放
    source.start();

    this.currentAudio = source;
    // 创建分析器
    this.currentAnalyser = audioOutputContext.createAnalyser();
    this.currentAnalyser.fftSize = 2048;
    source.connect(this.currentAnalyser);
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new WebGPURenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setAnimationLoop(() => { this.render(); });
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

  // 渲染
  private render() {
    this.stats?.update();

    if (this.currentAnalyser) {
      this.currentAnalyser.getByteFrequencyData(this.analyserBuffer);
      this.analyserTexture.needsUpdate = true;
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

