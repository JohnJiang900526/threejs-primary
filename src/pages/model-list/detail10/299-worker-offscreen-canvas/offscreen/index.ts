import * as THREE from "three";

class Model {
  private camera: THREE.PerspectiveCamera
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private group: THREE.Group;

  private seed: number;
  constructor(canvas: HTMLCanvasElement | THREE.OffscreenCanvas, width: number, height: number, pixelRatio: number, path: string) {
    this.seed = 1;
    
    this.camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
    this.camera.position.z = 200;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x444466, 100, 400);
    this.scene.background = new THREE.Color(0x444466);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);

    // model
    this.loadModel(path);
  }

  private random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  private loadModel(path: string) {
    const loader = new THREE.ImageBitmapLoader().setPath(path);
    const url = "textures/matcaps/matcap-porcelain-white.jpg";

    loader.setOptions({ imageOrientation: 'flipY' });
    loader.load(url, (imageBitmap) => {
      const texture = new THREE.CanvasTexture(imageBitmap);
      const geometry = new THREE.IcosahedronGeometry(5, 8);

      const materials = [
        new THREE.MeshMatcapMaterial({ color: 0xaa24df, matcap: texture }),
        new THREE.MeshMatcapMaterial({ color: 0x605d90, matcap: texture }),
        new THREE.MeshMatcapMaterial({ color: 0xe04a3f, matcap: texture }),
        new THREE.MeshMatcapMaterial({ color: 0xe30456, matcap: texture })
      ];

      for (let i = 0; i < 100; i++) {
        const material = materials[i % materials.length];
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = this.random() * 200 - 100;
        mesh.position.y = this.random() * 200 - 100;
        mesh.position.z = this.random() * 200 - 100;
        mesh.scale.setScalar(this.random() + 1);
        this.group.add(mesh);
      }

      this.animate();
    });
  }

  private animate() {
    this.group.rotation.y = -Date.now() / 4000;
    this.renderer.render(this.scene, this.camera);
    self.requestAnimationFrame(() => { this.animate(); });
  }
}

const init = (canvas: HTMLCanvasElement | THREE.OffscreenCanvas, width: number, height: number, pixelRatio: number, path: string) => {
  new Model(canvas, width, height, pixelRatio, path);
};

export default init;