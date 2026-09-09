export const changelogs: Record<string, string> = {
    '1.1.61': `
        [Verbesserung] Das Änderungsprotokoll ist jetzt in den 4 Sprachen des Skripts verfügbar (Französisch, Englisch, Deutsch, Spanisch)

        [Korrektur] Nach einem 429 von MyHordes wartete das Skript und versuchte danach den Token in einer Endlosschleife erneut, ohne dass sich das Kontingent je erholen konnte
        [Korrektur] Eine Serveranfrage, die nie beantwortet wurde, konnte eine Funktion des Skripts auf unbestimmte Zeit blockieren
        `,
    '1.1.60': `
        [Verbesserung] Im Tooltip des Katapult-Effekts zeigt ein Gegenstand, der spurlos verschwindet, jetzt sein eigenes Icon in sehr geringer Deckkraft an, statt gar nichts anzuzeigen
        [Verbesserung] Allgemeine Serverleistung und -zuverlässigkeit (Caching, Komprimierung, Absicherung der Übertragungen)
        `,
    '1.1.59': `
        [Neu] Die erweiterten Tooltips zeigen jetzt den tatsächlichen Katapult-Effekt der Gegenstände an (Gegenstand oder Umwandlung beim Aufprall, getötete Zombies oder Abstoßung, Wirkungsbereich), als Ersatz für den alten Hinweis "objet fragile"

        [Korrektur] Klarere Meldung, die zum Neuladen der Seite auffordert, wenn die Version des Skripts/der Erweiterung nicht gelesen werden kann, statt einer unvollständigen Fehlermeldung
        `,
    '1.1.58': `
        [Neu] Neue Option, um den Inhalt der Truhe bei einer Aktualisierung der externen Tools von zu Hause aus an MHO zu senden
        `,
    '1.1.57': `
        [Korrektur] Die Notiz zu einem Spieler konnte fehlschlagen, wenn dieser Spieler in derselben Stadt war wie ihr
        `,
    '1.1.56': `
        [Korrektur] Anzeige der Notizen
        `,
    '1.1.55': `
        [Neu] Persönliche Notizen zu Städten, Bürgern einer Stadt und Spielern hinzugefügt, über ein Stift-Icon (Bürgerfenster, Bürgerliste, Stadtseite)
        [Neu] Anzeige der Kosten / Erfolgschance beim Öffnen riskanter Behälter (Kisten, Truhen...) sowie des dafür benötigten Werkzeugs in den Tooltips
        [Neu] Links zur Spieler- und Stadtseite auf MyHordes Optimizer hinzugefügt, aus der Bürger-Sprechblase und dem Block der externen Tools
        [Neu] Benachrichtigung, wenn ein Update des Skripts oder der Erweiterung verfügbar ist, und wenn ein Update gerade angewendet wurde

        [Korrektur] Der Block "Bâtiment" der Zusatzinformationen auf dem Feld wurde nicht immer angezeigt und konnte beim Verlassen des Feldes die Informationen des vorherigen Gebäudes behalten
    `,
    '1.1.54': `
        [Neu] Neue Leseoption fürs Forum: Videos (YouTube) direkt in den Beiträgen anzeigen (für andere Anbieter, kontaktiert mich)
        [Neu] Neue Option, um die täglichen Aktionen in MHO zu aktualisieren. Das Senden der Bade-Information wurde dorthin verschoben, dazu kommen neu das Wegräumen und das Reinigen der Kleidung

        [Korrektur] Sortierung und Filter der Positionsspalte des Bürgers in der Bürgerliste
        [Korrektur] In seltenen Fällen wurde die Duplikat-Benachrichtigung angezeigt, obwohl nur ein einziges Skript / eine einzige Erweiterung aktiv war
    `,
    '1.1.53': `
        [Neu] Drei neue Leseoptionen fürs Forum: eingeklappte Abschnitte automatisch ausklappen, auf einen Spoiler klicken, um ihn dauerhaft anzuzeigen, und Bilder von Links direkt in den Beiträgen anzeigen
        [Neu] Die Aktualisierung der externen Tools zeigt jetzt den Fortschritt Tool für Tool an (Icon + Status) statt einer einfachen globalen Meldung, mit den Fehlerdetails für jedes fehlgeschlagene Tool

        [Korrektur] Der Button "Tout cocher" in den Einstellungen entfernt nicht mehr versehentlich Häkchen bei Optionen, die durch Kaskadierung bereits aktiviert waren
        [Korrektur] Der Button zur Aktualisierung der externen Tools (erweiterte Version) konnte abstürzen, statt das Ergebnis anzuzeigen, wenn eines der Tools fehlschlug
    `,
    '1.1.52': `
        [Verbesserung] Bei gleichzeitiger Nutzung von Skript und Erweiterung wird eine Fehlermeldung angezeigt, und es wird nur eines von beiden geladen

        [Korrektur] Das Rezept zum Zusammenbau einer Kettensäge im Freien (ein spezielles Rezept, weil es fehlschlägt) wurde entfernt, da es den Eindruck erweckte, das Rezept existiere zweimal identisch
        [Korrektur] Die Nutzung auf myHordes.localhost, die sich versehentlich während Tests eingeschlichen hatte, wurde entfernt
        [Korrektur] Die Nutzung der heroischen Fähigkeit "Fund" und ihrer Varianten sollte jetzt korrekt aktualisiert werden
    `,
    '1.1.51': `
        [Neu] Auf der Bankseite zeigt ein Zähler an, wie viele Entnahmen noch möglich sind, bevor der Anti-Missbrauch-Schutz greift, mit einer Warnung, sobald das Limit erreicht ist
        [Neu] Die Berechnung der PA, die nötig sind, damit ein Gebäude die Nacht übersteht, berücksichtigt jetzt Feuerwerkskörper und den sowjetischen Reaktor, mit dem richtigen Wert sowohl in der Fernen Region als auch in Pandämonium

        [Verbesserung] Das Skript wurde deutlich schlanker und optimiert
        [Verbesserung] Der MHO-Button wird jetzt korrekt positioniert

        [Korrektur] Der Rucksack öffnete sich nicht immer automatisch, selbst wenn kein Gegenstand darin war
        [Korrektur] Die Einkaufsliste konnte leer angezeigt werden und erschien erst nach einem Klick auf « Rafraîchir »
        [Korrektur] Die auf Gegenständen angezeigten Prioritäten verschwanden beim Aufheben oder Ablegen
        [Korrektur] Der Button zur Aktualisierung der externen Tools erschien nicht immer, insbesondere nach einer Bewegung
        [Korrektur] Der Zeichenzähler des Registers verschwand zeitweise
        [Korrektur] Der Anti-Missbrauch-Zähler wird jetzt entfernt, wenn die Option deaktiviert wird
    `,
    '1.1.50': `
        [Neu] Die Listen der Nachtwache, der Fallen und der Müllhalde können jetzt sortiert werden
        [Neu] Auf der Fallen-Seite kann jetzt ein Suchfeld für Köder angezeigt werden
        [Neu] Neue Option, um animierte Avatare einzufrieren, die sich erst beim Überfahren mit der Maus wieder bewegen
        [Neu] Neue Option, um Forums-Themennamen je nach Tag und enthaltenen Wörtern individuell zu gestalten, konfigurierbar über ein eigenes Fenster
    `,
    '1.1.49': `
        [Korrektur] Schätzungen seit dem Website-Update
    `,
    '1.1.48': `
        [Korrektur] Die Einkaufsliste wurde in der Oberfläche nicht angezeigt
    `,
    '1.1.47': `
        [Verbesserung] Links zu den Stadtseiten der externen Tools auf der Stadtauswahlseite hinzugefügt
    `,
    '1.1.46': `
        [Korrektur] Größe bestimmter Filter der Bürgerliste angepasst
        [Korrektur] Es gab einen Bug, der Links zu den externen Tools im Benutzer-Popup verdoppelte
    `,
    '1.1.45': `
        [Korrektur] Der Anti-Missbrauch-Zähler funktionierte nicht richtig (aber wir kommen der Sache immer näher!)

        [Verbesserung] Der in die Seite integrierte Camping-Rechner wurde überarbeitet
    `,
    '1.1.44': `
        [Korrektur] Die Suchfelder der Baustellen-Seite, der Nachtwache-Seite und der Empfängerliste funktionierten nicht
        [Korrektur] Der Anti-Missbrauch-Zähler funktionierte nicht richtig (wir drücken die Daumen, dass es diesmal klappt)

        [Verbesserung] Die Changelog-Anzeige erlaubt jetzt auch das Einsehen älterer Changelogs
    `,
    '1.1.43': `
        [Korrektur] Die Aktualisierung der GH-Karte nach einer Aktualisierung der externen Tools funktioniert wieder korrekt, ohne die ganze Seite neu zu laden

        [Neu] Zwei neue Optionen ermöglichen die Anzeige von Filtern auf der Bürgerlisten- und der Allwissenheits-Seite
    `,
    '1.1.42': `
        [Korrektur] Die Aktualisierung vom Haus aus funktionierte nicht mehr
    `,
    '1.1.41': `
        [Korrektur] Tippfehler
        [Korrektur] Die Aufrufe funktionieren nicht mehr
    `,
    '1.1.40': `
        [Korrektur] Fix der Aktualisierung der externen Tools nach dem Mid-Season-Update
        [Korrektur] Anzeige der Einkaufsliste auf der Seite

        [Verbesserung] Überarbeitung der Skript-Optionen für mehr Übersichtlichkeit

        [Neu] Option, um die Bürgerliste und die Allwissenheits-Funktion zu sortieren
    `,
    '1.1.39.0': `
        [Korrektur] Fix der Aktualisierung der externen Tools nach dem Mid-Season-Update
    `,
    '1.1.38.0': `
        [Korrektur] Änderungen an der Verwaltung der Wunschliste
    `,
    '1.1.37.0': `
        [Korrektur] Behebt die Anzeige der Auras bei Gegenständen der Einkaufsliste
    `,
    '1.1.36.0': `
        [Verbesserung] Die verbesserten Tooltips zeigen jetzt an, auf welches Element des Rezepts geklickt werden muss
    `,
    '1.1.35.0': `
        [Korrektur] Komplette Verhaltensänderung beim verbesserten Tooltip, um die Nutzung flüssiger und fehlerfrei zu machen. Danke Emmet für die Hilfe

        [Verbesserung] Kompakte Anzeige der Rezepte im verbesserten Tooltip
        [Verbesserung] Informationen zu den Eigenschaften von Status und Gegenständen hinzugefügt

        [Neu] Anpassung der im Tooltip angezeigten Informationen über einzelne Optionen (Achtung, dadurch werden die betreffenden Optionen deaktiviert, ihr müsst sie wieder aktivieren)
        [Neu] Übersetzung in den Tooltips der Gegenstände hinzugefügt
    `,
    '1.1.34.0': `
        [Korrektur] Komplette Verhaltensänderung beim verbesserten Tooltip, um die Nutzung flüssiger und fehlerfrei zu machen. Danke Emmet für die Hilfe

        [Verbesserung] Kompakte Anzeige der Rezepte im verbesserten Tooltip

        [Neu] Anpassung der im Tooltip angezeigten Informationen über einzelne Optionen (Achtung, dadurch werden die betreffenden Optionen deaktiviert, ihr müsst sie wieder aktivieren)
        [Neu] Übersetzung in den Tooltips der Gegenstände hinzugefügt
    `,
    '1.1.33.0': `
        [Korrektur] Komplette Verhaltensänderung beim verbesserten Tooltip, um die Nutzung flüssiger und fehlerfrei zu machen. Danke Emmet für die Hilfe
        [Korrektur] Fälle behoben, in denen der Tooltip weder den Hinweis "shift" noch den Button zum Schließen im fixierten Zustand hatte
        [Korrektur] Verhindert das Fixieren eines Tooltips, bei dem der Hinweis "shift" nicht angezeigt wird
        [Korrektur] Bessere Anzeige der Buttons "Wiki" und "Outils" im Tooltip

        [Neu] Anpassung der im Tooltip angezeigten Informationen über einzelne Optionen
        [Neu] Übersetzung in den Tooltips der Gegenstände hinzugefügt
    `,
    '1.1.32.0': `
        [Korrektur] Komplette Verhaltensänderung beim verbesserten Tooltip, um die Nutzung flüssiger und fehlerfrei zu machen. Danke Emmet für die Hilfe
        [Korrektur] Fälle behoben, in denen der Tooltip weder den Hinweis "shift" noch den Button zum Schließen im fixierten Zustand hatte
        [Korrektur] Verhindert das Fixieren eines Tooltips, bei dem der Hinweis "shift" nicht angezeigt wird
        [Korrektur] Bessere Anzeige der Buttons "Wiki" und "Outils" im Tooltip

        [Neu] Anpassung der im Tooltip angezeigten Informationen über einzelne Optionen
        [Neu] Übersetzung in den Tooltips der Gegenstände hinzugefügt
    `,
    '1.1.31.0': `
        [Korrektur] Komplette Verhaltensänderung beim verbesserten Tooltip, um die Nutzung flüssiger und fehlerfrei zu machen. Danke Emmet für die Hilfe
        [Korrektur] Bessere Anzeige der Buttons "Wiki" und "Outils" im Tooltip

        [Neu] Anpassung der im Tooltip angezeigten Informationen über einzelne Optionen
        [Neu] Übersetzung in den Tooltips der Gegenstände hinzugefügt
    `,
    '1.1.30.0': `
        [Korrektur] Komplette Verhaltensänderung beim verbesserten Tooltip, um die Nutzung flüssiger und fehlerfrei zu machen. Danke Emmet für die Hilfe
        [Korrektur] Bessere Anzeige der Buttons "Wiki" und "Outils" im Tooltip

        [Neu] Anpassung der im Tooltip angezeigten Informationen über einzelne Optionen
        [Neu] Übersetzung in den Tooltips der Gegenstände hinzugefügt
    `,
    '1.1.29.0': `
        [Korrektur] Komplette Verhaltensänderung beim verbesserten Tooltip, um die Nutzung flüssiger und fehlerfrei zu machen. Danke Emmet für die Hilfe
    `,
    '1.1.28.0': `
        [Korrektur] Der Filter für Gegenstandsnamen auf der Müllhalden-Seite funktionierte nicht mehr
    `,
    '1.1.27.0': `
        [Korrektur] Bessere Stabilität beim Öffnen eines Rucksacks
    `,
    '1.1.26.0': `
        [Korrektur] Versuch, die 429-Fehler in der Stadt zu beheben
    `,
    '1.1.25.0': `
        [Korrektur] Versuch, die 429-Fehler in der Stadt zu beheben
    `,
    '1.1.24.0': `
        [Korrektur] Das Skript funktioniert mit der neuen URL von GH
        [Korrektur] 429-Fehler, wenn man sich nicht in der Stadt befindet
        [Korrektur] Bestimmte Fälle, in denen sich der Rucksack bei aktivierter Option nicht automatisch öffnete

        [Sonstiges] Aktualisierung von BBH entfernt (BBH funktioniert nicht mehr)
    `,
    '1.1.23.0': `
        [Korrektur] Anzeige des Wikis im Skript
        [Korrektur] Anzeige von 503-Fehlern beim Angriff
    `,
    '1.1.22.0': `
        [Korrektur] Endlose Aktualisierung
    `,
    '1.1.21.0': `
        [Korrektur] Behebt den 400-Fehler zu Beginn einer Stadt
    `,
    '1.1.20.0': `
        [Korrektur] Anzeige von MHO nach dem Saisonwechsel
    `,
    '1.1.19.0': `
        [Korrektur] Anzeige der Baustellen
        [Korrektur] Anti-Missbrauch-Zähler
        [Korrektur] Anzeige bei Fehlern der externen Tools mit CSS
    `,
    '1.1.18.0': `
        [Korrektur] Anzeige der Baustellen
    `,
    '1.1.17.0': `
        [Neu] Das Skript sendet die Seiteninformationen jetzt auch außerhalb des Chaos-Modus an FataMorgana
    `,
    '1.1.16.0': `
        [Korrektur] Das Skript wurde bei vorhandener Wunschliste nicht mehr angezeigt
    `,
    '1.1.15.0': `
        [Korrektur] Anzeige der Bank im Fenster "Outils"
        [Korrektur] Der Tab "Liste de courses" im Fenster "Outils" wurde entfernt, da veraltet (jetzt auf der Website zu finden)
    `,
    '1.1.14.0': `
        [Korrektur] Korrektur beim Senden der Buddler-Daten an Fata Morgana
    `,
    '1.1.13.0': `
        [Korrektur] Senden der Aufklärer- und Buddler-Daten
        [Korrektur] Anti-Missbrauch
    `,
    '1.1.12.0': `
        [Neu] Option hinzugefügt, um die aus den Berufen (Aufklärer, Buddler) stammenden Informationen an Fata Morgana zu senden
    `,
    '1.1.11.0': `
        [Neu] Option hinzugefügt, um die aus den Berufen (Aufklärer, Buddler) stammenden Informationen an Fata Morgana zu senden
    `,
    '1.1.10.1': `
        [Neu] Option hinzugefügt, um die aus den Berufen (Aufklärer, Buddler) stammenden Informationen an Fata Morgana zu senden
    `,
    '1.1.10.0': `
        [Neu] Option hinzugefügt, um die aus den Berufen (Aufklärer, Buddler) stammenden Informationen an Fata Morgana zu senden
    `,
    '1.1.9.0': `
        [Korrektur] Behebt die Einkaufsliste
    `,
    '1.1.8.0': `
        [Korrektur] Behebt die Einkaufsliste
    `,
    '1.1.7.0': `
        [Korrektur] Behebt den Endlosaufruf auf der Seelen-Seite, wenn man nicht verkörpert ist
    `,
    '1.1.6.0': `
        [Korrektur] Anzeige der fehlenden PA bei Baustellen in Pandämonium

        [Verbesserung] Allgemeine Leistung & Stabilität

        [Neu] Es ist jetzt möglich, einen Zeichenzähler im Chatfeld anzuzeigen
        [Neu] Es ist jetzt möglich, alte Benachrichtigungen erneut zu lesen (solange die Seite nicht neu geladen wurde)
    `,
    '1.1.5.0': `
        [Korrektur] Anzeige der fehlenden PA bei Baustellen in Pandämonium

        [Verbesserung] Allgemeine Leistung & Stabilität

        [Neu] Es ist jetzt möglich, einen Zeichenzähler im Chatfeld anzuzeigen
        [Neu] Es ist jetzt möglich, alte Benachrichtigungen erneut zu lesen (solange die Seite nicht neu geladen wurde)
    `,
    '1.1.4.0': `
        [Korrektur] Diverse Reparaturen an den Rezepten der Gegenstände
    `,
    '1.1.3.0': `
        [Korrektur] Zeigt doppelte Elemente in den Rezepten der Gegenstände korrekt an
    `,
    '1.1.2.0': `
        [Korrektur] Zeigt doppelte Elemente in den Rezepten der Gegenstände korrekt an
    `,
    '1.1.1.0': `
        [Korrektur] Diverse fehlende Eigenschaften bei Gegenständen hinzugefügt
        [Korrektur] Behebt das Senden des Rucksacks an MHO
    `,
    '1.1.0.0': `
        Kompatibilitätsupdate (fast) für S18
    `,
    '1.0.33.0': `
        [Korrektur] Diverse Anzeigekorrekturen
    `,
    '1.0.32.0': `
        [Korrektur] Fehlende Texte in bestimmten Tooltips
    `,
    '1.0.31.0': `
        [Neu] Informationen zu den verbesserten Status-Tooltips hinzugefügt
    `,
    '1.0.30.0': `
        [Korrektur] Beschriftung im Gegenstands-Tooltip (die Info "im Rucksack" wurde statt "in der Bank" angezeigt)
        [Korrektur] Die Aktualisierung im Chaos-Modus funktionierte nicht
    `,
    '1.0.29.0': `
        [Korrektur] Die Buttons zum Erhöhen der Baustellenwerte waren verschwunden
    `,
    '1.0.28.0': `
        [Korrektur] Korrektur der Camping-Berechnung auf dem Feld


        html[lang]
        lang
        fr
    `,
    '1.0.27.0': `
        [Korrektur] Korrektur der Camping-Berechnung auf dem Feld


        html[lang]
        lang
        fr
    `,
    '1.0.26.0': `
        [Korrektur] Das Kopieren des Registers kopiert keine durch den Filter ausgeblendeten Zeilen mehr

        [Änderung] Der Begriff "priorité" wurde aus der Einkaufsliste entfernt, die Farben richten sich jetzt nach der Position
    `,
    '1.0.25.0': `
        [Korrektur] Das Speichern am Wachturm lässt die Anzeige des geschätzten Angriffs nicht mehr abstürzen
    `,
    '1.0.24.0': `
        [Korrektur] Wir versuchen, dass die Reparaturbalken in Pandämonium nicht mehr überlaufen
        [Korrektur] localhost aus der Liste der Matches entfernt
    `,
    '1.0.23.0': `
        [Korrektur] Wir versuchen, dass die Reparaturbalken in Pandämonium immer angezeigt werden, und nicht nur, wenn ihnen danach ist
    `,
    '1.0.22.0': `
        [Korrektur] Diverse Anzeigefehler
    `,
    '1.0.21.0': `
        [Neu] Die Aktualisierung der externen Tools mit aktivierter Status-Option aktualisiert jetzt auch die Information, ob das Bad genommen wurde oder nicht
    `,
    '1.0.20.0': `
        [Aktualisierung des Skriptnamens] Das Skript heißt ab jetzt MHO Addon
    `,
    '1.0.19.0': `
        [Korrektur] Der individuelle Anti-Missbrauch-Zähler zählte nur eine Minute
    `,
    '1.0.18.0': `
        [Korrektur] Anzeigeprobleme
        [Korrektur] Fehler beim Hinzufügen eines Gegenstands zur Einkaufsliste
    `,
    '1.0.17.0': `
        [Korrektur] Das automatische Abrufen der externen ID ist wieder verfügbar

        [Verbesserung] Diverse Leistungsverbesserungen (zumindest hoffen wir das :D)

        [Neu] Option hinzugefügt, mit der eine Nachricht im Haus vorausgefüllt wird, wenn ihr einen Gegenstand senden wollt und die Nachricht leer ist. Die Nachricht wird zufällig aus den für eure Sprache verfügbaren Werten vorausgefüllt. Aktuell gibt es nur eine Nachricht pro Sprache, aber ihr könnt mir gerne Vorschläge machen, damit ich weitere hinzufüge ;)
        [Neu] Option hinzugefügt, um die Expeditionen aus MHO, für die ihr angemeldet seid, im Spiel anzuzeigen
    `,
    '1.0.16.0': `
        [Korrektur] Ein Hotfix wurde nach der Einführung eines Bugs veröffentlicht. Das automatische Abrufen eurer externen ID für die Apps ist vorübergehend nicht mehr verfügbar.
    `,
    '1.0.15.0': `
        [Verbesserung] Verfügbare Updates werden jetzt durch ein visuelles Symbol angezeigt, und bei verfügbarem Update erscheint ein neuer Link im Menü
        [Verbesserung] Die Changelogs werden beim Laden der Anwendung nicht mehr angezeigt, sondern durch ein visuelles Symbol im Menü signalisiert

        [Neu] Eine neue Option erscheint für Fata Morgana: das Senden der Anzahl getöteter Zombies
    `,
    '1.0.14.0': `
        [Korrektur] Fehlende Übersetzungen
        [Korrektur] Benachrichtigung nach Abschluss der Suche
        [Korrektur] Diverse Bugs seit Version 1.0.8.0

        [Verbesserung] Eine neue Option ist verfügbar, um Fata Morgana in einer verwüsteten Stadt zu aktualisieren
    `,
    '1.0.13.0': `
        [Korrektur] Fehlende Übersetzungen
        [Korrektur] Benachrichtigung nach Abschluss der Suche
        [Korrektur] Diverse Bugs seit Version 1.0.8.0

        [Verbesserung] Eine neue Option ist verfügbar, um Fata Morgana in einer verwüsteten Stadt zu aktualisieren
    `,
    '1.0.12.0': `
        [Korrektur] Fehlende Übersetzungen
        [Korrektur] Benachrichtigung nach Abschluss der Suche

        [Verbesserung] Eine neue Option ist verfügbar, um Fata Morgana in einer verwüsteten Stadt zu aktualisieren
    `,
    '1.0.11.0': `
        [Korrektur] Fehlende Übersetzungen
        [Korrektur] Benachrichtigung nach Abschluss der Suche

        [Verbesserung] Eine neue Option ist verfügbar, um Fata Morgana in einer verwüsteten Stadt zu aktualisieren
    `,
    '1.0.10.0': `
        [Korrektur] Fehlende Übersetzungen
        [Korrektur] Benachrichtigung nach Abschluss der Suche

        [Verbesserung] Eine neue Option ist verfügbar, um Fata Morgana in einer verwüsteten Stadt zu aktualisieren
    `,
    '1.0.9.0': `
        [Korrektur] Beim Speichern der Suchergebnisse wurden die Ergebnisse der Person, die speicherte, nie berücksichtigt
        [Korrektur] Ein Anzeigefehler bei den Links zu den externen Profilen der Nutzer wurde behoben
        [Korrektur] Einige Korrekturen am Anti-Missbrauch-System (das ist noch nicht vorbei, und ich habe das Gefühl, kein Ende zu sehen 🥲)
        [Korrektur] Ein Integrationsfehler mit Fata Morgana wurde behoben

        [Entfernt] Die Benachrichtigungsfunktion bei neuen Nachrichten wurde entfernt, da sie jetzt nativ in MyHordes existiert
    `,
    '1.0.8.0': `
        [Verbesserung] Eine neue Option ist verfügbar, um Fata Morgana in einer verwüsteten Stadt zu aktualisieren
    `,
    '1.0.7.0': `
        [Korrektur] Beim Speichern der Suchergebnisse wurden die Ergebnisse der Person, die speicherte, nie berücksichtigt
        [Korrektur] Ein Anzeigefehler bei den Links zu den externen Profilen der Nutzer wurde behoben
        [Korrektur] Einige Korrekturen am Anti-Missbrauch-System (das ist noch nicht vorbei, und ich habe das Gefühl, kein Ende zu sehen 🥲)
        [Korrektur] Ein Integrationsfehler mit Fata Morgana wurde behoben

        [Entfernt] Die Benachrichtigungsfunktion bei neuen Nachrichten wurde entfernt, da sie jetzt nativ in MyHordes existiert
    `,
    '1.0.6.0': `
        [Korrektur] Anzeige und Speicherung der Wachturm-Schätzungen in der Firefox-Erweiterung

        [Verbesserung] Es muss nicht mehr Enter gedrückt werden, um eine Übersetzung zu starten, sie startet automatisch bei jeder Eingabe von mehr als 2 Buchstaben
        [Verbesserung] Visuelles Symbol am Button zum Kopieren des Registers, sobald die Kopie erfolgt ist

        [Neu] Links zu den externen Profilen im Benutzer-Popup hinzugefügt
    `,
    '1.0.5.0': `
        [Korrektur] Die erste Bank-Entnahme zählt wieder nicht für den Anti-Missbrauch-Schutz
        [Korrektur] Übersetzungen

        [Neu] Suchfeld auf der Müllhalden-Seite
        [Neu] Anzeige des Gefräßigkeits-Prozentsatzes auf der Anzeige
    `,
    '1.0.4.0': `
        [Korrektur] Der Button zum Hinzufügen eines Gegenstands zur Einkaufsliste erscheint jetzt nicht mehr bei Gegenständen des Bank-Tools
        [Korrektur] Der "CloneInto"-Fehler sollte (endlich) behoben sein
        [Korrektur] Das Rezept-Wiki ist in der Erweiterung wieder erreichbar
    `,
    '1.0.3.0': `
        [Korrektur] Behebt die Anzeige des Aktualisierungs-Buttons der externen Tools unter Chrome
        [Korrektur] Behebt das Abrufen der Einkaufsliste, wenn sie existiert
    `,
    '1.0.2.0': `
        [Korrektur] Behebt die Anzeige des Erfolgssymbols nach einer Aktualisierung der externen Tools auf kleinen Bildschirmen im kompakten Modus
        [Korrektur] Behebt die Anzeige des Ladesymbols in den Tooltips, das auf Deutsch war, obwohl dort gar kein Text stehen sollte
        [Korrektur] Die Anzeige des APAG-Tooltips ist jetzt sauberer
        [Korrektur] Behebt die Camping-Berechnung, die den falschen Wert für das Gebäude berücksichtigte

        [Neu] Button hinzugefügt, um alle Einstellungen anzukreuzen
    `,
    '1.0.1.0': `
        Diese Version enthält wichtige technische Änderungen. Aus diesem Grund müsst ihr eure Optionen eventuell neu einrichten.

        [Korrektur] Behebt das Problem des unerwünschten Ladens, das MyHordes blockierte.

        [Verbesserung] Option für jedes externe Tool hinzugefügt, um zu wählen, ob es beim Tab-Wechsel aktualisiert werden soll oder nicht. Wenn ihr euch auf diese bereits vorhandene Funktion verlassen habt, vergesst nicht, sie in den Optionen wieder zu aktivieren.
    `,
    '1.0.0.0': `
        Diese Version enthält wichtige technische Änderungen. Aus diesem Grund müsst ihr eure Optionen eventuell neu einrichten.

        [Korrektur] Behebt das Problem des unerwünschten Ladens, das MyHordes blockierte.

        [Verbesserung] Option für jedes externe Tool hinzugefügt, um zu wählen, ob es beim Tab-Wechsel aktualisiert werden soll oder nicht. Wenn ihr euch auf diese bereits vorhandene Funktion verlassen habt, vergesst nicht, sie in den Optionen wieder zu aktivieren.
    `,
    '1.0.0': `
        Diese Version enthält wichtige technische Änderungen. Aus diesem Grund müsst ihr eure Optionen eventuell neu einrichten.

        [Korrektur] Behebt das Problem des unerwünschten Ladens, das MyHordes blockierte.

        [Verbesserung] Option für jedes externe Tool hinzugefügt, um zu wählen, ob es beim Tab-Wechsel aktualisiert werden soll oder nicht. Wenn ihr euch auf diese bereits vorhandene Funktion verlassen habt, vergesst nicht, sie in den Optionen wieder zu aktivieren.
    `,
    '1.0.0-beta.73': `
        [Korrektur] Anzeige der Camping-Berechnungen
    `,
    '1.0.0-beta.72': `
        [Korrektur] Update-Link des Skripts bei veraltetem Skript
        [Korrektur] Aktualisierung des Camping-Rechners für S16
        [Korrektur] Anzeige der Reparaturen in Pandämonium korrigiert
        [Korrektur] Behebt die Rationsentnahme im Anti-Missbrauch-System

        [Verbesserung] Das Skript sollte bei mehreren gleichzeitig fehlschlagenden Aufrufen nicht mehr mehrere Fehler gleichzeitig anzeigen
        [Verbesserung] Die in einem Gebäude auffindbaren Gegenstände sind nach Wahrscheinlichkeit sortiert
    `,
    '1.0.0-beta.71': `
        [Korrektur] Anzeige der Zusatzinformationen zu einem Gebäude korrigiert

        [Verbesserung] Methoden eingeführt, um die Anzahl der Aufrufe an die MyHordes-API zu begrenzen
    `,
    '1.0.0-beta.70': `
        [Korrektur] Korrekturen an der Anzeige der zu reparierenden Baustellen in Pandämonium

        [Verbesserung] Von MH stammende Fehler werden jetzt besser behandelt und angezeigt
        [Verbesserung] Der Block der Zusatzinformationen zeigt jetzt die im Gebäude auffindbaren Gegenstände an
    `,
    '1.0.0-beta.69': `
        [Verbesserung] Der Filter zum Ausblenden fertiger Baustellen blendet beschädigte Baustellen nicht mehr aus
        [Verbesserung] Korrekturen an den Schätzungen
        [Verbesserung] Der Block der Zusatzinformationen zeigt jetzt an, ob das Gebäude leer ist
    `,
    '1.0.0-beta.68': `
        [Korrektur] Das Kopieren des Registers entfernt jetzt überflüssige Leerzeichen am Zeilenanfang

        [Verbesserung] Die verschiedenen Filter berücksichtigen jetzt keine Akzente mehr
        [Verbesserung] Visuelle Verbesserung des Blocks der Zusatzinformationen

        [Neu] Filter hinzugefügt, um fertige Baustellen auszublenden
    `,
    '1.0.0-beta.67': `
        [Korrektur] Ein Bug beim Speichern des Werts 0 der TDG wurde behoben

        [Neu] Beim Laden des Skripts wird jetzt eine Meldung angezeigt, wenn es nicht auf dem neuesten Stand ist.
    `,
    '1.0.0-beta.66': `
        [Korrektur] Ein Bug beim Speichern des Werts 0 der TDG wurde behoben

        [Neu] Beim Laden des Skripts wird jetzt eine Meldung angezeigt, wenn es nicht auf dem neuesten Stand ist.
    `,
    '1.0.0-beta.65': `
        [Korrektur] Ein Bug beim Speichern des Werts 0 der TDG wurde behoben

        [Neu] Beim Laden des Skripts wird jetzt eine Meldung angezeigt, wenn es nicht auf dem neuesten Stand ist.
    `,
    '1.0.0-beta.64': `
        [Korrektur] Ein Bug beim Speichern der Werte der TDG wurde behoben

        [Verbesserung] Versuch, die Tooltips zu verbessern, um bei Rezepten eine Scrollleiste anzuzeigen
        [Verbesserung] Der verbesserte Tooltip zeigt jetzt den Ablageort eines Gegenstands der Einkaufsliste an
        [Verbesserung] Die in die Seite eingebettete Einkaufsliste ist jetzt nach Priorität sortiert und zeigt nur die auf dem Feld vorhandenen Gegenstände an
    `,
    '1.0.0-beta.63': `
        [Korrektur] Ein Bug bei den Eskorte-Optionen wurde behoben, die nach einer Aktualisierung nicht immer korrekt waren
    `,
    '1.0.0-beta.62': `
        [Korrektur] Suchfehler beim Namen einer Baustelle
    `,
    '1.0.0-beta.61': `
        [Korrektur] Diverse Anzeigekorrekturen der Einstellungen, insbesondere auf Mobilgeräten oder kleinen Bildschirmen
    `,
    '1.0.0-beta.60': `
        [Verbesserung] Die Übersetzungsleiste, die sich mit Spielelementen überschneiden konnte, wurde verschoben
        [Verbesserung] Verbesserte Anzeige der Einstellungen, insbesondere auf Mobilgeräten oder Bildschirmen, die klein genug sind, um ein Scrollen in den Einstellungen zu erfordern
    `,
    '1.0.0-beta.59': `
        Achtung, einige Änderungen könnten eure ausgewählten Optionen beeinflusst haben, stellt sicher, dass alles in Ordnung ist!

        [Korrektur] Behebt die Anzeige bestimmter Bilder, die nicht immer angezeigt wurden
        [Korrektur] Behebt die Berücksichtigung des Berufs im integrierten Camping-Rechner

        [Verbesserung] Neuorganisation des Menüs, in dem die Optionen langsam zu viel Platz einnahmen
        [Verbesserung] Trennung bestimmter Optionen (Aktualisierung in verwüsteter Stadt und Senden der Anzahl getöteter Zombies / Suchfelder)

        [Neu] Option hinzugefügt, um die TDG-Schätzungen in MHO zu speichern, die gespeicherten Werte einzusehen und sie fürs Forum zu kopieren
        [Neu] Option hinzugefügt, um ein Suchfeld im Register anzuzeigen
        [Neu] Option hinzugefügt, um die Eskorte-Optionen festzulegen, die beim Aktivieren des Eskorte-Wartens angewendet werden
        [Neu] Option hinzugefügt, um den Nutzer bei mehr als 5 Minuten Inaktivität zu benachrichtigen, wenn er die Eskorte nicht freigegeben oder sich nicht ins Eskorte-Warten begeben hat
    `,
    '1.0.0-beta.58': `
        [Korrektur] Behebt bestimmte Verhaltensweisen des Anti-Missbrauch-Zählers

        [Neu] Button zum Kopieren des Registers hinzugefügt

        [Wiederhergestellt] Die Option zum Senden der Hausverbesserungen wurde wieder eingeführt. Ein neuer Button wird auf der Verbesserungsseite erstellt
    `,
    '1.0.0-beta.57': `
        [Korrektur] Behebt die Anzeige des Aktualisierungs-Buttons auf kleinen Bildschirmen, wenn der kompakte Modus in den Optionen nicht aktiviert ist
        [Korrektur] Behebt bestimmte Verhaltensweisen des Anti-Missbrauch-Zählers
        [Korrektur] Sollte die Anzeige der Bilder korrigieren, die manchmal fehlerhaft war

        [Verbesserung] Der Button für den Zugriff auf die Skript-Optionen ist auf kleinen Bildschirmen jetzt größer
    `,
    '1.0.0-beta.56': `
        [Korrektur] Behebt die Anzeige der Anzahl toter Zombies auf dem Feld
    `,
    '1.0.0-beta.55': `
        [Korrektur] Die Anzahl verbleibender APAG-Ladungen wurde falsch gespeichert
    `,
    '1.0.0-beta.54': `
        [Neu] Option hinzugefügt, um einen kompakten Modus auf Mobilgeräten für den Aktualisierungs-Button der externen Tools zu aktivieren
    `,
    '1.0.0-beta.53': `
        [Neu] Option hinzugefügt, um einen kompakten Modus auf Mobilgeräten für den Aktualisierungs-Button der externen Tools zu aktivieren
    `,
    '1.0.0-beta.52': `
        [Korrektur] Anzeige der verbesserten Tooltips nach dem MyHordes-Update korrigiert
        [Korrektur] Ein Bug, der Zeilen der Bank-Entnahmen im Anti-Missbrauch-Tracking-Tool verdoppelte, wurde behoben

        [Achtung] Die Hausverbesserungen werden nach dem MyHordes-Update nicht mehr an MHO und GH gesendet. Ich werde versuchen, eine Lösung zu finden, um diese Funktion wiederherzustellen, aber ohne Garantie.
    `,
    '1.0.0-beta.51': `
        [Korrektur] Diverse Verhaltensweisen korrigiert

        [Neu] Option hinzugefügt, um einen Zähler für Bank-Entnahmen anzuzeigen
    `,
    '1.0.0-beta.50': `
        [Korrektur] Diverse Verhaltensweisen korrigiert

        [Verbesserung] Sollte jetzt mit Greasemonkey funktionieren

        [Neu] Option hinzugefügt, um das Menü "Gegenstand verwenden" automatisch zu öffnen
    `,
    '1.0.0-beta.49': `
        [Korrektur] Tippfehler
        [Korrektur] Anzeige der Warnung bei unvollständigem Register
    `,
    '1.0.0-beta.48': `
        [Korrektur] Der Wert des Zauns wird korrekt an GH gesendet
    `,
    '1.0.0-beta.47': `
        [Korrektur] Endlosschleife, wenn man eskortiert wurde (ups)
        [Korrektur] Anzeige der fehlenden PA, damit die Baustelle nachts nicht zerstört wird
    `,
    '1.0.0-beta.46': `
        [Korrektur] Das Kopieren der BBH-Karte funktioniert wieder
        [Korrektur] Die Größe der Hilfe-Tooltips ist wieder angemessen
    `,
    '1.0.0-beta.45': `
        [Korrektur] Fehler in der Konsole entfernt
        [Korrektur] Die Karte öffnete sich nicht mehr
    `,
    '1.0.0-beta.44': `
        [Verbesserung] Optik des Hinweises, der angezeigt wird, wenn die Such-Option aktiviert ist, die Suchdaten aber unvollständig sind
    `,
    '1.0.0-beta.43': `
        [Korrektur] Fehlende Übersetzungen hinzugefügt

        [Verbesserung] Ein Hinweis wird auf der Karte angezeigt, wenn die Such-Option aktiviert ist, die Suchdaten aber unvollständig sind (Registerzeilen nicht geladen)
    `,
    '1.0.0-beta.42': `
        [Korrektur] Position des MHO-Icons

        [Verbesserung] Bei einer Aktualisierung von GH wird die Seite nicht mehr komplett neu geladen, sondern nur noch die Karte

        [Entfernt] Nach einem Gespräch mit dem MyHordes-Team (das seinerseits einer intensiven Diskussion im Welt-Forum folgte) wurde die Funktion für Zusatzinformationen zu Bürgern - von manchen "Omniscience++" oder für die Faulsten "O++" genannt - entfernt.
    `,
    '1.0.0-beta.41': `
        [Korrektur] Das Menü, das nach Änderungen auf Seiten von MH unter die Oberflächenelemente rutschte, wurde repariert
    `,
    '1.0.0-beta.40': `
        [Verbesserung] Diverse Übersetzungen und Formulierungen
        [Verbesserung] Zusammenfassung der Suchfeld-Optionen zu einer einzigen Option

        [Neu] Camping-Simulator hinzugefügt, direkt auf dem Feld verfügbar
        [Neu] Option hinzugefügt, um Notizen auf einem Feld anzuzeigen, die von der MHO-Karte stammen
    `,
    '1.0.0-beta.39': `
        [MH][Verbesserung] Die Aktualisierung der Einkaufsliste sollte jetzt korrekt funktionieren
    `,
    '1.0.0-beta.38': `
        [MH][Korrektur] Der Link zur Website war ungültig

        [MH][Verbesserung] Spanische Übersetzungen (danke Bacchus)
        [MH][Verbesserung] Die Aktualisierung der Einkaufsliste aus dem Fenster "Outils" wurde entfernt und ausschließlich der Website übertragen
    `,
    '1.0.0-beta.37': `
        [MH][Verbesserung] Spanische Übersetzungen (danke Bacchus)
        [MH][Verbesserung] Die Aktualisierung der Einkaufsliste aus dem Fenster "Outils" wurde entfernt und ausschließlich der Website übertragen
    `,
    '1.0.0-beta.36': `
        [MH][Verbesserung] Erfolgschancen des Handbuchs im zugehörigen Tooltip hinzugefügt
    `,
    '1.0.0-beta.35': `
        [MH][Neu] Option hinzugefügt, um die Nachrichtenempfänger zu filtern
    `,
    '1.0.0-beta.34': `
        [MH][Neu] Option hinzugefügt, um Browser-Benachrichtigungen zu erhalten, wenn sich die Anzahl der MH-Benachrichtigungen ändert
    `,
    '1.0.0-beta.33': `
        [MH][Korrektur] Der in Tampermonkey verwendete Link zur Dokumentation wurde korrigiert

        [MH][Verbesserung] Der Link zur Website wurde ganz nach oben in die Optionsliste verschoben (ich hoffe, dieses Mal wissen endlich alle, dass es ihn gibt 😊)
    `,
    '1.0.0-beta.32': `
        [MH][Korrektur] Stile korrigiert, die die Aufzählungspunkte von MH in den Foren überschrieben haben (sorry :( )

        [MH][Verbesserung] Übersetzungen hinzugefügt (Englisch und Deutsch) - danke Xochi, Crazy Unicorn, Nekomine!
    `,
    '1.0.0-beta.31': `
        [MH][Korrektur] Digs => searches

        [MH][Verbesserung] Berücksichtigung der Gegenstandsmenge in den Rucksäcken in der Einkaufsliste
    `,
    '1.0.0-beta.30': `
        [MH][Korrektur] Die an MHO gesendete Liste der auf dem Feld anwesenden Bürger war leer, wenn sich nur eine Person auf dem Feld befand
    `,
    '1.0.0-beta.29': `
        [MH][Verbesserung] Der Button zum Löschen der externen ID für Apps wurde durch einen Bearbeiten-Button ersetzt
        [MH][Verbesserung] Visuelle Korrekturen auf der Seite mit Zusatzinformationen zu den Bürgern

        [MH][Neu] Option hinzugefügt, um die Ergebnisse eurer Suche an MHO zu übermitteln. Lese- und Bearbeitungswerkzeuge stehen euch auf der Website zur Verfügung
    `,
    '1.0.0-beta.28': `
        [MH][Korrektur] Aktualisierung der externen Tools korrigiert bei 0 APAG-Ladungen
    `,
    '1.0.0-beta.27': `
        [MH-beta][Korrektur] Die Gegenstandsliste wurde repariert: die Fette Python existierte darin nicht, was bei einer Aktualisierung mit einer fetten Python zu Fehlern führte
        [MH][Korrektur]Die integrierte GH-Karte wurde repariert (aber nein, sie zeigt immer noch keine Expeditionen an)

        [MH][Verbesserung] Die verbesserte Bürgerliste in der Stadt ist jetzt besser organisiert und weiterhin alphabetisch sortiert. Im Gegenzug dauert das Laden etwas länger
        [MH][Verbesserung] Der Durchgang in Kraft gehört jetzt zu den gespeicherten AH
    `,
    '1.0.0-beta.26': `
        [MH-beta][Verbesserung] MHO unterstützt jetzt die Aktualisierung von FataMorgana in der Beta
    `,
    '1.0.0-beta.25': `
        [MH-beta][Korrektur] Korrektur beim Senden von Informationen an GH
    `,
    '1.0.0-beta.24': `
        [Korrektur] Die verschwundene API-Aufruf-URL wurde wiederhergestellt (magic everywhere)

        [MH-beta] Deaktivierung der Aufrufe an BBH & Fata. Sie werden reaktiviert, sobald eine kompatible Beta-Version existiert. Die Optionen bleiben weiterhin sichtbar, haben aber keine Wirkung
    `,
    '1.0.0-beta.23': `
        Skript auf der Beta-Website von MH hinzugefügt - keine Neuerung
    `,
    '1.0.0-beta.22': `
        Skript auf der Beta-Website von MH hinzugefügt - keine Neuerung
    `,
    '1.0.0-beta.21': `
        Skript auf der Beta-Website von MH hinzugefügt - keine Neuerung
    `,
    '1.0.0-beta.20': `
        [Korrektur] Diverse Korrekturen, um Abstürzen vorzubeugen
    `,
    '1.0.0-beta.19': `
        [Korrektur] Das Skript stürzt ab, wenn der Nutzer keine heroischen Fähigkeiten hat
    `,
    '1.0.0-beta.18': `
        [Korrektur] Der Zustand "Top in Form" wurde nie an GH gesendet
    `,
    '1.0.0-beta.17': `
        [Korrektur] Es war nicht möglich, den Rucksack in MHO zu speichern, wenn ihr denselben Gegenstand zweimal darin hattet (ups)
    `,
    '1.0.0-beta.16': `
        [Neu] Zwei neue Optionen sind verfügbar, um GH zu aktualisieren: die automatische Aktualisierung der heroischen Fähigkeiten und die Aktualisierung der Hausverbesserungen! Denkt daran, sie in euren Optionen zu aktivieren!
    `,
    '1.0.0-beta.15': `
        [Korrektur] Senden der korrekten Informationen an GH
    `,
    '1.0.0-beta.14': `
        [Neu] Möglichkeit, Zusatzinformationen in MHO zu speichern. Denkt daran, die zugehörigen Optionen anzukreuzen!
    `,
    '1.0.0-beta.13': `
        [Korrektur] Korrektur des Verhaltens bei der Aktualisierung von GH
    `,
    '1.0.0-beta.12': `
        [Korrektur] Korrektur der Fehler bei der Aktualisierung des Rucksackinhalts
    `,
    '1.0.0-beta.11': `
        [Korrektur] Die Anzeige des Buttons nach Aktualisierungen sollte jetzt korrigiert sein!
    `,
    '1.0.0-beta.10': `
        [Neu] Es ist jetzt möglich, den Inhalt des Rucksacks über den Aktualisierungs-Button der externen Tools zu speichern. Die Rucksäcke können über die Bürgerliste der MHO-Website eingesehen und bearbeitet werden.
        Vergesst nicht, die zugehörige Option in euren Einstellungen zu aktivieren, damit diese Aktualisierung möglich ist!

        [Übersetzungen] Danke an isaaclw, der uns einige englische Übersetzungen geliefert hat! Wenn ihr zur Übersetzung beitragen möchtet, tretet gerne dem Discord bei oder kontaktiert mich per PN
    `,
    '1.0.0-beta.09': `
        [Neu] Es ist jetzt möglich, den Inhalt des Rucksacks über den Aktualisierungs-Button der externen Tools zu speichern. Die Rucksäcke können über die Bürgerliste der MHO-Website eingesehen und bearbeitet werden.
        Vergesst nicht, die zugehörige Option in euren Einstellungen zu aktivieren, damit diese Aktualisierung möglich ist!

        [Übersetzungen] Danke an isaaclw, der uns einige englische Übersetzungen geliefert hat! Wenn ihr zur Übersetzung beitragen möchtet, tretet gerne dem Discord bei oder kontaktiert mich per PN
    `,
    '1.0.0-beta.08': `
        [Korrektur] Diverse Korrekturen, um das Skript für iOS-Nutzer zum Laufen zu bringen.
        [Korrektur] Ein von der MH-API gemeldeter, aber nicht mehr existierender Gegenstand wurde entfernt
        [Korrektur] Anzeige eines Fehlers beim Aktualisieren der externen Apps, wenn nicht alle angekreuzt wurden (obwohl die Aktualisierung eigentlich gut verläuft)
    `,
    '1.0.0-beta.07': `
        [Korrektur] Korrektur beim Speichern des Status "erschöpftes Feld" auf GH
    `,
    '1.0.0-beta.06': `
        [Korrektur] Korrektur beim Speichern der Anzahl getöteter Zombies auf GH

        [Wichtig] Wir haben die Struktur der Datenbank geändert. Bestehende Einkaufslisten wurden dabei nicht übernommen. Wenn ihr eure Einkaufsliste behalten möchtet, kontaktiert uns bitte im Discord von MHO, damit wir sie für euch wiederherstellen.
    `,
    '1.0.0-beta.05': `
        [Neu] Oberfläche, mit der die Entwicklung jedes Bürgers abgerufen werden kann (auf der Bürgerseite)
        [Neu] Neue Option, um die Anzahl der auf dem Feld getöteten Zombies an GH zu senden, um Zombie-Markierungen zu setzen

        [Wichtig] Wir haben die Struktur der Datenbank geändert. Bestehende Einkaufslisten wurden dabei nicht übernommen. Wenn ihr eure Einkaufsliste behalten möchtet, kontaktiert uns bitte im Discord von MHO, damit wir sie für euch wiederherstellen.
    `,
    '1.0.0-beta.04': `
        [Wichtig] Wir haben die Struktur der Datenbank geändert. Bestehende Einkaufslisten wurden dabei nicht übernommen. Wenn ihr eure Einkaufsliste behalten möchtet, kontaktiert uns bitte im Discord von MHO, damit wir sie für euch wiederherstellen.
    `,
    '1.0.0-beta.03': `
        [Wichtig] Wir haben die Struktur der Datenbank geändert. Bestehende Einkaufslisten wurden dabei nicht übernommen. Wenn ihr eure Einkaufsliste behalten möchtet, kontaktiert uns bitte im Discord von MHO, damit wir sie für euch wiederherstellen.
    `,
    '1.0.0-beta.02': `
        [Wichtig] Wir haben die Struktur der Datenbank geändert. Bestehende Einkaufslisten wurden dabei nicht übernommen. Wenn ihr eure Einkaufsliste behalten möchtet, kontaktiert uns bitte im Discord von MHO, damit wir sie für euch wiederherstellen.
    `,
    '1.0.0-beta.01': `
        [Wichtig] Wir haben die Struktur der Datenbank geändert. Bestehende Einkaufslisten wurden dabei nicht übernommen. Wenn ihr eure Einkaufsliste behalten möchtet, kontaktiert uns bitte im Discord von MHO, damit wir sie für euch wiederherstellen.
    `,
    '1.0.0-alpha.73': `
        [Korrektur] Reparatur der Baustellensuche
    `,
    '1.0.0-alpha.72': `
        [Entfernt] Die experimentelle Funktion zur Verhinderung gefährlicher Aktionen (Zyanid / Abhängigkeit) wurde entfernt
    `,
    '1.0.0-alpha.71': `
        [Korrektur] Reparatur des Baustellenfilters
    `,
    '1.0.0-alpha.70': `
        [Neu] Berechnung der Anzahl an Zombies hinzugefügt, die aus Verzweiflung auf einem Feld sterben werden
        [Neu] Es ist nicht mehr nötig, seine externe App-ID anzugeben
    `,
    '1.0.0-alpha.69': `
        [Neu] Berechnung der Anzahl an Zombies hinzugefügt, die aus Verzweiflung auf einem Feld sterben werden
        [Neu] Es ist nicht mehr nötig, seine externe App-ID anzugeben
    `,
    '1.0.0-alpha.68': `
        [Neu] Berechnung der Anzahl an Zombies hinzugefügt, die aus Verzweiflung auf einem Feld sterben werden
        [Neu] Es ist nicht mehr nötig, seine externe App-ID selbst anzugeben
    `,
    '1.0.0-alpha.67': `
        [Korrektur] Wir versuchen, die Leistung zu verbessern
    `,
    '1.0.0-alpha.66': `
        [Neu] Sicherheitszertifikat hinzugefügt
    `,
    '1.0.0-alpha.65': `
        [Korrektur] Erklärender Satz zum Feld für das Hinzufügen eines Gegenstands zur Einkaufsliste hinzugefügt

        [Neu] In der Einkaufsliste kann jetzt ausgewählt werden, wohin der Gegenstand gebracht werden soll (Bank oder Sammelzone)
    `,
    '1.0.0-alpha.64': `
        [Korrektur] Erklärender Satz zum Feld für das Hinzufügen eines Gegenstands zur Einkaufsliste hinzugefügt

        [Neu] In der Einkaufsliste kann jetzt ausgewählt werden, wohin der Gegenstand gebracht werden soll (Bank oder Sammelzone)
    `,
    '1.0.0-alpha.63': `
        [Korrektur] Erklärender Satz zum Feld für das Hinzufügen eines Gegenstands zur Einkaufsliste hinzugefügt

        [Neu] In der Einkaufsliste kann jetzt ausgewählt werden, wohin der Gegenstand gebracht werden soll (Bank oder Sammelzone)
    `,
    '1.0.0-alpha.62': `
        [Verbesserung] Nach dem Kopieren einer Karte informiert der Button-Text den Nutzer ausdrücklich darüber
    `,
    '1.0.0-alpha.61': `
        [Korrektur] Der Discord-Link, der nur ein einziges Mal funktionierte, bevor er einseitig beschloss, unbrauchbar zu werden, wurde korrigiert
    `,
    '1.0.0-alpha.60': `
        [Neu] Der Mail-Link wurde durch einen Discord-Link ersetzt
        [Neu] Die Oberflächenergänzungen im Spiel sind jetzt deutlich als von MHO stammend gekennzeichnet
    `,
    '1.0.0-alpha.59': `
        [Korrektur] Die Anzeige der Prioritäts-"Aura" funktionierte nicht mehr
    `,
    '1.0.0-alpha.58': `
        [Korrektur] Anzeige der Einkaufsliste auf der Seite
        [Korrektur] Anzeige bestimmter Icons in den Rezepten
    `,
    '1.0.0-alpha.57': `
        [Korrektur] Anzeige der Einkaufsliste auf der Seite
    `,
    '1.0.0-alpha.56': `
        [Neu] Spanische Übersetzung (Danke Nekomine!)
    `,
    '1.0.0-alpha.55': `
        [Neu] Spanische Übersetzung (Danke Nekomine!)
    `,
    '1.0.0-alpha.54': `
        [Korrektur] Bei fehlender gespeicherter Wunschliste funktionierte der Wunschlisten-Bildschirm nicht
    `,
    '1.0.0-alpha.53': `
        [Korrektur] Die Positionierung des Übersetzungsfelds blockiert den Umfrage-Button nicht mehr
    `,
    '1.0.0-alpha.52': `
        [Korrektur] Bilder der Gegenstände

        [Neu] Button hinzugefügt, um die externe App-ID aus MHO zu entfernen, ohne über die Einstellungen der Erweiterung gehen zu müssen
        [Neu] Datum der letzten Aktualisierung der Einkaufsliste auf der Einkaufslisten-Seite hinzugefügt
    `,
    '1.0.0-alpha.51': `
        [Korrektur] Server-Migration, um Quota-Probleme zu vermeiden (wir drücken die Daumen, dass es danach weiterhin klappt...). Die Migration betrifft leider noch nicht das Camping und die Gebäudeliste
    `,
    '1.0.0-alpha.50': `
        [Korrektur] Server-Migration, um Quota-Probleme zu vermeiden (wir drücken die Daumen, dass es danach weiterhin klappt...). Die Migration betrifft leider noch nicht das Camping und die Gebäudeliste
    `,
    '1.0.0-alpha.49': `
        [Neu] Gebäudeliste und Wahrscheinlichkeiten für die darin auffindbaren Gegenstände, alles unter "Wiki" > "Bâtiments"

        [Experimentell] Schätzung der Überlebenschancen beim Camping. Zu finden unter "Outils" > "Camping"
    `,
    '1.0.0-alpha.48': `
        [Entfernt] Die Schätzungsfunktion wurde entfernt. Die Berechnungsmethode wurde wie angekündigt geändert, wodurch die Funktion unwirksam wurde
    `,
    '1.0.0-alpha.47': `
        [Verbesserung] Bankbestand und gewünschter Bestand im erweiterten Tooltip hinzugefügt
    `,
    '1.0.0-alpha.46': `
        [Verbesserung] Übersetzungen für die Angriffsschätzungs-Funktion (nur noch wenige Tage, um sie zu nutzen, bevor sie verschwindet)
    `,
    '1.0.0-alpha.45': `
        [Neu] Neue Option, mit der die Schwelle (70% + 1 PA) angezeigt wird, ab der Baustellen repariert werden müssen, damit sie in Pandämonium nicht zerstört werden
    `,
    '1.0.0-alpha.44': `
        [Experimentell] (Vorübergehende) Funktion zur Angriffsschätzung
    `,
    '1.0.0-alpha.43': `
        [Experimentell] (Vorübergehende) Funktion zur Angriffsschätzung
    `,
    '1.0.0-alpha.42': `
        [Korrektur] Ups, ich hatte vergessen, die Kartenoption wieder zu aktivieren, sie war zwar implementiert, aber unmöglich zu aktivieren ^^'
        [Korrektur] Ich versuche seit einiger Zeit, die Benachrichtigungsfunktion am Ende der Suche zu verbessern, es scheint stabiler zu sein

        [Verbesserung] PA des Cafés im verbesserten Tooltip hinzugefügt
    `,
    '1.0.0-alpha.41': `
        [Neu] Die Funktion zur Kartenansicht, die entfernt worden war, wurde wieder implementiert.
        Ab jetzt werden die Karten anhand der Daten rekonstruiert, die durch Klicken auf den Button "copier" abgerufen werden.
        Es ist daher normal, dass das Design eurer Karte nicht mit dem eures bevorzugten Tools identisch ist!
    `,
    '1.0.0-alpha.40': `
        [Neu] Die Funktion zur Kartenansicht, die entfernt worden war, wurde wieder implementiert.
        Ab jetzt werden die Karten anhand der Daten rekonstruiert, die durch Klicken auf den Button "copier" abgerufen werden.
        Es ist daher normal, dass das Design eurer Karte nicht mit dem eures bevorzugten Tools identisch ist!
    `,
    '1.0.0-alpha.39': `
        [Vorübergehend] Verwendung von Englisch anstelle von Spanisch, solange die spanischen Übersetzungen fehlen
    `,
    '1.0.0-alpha.38': `
        [Korrektur] Das Hinzufügen eines Einkaufslisten-Elements zu dieser Liste von der Einkaufslisten-Seite aus sollte jetzt korrekt funktionieren
    `,
    '1.0.0-alpha.37': `
        [Korrektur] Die Option zum Kopieren der Karten der externen Tools wurde aufgrund eines Tampermonkey-Bugs entfernt
        [Korrektur] Das Hinzufügen eines Einkaufslisten-Elements zu dieser Liste von der Einkaufslisten-Seite aus sollte jetzt korrekt funktionieren
    `,
    '1.0.0-alpha.36': `
        [Korrektur] Die Aktivierung des Skripts führte zum Verschwinden eines Hintergrundelements der Website
    `,
    '1.0.0-alpha.35': `
        [Korrektur] Wenn eine Berechtigung abgelehnt wurde, konnte man nicht auf die Website zugreifen

        [Verbesserung] Link zur Dokumentation in der Skriptbeschreibung hinzugefügt, damit sie schon vor jeder Installation zugänglich ist
    `,
    '1.0.0-alpha.34': `
        [Korrektur] Sortierungen nicht immer funktionsfähig
        [Korrektur] Anzeige der Button-Beschriftung bei Fata Morgana / Chrome
    `,
    '1.0.0-alpha.33': `
        [Verbesserung] Wenn eines der externen Tools sich nicht richtig aktualisiert, werden die Details zu Erfolgen und Fehlschlägen angezeigt

        [Neu] Unterstützung für Violentmonkey
    `,
    '1.0.0-alpha.32': `
        [Korrektur] Abruf der Karte von GH nach der neuen Version (aber die Karte ist immer noch unvollständig :'( )

        [Achtung] Nach dem Update auf V2 von Gest'Hordes funktioniert die Aktualisierung über das Skript und die Website von MHO nicht mehr. Wir arbeiten aktiv an einer Lösung des Problems.
    `,
    '1.0.0-alpha.31': `
        [Neu] Auswahlfeld mit Suche für Gegenstände in der Einkaufsliste hinzugefügt
        [Neu] Funktion hinzugefügt, mit der eine Karte eines externen Tools (vollständige Karte oder Ruinenkarte) kopiert und dann in MyHordes angezeigt werden kann
    `,
    '1.0.0-alpha.30': `
        [Korrektur] Behebt erhebliche Verlangsamungen in der gesamten Oberfläche der Anwendung
    `,
    '1.0.0-alpha.29': `
        [Korrektur] Behebt erhebliche Verlangsamungen in der gesamten Oberfläche der Anwendung
    `,
    '1.0.0-alpha.28': `
        [Korrektur] Löst das Anzeigeproblem der Spielmenüleiste, wenn die Übersetzungsoption aktiviert ist

        [Verbesserung] Deutsche Übersetzungen für die Anzeige des Übersetzungstools hinzugefügt
    `,
    '1.0.0-alpha.27': `
        [Verbesserung] Verbesserung der Übersetzungsfunktion (Kopieren einer Bezeichnung, Anzeige ungenauer Ergebnisse)
    `,
    '1.0.0-alpha.26': `
        [Verbesserung] Verbesserung der Übersetzungsfunktion (Kopieren einer Bezeichnung, Anzeige ungenauer Ergebnisse)
    `,
    '1.0.0-alpha.25': `
        [Verbesserung] Funktion zur Übersetzung der Elemente von MyHordes hinzugefügt
    `,
    '1.0.0-alpha.24': `
        [Verbesserung] Funktion zur Übersetzung der Elemente von MyHordes hinzugefügt
    `,
    '1.0.0-alpha.23': `
        [Verbesserung] Funktion zur Übersetzung der Elemente von MyHordes hinzugefügt
    `,
    '1.0.0-alpha.22': `
        [Verbesserung] Funktion zur Übersetzung der Elemente von MyHordes hinzugefügt
    `,
    '1.0.0-alpha.21': `
        [Verbesserung] Funktion zur Übersetzung der Elemente von MyHordes hinzugefügt
    `,
    '1.0.0-alpha.20': `
        [Verbesserung] Englische und deutsche Übersetzungen hinzugefügt, danke Katt und Shokolaw
    `,
    '1.0.0-alpha.19': `
        [Verbesserung] Überarbeitung der Einstellungen für bessere Übersichtlichkeit

        [Neu] Suchfeld in der Baustellenliste hinzugefügt
    `,
    '1.0.0-alpha.18': `
        [Korrektur] Tippfehler

        [Verbesserung] Info "Objet de camping" im verbesserten Tooltip hinzugefügt
    `,
    '1.0.0-alpha.17': `
        [Neu] Anzeige der Anzahl heute auf dem Feld gestorbener Zombies
    `,
    '1.0.0-alpha.16': `
        [Korrektur] 500-Fehler beim Laden des Skripts, wenn man sich nicht in der Stadt befindet
        [Korrektur] Verhalten der Benachrichtigung bei abgeschlossener Suche
    `,
    '1.0.0-alpha.15': `
        [Verbesserung] Bestimmte Gegenstandseigenschaften in den verbesserten Tooltips hinzugefügt

        [Neu] Option hinzugefügt, um am Ende der Suche benachrichtigt zu werden
    `,
    '1.0.0-alpha.14': `
        [Verbesserung] Stufe "trashlist" zur Einkaufsliste hinzugefügt, die grau angezeigt wird
        [Verbesserung] Änderung der Farben der Elemente in der Einkaufsliste
        [Verbesserung] Die Prioritätsfarben werden jetzt auch auf dem Bild des Gegenstands in der eingebetteten Einkaufsliste angezeigt
        [Verbesserung] Anzeige bestimmter Eigenschaften in den Gegenstands-Tooltips, wenn die Option "afficher les tooltips détaillés" aktiviert ist

        [Neu] [experimentell] Option hinzugefügt, um vor "gefährlichen" Aktionen eine Bestätigung zu verlangen (Konsum von Zyanid, Konsum von Drogen bei bereits bestehender Drogenabhängigkeit)
    `,
    '1.0.0-alpha.13': `
        [Korrektur] Korrektur der Anzeige des Skriptnamens
    `,
    '1.0.0-alpha.12': `
        [Korrektur] Hinzufügen zur Einkaufsliste von der Gegenstandsliste aus

        [Verbesserung] Anzeige der Einstellungen

        [Neu] Anzeige der Version
        [Neu] Anzeige des Changelogs nach einer Aktualisierung
    `,
};
