#version 300 es
precision highp float;
precision highp int;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;

int channel;

// hash 関係
uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
uvec3 u = uvec3(1, 2, 3);
const uint UINT_MAX = 0xffffffffu;


vec2 grad(vec2 p) {
  float eps = 0.001;
  return 0.5 * (vec2()) / eps;

}

void main() {
  vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  fragColor.rgb = vec3(dot(vec2(1), grad(pos)));  // 変数ベクトルとの内積
  fragColor.a = 1.0;
}

