"""Tira o fundo branco do logo da Cruz Vermelha Brasileira e gera as versões do site.

Uso, na raiz do projeto:  python3 design/recortar-logo.py
Entrada: design/logo-cvb-original.jpg (logo vermelho sobre fundo branco).

Como o logo tem uma única cor sobre branco, a transparência de cada pixel sai da
própria cor: pixel = a·vermelho + (1 - a)·branco. Isso preserva o antisserrilhado
das bordas sem deixar halo branco.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "logo-cvb-original.jpg"
ASSETS = ROOT / "assets"
RED = np.array([185, 14, 7])  # vermelho sólido medido no original

img = np.asarray(Image.open(SRC).convert("RGB")).astype(float)

# Recorta só o círculo (a marca d'água do jornal fica de fora)
r, g, b = img[..., 0], img[..., 1], img[..., 2]
mask = (r - g > 80) & (r - b > 80)
ys, xs = np.where(mask)
pad = 6
x0, y0, x1, y1 = xs.min() - pad, ys.min() - pad, xs.max() + pad, ys.max() + pad
side = max(x1 - x0, y1 - y0)
cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
crop = img[cy - side // 2: cy + side // 2, cx - side // 2: cx + side // 2]

# Transparência a partir dos canais verde e azul (os que mais mudam entre vermelho e branco)
ag = (255 - crop[..., 1]) / (255 - RED[1])
ab = (255 - crop[..., 2]) / (255 - RED[2])
alpha = np.clip((ag + ab) / 2, 0, 1)
alpha[alpha < 0.05] = 0  # ruído do JPEG no branco
alpha = np.clip((alpha - 0.05) / 0.9, 0, 1)

out = np.zeros(crop.shape[:2] + (4,), dtype=np.uint8)
out[..., :3] = RED
out[..., 3] = (alpha * 255).round()
logo = Image.fromarray(out)  # RGBA, inferido das 4 camadas

for size in (512, 160):
    logo.resize((size, size), Image.LANCZOS).save(ASSETS / f"logo-cruz-vermelha-{size}.png", optimize=True)
logo.resize((160, 160), Image.LANCZOS).save(ASSETS / "logo-cruz-vermelha-160.webp", quality=92, method=6)

# Ícones: logo sobre disco branco (fica legível em abas escuras e na tela do iPhone)
def badge(size, margin):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    disc = Image.new("L", (size * 4, size * 4), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(disc).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    white = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    canvas.paste(white, (0, 0), disc.resize((size, size), Image.LANCZOS))
    inner = size - 2 * margin
    canvas.alpha_composite(logo.resize((inner, inner), Image.LANCZOS), (margin, margin))
    return canvas

badge(48, 1).save(ASSETS / "favicon-48.png", optimize=True)
touch = Image.new("RGB", (180, 180), (255, 255, 255))
touch.paste(logo.resize((156, 156), Image.LANCZOS), (12, 12), logo.resize((156, 156), Image.LANCZOS))
touch.save(ASSETS / "apple-touch-icon.png", optimize=True)

print("Logo recortado:", side, "px de lado")
