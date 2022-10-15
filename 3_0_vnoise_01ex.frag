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

float hash21(vec2 p) {
  uvec2 n = floatBitsToUint(p);
  return float(uhash22(n).x) / float(UINT_MAX);
}

float biLinearInterpolation21(vec2 p) {
  //2 次元値ノイズ : 双線形補間
  vec2 n = floor(p);
  float[4] v;
  for (int j = 0; j < 2; j++) {
    for (int i = 0; i < 2; i++) {
      v[i + 2 * j] = hash21(n + vec2(i, j)); // マスの 4 頂点のハッシュ値
    }
  }
  vec2 f = fract(p);
  return mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  );
}

vec3 biLinearInterpolation23(vec2 p) {
  //2 次元値ノイズ : 双線形補間
  vec2 n = floor(p);
  float[4] v;
  for (int j = 0; j < 2; j++) {
    for (int i = 0; i < 2; i++) {
      v[i + 2 * j] = hash21(n + vec2(i, j)); // マスの 4 頂点のハッシュ値
    }
  }
  vec2 f = fract(p);
  vec3 outRGB;
  /*
  return mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  );
  */
  outRGB.x = mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  );
  outRGB.y = mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  );
  outRGB.z = mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  );
  return outRGB;
}

void main() {
  vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  
  pos = 16.0 * pos + u_time;
  
  //fragColor = vec4(biLinearInterpolation21(pos));
  fragColor.xyz = biLinearInterpolation23(pos);
  fragColor.a = 1.0;
}
