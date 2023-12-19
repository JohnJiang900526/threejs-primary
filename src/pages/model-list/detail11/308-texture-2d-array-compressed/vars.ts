export const vertexShader: string = `
  uniform vec2 size;
  out vec2 vUv;

  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    // Convert position.xy to 1.0-0.0
    vUv.xy = position.xy / size + 0.5;

    // original data is upside down
    vUv.y = 1.0 - vUv.y;
  }
`;
export const fragmentShader: string = `
  precision highp float;
  precision highp int;
  precision highp sampler2DArray;

  uniform sampler2DArray diffuse;
  in vec2 vUv;
  uniform int depth;

  out vec4 outColor;
  void main() {
    vec4 color = texture( diffuse, vec3( vUv, depth ) );

    // lighten a bit
    outColor = vec4( color.rgb + .2, 1.0 );
  }
`;
