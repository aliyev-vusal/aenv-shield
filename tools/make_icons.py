#!/usr/bin/env python3
"""Generate the AENV Shield icon (original geometric design) at all extension sizes."""
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
ICONS = ROOT / "extension" / "icons"
STORE = ROOT / "store-assets"

SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#16243f"/><stop offset="1" stop-color="#0b1220"/>
    </linearGradient>
    <linearGradient id="sh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4ff0c4"/><stop offset="1" stop-color="#1fae88"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="120" height="120" rx="28" fill="url(#bg)"/>
  <path d="M64 18 L102 32 V62 C102 86 86 102 64 110 C42 102 26 86 26 62 V32 Z" fill="url(#sh)"/>
  <path d="M64 18 L102 32 V62 C102 86 86 102 64 110 Z" fill="#000" opacity=".10"/>
  <path d="M47 64 L59 76 L82 50" fill="none" stroke="#062a20" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
"""


def render(svg_path, out, size):
    subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), str(svg_path), "-o", str(out)], check=True)


def main():
    ICONS.mkdir(parents=True, exist_ok=True)
    STORE.mkdir(parents=True, exist_ok=True)
    svg = ICONS / "icon.svg"
    svg.write_text(SVG, encoding="utf-8")
    for size in (16, 32, 48, 128):
        render(svg, ICONS / f"icon{size}.png", size)
    render(svg, STORE / "icon-128.png", 128)
    print("icons written")


if __name__ == "__main__":
    main()
