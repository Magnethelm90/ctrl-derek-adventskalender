"""Gibt den SHA-256-Hash einer Flagge aus (wird in docs/doors.json eingetragen).

Benutzung: python tools/hash_flag.py "CTRL{MEINE_FLAGGE}"
Die Seite vergleicht immer in Großbuchstaben, deshalb wird hier auch normalisiert.
"""
import hashlib
import sys

if len(sys.argv) != 2:
    sys.exit('Benutzung: python tools/hash_flag.py "CTRL{...}"')

print(hashlib.sha256(sys.argv[1].strip().upper().encode("utf-8")).hexdigest())
