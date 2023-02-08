# 📝 2023/02/08

## `precision highp`

`highp` は、32bit 精度

``` .frag
precision highp int;
precision highp float;
```

と、浮動小数点数や整数を指定する


## シフト

```.frag
uint b = a[int(pos.y)]; 
b = (b << uint(pos.x)) >> 31;
fragColor = vec4(vec3(b), 1.0); 
```

まだ、雰囲気

### こーゆーことか

`9` の場合だと、

```python
[bin(9 << b >> 31)[-1] for b in range(32)]
```



## メモ場所


[pome-ta/rustTest230204: Created with CodeSandbox](https://github.com/pome-ta/rustTest230204)

検証のため、行ったり来たりしてるから、点在しちゃうかも



# 📝 2023/02/06

全般的に忘れたので、一から再度写経する。

## とは言え、乱数のビッド演算から


### 誤植？

p.035

文中の2進数(`10011001`)と、10進数変換用の2進数(`10111001`)が違う？


