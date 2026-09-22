# Cinema Control v0.6.1

GitHub-Pages/iPad Build für den Marantz NR1605.

## Neu in v0.6.1

- Quellenbelegung an den echten NR1605 angepasst: XBOX = umbenannter Blu-ray Eingang (`SIBD`).
- Tone Control, Bass, Treble.
- Dialog Level und separater Subwoofer Level.
- Cinema EQ, M-DAX/Restorer, DRC und Audio Delay.
- Picture Mode, HDMI Audio Out und Video Select.
- Frontdisplay-Dimmer, Sleep Timer, ECO und Auto Standby.
- Smart Select 1-4: Abrufen und bewusstes Speichern.
- Zone 2: Power, Mute, Quelle, Lautstärke, L/R-Pegel, Bass und Treble.
- Sitzungsweites Befehlsprotokoll in der Oberfläche.
- Weiterhin sichtbare Versionsnummer.

## Wichtig

Die Web-App sendet die Befehle direkt im lokalen LAN an den Receiver. Wegen Browser-CORS kann die GitHub-Pages-Version Antworten des Receivers nicht zuverlässig lesen. Daher zeigt v0.6.1 keine erfundenen Live-Rückmeldungen an. Das bidirektionale TCP-Lesen über Port 23 wurde am NR1605 separat erfolgreich getestet und ist für eine spätere native iPad-Bridge vorgesehen.

Receiver: Netzwerk -> IP Control -> Always On.


## v0.6.1 Premium UI
Kompletter visueller Premium-Skin ohne Änderung der verifizierten NR1605-Steuerlogik.
