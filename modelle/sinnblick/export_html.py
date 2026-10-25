#!/usr/bin/env python3
"""Build the offline Zellblick HTML from index.html's actual dependency order.

Usage: python3 work/build_cell.py
No build dependencies or network connection are needed.
"""
from __future__ import annotations

import argparse
import hashlib
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "outputs" / "zellblick-3d"
DEFAULT_OUTPUTS = (
    ROOT / "outputs" / "Zellblick-3D-Einzeldatei.html",
    ROOT / "outputs" / "Zellblick-3D-Ueberarbeitet.html",
)
SCRIPT_TAG = re.compile(r"<script\b(?P<attrs>[^>]*)>(?P<body>.*?)</script\s*>", re.I | re.S)
LINK_TAG = re.compile(r"<link\b[^>]*>", re.I | re.S)


class Element(HTMLParser):
    def __init__(self, tag: str):
        super().__init__(convert_charrefs=True)
        self.attrs: dict[str, str | None] = {}
        self.feed(tag)

    def handle_starttag(self, tag, attrs):
        self.attrs = dict(attrs)


def raw_text_safe(text: str, element: str) -> str:
    # A literal closing tag terminates a raw-text HTML element even inside a
    # JS/CSS string or comment. Escaping the slash keeps those strings intact.
    return re.sub(r"</" + element + r"\b", lambda m: "<\\/" + m.group(0)[2:], text, flags=re.I)


class OfflineAudit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.dependencies: list[str] = []
        self.ids: set[str] = set()
        self.duplicate_ids: list[str] = []
        self.script_count = 0
        self.style_count = 0
        self.styles: list[str] = []
        self.in_style = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            if attrs["id"] in self.ids:
                self.duplicate_ids.append(attrs["id"])
            self.ids.add(attrs["id"])
        for key in ("src", "poster", "srcset"):
            value = attrs.get(key)
            if value and not value.startswith(("data:", "#")):
                self.dependencies.append(f"<{tag} {key}={value!r}>")
        if tag in {"link", "object", "embed", "iframe"}:
            value = attrs.get("href") or attrs.get("data") or attrs.get("src")
            if value and not value.startswith(("data:", "#")):
                self.dependencies.append(f"<{tag}> {value}")
        if tag == "script":
            self.script_count += 1
        if tag == "style":
            self.style_count += 1
            self.in_style = True
        if attrs.get("style"):
            self.styles.append(attrs["style"])

    def handle_endtag(self, tag):
        if tag == "style":
            self.in_style = False

    def handle_data(self, data):
        if self.in_style:
            self.styles.append(data)

    def verify(self):
        css = "\n".join(self.styles)
        if re.search(r"@import\b", css, re.I):
            self.dependencies.append("CSS @import")
        for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", css, re.I | re.S):
            url = unescape(match.group(2).strip())
            if not url.startswith(("data:", "#")):
                self.dependencies.append(f"CSS url({url})")
        if self.dependencies:
            raise ValueError("Standalone HTML still references runtime assets: " + ", ".join(self.dependencies))
        if self.duplicate_ids:
            raise ValueError("Duplicate HTML IDs: " + ", ".join(self.duplicate_ids))


def build(source: Path) -> tuple[str, list[str]]:
    source = source.resolve()
    html = (source / "index.html").read_text(encoding="utf-8")
    assets: list[str] = []

    def read_asset(relative: str) -> str:
        path = (source / unescape(relative)).resolve()
        if not path.is_relative_to(source):
            raise ValueError(f"Asset outside source folder: {relative}")
        if ":" in relative or "?" in relative or "#" in relative:
            raise ValueError(f"Expected a local asset path: {relative}")
        assets.append(relative)
        return path.read_text(encoding="utf-8")

    def embed_script(match: re.Match) -> str:
        attrs = Element("<script " + match.group("attrs") + ">").attrs
        src = attrs.pop("src", None)
        if src is None:
            return match.group(0)
        if match.group("body").strip():
            raise ValueError(f"External script has unexpected inline content: {src}")
        # These attributes only affect loading external scripts; source order is
        # preserved in the standalone artifact. Keep type, nonce, etc. intact.
        for name in ("defer", "async", "integrity", "crossorigin"):
            attrs.pop(name, None)
        attributes = "".join(" " + name + ("" if value is None else '="' + escape(value, quote=True) + '"') for name, value in attrs.items())
        script = read_asset(src)
        return "<script" + attributes + ">\n" + raw_text_safe(script, "script") + "\n</script>"

    def embed_stylesheet(match: re.Match) -> str:
        attrs = Element(match.group(0)).attrs
        if "stylesheet" not in (attrs.get("rel") or "").lower().split():
            return match.group(0)
        href = attrs.get("href")
        if not href:
            raise ValueError("Stylesheet link has no href")
        media = (' media="' + escape(attrs["media"], quote=True) + '"') if attrs.get("media") else ""
        css = read_asset(href)
        return "<style" + media + ">\n" + raw_text_safe(css, "style") + "\n</style>"

    html = LINK_TAG.sub(embed_stylesheet, html)
    html = SCRIPT_TAG.sub(embed_script, html)
    license_text = (source / "THREE-LICENSE.txt").read_text(encoding="utf-8").strip()
    if "--" in license_text:
        raise ValueError("License cannot be included verbatim in an HTML comment")
    html = html.replace("<head>", "<head>\n<!--\nThree.js license (bundled library):\n" + license_text + "\n-->\n", 1)
    html = re.sub(r"(<title>)(.*?)(</title>)", lambda m: m[1] + m[2] + " · Einzeldatei" + m[3], html, count=1, flags=re.S)
    audit = OfflineAudit()
    audit.feed(html)
    audit.verify()
    scripts = [name for name in assets if name.endswith(".js")]
    if audit.script_count != len(scripts):
        raise ValueError(f"Expected {len(scripts)} inline scripts, found {audit.script_count}")
    if not audit.style_count:
        raise ValueError("No embedded stylesheet found")
    return html, assets


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", action="append", type=Path, help="Override output paths; may be repeated")
    args = parser.parse_args()
    html, assets = build(args.source)
    encoded = html.encode("utf-8")
    for output in args.output or DEFAULT_OUTPUTS:
        output.parent.mkdir(parents=True, exist_ok=True)
        temporary = output.with_name(output.name + ".tmp")
        temporary.write_bytes(encoded)
        temporary.replace(output)
        print(f"Written {output}: {len(encoded):,} bytes")
    print("Embedded assets in source order: " + ", ".join(assets))
    print("Offline dependency and duplicate-ID audit passed.")
    print("SHA-256: " + hashlib.sha256(encoded).hexdigest())


if __name__ == "__main__":
    main()
