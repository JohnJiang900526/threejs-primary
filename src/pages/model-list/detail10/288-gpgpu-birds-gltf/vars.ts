
export const vertexShader = `
  #define STANDARD
  attribute vec4 reference;
  attribute vec4 seeds;
  attribute vec3 birdColor;
  uniform sampler2D texturePosition;
  uniform sampler2D textureVelocity;
  uniform sampler2D textureAnimation;
  uniform float size;
  uniform float time;

  varying vec3 vViewPosition;
  #ifdef USE_TRANSMISSION
    varying vec3 vWorldPosition;
  #endif
  #include <common>
  #include <uv_pars_vertex>
  #include <uv2_pars_vertex>
  #include <displacementmap_pars_vertex>
  #include <color_pars_vertex>
  #include <fog_pars_vertex>
  #include <normal_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <shadowmap_pars_vertex>
  #include <logdepthbuf_pars_vertex>
  #include <clipping_planes_pars_vertex>

  void main() {
    #include <uv_vertex>
    #include <uv2_vertex>
    #include <color_vertex>
    #include <morphcolor_vertex>
    #include <beginnormal_vertex>
    #include <morphnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>
    #include <defaultnormal_vertex>
    #include <normal_vertex>

    vec4 tmpPos = texture2D( texturePosition, reference.xy );

    vec3 pos = tmpPos.xyz;
    vec3 velocity = normalize(texture2D( textureVelocity, reference.xy ).xyz);
    vec3 aniPos = texture2D( textureAnimation, vec2( reference.z, mod( time + ( seeds.x ) * ( ( 0.0004 + seeds.y / 10000.0) + normalize( velocity ) / 20000.0 ), reference.w ) ) ).xyz;
    vec3 newPosition = position;

    newPosition = mat3( modelMatrix ) * ( newPosition + aniPos );
    newPosition *= size + seeds.y * size * 0.2;

    velocity.z *= -1.;
    float xz = length( velocity.xz );
    float xyz = 1.;
    float x = sqrt( 1. - velocity.y * velocity.y );

    float cosry = velocity.x / xz;
    float sinry = velocity.z / xz;

    float cosrz = x / xyz;
    float sinrz = velocity.y / xyz;

    mat3 maty =  mat3( cosry, 0, -sinry, 0    , 1, 0     , sinry, 0, cosry );
    mat3 matz =  mat3( cosrz , sinrz, 0, -sinrz, cosrz, 0, 0     , 0    , 1 );

    newPosition =  maty * matz * newPosition;
    newPosition += pos;

    vec3 transformed = vec3( newPosition );
    
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <displacementmap_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    vViewPosition = - mvPosition.xyz;
    #include <worldpos_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
    #ifdef USE_TRANSMISSION
      vWorldPosition = worldPosition.xyz;
    #endif
  }
`;

export const fragmentPosition = `
  uniform float time;
  uniform float delta;

  void main()	{
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 tmpPos = texture2D( texturePosition, uv );
    vec3 position = tmpPos.xyz;
    vec3 velocity = texture2D( textureVelocity, uv ).xyz;

    float phase = tmpPos.w;

    phase = mod((phase + delta + length(velocity.xz) * delta * 3. + max(velocity.y, 0.0) * delta * 6.), 62.83);

    gl_FragColor = vec4( position + velocity * delta * 15. , phase );
  }
`;

export const fragmentVelocity = `
  uniform float time;
  uniform float testing;
  uniform float delta; // about 0.016
  uniform float separationDistance; // 20
  uniform float alignmentDistance; // 40
  uniform float cohesionDistance; //
  uniform float freedomFactor;
  uniform vec3 predator;

  const float width = resolution.x;
  const float height = resolution.y;

  const float PI = 3.141592653589793;
  const float PI_2 = PI * 2.0;
  // const float VISION = PI * 0.55;

  float zoneRadius = 40.0;
  float zoneRadiusSquared = 1600.0;

  float separationThresh = 0.45;
  float alignmentThresh = 0.65;

  const float UPPER_BOUNDS = BOUNDS;
  const float LOWER_BOUNDS = -UPPER_BOUNDS;

  const float SPEED_LIMIT = 9.0;

  float rand( vec2 co ){
    return fract( sin( dot( co.xy, vec2(12.9898,78.233) ) ) * 43758.5453 );
  }

  void main() {

    zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
    separationThresh = separationDistance / zoneRadius;
    alignmentThresh = ( separationDistance + alignmentDistance ) / zoneRadius;
    zoneRadiusSquared = zoneRadius * zoneRadius;


    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 birdPosition, birdVelocity;

    vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
    vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;

    float dist;
    vec3 dir; // direction
    float distSquared;

    float separationSquared = separationDistance * separationDistance;
    float cohesionSquared = cohesionDistance * cohesionDistance;

    float f;
    float percent;

    vec3 velocity = selfVelocity;

    float limit = SPEED_LIMIT;

    dir = predator * UPPER_BOUNDS - selfPosition;
    dir.z = 0.;
    // dir.z *= 0.6;
    dist = length( dir );
    distSquared = dist * dist;

    float preyRadius = 150.0;
    float preyRadiusSq = preyRadius * preyRadius;


    // move birds away from predator
    if ( dist < preyRadius ) {

      f = ( distSquared / preyRadiusSq - 1.0 ) * delta * 100.;
      velocity += normalize( dir ) * f;
      limit += 5.0;
    }


    // if (testing == 0.0) {}
    // if ( rand( uv + time ) < freedomFactor ) {}


    // Attract flocks to the center
    vec3 central = vec3( 0., 0., 0. );
    dir = selfPosition - central;
    dist = length( dir );

    dir.y *= 2.5;
    velocity -= normalize( dir ) * delta * 5.;

    for ( float y = 0.0; y < height; y++ ) {
      for ( float x = 0.0; x < width; x++ ) {

        vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
        birdPosition = texture2D( texturePosition, ref ).xyz;

        dir = birdPosition - selfPosition;
        dist = length( dir );

        if ( dist < 0.0001 ) continue;

        distSquared = dist * dist;

        if ( distSquared > zoneRadiusSquared ) continue;

        percent = distSquared / zoneRadiusSquared;

        if ( percent < separationThresh ) { // low

          // Separation - Move apart for comfort
          f = ( separationThresh / percent - 1.0 ) * delta;
          velocity -= normalize( dir ) * f;

        } else if ( percent < alignmentThresh ) { // high

          // Alignment - fly the same direction
          float threshDelta = alignmentThresh - separationThresh;
          float adjustedPercent = ( percent - separationThresh ) / threshDelta;

          birdVelocity = texture2D( textureVelocity, ref ).xyz;

          f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;
          velocity += normalize( birdVelocity ) * f;

        } else {

          // Attraction / Cohesion - move closer
          float threshDelta = 1.0 - alignmentThresh;
          float adjustedPercent;
          if( threshDelta == 0. ) adjustedPercent = 1.;
          else adjustedPercent = ( percent - alignmentThresh ) / threshDelta;

          f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;

          velocity += normalize( dir ) * f;

        }

      }

    }

    // this make tends to fly around than down or up
    // if (velocity.y > 0.) velocity.y *= (1. - 0.2 * delta);

    // Speed Limits
    if ( length( velocity ) > limit ) {
      velocity = normalize( velocity ) * limit;
    }

    gl_FragColor = vec4( velocity, 1.0 );
  }
`;