import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
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

  private controls: null | OrbitControls;
  private cameraOrtho: null | THREE.OrthographicCamera;

  private sceneOrtho: THREE.Scene;
  private spriteTL: THREE.Sprite;
  private spriteTR: THREE.Sprite;
  private spriteBL: THREE.Sprite;
  private spriteBR: THREE.Sprite;
  private spriteC: THREE.Sprite;

  private mapC: THREE.Texture;
  private group: THREE.Group;
  constructor(container: HTMLDivElement) {
    this.container = container;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.aspect = this.width/this.height;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.camera = null;
    this.stats = null;

    this.controls = null;
    this.cameraOrtho = null;

    this.sceneOrtho = new THREE.Scene();
    this.spriteTL = new THREE.Sprite();
    this.spriteTR = new THREE.Sprite();
    this.spriteBL = new THREE.Sprite();
    this.spriteBR = new THREE.Sprite();
    this.spriteC = new THREE.Sprite();

    this.mapC = new THREE.Texture();
    this.group = new THREE.Group();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 1500, 2100);

    // 相机
    this.camera = new THREE.PerspectiveCamera(80, this.aspect, 1, 30000);
    this.camera.position.z = 1500;

    const left = -this.width / 2;
    const right = this.width / 2;
    const top = this.height / 2;
    const bottom = -this.height / 2;
    this.cameraOrtho = new THREE.OrthographicCamera(left, right, top, bottom, 1, 10);
		this.cameraOrtho.position.z = 10;

    this.createSprites();
    // 渲染器
    this.createRenderer();

    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);
    this.controls.update();

    this.initStats();
    this.animate();
    this.resize();
  }

  // 判断是否为移动端
  isMobile() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 创建 精灵
  private createSprites() {
    const amount = 200;

    const loader = new THREE.TextureLoader();
    loader.load('/examples/textures/sprite0.png', (texture: THREE.Texture) => {
      this.createHUDSprites(texture);
    });
    const mapB = loader.load('/examples/textures/sprite1.png');
    this.mapC = loader.load('/examples/textures/sprite2.png');

    const materialC = new THREE.SpriteMaterial({ map: this.mapC, color: 0xffffff, fog: true });
    const materialB = new THREE.SpriteMaterial({ map: mapB, color: 0xffffff, fog: true });

    const getMaterial = (z: number) => {
      if (z < 0) {
        return materialB.clone();
      } else {
        const material = materialC.clone();
        material.color.setHSL(0.5 * Math.random(), 0.75, 0.5);
        material?.map?.offset.set(-0.5, -0.5);
        material?.map?.repeat.set(2, 2);
        return material;
      }
    };

    for (let i = 0; i < amount; i++) {
      const x = Math.random() - 0.5;
      const y = Math.random() - 0.5;
      const z = Math.random() - 0.5;

      const material = getMaterial(z);
      const sprite = new THREE.Sprite(material);

      sprite.position.set(x, y, z);
      sprite.position.normalize();
      sprite.position.multiplyScalar(500);

      this.group.add(sprite);
    }

    this.scene.add(this.group);
  }

  private createHUDSprites(texture: THREE.Texture) {
    const material = new THREE.SpriteMaterial({ map: texture });

    const width = (material.map as THREE.Texture).image.width / 2;
    const height = (material.map as THREE.Texture).image.height / 2;

    // top left
    this.spriteTL = new THREE.Sprite(material);
    this.spriteTL.center.set(0.0, 2.0);
    this.spriteTL.scale.set(width, height, 1);
    this.sceneOrtho.add(this.spriteTL);

    // top right 
    this.spriteTR = new THREE.Sprite(material);
    this.spriteTR.center.set(1.0, 2.0);
    this.spriteTR.scale.set(width, height, 1);
    this.sceneOrtho.add(this.spriteTR);

    // bottom left
    this.spriteBL = new THREE.Sprite(material);
    this.spriteBL.center.set(0.0, 0.0);
    this.spriteBL.scale.set(width, height, 1);
    this.sceneOrtho.add(this.spriteBL);

    // bottom right
    this.spriteBR = new THREE.Sprite(material);
    this.spriteBR.center.set(1.0, 0.0);
    this.spriteBR.scale.set(width, height, 1);
    this.sceneOrtho.add(this.spriteBR);

    // center
    this.spriteC = new THREE.Sprite(material);
    this.spriteC.center.set(0.5, 0.5);
    this.spriteC.scale.set(width, height, 1);
    this.sceneOrtho.add(this.spriteC);

    this.updateHUDSprites();
  }

  private updateHUDSprites() {
    const half = new THREE.Vector2(this.width/2, this.height/2);

    this.spriteTL.position.set(-half.x, half.y, 1); // top left
    this.spriteTR.position.set(half.x, half.y, 1); // top right
    this.spriteBL.position.set(-half.x, -half.y, 1); // bottom left
    this.spriteBR.position.set(half.x, -half.y, 1); // bottom right
    this.spriteC.position.set(0, 0, 1); // center
  }

  // 创建渲染器
  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.autoClear = false;
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
    const time = Date.now() / 2000;
    const length = this.group.children.length;

    this.group.children.forEach((obj, i) => {
      const sprite = obj as THREE.Sprite;

      const material = sprite.material;
      const scale = Math.sin(time + sprite.position.x * 0.01) * 0.3 + 1.0;

      let imageWidth = 1;
      let imageHeight = 1;

      if (material.map && material.map.image && material.map.image.width) {
        imageWidth = material.map.image.width;
        imageHeight = material.map.image.height;
      }

      sprite.material.rotation += 0.1 * (i / length);
      sprite.scale.set(scale * imageWidth, scale * imageHeight, 1.0);

      if ( material.map !== this.mapC) {
        material.opacity = Math.sin(time + sprite.position.x * 0.01) * 0.4 + 0.6;
      }
    });

    this.group.rotation.set(time * 0.5, time * 0.75, time * 1.0);
  }

  // 持续动画
  private animate() {
    window.requestAnimationFrame(() => { this.animate(); });

    this.render();
    this.stats?.update();
    this.controls?.update();
    
    // 执行渲染
    if (this.renderer && this.camera && this.cameraOrtho) {
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);

      this.renderer.clearDepth();
      this.renderer.render(this.sceneOrtho, this.cameraOrtho);
    }
  }

  // 处理自适应
  resize() {
    window.onresize = () => {
      this.width = this.container.offsetWidth;
      this.height = this.container.offsetHeight;
      this.aspect = this.width/this.height;

      if (this.camera) {
        this.camera.aspect = this.aspect;
        // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用。
        this.camera.updateProjectionMatrix();
      }

      if (this.cameraOrtho) {
        this.cameraOrtho.left = -this.width / 2;
				this.cameraOrtho.right = this.width / 2;
				this.cameraOrtho.top = this.height / 2;
				this.cameraOrtho.bottom = -this.height / 2;
				this.cameraOrtho.updateProjectionMatrix();
      }

      this.updateHUDSprites();

      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
    };
  }
}

export default THREE;

