#version 300 es

precision highp int;
precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;

uint k = 0x456789abu;// 算術積に使う大きな桁数の定数

uint uhash11(uint n) {
  n ^= (n << 1);  // 1左シフトして`XOR`
  n ^= (n >> 1);  // 1右シフトして`XOR`
  n *= k;         // 算術積
  n ^= (n << 1);  // 1左シフトして`XOR`
  return n * k;   // 算術積
}

uint uuu(uint n) {
  n ^= (n << 1);  // 1左シフトして`XOR`
  n ^= (n >> 1);  // 1右シフトして`XOR`
  n *= k;         // 算術積
  n ^= (n << 1);  // 1左シフトして`XOR`
  return n;
}



void main() {
  vec2 pos = gl_FragCoord.xy / u_resolution.xy;
  pos *= vec2(32.0, 9.0);
  uint[9] a = uint[](
    uuu(floatBitsToUint(1.0)),
    1u,
    2u,
    3u,
    4u,
    5u,
    6u,
    7u,
    8u
  );
  
  if (fract(pos.x) < 0.1) {
    if (floor(pos.x) == 1.0) {
      fragColor = vec4(1.0, 0.0, 0.0, 1.0);  // 赤区切り
    } else if (floor(pos.x) == 9.0) {
      fragColor = vec4(1.0, 0.0, 1.0, 1.0);  // マゼンタ区切り
    } else if (mod(floor(pos.x), 4.0) == 0.0){
      fragColor = vec4(0.0, 1.0, 1.0, 1.0);  // シアン区切り
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


