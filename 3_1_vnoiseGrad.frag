#version 300 es
precision highp float;
precision highp int;

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

int channel;

// start hash
uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
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

float vnoise21(vec2 p) { // 2次元値ノイズ
  vec2 n = floor(p);
  float[4]v;
  for(int j = 0; j < 2; j ++ ) {
    for(int i = 0; i < 2; i ++ ) {
      v[i + 2 * j] = hash21(n + vec2(i, j)); // マスの 4頂点のハッシュ値
    }
  }
  vec2 f = fract(p);
  if (channel == 0) {
    f = f * f * (3.0 - 2.0 * f); // エルミート補間
  } else {
    f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f); // 双線形補間
  }
  return mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  );
}

vec2 grad(vec2 p) { // 数値微分による勾配取得
  float eps = 0.001; // 微小な増分
  return 0.5 * (vec2(
      vnoise21(p + vec2(eps, 0.0)) - vnoise21(p - vec2(eps, 0.0)),
      vnoise21(p + vec2(0.0, eps)) - vnoise21(p - vec2(0.0, eps))
    )) / eps;
  }
  
  void main() {
    vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
    channel = int(gl_FragCoord.x * 2.0 / u_resolution.x);
    pos = 3.0 * pos + u_time;
    vec3 rgbColor = vec3(dot(vec2(1), grad(pos))); // 定数ベクトルとの内積
    
    fragColor = vec4(rgbColor, 1.0);
    
  }
  