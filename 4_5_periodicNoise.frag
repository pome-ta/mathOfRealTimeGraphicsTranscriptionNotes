#version 300 es

precision highp float;
precision highp int;

uniform float u_time;
uniform vec2 u_resolution;

out vec4 fragColor;

ivec2 channel;

const float PI = acos(-1.0);

// start xy<->pol
float atan2(float y, float x) {
  return x == 0.0 ? sign(y) * PI / 2.0 : atan(y, x);
}

vec2 xy2pol(vec2 xy) {
  return vec2(atan2(xy.x, xy.y), length(xy));
}

vec2 pol2xy(vec2 pol) {
  return pol.y * vec2(cos(pol.x), sin(pol.x));
}
//end xy<->pol

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

//start gnoise
float gnoise21(vec2 p) {
  vec2 n = floor(p);
  vec2[4]g;
  for(int _j = 0; _j < 2; _j ++ ) {
    for(int _i = 0; _i < 2; _i ++ ) {
      g[_i + 2 * _j] = normalize(hash22(n + vec2(_i, _j)) - vec2(0.5));
    }
  }
  vec2 f = fract(p);
  float[4]v;
  for(int _j = 0; _j < 2; _j ++ ) {
    for(int _i = 0; _i < 2; _i ++ ) {
      v[_i + 2 * _j] = dot(g[_i + 2 * _j], f - vec2(_i, _j));
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  return 0.5 * mix(
    mix(v[0], v[1], f[0]),
    mix(v[2], v[3], f[0]),
    f[1]
  ) + 0.5;
}

float gnoise31(vec3 p) {
  vec3 n = floor(p);
  vec3[8]g;
  for(int _k = 0; _k < 2; _k ++ ) {
    for(int _j = 0; _j < 2; _j ++ ) {
      for(int _i = 0; _i < 2; _i ++ ) {
        g[_i + 2 * _j + 4 * _k] = normalize(hash33(n + vec3(_i, _j, _k)) - vec3(0.5));
      }
      
    }
  }
  vec3 f = fract(p);
  float[8]v;
  for(int _k = 0; _k < 2; _k ++ ) {
    for(int _j = 0; _j < 2; _j ++ ) {
      for(int _i = 0; _i < 2; _i ++ ) {
        v[_i + 2 * _j + 4 * _k] = dot(g[_i + 2 * _j + 4 * _k], f - vec3(_i, _j, _k));
      }
      
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  float[2]w;
  for(int _i = 0; _i < 2; _i ++ ) {
    w[_i] = mix(
      mix(v[4 * _i + 0], v[4 * _i + 1], f[0]),
      mix(v[4 * _i + 2], v[4 * _i + 3], f[0]),
      f[1]
    );
  }
  return 0.5 * mix(w[0], w[1], f[2]) + 0.5;
}

//end gnoise

//start pnoise
float gtable2(vec2 lattice, vec2 p) {
  uvec2 n = floatBitsToUint(lattice);
  uint ind = uhash22(n).x >> 29;
  float u = 0.92387953 * (ind < 4u ? p.x : p.y); //0.92387953 = cos(pi/8)
  float v = 0.38268343 * (ind < 4u ? p.y : p.x); //0.38268343 = sin(pi/8)
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

float gtable3(vec3 lattice, vec3 p) { // lattice:格子点
  uvec3 n = floatBitsToUint(lattice); // 格子点の値をビット列に変換
  uint ind = uhash33(n).x >> 28; // hash 値の桁を落とす
  float u = ind < 8u ? p.x : p.y;
  float v = ind < 4u ? p.y : ind == 12u || ind == 14u ? p.x : p.z;
  return ((ind & 1u) == 0u ? u: - u) + ((ind & 2u) == 0u ? v : -v);
}

float pnoise31(vec3 p) {
  vec3 n = floor(p);
  vec3 f = fract(p);
  float[8]v;
  for(int _k = 0; _k < 2; _k ++ ) {
    for(int _j = 0; _j < 2; _j ++ ) {
      for(int _i = 0; _i < 2; _i ++ ) {
        v[_i + 2 * _j + 4 * _k] = gtable3(n + vec3(_i, _j, _k), f - vec3(_i, _j, _k)) * (1.0 / sqrt(2.0)); // * 0.70710678;
      }
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  float[2]w;
  for(int _i = 0; _i < 2; _i ++ ) {
    w[_i] = mix(
      mix(v[4 * _i + 0], v[4 * _i + 1], f[0]),
      mix(v[4 * _i + 2], v[4 * _i + 3], f[0]),
      f[1]
    );
  }
  return 0.5 * mix(w[0], w[1], f[2]) + 0.5;
}
//end pnoise

float periodicNoise21(vec2 p, float period) { // period: 周期
  vec2 n = floor(p);
  vec2 f = fract(p);
  float[4]v;
  for(int _j = 0; _j < 2; _j ++ ) {
    for(int _i = 0; _i < 2; _i ++ ) {
      // mod 関数で周期性を持たせたハッシュ値
      v[_i + 2 * _j] = gtable2(mod(n + vec2(_i, _j), period), f - vec2(_i, _j));
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  return 0.5 * mix(mix(v[0], v[1], f[0]), mix(v[2], v[3], f[0]), f[1]) + 0.5;
}

float periodicNoise31(vec3 p, float period) {
  vec3 n = floor(p);
  vec3 f = fract(p);
  float[8]v;
  for(int _k = 0; _k < 2; _k ++ ) {
    for(int _j = 0; _j < 2; _j ++ ) {
      for(int _i = 0; _i < 2; _i ++ ) {
        v[_i + 2 * _j + 4 * _k] = gtable3(mod(n + vec3(_i, _j, _k), period), f - vec3(_i, _j, _k)) * 0.70710678;
      }
    }
  }
  f = f * f * f * (10.0 - 15.0 * f + 6.0 * f * f);
  float[2]w;
  for(int _i = 0; _i < 2; _i ++ ) {
    w[_i] = mix(
      mix(v[4 * _i + 0], v[4 * _i + 1], f[0]),
      mix(v[4 * _i + 2], v[4 * _i + 3], f[0]),
      f[1]
    );
  }
  return 0.5 * mix(w[0], w[1], f[2]) + 0.5;
}

void main() {
  vec2 pos = gl_FragCoord.xy / u_resolution.xy;
  pos = 2.0 * pos.xy - vec2(1.0);
  pos = xy2pol(pos);
  pos = vec2(5.0 / PI, 5.0) * pos + u_time;
  fragColor = vec4(periodicNoise21(pos, 10.0));
  fragColor.a = 1.0;
}
