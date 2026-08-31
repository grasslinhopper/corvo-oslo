#!/usr/bin/env python3
"""Generate one print-ready A5 PDF per rug QR code."""

from __future__ import annotations

from pathlib import Path

import qrcode
from PIL import Image, ImageDraw, ImageFont
from qrcode.constants import ERROR_CORRECT_H

ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "assets" / "fonts"
OUT_DIR = ROOT / "print"

SITE = "https://oslo.corvorugs.com"
DPI = 300
# A5 portrait
PAGE_W = round(148 / 25.4 * DPI)
PAGE_H = round(210 / 25.4 * DPI)

IVORY = (244, 239, 232)
INK = (28, 26, 23)
MUTED = (122, 116, 108)
WHITE = (250, 247, 242)
LINE = (28, 26, 23, 36)

RUGS = (
    ("verdant", "Verdant"),
    ("gradient", "Gradient"),
    ("atlantico", "Atlântico"),
    ("lagoon", "Lagoon"),
)


def mm(value: float) -> int:
    return round(value / 25.4 * DPI)


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_DIR / name), size)


def tracked_width(font: ImageFont.FreeTypeFont, text: str, tracking_em: float) -> float:
    extra = tracking_em * font.size
    widths = [font.getlength(ch) for ch in text]
    if not widths:
        return 0
    return sum(widths) + extra * (len(text) - 1)


def draw_tracked(
    draw: ImageDraw.ImageDraw,
    text: str,
    center_x: float,
    top: float,
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    tracking_em: float,
) -> float:
    extra = tracking_em * font.size
    total = tracked_width(font, text, tracking_em)
    x = center_x - total / 2
    bbox = font.getbbox("Ag")
    height = bbox[3] - bbox[1]
    for ch in text:
        draw.text((x, top), ch, font=font, fill=fill)
        x += font.getlength(ch) + extra
    return height


def make_qr(url: str, module_px: int) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=module_px,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.make_image(fill_color=INK, back_color=WHITE).convert("RGB")


def make_page(rug_id: str, name: str) -> Image.Image:
    url = f"{SITE}/#{rug_id}"
    page = Image.new("RGB", (PAGE_W, PAGE_H), IVORY)
    draw = ImageDraw.Draw(page, "RGBA")
    cx = PAGE_W / 2

    brand_font = load_font("Barlow-ExtraLight.ttf", mm(5.2))
    name_font = load_font("Barlow-ExtraLight.ttf", mm(11))
    url_font = load_font("Barlow-Light.ttf", mm(3.2))

    qr_img = make_qr(url, module_px=mm(1.15))
    qr_size = qr_img.width

    pad_x = mm(10)
    pad_top = mm(14)
    pad_bottom = mm(12)
    gap_brand = mm(9)
    gap_name = mm(8)
    block_w = qr_size + pad_x * 2
    block_h = pad_top + mm(11) + gap_name + qr_size + pad_bottom

    brand_h = draw_tracked(draw, "CORVO", cx, mm(18), brand_font, MUTED, 0.46)

    block_x = round((PAGE_W - block_w) / 2)
    block_y = round(mm(18) + brand_h + gap_brand)
    radius = mm(2)

    draw.rounded_rectangle(
        (block_x, block_y, block_x + block_w, block_y + block_h),
        radius=radius,
        fill=WHITE,
        outline=(28, 26, 23, 40),
        width=max(2, mm(0.25)),
    )

    name_top = block_y + pad_top
    draw_tracked(draw, name, cx, name_top, name_font, INK, 0.12)

    qr_x = round((PAGE_W - qr_size) / 2)
    qr_y = round(name_top + mm(11) + gap_name)
    page.paste(qr_img, (qr_x, qr_y))

    draw_tracked(
        draw,
        "Oslo Design Fair",
        cx,
        block_y + block_h + mm(10),
        url_font,
        MUTED,
        0.22,
    )
    return page


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for rug_id, name in RUGS:
        page = make_page(rug_id, name)
        dest = OUT_DIR / f"QR-{name.replace('â', 'a')}.pdf"
        page.save(dest, "PDF", resolution=float(DPI), title=f"CORVO — {name}")
        print(f"wrote {dest.relative_to(ROOT)} ({dest.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
