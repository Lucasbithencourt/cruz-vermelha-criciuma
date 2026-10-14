"""Gera a imagem de compartilhamento (Open Graph) com o logo oficial.

Uso, na raiz do projeto:  python3 design/gerar-imagens.py
Rode antes o design/recortar-logo.py (ele gera o logo sem fundo e os ícones).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
FONTS = Path("/System/Library/Fonts/Supplemental")

INK = (24, 24, 27)
RED = (225, 20, 30)
RED_DEEP = (178, 14, 23)
WHITE = (255, 255, 255)
MUTED = (185, 183, 178)


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def glow(size, center, radius, color, alpha):
    """Brilho vermelho difuso, igual ao do hero."""
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = center
    d.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.45))


def mark(img, x, y, s):
    """Logo oficial sobre disco branco, igual ao header do site."""
    disc = Image.new("L", (s * 4, s * 4), 0)
    ImageDraw.Draw(disc).ellipse((0, 0, s * 4 - 1, s * 4 - 1), fill=255)
    img.paste(Image.new("RGBA", (s, s), WHITE + (255,)), (x, y), disc.resize((s, s), Image.LANCZOS))
    logo = Image.open(ASSETS / "logo-cruz-vermelha-512.png").resize((s - 4, s - 4), Image.LANCZOS)
    img.alpha_composite(logo, (x + 2, y + 2))


def og_image():
    w, h = 1200, 630
    img = Image.new("RGBA", (w, h), INK + (255,))
    img.alpha_composite(glow((w, h), (1020, 60), 420, RED, 120))

    # Linhas diagonais discretas
    lines = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ld = ImageDraw.Draw(lines)
    for i in range(-h, w, 22):
        ld.line((i, h, i + h, 0), fill=(255, 255, 255, 9), width=2)
    img.alpha_composite(lines)

    mark(img, 72, 58, 76)
    d = ImageDraw.Draw(img)
    d.text((164, 70), "Cruz Vermelha", font=font("Arial Bold.ttf", 30), fill=WHITE)
    d.text((164, 108), "FILIAL CRICIÚMA", font=font("Arial.ttf", 18), fill=MUTED)

    title = font("Arial Narrow Bold.ttf", 96)
    y = 210
    for line in ["Há 42 anos, Criciúma", "não enfrenta nada sozinha."]:
        d.text((72, y), line, font=title, fill=WHITE)
        y += 104

    # Selo
    tag_font = font("Arial Bold.ttf", 24)
    tag = "Doe alimentos, fraldas e agasalhos  ·  Não pedimos dinheiro"
    tw = d.textlength(tag, font=tag_font)
    d.rounded_rectangle((72, 482, 72 + tw + 48, 538), radius=28, fill=RED_DEEP)
    d.text((96, 510), tag, font=tag_font, fill=WHITE, anchor="lm")

    d.text((72, 572), "Desde 1984  ·  Pinheirinho, Criciúma/SC", font=font("Arial.ttf", 22), fill=MUTED)

    img.convert("RGB").save(ASSETS / "cruz-vermelha-criciuma-og.jpg", quality=88, optimize=True, progressive=True)


if __name__ == "__main__":
    og_image()
    print("Imagem de compartilhamento gerada em", ASSETS)
