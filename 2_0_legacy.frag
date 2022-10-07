#version 300 es
precision highp float;

uniform vec2 resolution;
uniform float time;

out vec4 fragColor;

int channel;

float fractSin11(float x) {
  return fract(1000.0 * sin(x));
}

float fractSin21(vec2 xy) {
  return fract(sin(dot(xy, vec2(12.9898, 78.233))) * 43758.5453123);
}


void main() {
  vec2 pos = gl_FragCoord.xy;
  pos += floor(60.0 * time);
  channel = int(2.0 * gl_FragCoord.x / resolution.x);
  
  if (channel == 0) {  // 真ん中で左右に分ける
    fragColor = vec4(fractSin11(pos.x));
  } else {
    fragColor = vec4(fractSin21(pos.xy / resolution.xy));
  }

  fragColor.a = 1.0;
}
