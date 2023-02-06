#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

out vec4 fragColor;

float fractSin11(float x) {
  return fract(1000.0 * sin(x));
}

void main(){
  vec2 pos = gl_FragCoord.xy / u_resolution.xy;
  fragColor = vec4(fractSin11(u_time),1.0, 1.0, 1.0);
}

