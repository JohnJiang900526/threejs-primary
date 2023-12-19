
export const vertexPostprocess: string = `
  out vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

export const fragmentPostprocess: string = `
  precision highp sampler2DArray;
  precision mediump float;

  in vec2 vUv;

  uniform sampler2DArray uTexture;
  uniform int uDepth;
  uniform float uIntensity;

  void main() {
    float voxel = texture(uTexture, vec3( vUv, uDepth )).r;
    gl_FragColor.r = voxel * uIntensity;
  }
`;

export const vertexShader: string = `
  uniform vec2 size;
  out vec2 vUv;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    // Convert position.xy to 1.0-0.0
    vUv.xy = position.xy / size + 0.5;
    vUv.y = 1.0 - vUv.y; // original data is upside down
  }
`;

export const fragmentShader: string = `
  precision highp float;
  precision highp int;
  precision highp sampler2DArray;

  uniform sampler2DArray diffuse;
  in vec2 vUv;
  uniform int depth;

  void main() {
    vec4 color = texture( diffuse, vec3( vUv, depth ) );
    // lighten a bit
    gl_FragColor = vec4( color.rrr * 1.5, 1.0 );
  }
`;
