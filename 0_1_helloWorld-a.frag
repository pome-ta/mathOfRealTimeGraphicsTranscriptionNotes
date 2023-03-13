#version 300 es
precision highp float;

uniform vec2 u_resolution;

out vec4 fragColor;

void main() {
  vec2 pos = gl_FragCoord.xy / u_resolution.xy;
  fragColor = vec4(0.0, pos, 1.0);
}
