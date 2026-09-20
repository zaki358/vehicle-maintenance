"""image/icon.jpg からホーム画面用のアイコン一式を public/ へ書き出す。

元画像は「透過に見えるが実際は市松模様が描き込まれた JPEG」で、中身は
青い角丸スクエアのロゴ。iOS / Android はアイコンに自前で角丸マスクを
かけるので、アイコン側の角は丸まっていない方が正しく表示される。

そこで角丸スクエアに内接する正方形（角丸の円弧に一切かからない範囲）を
切り出す。角を後から塗り足すとグラデーションの継ぎ目が出るが、内接部分を
使えば全画素が元画像そのままで、継ぎ目が原理的に発生しない。
"""

from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path("image/icon.jpg")
OUT = Path("public")

# 青い角丸スクエアの位置（元画像 1024x1024 を走査して実測）
RECT = (255, 256, 769, 769)
# 内接正方形の余白。角丸半径 104 に対する幾何的な下限は 31 だが、
# 縁に沿う明るいリムと JPEG のにじみを避けるため 40 まで寄せる
INSET = 40
MASTER = 1024
# Android の maskable は中央 80% しか保証されないので、その内側に収める
SAFE_ZONE = 0.78


def build_master() -> Image.Image:
    """角丸スクエアに内接する正方形を切り出し、マスターにする。"""
    left, top, right, bottom = RECT
    box = (left + INSET, top + INSET, right - INSET, bottom - INSET)
    return Image.open(SRC).convert("RGB").crop(box).resize(
        (MASTER, MASTER), Image.LANCZOS
    )


def with_safe_zone(master: Image.Image) -> Image.Image:
    """maskable 用。ロゴを中央へ寄せ、外周は縁の色を引き伸ばして埋める。

    元画像に角丸スクエアの外側は存在しないため、新たに色を作らず
    端の画素をそのまま外へ複製する。こうすれば継ぎ目が出ない。
    """
    size = master.size[0]
    pad = round(size * (1 / SAFE_ZONE - 1) / 2)
    padded = np.pad(np.asarray(master), ((pad, pad), (pad, pad), (0, 0)), mode="edge")
    return Image.fromarray(padded).resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    master = build_master()
    maskable = with_safe_zone(master)

    targets = [
        ("apple-touch-icon.png", master, 180),
        ("icon-192.png", master, 192),
        ("icon-512.png", master, 512),
        ("icon-maskable-192.png", maskable, 192),
        ("icon-maskable-512.png", maskable, 512),
        ("favicon-32.png", master, 32),
        ("favicon-16.png", master, 16),
    ]
    for name, base, size in targets:
        base.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)
        print(f"{name}: {size}x{size}")

    master.resize((48, 48), Image.LANCZOS).save(
        OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("favicon.ico: 16/32/48")


if __name__ == "__main__":
    main()
