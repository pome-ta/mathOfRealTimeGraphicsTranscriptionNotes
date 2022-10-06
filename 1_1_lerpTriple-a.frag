#version 300 es
precision highp float;

uniform vec2 resolution;
uniform float time;

out vec4 fragColor;

// コード 1.2:3 つのベクトルをつなぐ線形補間
// custom
void main(){
  vec2 pos = gl_FragCoord.xy / resolution.xy;

  vec3[5] col3 = vec3[](
    // ベクトルの配列
    vec3(0.0, 0.0, 0.0),
    vec3(1.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    vec3(0.0, 0.0, 1.0),
    vec3(1.0, 1.0, 1.0)
  );
  pos.y *= 4.0;//x 座標範囲を [0,2] 区間にスケール
  int ind = int(pos.y);// 配列のインデックス
  
  // vec3 col = mix(col3[ind], col3[ind + 1], fract(pos.y));
    vec3 col = mix(col3[ind], col3[ind + 1], abs(sin(time)));

  fragColor = vec4(col, 1.0);
}

