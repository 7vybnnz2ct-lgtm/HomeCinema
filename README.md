# Cinema Control v0.4.2

Diagnose-/Bereinigungsbuild auf Basis von v0.4.1.

## HAR-Auswertung
Die GitHub-Pages-Dateien selbst wurden sauber mit HTTP 200 geladen.

Die auffälligen `Status 0`-Einträge entstanden bei lokalen Requests an den Marantz.
Die App nutzt für direkte Receiver-Kommandos `fetch(..., mode: "no-cors")`.
Solche Antworten sind für JavaScript absichtlich *opaque*: Status, Header und Body
sind nicht lesbar. Browser stellen den Status deshalb als `0` dar, auch wenn der
Receiver den Befehl tatsächlich ausführt.

## Änderung in v0.4.2
- sichtbare Versionsnummer bleibt erhalten
- alte Mehrfach-Probes gegen
  - MainZoneXmlStatus.xml
  - MainZoneXmlStatusLite.xml
  - Receiver-Root
  wurden entfernt
- „Verbindungsinfo“ erzeugt jetzt keinen Netzwerkverkehr
- Funktionstest erfolgt nur noch bewusst über die vorhandenen Lautstärke-/Power-Tasten
- Texte unterscheiden nun zwischen „Befehl ausgelöst“ und „Antwort bestätigt“
- Cache-Busting auf v0.4.2

## Wichtig
Bei echten no-cors-Kommandos kann ein HAR weiterhin `Status 0` anzeigen.
Das ist bei diesem Direktsteuerungsmodell technisch normal und kein belastbarer
Hinweis darauf, dass der Befehl fehlgeschlagen ist.
