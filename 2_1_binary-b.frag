#version 300 es

precision highp int;
precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;

void main() {
  vec2 pos = gl_FragCoord.xy / u_resolution.xy;
  pos *= vec2(32.0, 9.0);
  uint[6] a = uint[](
    uint(u_time),
    floatBitsToUint(1.0),
    floatBitsToUint(3.0),
    floatBitsToUint(3.1415926),
    floatBitsToUint(acos(-1.0)),
    floatBitsToUint(0.0)
  );
  
  if (fract(pos.x) < 0.1) {
    if (floor(pos.x) == 1.0) {
      fragColor = vec4(1, 0, 0, 1);
    } else if (floor(pos.x) == 9.0) {
      fragColor = vec4(0, 1, 0, 1);
    } else {
      fragColor = vec4(0.5);
    }
  } else if (fract(pos.y) < 0.1) {
    fragColor = vec4(0.5);
  } else {
    uint b = a[int(pos.y)]; 
    b = (b << uint(pos.x)) >> 31;
    fragColor = vec4(vec3(b), 1.0); 
  }
}

