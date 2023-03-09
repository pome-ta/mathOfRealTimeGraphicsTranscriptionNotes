# 📝 2023/03/10

```frag
precision highp float;
precision highp int;

// memo: 
#define BPM 90.0

const float PI = acos(-1.0);
const float TAU = PI * 2.0;

/* sound common */
float timeToBeat(float t) { return t / 60.0 * BPM; }
float beatToTime(float b) { return b / BPM * 60.0; }

float sine(float phase) { return sin(TAU * phase); }
float pitch(float p) { return pow(2.0, p / 12.0) * 440.0; }


//start hash
uvec3 k = uvec3(0x456789abu, 0x6789ab45u, 0x89ab4567u);
uvec3 u = uvec3(1, 2, 3);
const uint UINT_MAX = 0xffffffffu;

uint uhash11(uint n){
  n ^= (n << u.x);
  n ^= (n >> u.x);
  n *= k.x;
  n ^= (n << u.x);
  return n * k.x;
}

uvec2 uhash22(uvec2 n){
  n ^= (n.yx << u.xy);
  n ^= (n.yx >> u.xy);
  n *= k.xy;
  n ^= (n.yx << u.xy);
  return n * k.xy;
}

uvec3 uhash33(uvec3 n){
  n ^= (n.yzx << u);
  n ^= (n.yzx >> u);
  n *= k;
  n ^= (n.yzx << u);
  return n * k;
}

float hash11(float p){
  uint n = floatBitsToUint(p);
  return float(uhash11(n)) / float(UINT_MAX);
}

float hash21(vec2 p){
  uvec2 n = floatBitsToUint(p);
  return float(uhash22(n).x) / float(UINT_MAX);
}

float hash31(vec3 p){
  uvec3 n = floatBitsToUint(p);
  return float(uhash33(n).x) / float(UINT_MAX);
}

vec2 hash22(vec2 p){
  uvec2 n = floatBitsToUint(p);
  return vec2(uhash22(n)) / vec2(UINT_MAX);
}

vec3 hash33(vec3 p){
  uvec3 n = floatBitsToUint(p);
  return vec3(uhash33(n)) / vec3(UINT_MAX);
}
//end hash

//start gnoise
float gnoise21(vec2 p){
  vec2 n = floor(p);
  vec2[4] g;
  for (int j = 0; j < 2; j ++){
    for (int i = 0; i < 2; i++){
      g[i+2*j] = normalize(hash22(n + vec2(i,j)) - vec2(0.5));
    }
  }
  vec2 f = fract(p);
  float[4] v;
  for (int j = 0; j < 2; j ++){
    for (int i = 0; i < 2; i++){
      v[i+2*j] = dot(g[i+2*j], f - vec2(i, j));
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  return 0.5 * mix(mix(v[0], v[1], f[0]), mix(v[2], v[3], f[0]), f[1]) + 0.5;
}

float gnoise31(vec3 p){
  vec3 n = floor(p);
  vec3[8] g;
  for (int k = 0; k < 2; k++ ){
    for (int j = 0; j < 2; j++ ){
      for (int i = 0; i < 2; i++){
        g[i+2*j+4*k] = normalize(hash33(n + vec3(i, j, k)) - vec3(0.5));
      }
    }
  }
  vec3 f = fract(p);
  float[8] v;
  for (int k = 0; k < 2; k++ ){
    for (int j = 0; j < 2; j++ ){
      for (int i = 0; i < 2; i++){
        v[i+2*j+4*k] = dot(g[i+2*j+4*k], f - vec3(i, j, k));
      }
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  float[2] w;
  for (int i = 0; i < 2; i++){
    w[i] = mix(mix(v[4*i], v[4*i+1], f[0]), mix(v[4*i+2], v[4*i+3], f[0]), f[1]);
  }
  return 0.5 * mix(w[0], w[1], f[2]) + 0.5;
}
//end gnoise

//start pnoise
float gtable2(vec2 lattice, vec2 p){
  uvec2 n = floatBitsToUint(lattice);
  uint ind = uhash22(n).x >> 29;
  float u = 0.92387953 * (ind < 4u ? p.x : p.y);  //0.92387953 = cos(pi/8)
  float v = 0.38268343 * (ind < 4u ? p.y : p.x);  //0.38268343 = sin(pi/8)
  return ((ind & 1u) == 0u ? u : -u) + ((ind & 2u) == 0u? v : -v);
}

float pnoise21(vec2 p){
  vec2 n = floor(p);
  vec2 f = fract(p);
  float[4] v;
  for (int j = 0; j < 2; j ++){
    for (int i = 0; i < 2; i++){
      v[i+2*j] = gtable2(n + vec2(i, j), f - vec2(i, j));
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  return 0.5 * mix(mix(v[0], v[1], f[0]), mix(v[2], v[3], f[0]), f[1]) + 0.5;
}

float gtable3(vec3 lattice, vec3 p){
  uvec3 n = floatBitsToUint(lattice);
  uint ind = uhash33(n).x >> 28;
  float u = ind < 8u ? p.x : p.y;
  float v = ind < 4u ? p.y : ind == 12u || ind == 14u ? p.x : p.z;
  return ((ind & 1u) == 0u? u: -u) + ((ind & 2u) == 0u? v : -v);
}

float pnoise31(vec3 p){
  vec3 n = floor(p);
  vec3 f = fract(p);
  float[8] v;
  for (int k = 0; k < 2; k++ ){
    for (int j = 0; j < 2; j++ ){
      for (int i = 0; i < 2; i++){
        v[i+2*j+4*k] = gtable3(n + vec3(i, j, k), f - vec3(i, j, k)) * 0.70710678;
      }
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  float[2] w;
  for (int i = 0; i < 2; i++){
    w[i] = mix(mix(v[4*i], v[4*i+1], f[0]), mix(v[4*i+2], v[4*i+3], f[0]), f[1]);
  }
  return 0.5 * mix(w[0], w[1], f[2]) + 0.5;
}
//end pnoise


vec2 mainSound(float time){
  float bpm = timeToBeat(time);
  float perlinNoise = pnoise21(vec2(tan(time * PI) * 0.1, sine(bpm) * 1e1)) - 0.5;

  return vec2(perlinNoise);
}


```

# 📝 2023/03/09

## sound shader

```frag
precision highp float;
precision highp int;

#define BPM 90.0

const float PI = acos(-1.0);
const float TAU = PI * 2.0;

float sine(float phase) { return sin(TAU * phase); }
/* GLSL */
// 2D Random
float _rnd(in vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float random(float t) {
  float rnd_x = sine(123.4 * t);
  float rnd_y = sine(567.8 * t);
  return _rnd(vec2(rnd_x, rnd_y)) - 0.5;
}


uint k = 0x456789abu;  // 算術積に使う大きな桁数の定数
const uint UINT_MAX = 0xffffffffu;  // 符号なし整数の最大値

uint uhash11(uint n) {
  n ^= (n << 1);  // 1左シフトして`XOR`
  n ^= (n >> 1);  // 1右シフトして`XOR`
  n *= k;         // 算術積
  n ^= (n << 1);  // 1左シフトして`XOR`
  return n * k;   // 算術積
}

float hash11(float p) {
  // 浮動小数点数のハッシュ関数
  uint n = floatBitsToUint(p);  // ビット列を符号なし整数に変換
  return float(uhash11(n)) / float(UINT_MAX);  // 値の正規化
}


vec2 mainSound(float time){
  //float old_random = random(time);
  float hash_random = hash11(time)-0.5;

  //float sound_out = old_random;
  float sound_out = hash_random;

  return vec2(sound_out);
}
```

`0.0 ~ 1.0` しか出ていない？音的には、`-1.0 ~ 1.0` 出てほしい？

# 📝 2023/02/08

## `precision highp`

`highp` は、32bit 精度

``` .frag
precision highp int;
precision highp float;
```

と、浮動小数点数や整数を指定する

## シフト

```.frag
uint b = a[int(pos.y)]; 
b = (b << uint(pos.x)) >> 31;
fragColor = vec4(vec3(b), 1.0); 
```

まだ、雰囲気

### こーゆーことか

`9` の場合だと、

```python
[bin(9 << b >> 31)[-1] for b in range(32)]
```

## メモ場所

[pome-ta/rustTest230204: Created with CodeSandbox](https://github.com/pome-ta/rustTest230204)

検証のため、行ったり来たりしてるから、点在しちゃうかも

# 📝 2023/02/06

全般的に忘れたので、一から再度写経する。

## とは言え、乱数のビッド演算から

### 誤植？

p.035

文中の2進数(`10011001`)と、10進数変換用の2進数(`10111001`)が違う？
