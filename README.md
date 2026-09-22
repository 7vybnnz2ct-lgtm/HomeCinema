# Cinema Control v0.4 — Marantz Live Control

Die App steuert den Marantz NR1605 jetzt aus der normalen Oberfläche heraus.

## Jetzt echt am NR1605
- Power ON / Standby
- Lautstärke + / -
- absolute Lautstärke über unteren Slider
- Mute
- Quellen:
  - TV Audio
  - Xbox / GAME
  - Blu-ray
  - Media Player
- Klangmodi:
  - Stereo
  - Dolby Digital
  - DTS Surround
  - Direct
  - Pure Direct
  - Movie / Music, soweit im Marantz-Profil angeboten
- Audyssey MultEQ ein/aus
- Dynamic EQ ein/aus
- Dynamic Volume (Light) ein/aus
- Subwoofer-Kanalpegel
- Center-Kanalpegel
- Szenen senden mehrere Receiver-Kommandos nacheinander

## Noch bewusst nicht automatisch gelesen
Die Oberfläche aktualisiert sich nach eigenen Befehlen sofort, liest aber den Zustand
noch nicht zuverlässig zurück, wenn du parallel die Original-Fernbedienung benutzt.
Die alten Receiver-Webendpunkte liefern den Status zwar als XML, aber ob Safari dessen
Cross-Origin-Antwort lesen darf, muss separat geprüft werden.

## Apple TV
Die App zeigt Apple TV als Quelle, sendet aber in v0.4 bewusst noch keinen Eingangsbefehl,
weil nicht bekannt ist, an welchem HDMI-Eingang dein Apple TV angeschlossen ist.
Das wird später konfigurierbar.

## Denon AVR-X4000
Bleibt als Geräteprofil vorhanden. Solange keine separate Denon-IP hinterlegt ist,
läuft dieses Profil bewusst im Demo-Modus.

## Marantz verbinden
- Netzwerk -> IP Control -> Always On
- IP-Adresse notieren
- Cinema Control -> Zahnrad
- IP und Port 80 speichern

Die App merkt sich die IP lokal im Browser.
