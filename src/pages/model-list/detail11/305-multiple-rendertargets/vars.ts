export const gbufferVert = `
  in vec3 position;
  in vec3 normal;
  in vec2 uv;

  out vec3 vNormal;
  out vec2 vUv;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform mat3 normalMatrix;

  void main() {
    vUv = uv;

    // get smooth normals
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

    vec3 transformedNormal = normalMatrix * normal;
    vNormal = normalize( transformedNormal );

    gl_Position = projectionMatrix * mvPosition;
  }
`;
export const gbufferFrag = `
  precision highp float;
  precision highp int;

  layout(location = 0) out vec4 gColor;
  layout(location = 1) out vec4 gNormal;

  uniform sampler2D tDiffuse;
  uniform vec2 repeat;

  in vec3 vNormal;
  in vec2 vUv;

  void main() {

    // write color to G-Buffer
    gColor = texture( tDiffuse, vUv * repeat );

    // write normals to G-Buffer
    gNormal = vec4( normalize( vNormal ), 0.0 );

  }
`;
export const renderVert = `
  in vec3 position;
  in vec2 uv;

  out vec2 vUv;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;
export const renderFrag = `
  precision highp float;
  precision highp int;

  layout(location = 0) out vec4 pc_FragColor;

  in vec2 vUv;

  uniform sampler2D tDiffuse;
  uniform sampler2D tNormal;

  void main() {

    vec3 diffuse = texture( tDiffuse, vUv ).rgb;
    vec3 normal = texture( tNormal, vUv ).rgb;

    pc_FragColor.rgb = mix( diffuse, normal, step( 0.5, vUv.x ) );
    pc_FragColor.a = 1.0;

  }
`;