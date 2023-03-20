#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

out vec4 fragColor;

int channel; // 表示するシェーダーのチャンネル
void main() {
  vec2 pos = gl_FragCoord.xy / u_resolution.xy;
  
  vec3[4]col4 = vec3[](// 見本と色違う
    vec3(0.0, 1.0, 1.0), // C
    vec3(1.0, 0.0, 1.0), // M
    vec3(1.0, 1.0, 0.0), // Y
    vec3(1.0, 1.0, 1.0)// h
  );
  
  float n = 4.0;
  pos *= n;
  channel = int(2.0 * gl_FragCoord.x / u_resolution.x); // ビューポートを分割して各チャンネルを表示
  if (channel == 0) {
    pos = floor(pos) + step(0.5, fract(pos));
  } else {
    float thr = 0.25 * sin(u_time);
    pos = floor(pos) + smoothstep(0.25 + thr, 0.75 - thr, fract(pos));
  }
  
  pos /= n;
  vec3 col = mix(
    mix(col4[0], col4[1], pos.x),
    mix(col4[2], col4[3], pos.x),
    pos.y
  );
  
  fragColor = vec4(col, 1.0);
}

