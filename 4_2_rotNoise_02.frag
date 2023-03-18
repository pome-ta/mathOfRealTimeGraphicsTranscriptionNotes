#version 300 es

/*
rotNoise31 のみ
*/
precision highp float;
precision highp int;

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

ivec2 channel;

vec3 hsv2rgb(in vec3 c) {
  vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z * mix(vec3(1.0), rgb, c.y);
}

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

uvec3 uhash33(uvec3 n) {
  n ^= (n.yzx << u);
  n ^= (n.yzx >> u);
  n *= k;
  n ^= (n.yzx << u);
  return n * k;
}

float hash21(vec2 p) {
  uvec2 n = floatBitsToUint(p);
  return float(uhash22(n).x) / float(UINT_MAX);
}

vec2 hash22(vec2 p) {
  uvec2 n = floatBitsToUint(p);
  return vec2(uhash22(n)) / vec2(UINT_MAX);
}

float hash31(vec3 p) {
  uvec3 n = floatBitsToUint(p);
  return float(uhash33(n).x) / float(UINT_MAX);
}

vec3 hash33(vec3 p) {
  uvec3 n = floatBitsToUint(p);
  return vec3(uhash33(n)) / vec3(UINT_MAX);
}

// noise
float vnoise21(vec2 p) {
  vec2 n = floor(p);
  float[4]v;
  for(int j = 0; j < 2; j ++ ) {
    for(int i = 0; i < 2; i ++ ) {
      v[i + 2*j] = hash21(n + vec2(i, j));
    }
  }
  vec2 f = fract(p);
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  return mix(mix(v[0], v[1], f[0]), mix(v[2], v[3], f[0]), f[1]);
}

float vnoise31(vec3 p) {
  vec3 n = floor(p);
  float[8]v;
  for(int k = 0; k < 2; k ++ ) {
    for(int j = 0; j < 2; j ++ ) {
      for(int i = 0; i < 2; i ++ ) {
        v[i + 2*j + 4*k] = hash31(n + vec3(i, j, k));
      }
      
    }
  }
  vec3 f = fract(p);
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  float[2]w;
  for(int i = 0; i < 2; i ++ ) {
    w[i] = mix(mix(v[4 * i], v[4 * i+1], f[0]), mix(v[4 * i+2], v[4 * i+3], f[0]), f[1]);
  }
  return mix(w[0], w[1], f[2]);
}

float gnoise21(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float[4]v;
  for(int j = 0; j < 2; j ++ ) {
    for(int i = 0; i < 2; i ++ ) {
      vec2 g = normalize(hash22(n + vec2(i, j)) - vec2(0.5)); // 乱数ベクトルを正規化
      v[i + 2 * j] = dot(g, f - vec2(i, j)); // 窓関数の係数
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f); // 5次エルミート補間
  return 0.5 * mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  ) + 0.5;
}

float gnoise31(vec3 p) {
  vec3 n = floor(p);
  vec3 f = fract(p);
  float[8]v;
  for(int _k = 0; _k < 2; _k ++ ) {
    for(int _j = 0; _j < 2; _j ++ ) {
      for(int _i = 0; _i < 2; _i ++ ) {
        vec3 g = normalize(hash33(n + vec3(_i, _j, _k)) - vec3(0.5));
        v[_i + 2 * _j + 4 * _k] = dot(g, f - vec3(_i, _j, _k));
      }
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  float[2]w;
  for(int i = 0; i < 2; i ++ ) {
    w[i] = mix(
      mix(v[4 * i + 0], v[4 * i + 1], f[0]),
      mix(v[4 * i + 2], v[4 * i + 3], f[0]),
      f[1]
    );
  }
  return 0.5 * mix(w[0], w[1], f[2]) + 0.5;
}

// 勾配の回転
vec2 rot2(vec2 p, float t) {
  return vec2(
    cos(t) * p.x - sin(t) * p.y,
    sin(t) * p.x + cos(t) * p.y
  ); // p の回転
}

vec3 rotX(vec3 p, float t) { // x軸を中心とした回転
  p.yz = rot2(p.yz, t);
  return p;
}

vec3 rotY(vec3 p, float t) { // y軸を中心とした回転
  p.xz = rot2(p.xz, t);
  return p;
}

vec3 rotZ(vec3 p, float t) { // z軸を中心とした回転
  p.xy = rot2(p.xy, t);
  return p;
}

float rotNoise21(vec2 p, float ang) { // ang: 回転角
  vec2 n = floor(p);
  vec2 f = fract(p);
  float[4]v;
  for(int j = 0; j < 2; j ++ ) {
    for(int i = 0; i < 2; i ++ ) {
      vec2 g = normalize(hash22(n + vec2(i, j)) - vec2(0.5)); // 勾配の取得
      g = rot2(g, ang); // 勾配の回転
      v[i + 2 * j] = dot(g, f - vec2(i, j)); // 窓関数の係数
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f); // 5次エルミート補間
  return 0.5 * mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  ) + 0.5;
}

float rotNoise31(vec3 p, float ang) {
  vec3 n = floor(p);
  vec3 f = fract(p);
  float[8]v;
  for(int _k = 0; _k < 2; _k ++ ) {
    for(int _j = 0; _j < 2; _j ++ ) {
      for(int _i = 0; _i < 2; _i ++ ) {
        vec3 g = normalize(hash33(n + vec3(_i, _j, _k)) - vec3(0.5));
        g = rotZ(g, ang);
        v[_i + 2 * _j + 4 * _k] = dot(g, f - vec3(_i, _j, _k));
      }
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  float[2]w;
  for(int i = 0; i < 2; i ++ ) {
    w[i] = mix(
      mix(v[4 * i + 0], v[4 * i + 1], f[0]),
      mix(v[4 * i + 2], v[4 * i + 3], f[0]),
      f[1]
    );
  }
  return 0.5 * mix(w[0], w[1], f[2]) + 0.5;
}

void main() {
  vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  
  pos = 20.0 * pos + u_time;
  channel = ivec2(2.0 * gl_FragCoord.xy / u_resolution.xy); // ビューポートを上下左右に分割して4チャンネルを表示
  
  vec3 rgbColor;
  
  float v = rotNoise31(vec3(pos, u_time), u_time);
  
  rgbColor = hsv2rgb(vec3(v, 1.0, 1.0)); // 値を色相に対応
  fragColor = vec4(rgbColor, 1.0);
}
