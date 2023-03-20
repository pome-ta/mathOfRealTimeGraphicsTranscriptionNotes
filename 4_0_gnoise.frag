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

vec2 hash22(vec2 p) {
  uvec2 n = floatBitsToUint(p);
  return vec2(uhash22(n)) / vec2(UINT_MAX);
}

uvec3 uhash33(uvec3 n) {
  n ^= (n.yzx << u);
  n ^= (n.yzx >> u);
  n *= k;
  n ^= (n.yzx << u);
  return n * k;
}

vec3 hash33(vec3 p) {
  uvec3 n = floatBitsToUint(p);
  return vec3(uhash33(n)) / vec3(UINT_MAX);
}

// noise

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

void main() {
  vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  channel = int(gl_FragCoord.x * 2.0 / u_resolution.x);
  
  pos = 12.0 * pos + u_time;
  vec3 rgbColor;
  
  if (channel < 1) {
    rgbColor = vec3(gnoise21(pos));
  } else {
    rgbColor = vec3(gnoise31(vec3(pos, u_time)));
  }
  
  fragColor = vec4(rgbColor, 1.0);
}

