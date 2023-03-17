#version 300 es
precision highp float;
precision highp int;

out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;

uvec3 k = uvec3(
  0x456789abu,
  0x6789ab45u,
  0x89ab4567u
);
uvec3 u = uvec3(1, 2, 3);
const uint UINT_MAX = 0xffffffffu;

uvec2 uhash22(uvec2 n) {
  n ^= (n.yx << u.xy);
  n ^= (n.yx >> u.xy);
  n *= k.xy;
  n ^= (n.yx << u.xy);
  return n * k.x;
}

uvec3 uhash33(uvec3 n) {
  n ^= (n.yzx << u);
  n ^= (n.yzx >> u);
  n *= k;
  n ^= (n.yzx << u);
  return n * k;
}

float hash31(vec3 p) {
  uvec3 n = floatBitsToUint(p);
  return float(uhash33(n).x) / float(UINT_MAX);
}

float vnoise31(vec3 p) {
  vec3 n = floor(p);
  float[8]v;
  for(int k = 0; k < 2; k ++ ) {
    for(int j = 0; j < 2; j ++ ) {
      for(int i = 0; i < 2; i ++ ) {
        v[i + 2 * j + 4 * k] = hash31(n + vec3(i, j, k)); // マスの8頂点のハッシュ値
      }
    }
  }
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f); // エルミート補間
  float[2]w;
  for(int i = 0; i < 2; i ++ ) {
    w[i] = mix(
      mix(v[4 * i], v[4 * i + 1], f[0]),
      mix(v[4 * i + 2], v[4 * i + 3], f[0]),
      f[1]
    ); // 底面と上面での補間
  }
  return mix(w[0], w[1], f[2]); // 高さに関する補間
}

void main() {
  vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  pos = 16.0 * pos + u_time;
  
  fragColor = vec4(vnoise31(vec3(pos, u_time)));
  fragColor.a = 1.0;
}
