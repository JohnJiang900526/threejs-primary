import * as THREE from 'three';
import GUI from 'lil-gui';
// @ts-ignore
import init from './offscreen/scene';
import { showFailToast } from 'vant';

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private canvas1: HTMLCanvasElement;
  private canvas2: HTMLCanvasElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats;
  private animateNumber: number;

  private gui: GUI;
  constructor(container: HTMLDivElement, canvas1: HTMLCanvasElement, canvas2: HTMLCanvasElement) {
    this.container = container;
    this.canvas1 = canvas1;
    this.canvas2 = canvas2;
    this.width = this.canvas1.offsetWidth;
    this.height = this.canvas1.offsetHeight;
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
    this.gui.hide();
  }

  init() {
    init(this.canvas1, this.width, this.height, window.devicePixelRatio, '/examples/');

    // offscreen
    if ('transferControlToOffscreen' in this.canvas2) {
      // @ts-ignore
      const offscreen = this.canvas2?.transferControlToOffscreen();
      const worker = new Worker(new URL('./offscreen/offscreen.js', import.meta.url), { 
        type: 'module' 
      });
      worker.postMessage({
        drawingSurface: offscreen,
        width: this.canvas2.clientWidth,
        height: this.canvas2.clientHeight,
        pixelRatio: window.devicePixelRatio,
        path: "/examples/"
      }, [offscreen]);
    } else {
      showFailToast({
        message: `canvas中不存在【transferControlToOffscreen】属性`,
        forbidClick: true,
        loadingType: 'spinner',
      });
    }
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
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
    };
  }
}

export default THREE;

