import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';

export class Model {
  private width: number;
  private height: number;
  private container: HTMLDivElement;
  private scene: null | THREE.Scene;
  private renderer: null | THREE.WebGLRenderer;
  private camera: null | THREE.PerspectiveCamera;
  private stats: null | Stats
  private group: THREE.Group
  private texture: null | THREE.Texture
  private targetRotation: number
  private targetRotationOnPointerDown: number
  private pointerX: number
  private pointerXOnPointerDown: number
  private windowHalfX: number
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.stats = null;
    this.group = new THREE.Group();
    this.texture = null;
    this.targetRotation = 0;
    this.targetRotationOnPointerDown = 0;
    this.pointerX = 0;
    this.pointerXOnPointerDown = 0;
    this.windowHalfX = this.width/2;
  }

  // 初始化方法入口
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.scene.add(new THREE.AmbientLight(0x808080));

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(120, this.width/this.height, 1, 2000);
    this.camera.position.set(0, 150, 500);

    // 创建光源
    const light = new THREE.PointLight(0xffffff, 0.8);
		this.camera.add(light);

    // 分组设置
    this.group.position.y = 50;
    this.scene.add(this.group);

    // 创建纹理
    const loader = new THREE.TextureLoader();
    this.texture = loader.load('/examples/textures/uv_grid_opengl.jpg' );
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.repeat.set( 0.008, 0.008 );

    // 创建图形
    this.createShapes();

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    // 事件绑定
    this.bind();

    // 执行动画
    this.animate();
    // 性能统计
    this.initStats();
    // 窗口自适应
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建图形核心调用方法
  createShapes() {
    // California
    const californiaPts = [];
    californiaPts.push( new THREE.Vector2( 610, 320 ) );
    californiaPts.push( new THREE.Vector2( 450, 300 ) );
    californiaPts.push( new THREE.Vector2( 392, 392 ) );
    californiaPts.push( new THREE.Vector2( 266, 438 ) );
    californiaPts.push( new THREE.Vector2( 190, 570 ) );
    californiaPts.push( new THREE.Vector2( 190, 600 ) );
    californiaPts.push( new THREE.Vector2( 160, 620 ) );
    californiaPts.push( new THREE.Vector2( 160, 650 ) );
    californiaPts.push( new THREE.Vector2( 180, 640 ) );
    californiaPts.push( new THREE.Vector2( 165, 680 ) );
    californiaPts.push( new THREE.Vector2( 150, 670 ) );
    californiaPts.push( new THREE.Vector2( 90, 737 ) );
    californiaPts.push( new THREE.Vector2( 80, 795 ) );
    californiaPts.push( new THREE.Vector2( 50, 835 ) );
    californiaPts.push( new THREE.Vector2( 64, 870 ) );
    californiaPts.push( new THREE.Vector2( 60, 945 ) );
    californiaPts.push( new THREE.Vector2( 300, 945 ) );
    californiaPts.push( new THREE.Vector2( 300, 743 ) );
    californiaPts.push( new THREE.Vector2( 600, 473 ) );
    californiaPts.push( new THREE.Vector2( 626, 425 ) );
    californiaPts.push( new THREE.Vector2( 600, 370 ) );
    californiaPts.push( new THREE.Vector2( 610, 320 ) );
    for (let i = 0; i < californiaPts.length; i++) {
      californiaPts[i].multiplyScalar(0.25);
    }
    const californiaShape = new THREE.Shape(californiaPts);

    // Triangle
    const triangleShape = new THREE.Shape()
    .moveTo( 80, 20 )
    .lineTo( 40, 80 )
    .lineTo( 120, 80 )
    .lineTo( 80, 20 ); // close path

    // Heart
    const x = 0, y = 0;
    const heartShape = new THREE.Shape()
      .moveTo( x + 25, y + 25 )
      .bezierCurveTo( x + 25, y + 25, x + 20, y, x, y )
      .bezierCurveTo( x - 30, y, x - 30, y + 35, x - 30, y + 35 )
      .bezierCurveTo( x - 30, y + 55, x - 10, y + 77, x + 25, y + 95 )
      .bezierCurveTo( x + 60, y + 77, x + 80, y + 55, x + 80, y + 35 )
      .bezierCurveTo( x + 80, y + 35, x + 80, y, x + 50, y )
      .bezierCurveTo( x + 35, y, x + 25, y + 25, x + 25, y + 25 );

    // Square
    const sqLength = 80;
    const squareShape = new THREE.Shape()
      .moveTo( 0, 0 )
      .lineTo( 0, sqLength )
      .lineTo( sqLength, sqLength )
      .lineTo( sqLength, 0 )
      .lineTo( 0, 0 );

    // Rounded rectangle
    const roundedRectShape = new THREE.Shape();
    (function roundedRect( ctx, x, y, width, height, radius ) {
      ctx.moveTo( x, y + radius );
      ctx.lineTo( x, y + height - radius );
      ctx.quadraticCurveTo( x, y + height, x + radius, y + height );
      ctx.lineTo( x + width - radius, y + height );
      ctx.quadraticCurveTo( x + width, y + height, x + width, y + height - radius );
      ctx.lineTo( x + width, y + radius );
      ctx.quadraticCurveTo( x + width, y, x + width - radius, y );
      ctx.lineTo( x + radius, y );
      ctx.quadraticCurveTo( x, y, x, y + radius );
    })( roundedRectShape, 0, 0, 50, 50, 20 );

    // Track
    const trackShape = new THREE.Shape()
    .moveTo( 40, 40 )
    .lineTo( 40, 160 )
    .absarc( 60, 160, 20, Math.PI, 0, true )
    .lineTo( 80, 40 )
    .absarc( 60, 40, 20, 2 * Math.PI, Math.PI, true );

    // Circle
    const circleRadius = 40;
    const circleShape = new THREE.Shape()
      .moveTo( 0, circleRadius )
      .quadraticCurveTo( circleRadius, circleRadius, circleRadius, 0 )
      .quadraticCurveTo( circleRadius, - circleRadius, 0, - circleRadius )
      .quadraticCurveTo( - circleRadius, - circleRadius, - circleRadius, 0 )
      .quadraticCurveTo( - circleRadius, circleRadius, 0, circleRadius );

    // Fish
    const fishShape = new THREE.Shape()
    .moveTo( x, y )
    .quadraticCurveTo( x + 50, y - 80, x + 90, y - 10 )
    .quadraticCurveTo( x + 100, y - 10, x + 115, y - 40 )
    .quadraticCurveTo( x + 115, y, x + 115, y + 40 )
    .quadraticCurveTo( x + 100, y + 10, x + 90, y + 10 )
    .quadraticCurveTo( x + 50, y + 80, x, y );

    // Arc circle
    const arcShape = new THREE.Shape()
      .moveTo( 50, 10 )
      .absarc( 10, 10, 40, 0, Math.PI * 2, false );
    const holePath = new THREE.Path()
      .moveTo( 20, 10 )
      .absarc( 10, 10, 10, 0, Math.PI * 2, true );
    arcShape.holes.push( holePath );

    // Smiley
    const smileyShape = new THREE.Shape()
    .moveTo( 80, 40 )
    .absarc( 40, 40, 40, 0, Math.PI * 2, false );
    const smileyEye1Path = new THREE.Path()
      .moveTo( 35, 20 )
      .absellipse( 25, 20, 10, 10, 0, Math.PI * 2, true, 0 );
    const smileyEye2Path = new THREE.Path()
      .moveTo( 65, 20 )
      .absarc( 55, 20, 10, 0, Math.PI * 2, true );
    const smileyMouthPath = new THREE.Path()
      .moveTo( 20, 40 )
      .quadraticCurveTo( 40, 60, 60, 40 )
      .bezierCurveTo( 70, 45, 70, 50, 60, 60 )
      .quadraticCurveTo( 40, 80, 20, 60 )
      .quadraticCurveTo( 5, 50, 20, 40 );
    smileyShape.holes.push( smileyEye1Path );
    smileyShape.holes.push( smileyEye2Path );
    smileyShape.holes.push( smileyMouthPath );

    // Spline shape
    const splinepts = [];
    splinepts.push( new THREE.Vector2( 70, 20 ) );
    splinepts.push( new THREE.Vector2( 80, 90 ) );
    splinepts.push( new THREE.Vector2( - 30, 70 ) );
    splinepts.push( new THREE.Vector2( 0, 0 ) );
    const splineShape = new THREE.Shape()
      .moveTo( 0, 0 )
      .splineThru( splinepts );

    const extrudeSettings: THREE.ExtrudeGeometryOptions = { 
      depth: 8, bevelEnabled: true, bevelSegments: 2, 
      steps: 2, bevelSize: 1, bevelThickness: 1 
    };

    this.addShape( californiaShape, extrudeSettings, 0xf08000, - 300, - 100, 0, 0, 0, 0, 1 );
    this.addShape( triangleShape, extrudeSettings, 0x8080f0, - 180, 0, 0, 0, 0, 0, 1 );
    this.addShape( roundedRectShape, extrudeSettings, 0x008000, - 150, 150, 0, 0, 0, 0, 1 );
    this.addShape( trackShape, extrudeSettings, 0x008080, 200, - 100, 0, 0, 0, 0, 1 );
    this.addShape( squareShape, extrudeSettings, 0x0040f0, 150, 100, 0, 0, 0, 0, 1 );
    this.addShape( heartShape, extrudeSettings, 0xf00000, 60, 100, 0, 0, 0, Math.PI, 1 );
    this.addShape( circleShape, extrudeSettings, 0x00f000, 120, 250, 0, 0, 0, 0, 1 );
    this.addShape( fishShape, extrudeSettings, 0x404040, - 60, 200, 0, 0, 0, 0, 1 );
    this.addShape( smileyShape, extrudeSettings, 0xf000f0, - 200, 250, 0, 0, 0, Math.PI, 1 );
    this.addShape( arcShape, extrudeSettings, 0x804000, 150, 0, 0, 0, 0, 0, 1 );
    this.addShape( splineShape, extrudeSettings, 0x808080, - 50, - 100, 0, 0, 0, 0, 1 );
    this.addLineShape( arcShape.holes[ 0 ], 0x804000, 150, 0, 0, 0, 0, 0, 1 );

    for ( let i = 0; i < smileyShape.holes.length; i += 1 ) {
      this.addLineShape( smileyShape.holes[ i ], 0xf000f0, - 200, 250, 0, 0, 0, Math.PI, 1 );
    }
  }
  // 创建图形的核心算法
  addShape(shape: THREE.Shape, extrudeSettings: THREE.ExtrudeGeometryOptions, color: number, x: number, y: number, z: number, rx: number, ry: number, rz: number, s: number) {
    let geometry = new THREE.ShapeGeometry( shape );

    let mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { side: THREE.DoubleSide, map: this.texture } ) );
    mesh.position.set( x, y, z - 175 );
    mesh.rotation.set( rx, ry, rz );
    mesh.scale.set( s, s, s );
    this.group.add( mesh );

    // flat shape

    geometry = new THREE.ShapeGeometry( shape );

    mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { color: color, side: THREE.DoubleSide } ) );
    mesh.position.set( x, y, z - 125 );
    mesh.rotation.set( rx, ry, rz );
    mesh.scale.set( s, s, s );
    this.group.add( mesh );

    // extruded shape

    geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );

    mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { color: color } ) );
    mesh.position.set( x, y, z - 75 );
    mesh.rotation.set( rx, ry, rz );
    mesh.scale.set( s, s, s );
    this.group.add( mesh );

    this.addLineShape( shape, color, x, y, z, rx, ry, rz, s );
  }
  // 创建线性图形的核心算法
  addLineShape(shape: THREE.Path | THREE.Shape, color: number, x: number, y: number, z: number, rx: number, ry: number, rz: number, s: number) {
    // lines
    shape.autoClose = true;
    const points = shape.getPoints();
    const spacedPoints = shape.getSpacedPoints( 50 );

    const geometryPoints = new THREE.BufferGeometry().setFromPoints( points );
    const geometrySpacedPoints = new THREE.BufferGeometry().setFromPoints( spacedPoints );

    // solid line
    let line = new THREE.Line( geometryPoints, new THREE.LineBasicMaterial( { color: color } ) );
    line.position.set( x, y, z - 25 );
    line.rotation.set( rx, ry, rz );
    line.scale.set( s, s, s );
    this.group.add( line );

    // line from equidistance sampled points
    line = new THREE.Line( geometrySpacedPoints, new THREE.LineBasicMaterial( { color: color } ) );
    line.position.set( x, y, z + 25 );
    line.rotation.set( rx, ry, rz );
    line.scale.set( s, s, s );
    this.group.add( line );

    // vertices from real points
    let particles = new THREE.Points( geometryPoints, new THREE.PointsMaterial( { color: color, size: 4 } ) );
    particles.position.set( x, y, z + 75 );
    particles.rotation.set( rx, ry, rz );
    particles.scale.set( s, s, s );
    this.group.add( particles );

    // equidistance sampled points
    particles = new THREE.Points( geometrySpacedPoints, new THREE.PointsMaterial( { color: color, size: 4 } ) );
    particles.position.set( x, y, z + 125 );
    particles.rotation.set( rx, ry, rz );
    particles.scale.set( s, s, s );
    this.group.add( particles );
  }

  // 绑定事件
  bind() {
    if (!this.isMobile()) {
      window.onpointerdown = (e) => {
        if ( e.isPrimary === false ) { return false; }
        this.pointerXOnPointerDown = e.clientX - this.windowHalfX;
        this.targetRotationOnPointerDown = this.targetRotation;
  
        window.onpointermove = (e) => {
          if ( e.isPrimary === false ) { return false; }
          this.pointerX = e.clientX - this.windowHalfX;
          this.targetRotation = this.targetRotationOnPointerDown + (this.pointerX - this.pointerXOnPointerDown) * 0.02;
        };
      };
  
      window.onpointerup = (e) => {
        if ( e.isPrimary === false ) { return false; }
  
        window.onpointermove = null;
      };
    } else {
      window.ontouchstart = (event) => {
        const e = event.touches[0];

        this.pointerXOnPointerDown = e.clientX - this.windowHalfX;
        this.targetRotationOnPointerDown = this.targetRotation;

        window.ontouchmove = (event) => {
          const e = event.touches[0];
          this.pointerX = e.clientX - this.windowHalfX;
          this.targetRotation = this.targetRotationOnPointerDown + (this.pointerX - this.pointerXOnPointerDown) * 0.02;
        };
      };

      window.ontouchend = () => {
        window.ontouchmove = null;
      };
    }
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => {
      this.animate();
    });

    // 统计信息更新
    if (this.stats) { this.stats.update(); }

    // 设置旋转
    this.group.rotation.y += (this.targetRotation - this.group.rotation.y) * 0.05;

    // 执行渲染
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
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
      this.windowHalfX = this.width/2;

      // 重新绑定事件
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

