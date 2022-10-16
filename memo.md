# 📝 2022/10/16

rgb 出すの苦難している

# 📝 2022/10/08

## `int channel` でのチャンネル分け

`2.0` の所で分け、`0` からの整数で管理？

``` .glsl
int channel;
channel = int(2.0 * gl_FragCoord.x / u_resolution.x);
```

`mod` の方がスマートに書けそう？今後に、ありそうだけど

# 📝 2022/10/06

## 写経開始

vscode やらVim やら使いながら写経してく
