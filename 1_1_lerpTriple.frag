#version 300 es
precision highp float;

uniform vec2 resolution;

out vec4 fragColor;

void main() {
  vec2 pos = gl_FragCoord.xy / resolution.xy;

  vec3[3] col3 = vec3[](
    vec3(1.0, 0.0, 0.0),  // 赤
    vec3(0.0, 0.0, 1.0),  // 青
    vec3(0.0, 1.0, 0.0)   // 緑
  );
  pos.x *= 2.0;
  int ind = int(pos.x); // 配列のインデックス

  vec3 col = mix(col3[ind], col3[ind + 1], fract(pos.x));
  fragColor = vec4(col, 1.0);
}

