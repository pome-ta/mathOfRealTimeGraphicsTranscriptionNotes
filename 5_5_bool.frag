#version 300 es

precision highp float;
precision highp int;

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

int channel;
const float PI = acos(-1.0);
const float TAU = PI * 2.0;

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

void main() {
  vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  
  channel = int(2.0 * gl_FragCoord.x / u_resolution.x);
  pos = 10.0 * pos + u_time;
  
  vec2 f = vec2(warp21(pos, 1.0), warp21(pos + 10.0, 1.0));
  f -= 0.5; // 値を [-0.5, 0.5] にずらす
  vec4 x;
  if (channel == 0) {
    bvec2 b = bvec2(step(f, vec2(0))); // 0より小さければ真、そうでなれけば偽
    x = vec4(
      b[0] && b[1], // 共通部分
      b[0] && !b[1], // 差集合
      ! b[0] && b[1], // 差集合
      ! (b[0] || b[1])// 和集合の補集合、または補集合の共通部分 `!b[0] && !b[1]`
    );
  } else {
    x = vec4(
      max(f[0], f[1]), // 和集合
      max(f[0], - f[1]), // 差集合
      max(-f[0], f[1]), // 差集合
      - min(f[0], f[1])// 和集合の補集合、または補集合の共通部分 `max(-f[0], -f[1])`
    );
    x = step(x, vec4(0.0));
  }
  vec3[4]col4 = vec3[](
    vec3(1, 0, 0), // 赤
    vec3(0, 1, 0), // 緑
    vec3(0, 0, 1), // 青
    vec3(1, 1, 0)// 黄
  );
  
  vec3 rgbColor;
  for(int i = 0; i < 4; i ++ ) {
    rgbColor += x[i] * col4[i];
  }
  
  // 行列を使って次のように書くことも可能
  // mat4x3 col43 = mat4x3(
    //   vec3(1, 0, 0), // 赤
    //   vec3(0, 1, 0), // 緑
    //   vec3(0, 0, 1), // 青
    //   vec3(1, 1, 0)// 黄
  // );
  // rgbColor = col43 * x;
  
  fragColor = vec4(rgbColor, 1.0);
}
