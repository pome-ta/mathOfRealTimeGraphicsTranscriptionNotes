#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

out vec4 fragColor;

float fractSin11(float x) {
  return fract(1000.0 * sin(x));
}

void main(){
  vec2 pos = gl_FragCoord.xy;
  pos += floor(60.0 * u_time);
  vec2 p = gl_FragCoord.xy / u_resolution.xy;
  vec3 colors = vec3(fractSin11(pos.x));
  fragColor = vec4(colors, 1.0);
}

