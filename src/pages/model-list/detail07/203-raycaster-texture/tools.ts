import GUI from 'lil-gui';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

class CanvasTexture {
  private _canvas: HTMLCanvasElement
  private _context2D: CanvasRenderingContext2D 
  private _xCross: number
  private _yCross: number

  private _crossRadius: number
  private _crossMax: number
  private _crossMin: number
  private _crossThickness: number

  private _parentTexture: THREE.Texture[]
  private _background: HTMLImageElement
  constructor(parentTexture: THREE.Texture) {
    this._canvas = document.createElement('canvas');
    this._canvas.width = 1024;
    this._canvas.height = 1024;
    this._context2D = this._canvas.getContext('2d') as CanvasRenderingContext2D ;
    this._xCross = 0;
    this._yCross = 0;
    this._crossRadius = 57;
    this._crossMax = 40;
    this._crossMin = 4;
    this._crossThickness = 4;
    this._parentTexture = [];

    if ( parentTexture ) {
      this._parentTexture.push(parentTexture);
      parentTexture.image = this._canvas;
    }

    this._background = document.createElement('img');
    this._background.crossOrigin = '';
		this._background.src = '/examples/textures/uv_grid_opengl.jpg';
    this._background.onload = () => {
      const that = this;
      that._canvas.width = that._background.naturalWidth;
      that._canvas.height = that._background.naturalHeight;

      that._crossRadius = Math.ceil( Math.min( that._canvas.width, that._canvas.height / 30 ) );
      that._crossMax = Math.ceil( 0.70710678 * that._crossRadius );
      that._crossMin = Math.ceil( that._crossMax / 10 );
      that._crossThickness = Math.ceil( that._crossMax / 10 );
      that._draw();
    };
  }

  addParent (parentTexture: THREE.Texture) {
    if ( this._parentTexture.indexOf(parentTexture) === -1) {
      this._parentTexture.push(parentTexture);
      parentTexture.image = this._canvas;
    }
  }

  setCrossPosition(x: number, y: number) {
    this._xCross = x * this._canvas.width;
    this._yCross = y * this._canvas.height;
    this._draw();
  }

  _draw() {
    if (!this._context2D ) return;
    this._context2D.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context2D.drawImage(this._background, 0, 0);
    this._context2D.lineWidth = this._crossThickness * 3;
    this._context2D.strokeStyle = '#FFFF00';

    this._context2D.beginPath();
    this._context2D.moveTo(this._xCross - this._crossMax - 2, this._yCross - this._crossMax - 2);
    this._context2D.lineTo(this._xCross - this._crossMin, this._yCross - this._crossMin);

    this._context2D.moveTo(this._xCross + this._crossMin, this._yCross + this._crossMin);
    this._context2D.lineTo(this._xCross + this._crossMax + 2, this._yCross + this._crossMax + 2);

    this._context2D.moveTo(this._xCross - this._crossMax - 2, this._yCross + this._crossMax + 2);
    this._context2D.lineTo(this._xCross - this._crossMin, this._yCross + this._crossMin);

    this._context2D.moveTo(this._xCross + this._crossMin, this._yCross - this._crossMin);
    this._context2D.lineTo(this._xCross + this._crossMax + 2, this._yCross - this._crossMax - 2);

    this._context2D.stroke();
    for (let i = 0; i < this._parentTexture.length; i++) {
      this._parentTexture[i].needsUpdate = true;
    }
  }
}

export class Model {
  private width: number;
  private height: number;
  private aspect: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private stats: null | Stats;

  private WRAPPING: {
    'RepeatWrapping': number
    'ClampToEdgeWrapping': number
    'MirroredRepeatWrapping': number
  }
  private params: {
    wrapS: number
    wrapT: number
    offsetX: number
    offsetY: number
    repeatX: number
    repeatY: number
    rotation: number
  }
  private canvas: null | CanvasTexture
  private planeTexture: THREE.Texture
  private cubeTexture: THREE.Texture
  private circleTexture: THREE.Texture
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private onClickPosition: THREE.Vector2
  private gui: GUI
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = new THREE.PerspectiveCamera();
    this.stats = null;

    this.WRAPPING = {
      'RepeatWrapping': THREE.RepeatWrapping,
      'ClampToEdgeWrapping': THREE.ClampToEdgeWrapping,
      'MirroredRepeatWrapping': THREE.MirroredRepeatWrapping
    };
    this.params = {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
      offsetX: 0,
      offsetY: 0,
      repeatX: 1,
      repeatY: 1,
      rotation: 0,
    };
    this.canvas = null;
    this.planeTexture = new THREE.Texture();
    this.cubeTexture = new THREE.Texture();
    this.circleTexture = new THREE.Texture();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.onClickPosition = new THREE.Vector2();
    this.gui = new GUI({
      container: this.container,
      autoPlace: false,
      title: "控制面板"
    });
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, this.aspect, 1, 1000);
    this.camera.position.set(-60, 80, 100);
    this.camera.lookAt(this.scene.position);

    this.createModel();
    // 渲染器
    this.createRenderer();

    this.bind();
    this.setUpGUI();
    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  private setUpGUI() {
    this.gui.add(this.params, 'wrapS', this.WRAPPING ).onChange((value: THREE.Wrapping) => {
      this.setwrapS(value);
    });
    this.gui.add( this.params, 'wrapT', this.WRAPPING ).onChange((value: THREE.Wrapping) => {
      this.setwrapT(value);
    });
    this.gui.add(this.params, 'offsetX', 0, 5);
    this.gui.add(this.params, 'offsetY', 0, 5);
    this.gui.add(this.params, 'repeatX', 0, 5);
    this.gui.add(this.params, 'repeatY', 0, 5);
    this.gui.add(this.params, 'rotation', 0, 2 * Math.PI);
  }

  // 核心
  private createModel() {
    // A cube, in the middle.
    this.cubeTexture = new THREE.Texture(undefined, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );
    this.canvas = new CanvasTexture(this.cubeTexture);

    const cubeMaterial = new THREE.MeshBasicMaterial({ map: this.cubeTexture });
    const cubeGeometry = new THREE.BoxGeometry(20, 20, 20);
    let uvs = (cubeGeometry.attributes.uv as THREE.BufferAttribute).array;

    // @ts-ignore
    for ( let i = 0; i < uvs.length; i ++ ) { uvs[i] *= 2; }
    const cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
    cube.position.set(4, -5, 0);
    this.scene.add(cube);

    // A plane on the left
    this.planeTexture = new THREE.Texture( undefined, THREE.UVMapping, THREE.MirroredRepeatWrapping, THREE.MirroredRepeatWrapping );
    this.canvas.addParent( this.planeTexture );
    const planeMaterial = new THREE.MeshBasicMaterial( { map: this.planeTexture } );
    const planeGeometry = new THREE.PlaneGeometry( 25, 25, 1, 1 );
    uvs = (planeGeometry.attributes.uv as THREE.BufferAttribute).array;

    // @ts-ignore
    for ( let i = 0; i < uvs.length; i ++ ) { uvs[i] *= 2; }
    const plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.position.set(-16, -5, 0);
    this.scene.add(plane);

    // A circle on the right.
    this.circleTexture = new THREE.Texture(undefined, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );
    this.canvas.addParent(this.circleTexture );
    const circleMaterial = new THREE.MeshBasicMaterial({ map: this.circleTexture });
    const circleGeometry = new THREE.CircleGeometry( 25, 40, 0, Math.PI * 2 );
    uvs = (circleGeometry.attributes.uv as THREE.BufferAttribute).array;

    for ( let i = 0; i < uvs.length; i ++ ) {
      // @ts-ignore
      uvs[i] = (uvs[i] - 0.25) * 2;
    }

    const circle = new THREE.Mesh( circleGeometry, circleMaterial );
    circle.position.set(24, -5, 0);
    this.scene.add( circle );
  }

  private bind() {
    window.onclick = (e) => {
      this.onMouseMove(e);
    };
    if (this.isMobile()) {
      window.ontouchmove = (event) => {
        const e = event.touches[0];
        this.onMouseMove(e);
      };
    } else {
      window.ontouchmove = null;
      window.onpointermove = (e) => {
        this.onMouseMove(e);
      };
    }
  }

  // 核心
  private onMouseMove(e: MouseEvent | Touch | PointerEvent) {
    const array = this.getMousePosition(this.container, e.clientX, e.clientY - 45);
    this.onClickPosition.fromArray(array);

    const intersects = this.getIntersects(this.onClickPosition, this.scene.children);
    if (intersects.length > 0 && intersects[0].uv) {
      const uv = intersects[0].uv;
      // @ts-ignore
      (intersects[0].object as THREE.Mesh).material.map.transformUv(uv);
      this.canvas?.setCrossPosition(uv.x, uv.y);
    }
  }

  private getMousePosition (dom: HTMLDivElement, x: number, y: number) {
    const rect = dom.getBoundingClientRect();
		return [( x - rect.left ) / rect.width, (y - rect.top) / rect.height];
  }

  private getIntersects(point: THREE.Vector2, objects: THREE.Object3D[]) {
    this.mouse.set((point.x * 2) - 1, - (point.y * 2) + 1);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(objects, false);
  }

  private setwrapS(value: THREE.Wrapping) {
    this.circleTexture.wrapS = value;
    this.circleTexture.needsUpdate = true;
  }
  private setwrapT(value: THREE.Wrapping) {
    this.circleTexture.wrapT = value;
    this.circleTexture.needsUpdate = true;
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

    this.circleTexture.offset.x = this.params.offsetX;
    this.circleTexture.offset.y = this.params.offsetY;
    this.circleTexture.repeat.x = this.params.repeatX;
    this.circleTexture.repeat.y = this.params.repeatY;
    this.circleTexture.rotation = this.params.rotation;

    this.stats?.update();
    
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

      this.bind();
      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

