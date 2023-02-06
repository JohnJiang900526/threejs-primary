import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
			import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private controls: null | OrbitControls
  private transformControl: null | TransformControls
  private stats: null | Stats
  private splineHelperObjects: THREE.Mesh[]
  private splinePointsLength: number
  private positions: THREE.Vector3[]
  private point: THREE.Vector3
  private raycaster: THREE.Raycaster
  private pointer: THREE.Vector2
  private onUpPosition: THREE.Vector2
  private onDownPosition: THREE.Vector2
  private geometry: THREE.BoxGeometry
  private ARC_SEGMENTS: number
  private splines: {
    uniform: THREE.CatmullRomCurve3,
    centripetal: THREE.CatmullRomCurve3,
    chordal: THREE.CatmullRomCurve3
  }
  private params: {
    uniform: boolean,
    tension: number,
    centripetal: boolean,
    chordal: boolean,
    addPoint: () => void,
    removePoint: () => void,
    exportSpline: () => void
  }

  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.controls = null;
    this.transformControl = null;
    this.stats = null;
    this.splineHelperObjects = [];
    this.splinePointsLength = 4;
    this.positions = [];
    this.point = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.onUpPosition = new THREE.Vector2();
    this.onDownPosition = new THREE.Vector2();
    this.geometry = new THREE.BoxGeometry(20, 20, 20);
    this.ARC_SEGMENTS = 200;
    this.splines = {
      uniform: new THREE.CatmullRomCurve3(),
      centripetal: new THREE.CatmullRomCurve3(),
      chordal: new THREE.CatmullRomCurve3()
    };
    this.params = {
      uniform: true,
      tension: 0.5,
      centripetal: true,
      chordal: true,
      addPoint: this.addPoint,
      removePoint: this.removePoint,
      exportSpline: this.exportSpline
    };
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.scene.add(new THREE.AmbientLight(0xf0f0f0));

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(90, this.width/this.height, 1, 10000);
    this.camera.position.set(0, 250, 1000);
    this.scene.add(this.camera);

    // 创建SpotLight 聚光灯光源
    const light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(0, 1500, 200);
    light.angle = Math.PI * 0.2;
    light.castShadow = true;
    light.shadow.camera.near = 200;
    light.shadow.camera.far = 2000;
    light.shadow.bias = - 0.000222;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    this.scene.add(light);

    // 创建 plane
    const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
    const planeMaterial = new THREE.ShadowMaterial({color: 0x000000, opacity: 0.2});
    planeGeometry.rotateX(-Math.PI/2);

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.y = -200;
    plane.receiveShadow = true;
    this.scene.add(plane);

    // 创建帮助
    const helper = new THREE.GridHelper(2000, 100);
    helper.position.y = -199;
    // @ts-ignore
    helper.material.opacity = 0.25;
    // @ts-ignore
    helper.material.transparent = true;
    this.scene.add(helper);

    // 创建场景
    this.createCurves();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // @ts-ignore
    this.controls.damping = 0.2;
    this.controls.addEventListener("change", () => {
      this.render();
    });

    // 创建缩放控制器
    this.transformControl = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControl.addEventListener( 'change', () => {
      this.render();
    });
    this.transformControl.addEventListener("dragging-changed", (e) => {
      if (this.controls) { this.controls.enabled = !e.value; }
    });
    this.transformControl.addEventListener('objectChange', () => {
      this.updateSplineOutline();
    });
    this.scene.add(this.transformControl);

    // 事件绑定
    this.bind();
    
    // 执行动画
    this.animate();
    // 性能统计
    this.initStats();
    // 窗口自适应
    this.resize();
  }
  // 创建 Curves 模型
  private createCurves() {
    for (let i = 0; i < this.splinePointsLength; i++) {
      this.addSplineObject(this.positions[i]);
    }

    this.positions.length = 0;
    for ( let i = 0; i < this.splinePointsLength; i++) {
      this.positions.push(this.splineHelperObjects[i].position);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.ARC_SEGMENTS * 3), 3));

    let curve = new THREE.CatmullRomCurve3(this.positions);
    // @ts-ignore
    curve.curveType = 'catmullrom';
    // @ts-ignore
    curve.mesh = new THREE.Line(geometry.clone(), new THREE.LineBasicMaterial({
      color: 0xff0000,
      opacity: 0.35
    }));
    // @ts-ignore
    curve.mesh.castShadow = true;
    this.splines.uniform = curve;

    curve = new THREE.CatmullRomCurve3(this.positions);
    // @ts-ignore
    curve.curveType = 'centripetal';
    // @ts-ignore
    curve.mesh = new THREE.Line(geometry.clone(), new THREE.LineBasicMaterial({
      color: 0x00ff00,
      opacity: 0.35
    }));
    // @ts-ignore
    curve.mesh.castShadow = true;
    this.splines.centripetal = curve;

    curve = new THREE.CatmullRomCurve3(this.positions);
    // @ts-ignore
    curve.curveType = 'chordal';
    // @ts-ignore
    curve.mesh = new THREE.Line(geometry.clone(), new THREE.LineBasicMaterial({
      color: 0x0000ff,
      opacity: 0.35
    }));
    // @ts-ignore
    curve.mesh.castShadow = true;
    this.splines.chordal = curve;

    Object.keys(this.splines).forEach((k) => {
      // @ts-ignore
      const spline = this.splines[k];
      this.scene.add(spline.mesh);
    });

    this.load([ 
      new THREE.Vector3(289.76843686945404, 452.51481137238443, 56.10018915737797),
      new THREE.Vector3(-53.56300074753207, 171.49711742836848, - 14.495472686253045),
      new THREE.Vector3(-91.40118730204415, 176.4306956436485, - 6.958271935582161),
      new THREE.Vector3(-383.785318791128, 491.1365363371675, 47.869296953772746) 
    ]);

    this.render();
  }
  setTension (tension: number) {
    // @ts-ignore
    this.splines.uniform.tension = tension;
    this.updateSplineOutline();
    this.render();
  }
  // 设置属性
  setAttr(obj: any) {
    this.params = Object.assign(this.params, obj);
    this.render();
  }

  // 绑定事件
  private bind() {
    window.onpointerdown = (e) => {
      this.onPointerDown(e);
    };
    window.onpointerup = (e) => {
      this.onPointerUp(e);
    };
    window.onpointermove = (e) => {
      this.onPointerMove(e);
    };
  }
  private onPointerMove(e: PointerEvent) {
    const intersects = this.raycaster.intersectObjects(this.splineHelperObjects, false);

    this.pointer.x = (e.clientX / this.width) * 2 - 1;
    this.pointer.y = -((e.clientY - 45) / (this.height)) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera as THREE.PerspectiveCamera);
  
    if (intersects.length > 0 && this.transformControl) {
      const object = intersects[0].object;
      if (object !== this.transformControl.object) {
        this.transformControl.attach(object);
      }
    }
  }
  private onPointerUp(e: PointerEvent) {
    this.onUpPosition.x = e.clientX;
		this.onUpPosition.y = e.clientY - 45;

		if (this.onDownPosition.distanceTo(this.onUpPosition) === 0) {
      if (this.transformControl) {
        this.transformControl.detach();
      }
    }
  }

  private onPointerDown(e: PointerEvent) {
    this.onDownPosition.x = e.clientX;
    this.onDownPosition.y = e.clientY - 45;
  }
  private load(new_positions: THREE.Vector3[]) {
    while ( new_positions.length > this.positions.length ) {
      this.addPoint();
    }
    while ( new_positions.length < this.positions.length ) {
      this.removePoint();
    }

    for ( let i = 0; i < this.positions.length; i ++ ) {
      this.positions[i].copy(new_positions[i]);
    }

    this.updateSplineOutline();
  }
  private addSplineObject(position?: THREE.Vector3) {
    const material = new THREE.MeshLambertMaterial({color: Math.random() * 0xffffff});
    const object = new THREE.Mesh(this.geometry, material);

    if (position) {
      object.position.copy(position);
    } else {
      object.position.x = Math.random() * 1000 - 500;
      object.position.y = Math.random() * 600;
      object.position.z = Math.random() * 800 - 400;
    }

    object.castShadow = true;
    object.receiveShadow = true;
    this.scene.add(object);
    this.splineHelperObjects.push(object);
    return object;
  }
  private updateSplineOutline() {
    Object.keys(this.splines).forEach((k) => {
      // @ts-ignore
      const spline: THREE.CatmullRomCurve3 = this.splines[k];

      // @ts-ignore
      const splineMesh = spline.mesh;
      const position = splineMesh.geometry.attributes.position;

      for (let i = 0; i < this.ARC_SEGMENTS; i++) {
        const t = i / (this.ARC_SEGMENTS - 1);
        spline.getPoint(t, this.point);
        position.setXYZ(i, this.point.x, this.point.y, this.point.z);
      }
      // 必须设置 否则不更新
      position.needsUpdate = true;
    });
  }
  // 渲染方法
  private render() {
    // @ts-ignore
    this.splines.uniform.mesh.visible = this.params.uniform;
    // @ts-ignore
    this.splines.centripetal.mesh.visible = this.params.centripetal;
    // @ts-ignore
    this.splines.chordal.mesh.visible = this.params.chordal;
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  // 添加点
  addPoint() {
    this.splinePointsLength++;
    this.positions.push(this.addSplineObject().position);
    this.updateSplineOutline();
    this.render();
  }
  // 删除点
  removePoint() {
    if (this.splinePointsLength <= 4) { return;}

    const point = this.splineHelperObjects.pop();
    this.splinePointsLength--;
    this.positions.pop();

    if (this.transformControl) {
      if (this.transformControl.object === point ) {
        this.transformControl.detach();
      }
    }

    this.scene.remove(point as THREE.Object3D);
    this.updateSplineOutline();
    this.render();
  }
  // 导出样条
  exportSpline() {
    const strplace = [];
    for (let i = 0; i < this.splinePointsLength; i++) {
      const p = this.splineHelperObjects[i].position;
      strplace.push( `new THREE.Vector3(${p.x}, ${p.y}, ${p.z})` );
    }

    console.log(strplace.join(',\n'));
    const code = '[' + (strplace.join(',\n\t')) + ']';
    prompt('copy and paste code', code);
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 执行渲染
    this.render();
  }

  // 性能统计
  private initStats() {
    this.stats = Stats();
    const dom = this.stats.domElement;
    dom.style.position = "absolute";
    this.container.appendChild(dom);
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;

      if (this.camera) {
        // 摄像机视锥体的长宽比，通常是使用画布的宽/画布的高。默认值是1（正方形画布）
        this.camera.aspect = this.width / this.height;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
        this.render();
      }
    };
  }
}

export default THREE;

