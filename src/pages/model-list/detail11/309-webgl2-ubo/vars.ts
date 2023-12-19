export const vertexShader1: string = `
  uniform ViewData {
    mat4 projectionMatrix;
    mat4 viewMatrix;
  };

  uniform mat4 modelMatrix;
  uniform mat3 normalMatrix;

  in vec3 position;
  in vec3 normal;

  out vec3 vPositionEye;
  out vec3 vNormalEye;

  void main()	{
    vec4 vertexPositionEye = viewMatrix * modelMatrix * vec4( position, 1.0 );

    vPositionEye = vertexPositionEye.xyz;
    vNormalEye = normalMatrix * normal;

    gl_Position = projectionMatrix * vertexPositionEye;
  }
`;
export const fragmentShader1: string = `
  precision highp float;

  uniform LightingData {
    vec3 position;
    vec3 ambientColor;
    vec3 diffuseColor;
    vec3 specularColor;
    float shininess;
  } Light;

  uniform vec3 color;

  in vec3 vPositionEye;
  in vec3 vNormalEye;

  out vec4 fragColor;

  void main()	{
    // a very basic lighting equation (Phong reflection model) for testing

    vec3 l = normalize( Light.position - vPositionEye );
    vec3 n = normalize( vNormalEye );
    vec3 e = - normalize( vPositionEye );
    vec3 r = normalize( reflect( - l, n ) );

    float diffuseLightWeighting = max( dot( n, l ), 0.0 );
    float specularLightWeighting = max( dot( r, e ), 0.0 );

    specularLightWeighting = pow( specularLightWeighting, Light.shininess );

    vec3 lightWeighting = Light.ambientColor +
      Light.diffuseColor * diffuseLightWeighting +
      Light.specularColor * specularLightWeighting;

    fragColor = vec4( color.rgb * lightWeighting.rgb, 1.0 );
  }
`;
export const vertexShader2: string = `
  uniform ViewData {
    mat4 projectionMatrix;
    mat4 viewMatrix;
  };

  uniform mat4 modelMatrix;

  in vec3 position;
  in vec2 uv;

  out vec2 vUv;

  void main()	{
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );
  }
`;
export const fragmentShader2: string = `
  precision highp float;

  uniform sampler2D diffuseMap;
  in vec2 vUv;
  out vec4 fragColor;

  void main()	{
    fragColor = texture( diffuseMap, vUv );
  }
`;