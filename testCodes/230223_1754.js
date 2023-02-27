#version 300 es

precision highp int;
precision highp float;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;

uint k = 0x456789abu;// 算術積に使う大きな桁数の定数
const uint UINT_MAX = 0xffffffffu;

uint uhash11(uint n) {
  n ^= (n << 1);  // 1左シフトして`XOR`
  n ^= (n >> 1);  // 1右シフトして`XOR`
  n *= k;         // 算術積
  n ^= (n << 1);  // 1左シフトして`XOR`
  return n * k;   // 算術積
}


void main() {
  vec2 pos = gl_FragCoord.xy / u_resolution.xy;
  float b = pos.x;
  
  fragColor = vec4(vec3(b), 1.0); 
}


