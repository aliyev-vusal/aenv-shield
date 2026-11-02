#!/usr/bin/env python3
"""Build extension/rules/ads.json (declarativeNetRequest static ruleset) from domains.txt."""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "extension" / "rules" / "domains.txt"
OUT = ROOT / "extension" / "rules" / "ads.json"

RESOURCE_TYPES = [
    "sub_frame", "stylesheet", "script", "image", "font", "object",
    "xmlhttprequest", "ping", "media", "websocket", "other",
]
DOMAIN_RE = re.compile(r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$")


def read_domains():
    seen, out = set(), []
    for n, line in enumerate(SRC.read_text(encoding="utf-8").splitlines(), 1):
        d = line.split("#", 1)[0].strip().lower()
        if not d:
            continue
        if not DOMAIN_RE.match(d):
            sys.exit(f"{SRC.name}:{n}: invalid domain {d!r}")
        if d not in seen:
            seen.add(d)
            out.append(d)
    return out


def main():
    domains = read_domains()
    rules = [
        {
            "id": i,
            "priority": 1,
            "action": {"type": "block"},
            "condition": {"urlFilter": f"||{d}^", "resourceTypes": RESOURCE_TYPES},
        }
        for i, d in enumerate(domains, 1)
    ]
    OUT.write_text(json.dumps(rules, indent=1) + "\n", encoding="utf-8")
    print(f"{len(rules)} rules -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
