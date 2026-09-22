# Cinema Control v0.3 — Marantz Test Build

Diese Version baut auf v0.2 auf und bereitet die echte Einbindung des Marantz NR1605 vor.

## Neu
- Receiver-IP und HTTP-Port speichern
- Marantz-Webinterface direkt öffnen
- Direktsteuerungs-Test für:
  - Lautstärke +
  - Lautstärke -
  - Power ON
  - Standby
- technischer Verbindungstest
- lokale Einstellungen werden nur im Browser/LocalStorage gespeichert
- Denon AVR-X4000 und Marantz NR1605 bleiben als Geräteprofile enthalten

## Am Marantz NR1605
1. Receiver mit demselben LAN/WLAN wie iPad verbinden.
2. Netzwerk -> IP Control -> Always On.
3. Netzwerk -> Information -> IP-Adresse notieren.
4. In Safari testweise `http://IP-ADRESSE` öffnen.
5. In Cinema Control -> Zahnrad -> IP-Adresse eintragen.
6. `Webinterface öffnen` testen.
7. Danach `+ Lautstärke` als ersten Direktsteuerungs-Test verwenden.

## Warum ein Testmodus?
GitHub Pages läuft über HTTPS, der NR1605 stellt sein altes Webinterface über HTTP bereit.
Moderne Browser schützen Zugriffe von öffentlichen HTTPS-Seiten auf lokale HTTP-Geräte.
Aktuelle Safari/WebKit-Versionen entwickeln dafür Local Network Access, aber Verhalten und
CORS-Unterstützung des Receivers müssen am echten Gerät getestet werden.

## HTTP-Kommandos
Der Build nutzt die bei älteren Denon/Marantz-Geräten üblichen iPhone-App-Endpunkte:
- `/goform/formiPhoneAppDirect.xml?MVUP`
- `/goform/formiPhoneAppDirect.xml?MVDOWN`
- `/goform/formiPhoneAppPower.xml?1+PowerOn`
- `/goform/formiPhoneAppPower.xml?1+PowerStandby`

V0.3 liest bewusst noch keinen Live-Status ein. Das kommt nach dem ersten Test am NR1605.
