#version 300 es

precision highp float;
precision highp int;

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

const float PI = acos(-1.0);

int channel;

//start hash
uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
uvec3 u = uvec3(1, 2, 3);
const uint UINT_MAX = 0xffffffffu;

uint uhash11(uint n) {
  n ^= (n << u.x);
  n ^= (n >> u.x);
  n *= k.x;
  n ^= (n << u.x);
  return n * k.x;
}

uvec2 uhash22(uvec2 n) {
  n ^= (n.yx << u.xy);
  n ^= (n.yx >> u.xy);
  n *= k.xy;
  n ^= (n.yx << u.xy);
  return n * k.xy;
}

uvec3 uhash33(uvec3 n) {
  n ^= (n.yzx << u);
  n ^= (n.yzx >> u);
  n *= k;
  n ^= (n.yzx << u);
  return n * k;
}

float hash11(float p) {
  uint n = floatBitsToUint(p);
  return float(uhash11(n)) / float(UINT_MAX);
}

float hash21(vec2 p) {
  uvec2 n = floatBitsToUint(p);
  return float(uhash22(n).x) / float(UINT_MAX);
}

float hash31(vec3 p) {
  uvec3 n = floatBitsToUint(p);
  return float(uhash33(n).x) / float(UINT_MAX);
}

vec2 hash22(vec2 p) {
  uvec2 n = floatBitsToUint(p);
  return vec2(uhash22(n)) / vec2(UINT_MAX);
}

vec3 hash33(vec3 p) {
  uvec3 n = floatBitsToUint(p);
  return vec3(uhash33(n)) / vec3(UINT_MAX);
}
//end hash

float vnoise21(vec2 p) { //2 次元値ノイズ
  vec2 n = floor(p);
  vec2 f = fract(p);
  float[4]v;
  for(int _j = 0; _j < 2; _j ++ ) {
    for(int _i = 0; _i < 2; _i ++ ) {
      v[_i + 2 * _j] = hash21(n + vec2(_i, _j)); // マスの 4 頂点のハッシュ値
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f); // 双線形補間 ? 5次エルミート補間 ? どっちだっけ？
  return mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  );
}

//start pnoise
float gtable2(vec2 lattice, vec2 p) { // lattice:格子点
  uvec2 n = floatBitsToUint(lattice); // 格子点の値をビット列に変換
  uint ind = uhash22(n).x >> 29; // hash 値の桁を落とす
  // float u = 0.92387953 * (ind < 4u ? p.x : p.y); //0.92387953 = cos(pi/8)
  // float v = 0.38268343 * (ind < 4u ? p.y : p.x); //0.38268343 = sin(pi/8)
  float u = cos(PI / 8.0) * (ind < 4u ? p.x : p.y); //0.92387953 = cos(pi/8)
  float v = sin(PI / 8.0) * (ind < 4u ? p.y : p.x); //0.38268343 = sin(pi/8)
  return ((ind & 1u) == 0u ? u : -u) + ((ind & 2u) == 0u ? v : -v);
}

float pnoise21(vec2 p) {
  vec2 n = floor(p);
  vec2 f = fract(p);
  float[4]v;
  for(int _j = 0; _j < 2; _j ++ ) {
    for(int _i = 0; _i < 2; _i ++ ) {
      v[_i + 2 * _j] = gtable2(n + vec2(_i, _j), f - vec2(_i, _j));
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  return 0.5 * mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  ) + 0.5;
}
//end pnoise

float base21(vec2 p) { // fBM の素材となる関数 (値の範囲は [-0.5, 0.5] 区間)
  // 左: 値ノイズ
  // 右: パーリンノイズ
  return channel == 0 ? vnoise21(p) - 0.5 : pnoise21(p) - 0.5;
}

float fbm21(vec2 p, float g) { // 2変数 fBM
  float val = 0.0; // 値の初期値
  float amp = 1.0; // 振幅の重みの初期値
  float freq = 1.0; // 周波数の重みの初期値
  for(int i = 0; i < 4; i ++ ) {
    val += amp * base21(freq * p);
    amp *= g; // 繰り返しのたびに振幅を g 倍
    freq *= 2.01; // 繰り返しのたびに周波数を倍増
    // 倍数は、少しずらした重みをつける
  }
  return 0.5 * val + 0.5; // 値の範囲を [0, 1] 区間に正規化
}

void main() {
  vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  vec3 rgbColor;
  
  channel = int(2.0 * gl_FragCoord.x / u_resolution.x);
  pos = 10.0 * pos + u_time;
  
  float g = abs(mod(0.2 * u_time, 2.0) - 1.0); // g を[0, 1] 区間上動かす
  rgbColor = vec3(fbm21(pos, g));
  fragColor = vec4(rgbColor, 1.0);
}
