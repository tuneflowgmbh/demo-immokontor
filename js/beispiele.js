/* Beispieldaten: zwei Wohnungen, zehn Anfragen, Illustrationen. Alle Personen sind erfunden. */
window.IK = window.IK || {};
(function (IK) {
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  // n-ter Werktag ab morgen
  function werktag(n) {
    const d = new Date(); d.setHours(12, 0, 0, 0);
    let k = 0;
    while (k < n) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) k++; }
    return iso(d);
  }
  IK.iso = iso;
  IK.werktag = werktag;

  IK.STADTTEILE = ['Altstadt', 'Bahnhofsvorstadt', 'Findorff', 'Gete', 'Hastedt', 'Horn-Lehe', 'Neustadt', 'Ostertor', 'Peterswerder', 'Schwachhausen', 'Steintor', 'Vahr', 'Walle', 'Gröpelingen', 'Woltmershausen', 'Obervieland', 'Huchting', 'Hemelingen', 'Osterholz', 'Vegesack', 'Burglesum', 'Blumenthal', 'Überseestadt'];

  IK.beispielWohnungen = function () {
    return [
      {
        id: 'w1', titel: 'Helle 2-Zimmer-Wohnung in Findorff', strasse: 'Hemmstraße 112', stadtteil: 'Findorff',
        zimmer: 2, flaeche: 58, kalt: 690, warm: 890, etage: '3. OG', frei_ab: '2026-12-01', bild: 'altbau',
        beschreibung: 'Helle Wohnung mit Balkon zum Hof, Einbauküche, Tageslichtbad mit Wanne und Kellerabteil. Gasetagenheizung. Bus und Straßenbahn in fünf Minuten zu Fuß.',
        vorgaben: { max_personen: 2, haustiere: 'nein', raucher: 'nein', wg: 'nein', wbs: 'nein', einkommen_faktor: 3, einzug_von: '2026-12-01', einzug_bis: '2027-01-01', schufa: 'ja', sonstiges: 'Eigentümer wünscht langfristige Mieter.' },
        besichtigung: [{ datum: werktag(2), von: '16:00', bis: '17:30' }, { datum: werktag(4), von: '16:00', bis: '17:30' }]
      },
      {
        id: 'w2', titel: 'Große 4-Zimmer-Altbauwohnung in der Neustadt', strasse: 'Große Johannisstraße 41', stadtteil: 'Neustadt',
        zimmer: 4, flaeche: 96, kalt: 1150, warm: 1450, etage: 'EG', frei_ab: '2027-01-01', bild: 'stadthaus',
        beschreibung: 'Altbau mit hohen Decken, Dielenböden und kleinem Garten zur Mitbenutzung. Wohnküche, Bad und separates Gäste-WC. Weser und Neustadtswall in wenigen Minuten erreichbar.',
        vorgaben: { max_personen: 4, haustiere: 'absprache', raucher: 'nein', wg: 'ja', wbs: 'nein', einkommen_faktor: 3, einzug_von: '2027-01-01', einzug_bis: '2027-02-01', schufa: 'ja', sonstiges: '' },
        besichtigung: [{ datum: werktag(3), von: '10:00', bis: '11:00' }]
      }
    ];
  };

  const leer = { ist_bewerbung: true, name: null, anrede: null, kontakt: null, personen: null, kinder: null, einkommen_netto: null, einkommen_hinweis: null, beruf: null, haustiere: { hat: null, art: null }, raucher: null, wg: null, einzug_wunsch: null, wbs: null, schufa_erwaehnt: false, nachmieter_vom_altmieter: false, zusammenfassung: null };
  const fb = o => Object.assign({}, leer, o, { haustiere: Object.assign({}, leer.haustiere, o.haustiere || {}) });

  /* {TITEL} und {STADTTEIL} werden durch das gewählte Inserat ersetzt. */
  IK.beispielAnfragen = [
    {
      id: 'b1', portal: 'immoscout', fall: 'Passt genau',
      text: `Kontaktanfrage über ImmoScout24
Objekt: {TITEL} (Scout-ID 15402318)

Anrede: Frau
Vorname: Lena
Nachname: Hartmann
E-Mail: lena.hartmann@example.de
Telefon: 0151 23456789
Einzugstermin: 01.12.2026
Personen im Haushalt: 2
Haustiere: Nein
Nettoeinkommen Haushalt: 3.000 – 4.000 €
Bonitätsauskunft: vorhanden

Nachricht:
Guten Tag,
mein Partner und ich interessieren uns sehr für die Wohnung. Ich arbeite als Pflegefachkraft im Klinikum, er ist Elektroniker. Zusammen haben wir 3.400 € netto. Wir sind Nichtraucher und würden gern zum 1. Dezember einziehen. Über einen Besichtigungstermin würden wir uns freuen.

Viele Grüße
Lena Hartmann`,
      fallback: fb({ name: 'Lena Hartmann', anrede: 'Frau', kontakt: 'lena.hartmann@example.de', personen: 2, kinder: 0, einkommen_netto: 3400, beruf: 'Pflegefachkraft; Elektroniker', haustiere: { hat: false }, raucher: false, wg: false, einzug_wunsch: '2026-12-01', schufa_erwaehnt: true, zusammenfassung: 'Paar, beide berufstätig, möchte zum 1. Dezember einziehen.' })
    },
    {
      id: 'b2', portal: 'immowelt', fall: 'Familie mit vier Personen',
      text: `Neue Anfrage über immowelt
Objekt: {TITEL}, Objekt-Nr. 2KX7F4
Name: Jan Brinkmann
E-Mail: j.brinkmann@example.de
Telefon: 0176 12345678

Nachricht:
Hallo,
wir sind eine vierköpfige Familie (zwei Erwachsene, zwei Kinder im Kita- und Grundschulalter) und suchen zum 01.01.2027 eine neue Wohnung. Ich bin Industriemechaniker, meine Frau arbeitet in Teilzeit in der Verwaltung. Unser Haushaltsnetto liegt bei 4.200 €. Keine Haustiere, Nichtraucher.
Wann wäre eine Besichtigung möglich?

Mit freundlichen Grüßen
Jan Brinkmann`,
      fallback: fb({ name: 'Jan Brinkmann', kontakt: 'j.brinkmann@example.de', personen: 4, kinder: 2, einkommen_netto: 4200, beruf: 'Industriemechaniker; Verwaltungsangestellte', haustiere: { hat: false }, raucher: false, wg: false, einzug_wunsch: '2027-01-01', zusammenfassung: 'Familie mit zwei Kindern, Einzug zum 1. Januar.' })
    },
    {
      id: 'b3', portal: 'kleinanzeigen', fall: 'Mit Hund',
      text: `Nachricht zu deiner Anzeige „{TITEL}“ auf Kleinanzeigen

Hi, ist die Wohnung noch zu haben? Wir sind zu zweit, mein Freund und ich, plus unser Hund Bruno (Labrador, total lieb und gut erzogen). Ich bin Erzieherin, er Kfz-Mechatroniker, zusammen ca. 3.600 netto. Wir rauchen nicht. Einzug ab Dezember wäre super, gerne auch später.
LG Sarah Wilke
Antwort gern an sarah.wilke@example.de`,
      fallback: fb({ name: 'Sarah Wilke', kontakt: 'sarah.wilke@example.de', personen: 2, kinder: 0, einkommen_netto: 3600, beruf: 'Erzieherin; Kfz-Mechatroniker', haustiere: { hat: true, art: 'Hund' }, raucher: false, wg: false, einzug_wunsch: '2026-12-01', zusammenfassung: 'Paar mit Hund, Einzug ab Dezember.' })
    },
    {
      id: 'b4', portal: 'immoscout', fall: 'Einkommen niedrig',
      text: `Kontaktanfrage über ImmoScout24
Objekt: {TITEL} (Scout-ID 15402318)

Anrede: Herr
Vorname: Kevin
Nachname: Schulte
E-Mail: k.schulte@example.de
Einzugstermin: 15.12.2026
Personen im Haushalt: 1
Haustiere: Nein
Nettoeinkommen Haushalt: 1.500 – 2.000 €

Nachricht:
Hallo, ich bin Einzelhandelskaufmann und suche eine Wohnung näher an meiner Arbeit. Ich verdiene 1.600 € netto, bin Nichtraucher und könnte Mitte Dezember einziehen.
Gruß Kevin Schulte`,
      fallback: fb({ name: 'Kevin Schulte', anrede: 'Herr', kontakt: 'k.schulte@example.de', personen: 1, kinder: 0, einkommen_netto: 1600, beruf: 'Einzelhandelskaufmann', haustiere: { hat: false }, raucher: false, wg: false, einzug_wunsch: '2026-12-15', zusammenfassung: 'Einzelperson, Einzug Mitte Dezember.' })
    },
    {
      id: 'b5', portal: 'mail', fall: 'Unvollständig',
      text: `Betreff: Wohnung {STADTTEIL}

Hallo, ist die Wohnung noch frei? Gruß Tim`,
      fallback: fb({ name: 'Tim' })
    },
    {
      id: 'b6', portal: 'immowelt', fall: 'WG aus zwei Personen',
      text: `Neue Anfrage über immowelt
Objekt: {TITEL}, Objekt-Nr. 2KX7F4
Name: Mia Becker
E-Mail: mia.becker@example.de

Nachricht:
Hallo! Meine Freundin Jule und ich suchen zusammen eine Wohnung als WG, gern zum 1.12. Ich studiere an der Uni Bremen und arbeite als Werkstudentin (1.250 € netto), Jule ist im letzten Ausbildungsjahr zur Bankkauffrau (1.100 € netto). Ohne Haustiere, wir rauchen beide nicht. Eine Bürgschaft wäre auch möglich.

Liebe Grüße
Mia Becker`,
      fallback: fb({ name: 'Mia Becker', kontakt: 'mia.becker@example.de', personen: 2, kinder: 0, einkommen_netto: 2350, beruf: 'Werkstudentin; Auszubildende Bankkauffrau', haustiere: { hat: false }, raucher: false, wg: true, einzug_wunsch: '2026-12-01', zusammenfassung: 'Zweier-WG, Einzug zum 1. Dezember.' })
    },
    {
      id: 'b7', portal: 'mail', fall: 'Nachmieter vom Altmieter',
      text: `Betreff: Nachmieter für {TITEL}

Guten Tag,
Herr Brandt, der jetzige Mieter der Wohnung, hat mir Ihre Adresse gegeben und mich als Nachmieter vorgeschlagen. Ich habe die Wohnung schon bei ihm gesehen und würde sie sehr gern übernehmen.
Kurz zu mir: Ich ziehe allein ein, arbeite als Softwareentwickler bei einem Bremer Logistikunternehmen und verdiene 2.900 € netto. Keine Haustiere, Nichtraucher. Einzug zum 01.12.2026 wäre ideal, eine Schufa-Auskunft schicke ich gern mit.

Mit freundlichen Grüßen
Thomas Behrens
0421 1234567`,
      fallback: fb({ name: 'Thomas Behrens', kontakt: '0421 1234567', personen: 1, kinder: 0, einkommen_netto: 2900, beruf: 'Softwareentwickler', haustiere: { hat: false }, raucher: false, wg: false, einzug_wunsch: '2026-12-01', schufa_erwaehnt: true, nachmieter_vom_altmieter: true, zusammenfassung: 'Einzelperson, vom bisherigen Mieter vorgeschlagen, Einzug zum 1. Dezember.' })
    },
    {
      id: 'b8', portal: 'mail', fall: 'Handwerkerpost, keine Bewerbung',
      text: `Betreff: Rechnung Nr. 2026-4471 Heizungswartung Hemmstraße

Sehr geehrte Damen und Herren,
anbei erhalten Sie unsere Rechnung für die jährliche Wartung der Gastherme in der Hemmstraße, Wohneinheit 3. OG links, durchgeführt am 14.10.2026.
Rechnungsbetrag: 186,45 € brutto, zahlbar innerhalb von 14 Tagen ohne Abzug.

Mit freundlichen Grüßen
Wärmetechnik Nord GmbH, Kundendienst`,
      fallback: fb({ ist_bewerbung: false, name: 'Wärmetechnik Nord GmbH', zusammenfassung: 'Rechnung für eine Heizungswartung.' })
    },
    {
      id: 'b9', portal: 'kleinanzeigen', fall: 'Raucherhaushalt',
      text: `Nachricht zu deiner Anzeige „{TITEL}“ auf Kleinanzeigen

Hallo, wir (Paar, beide Vollzeit, er Lagerist, ich Friseurin) suchen ab Januar was Neues. Zusammen ca. 3.000 netto. Keine Tiere. Ehrlich gesagt rauchen wir beide, aber nur auf dem Balkon. Einzug ginge zum 01.01.
Grüße, Nadine Hoffmann`,
      fallback: fb({ name: 'Nadine Hoffmann', personen: 2, kinder: 0, einkommen_netto: 3000, beruf: 'Friseurin; Lagerist', haustiere: { hat: false }, raucher: true, wg: false, einzug_wunsch: '2027-01-01', zusammenfassung: 'Paar, beide berufstätig, Einzug zum 1. Januar.' })
    },
    {
      id: 'b10', portal: 'immoscout', fall: 'Einzug zu spät',
      text: `Kontaktanfrage über ImmoScout24
Objekt: {TITEL} (Scout-ID 15402318)

Anrede: Frau
Vorname: Katharina
Nachname: Vogt
E-Mail: k.vogt@example.de
Einzugstermin: 01.03.2027
Personen im Haushalt: 1
Haustiere: Nein
Nettoeinkommen Haushalt: 2.500 – 3.000 €

Nachricht:
Guten Tag, ich bin Lehrerin und wechsle zum zweiten Halbjahr an eine Schule in Bremen. Deshalb suche ich zum 1. März 2027. Nichtraucherin, keine Haustiere. Eine Schufa-Auskunft liegt vor.

Freundliche Grüße
Katharina Vogt`,
      fallback: fb({ name: 'Katharina Vogt', anrede: 'Frau', kontakt: 'k.vogt@example.de', personen: 1, kinder: 0, einkommen_netto: 2500, beruf: 'Lehrerin', haustiere: { hat: false }, raucher: false, wg: false, einzug_wunsch: '2027-03-01', schufa_erwaehnt: true, zusammenfassung: 'Einzelperson, Einzug zum 1. März 2027.' })
    }
  ];
  IK.leereExtraktion = () => JSON.parse(JSON.stringify(leer));

  IK.PORTALE = { immoscout: 'ImmoScout24', immowelt: 'Immowelt', kleinanzeigen: 'Kleinanzeigen', mail: 'E-Mail' };

  /* Illustrationen im Linienstil der Marke, grün markiert die inserierte Wohnung. */
  const fenster = (x0, y0, cols, rows, w, h, gx, gy, an) => {
    let s = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = an && an[0] === r && an[1] === c;
      s += `<rect x="${x0 + c * (w + gx)}" y="${y0 + r * (h + gy)}" width="${w}" height="${h}" rx="2" class="${on ? 'ill-an' : 'ill-fe'}"/>`;
    }
    return s;
  };
  const baum = (x, y, r) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + r * 1.6}" class="ill-li"/><circle cx="${x}" cy="${y}" r="${r}" class="ill-baum"/>`;
  IK.BILDER = {
    altbau: { name: 'Altbau mit Giebel', svg:
      `<rect x="0" y="150" width="320" height="30" class="ill-boden"/>
       <path d="M100 58 L160 22 L220 58 Z" class="ill-dach"/>
       <rect x="100" y="58" width="120" height="92" class="ill-haus"/>
       ${fenster(112, 68, 4, 3, 18, 20, 8, 8, [0, 1])}
       <rect x="150" y="128" width="20" height="22" rx="2" class="ill-tuer"/>
       ${baum(60, 112, 18)}${baum(262, 118, 14)}` },
    neubau: { name: 'Neubau mit Balkonen', svg:
      `<rect x="0" y="150" width="320" height="30" class="ill-boden"/>
       <rect x="88" y="30" width="144" height="120" class="ill-haus"/>
       ${fenster(100, 40, 4, 4, 22, 16, 9, 12, [1, 2])}
       <line x1="96" y1="60" x2="224" y2="60" class="ill-li"/><line x1="96" y1="88" x2="224" y2="88" class="ill-li"/><line x1="96" y1="116" x2="224" y2="116" class="ill-li"/>
       ${baum(48, 116, 16)}${baum(272, 110, 20)}` },
    stadthaus: { name: 'Bremer Haus', svg:
      `<rect x="0" y="150" width="320" height="30" class="ill-boden"/>
       <rect x="70" y="48" width="60" height="102" class="ill-haus"/><path d="M70 48 L100 30 L130 48 Z" class="ill-dach"/>
       <rect x="130" y="40" width="60" height="110" class="ill-haus"/><path d="M130 40 L160 22 L190 40 Z" class="ill-dach"/>
       <rect x="190" y="48" width="60" height="102" class="ill-haus"/><path d="M190 48 L220 30 L250 48 Z" class="ill-dach"/>
       ${fenster(80, 58, 2, 2, 16, 20, 8, 10)}${fenster(140, 52, 2, 3, 16, 18, 8, 10, [2, 0])}${fenster(200, 58, 2, 2, 16, 20, 8, 10)}
       <rect x="152" y="130" width="16" height="20" rx="2" class="ill-tuer"/>
       ${baum(36, 118, 14)}${baum(284, 120, 12)}` },
    loft: { name: 'Speicher am Wasser', svg:
      `<rect x="0" y="150" width="320" height="30" class="ill-wasser"/>
       <rect x="60" y="42" width="200" height="108" class="ill-haus"/>
       <path d="M60 42 L80 26 L240 26 L260 42 Z" class="ill-dach"/>
       ${fenster(74, 54, 6, 3, 22, 18, 9, 12, [0, 4])}
       <line x1="40" y1="164" x2="90" y2="164" class="ill-li"/><line x1="200" y1="170" x2="280" y2="170" class="ill-li"/>` }
  };
  IK.bildSvg = (key, cls) => `<svg class="ill ${cls || ''}" viewBox="0 0 320 180" role="img" aria-label="${(IK.BILDER[key] || IK.BILDER.altbau).name}"><rect width="320" height="180" class="ill-bg"/>${(IK.BILDER[key] || IK.BILDER.altbau).svg}</svg>`;
})(window.IK);
