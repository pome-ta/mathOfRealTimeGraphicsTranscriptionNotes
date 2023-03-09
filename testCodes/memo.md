# 📝 2023/03/09

## sound shader

```frag
precision highp float;
precision highp int;


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
  float old_random = random(time);
  float hash_random = hash11(time);

  // float sound_out = old_random;
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
