# ctrl+Derek Adventskalender

24 Türchen, 24 Hacking-Rätsel für Einsteiger ab 11 Jahren. Jeden Tag im Dezember öffnet sich ein neues Türchen. Dazu gibt es täglich ein kurzes Video auf dem TikTok-Kanal **ctrl+Derek**.

## Wie es funktioniert

- Die Seite liegt in `docs/` und läuft über GitHub Pages, ohne Server.
- Türchen schalten sich anhand des Datums frei (`docs/config.json`: Jahr und Monat).
- Flaggen stehen nicht im Klartext im Code, sondern nur als SHA-256-Hash in `docs/doors.json`. Die Seite hasht die Eingabe und vergleicht.
- Der Fortschritt wird im Browser (localStorage) gespeichert.

## Testen

Lokal starten (aus dem Projektordner):

```bash
python -m http.server 8000 --directory docs
```

Dann `http://localhost:8000/?alle=1` öffnen (alle Türchen offen) oder `?datum=2026-12-05` (simuliertes Datum).

## Story und Spielprinzip

Grinch.exe hat Dereks Weihnachts-Server gehackt, der Spieler ist Hacker-Azubi. Jedes Türchen hat eine kleine Story, zwei Tipps (Tipp 1 und eine stärkere Tipp 2), Schwierigkeit (1 bis 3 Flammen) und XP. Es gibt Ränge von Noob bis Legende, Konfetti, einen Countdown und ein Finale mit Teilen-Text. Die Ränge und der Intro-Text stehen in `docs/config.json`.

## Neues Türchen hinzufügen

1. Aufgabe und Flagge ausdenken, Flagge im Format `CTRL{...}`.
2. Hash erzeugen: `python tools/hash_flag.py "CTRL{MEINE_FLAGGE}"`
3. Alle Türchen stehen in `tools/build_doors.py` (liegt nur lokal und ist bewusst nicht im Repo, weil dort die Flaggen im Klartext stehen). Dort ergänzen oder ändern und dann `python tools/build_doors.py` ausführen, das schreibt `docs/doors.json`.
4. Passendes Video-Skript in `tiktok/skripte.md` schreiben.

## Veröffentlichen

Repo auf GitHub hochladen, dann *Settings, Pages, Branch main, Ordner /docs* wählen.

## Wichtig: Spoiler

Das Repo ist öffentlich, die Aufgabentexte stehen also schon vorher in `doors.json`. Die Flaggen sind durch den Hash sicher, aber wer im Code stöbert, sieht kommende Aufgaben. Wer das verhindern will, trägt die Türchen erst am jeweiligen Tag ein (oder baut Aufgaben vorab in einem privaten Repo und kopiert sie täglich herüber).

## Regeln für Aufgaben

Nur legale Sandbox-Rätsel auf dieser Seite. Nie Anleitungen gegen echte Systeme, immer mit dem Hinweis: Hacken nur mit Erlaubnis.

## Stand

Alle 24 Türchen sind fertig. Rest siehe `PLAN.md`.



