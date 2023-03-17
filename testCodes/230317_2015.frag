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

uint uhash11(uint n) {
  n ^= (n << u.x);
  n ^= (n >> u.x);
  n *= k.x;
  n ^= (n << u.x);
  return n * k.x;
}

float hash11(float p) {
  uint n = floatBitsToUint(p);
  return float(uhash11(n)) / float(UINT_MAX);
  
}

void main() {
  vec2 pos = gl_FragCoord.xy / min(u_resolution.x, u_resolution.y);
  channel = int(gl_FragCoord.x * 3.0 / u_resolution.x);
  if (channel < 2) {
    fragColor = vec4(pos, hash11(pos.x), 1.0);
  } else {
    fragColor = vec4(pos, sin(u_time), 1.0);
  }
  
}
