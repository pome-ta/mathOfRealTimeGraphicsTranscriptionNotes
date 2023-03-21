#version 300 es

precision highp float;
precision highp int;

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

const float PI = acos(-1.0);

ivec2 channel;

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

float fbm21(vec2 p, float g) { // 2変数 fBM
  float val = 0.0; // 値の初期値
  float amp = 1.0; // 振幅の重みの初期値
  float freq = 1.0; // 周波数の重みの初期値
  for(int i = 0; i < 4; i ++ ) {
    val += amp * (vnoise21(freq * p) - 0.5);
    amp *= g; // 繰り返しのたびに振幅を g 倍
    freq *= 2.01; // 繰り返しのたびに周波数を倍増
    // 倍数は、少しずらした重みをつける
  }
  return 0.5 * val + 0.5; // 値の範囲を [0, 1] 区間に正規化
}

float base21(vec2 p) { // ドメインワービングの素材となる関数
  // return channel == 0 ? fbm21(p, 0.5) : pnoise21(p); // 左: fBM (G=0.5) // 右: パーリンノイズ
  return mod(u_time, 20.0) < 10.0 ? fbm21(p, 0.5) : pnoise21(p);
}

float warp21(vec2 p, float g) {
  float val = 0.0; // 値の初期値
  for(int i = 0; i < 4; i ++ ) {
    val = base21(p + g * vec2(cos(2.0 * PI * val), sin(2.0 * PI * val))); // 歪ませる方向をノイズで回転
  }
  return val;
}

float converter(float v) { // 階調変換関数
  float time = abs(mod(0.1 * u_time, 2.0) - 1.0); // [0, 1] 区間を動く変数
  float n = floor(8.0 * time); // ポスタリゼーションの階調数
  return \
  channel == ivec2(1, 0) ? step(time, v) : // 中央下: (a) 二階調化
  channel == ivec2(2, 0) ? (floor(n * v) + step(0.5, fract(n * v))) / n : // 右下: (b) ポスタリゼーション
  channel == ivec2(0, 1) ? smoothstep(0.5 * (1.0 - time), 0.5 * (1.0 + time), v) : // 左上: (c) s字トーンカーブ
  channel == ivec2(1, 1) ? pow(v, 2.0 * time) : // 中央上: (d) ガンマ補正
  channel == ivec2(2, 1) ? 0.5 * sin(4.0 * PI * v + u_time) + 0.5 : // 右上: (e) ソラリゼーション
  v; // 左下: 元画像
}

void main() {
  vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  
  channel = ivec2(vec2(3, 2) * gl_FragCoord.xy / u_resolution.xy);
  pos = 10.0 * pos + u_time;
  
  vec3 rgbColor = vec3(converter(warp21(pos, 1.0)));
  fragColor = vec4(rgbColor, 1.0);
}
