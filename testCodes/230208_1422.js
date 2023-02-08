#version 300 es

precision highp int;
precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;

void main() {
  vec2 pos = gl_FragCoord.xy / u_resolution.xy;
  pos *= vec2(32.0, 9.0);
  uint[9] a = uint[](
    uint(u_time),
    0xbu,
    9u,
    0xbu ^ 9u,
    0xffffffffu,
    0xffffffffu + uint(u_time),
    floatBitsToUint(floor(u_time)),
    floatBitsToUint(-floor(u_time)),
    floatBitsToUint(11.5625)
  );
  
  if (fract(pos.x) < 0.1) {
    if (floor(pos.x) == 1.0) {
      fragColor = vec4(1, 0, 0, 1);  // 赤区切り
    } else if (floor(pos.x) == 9.0) {
      fragColor = vec4(0, 1, 0, 1);  // 緑区切り
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


