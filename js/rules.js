/* Prüfung gegen die Vorgaben. Läuft komplett im Browser, damit jede Änderung an den
   Vorgaben sofort und ohne KI-Aufruf neu bewertet wird. */
(function (IK) {
  const pad = n => String(n).padStart(2, '0');
  const euro = n => (n == null ? '' : Math.round(n).toLocaleString('de-DE') + ' €');
  const datum = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}.${m}.${y}`; };
  const TAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const TAGE_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const dObj = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const tagKurz = s => { const d = dObj(s); return `${TAGE[d.getDay()]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`; };
  const tagLang = s => { const d = dObj(s); return `${TAGE_LANG[d.getDay()]}, ${datum(s)}`; };
  IK.fmt = { euro, datum, tagKurz, tagLang, pad };

  const KLEINTIERE = ['kaninchen', 'zwergkaninchen', 'meerschweinchen', 'hamster', 'maus', 'mäuse', 'ratte', 'rennmaus', 'degu', 'chinchilla', 'wellensittich', 'vogel', 'sittich', 'kanarienvogel', 'fisch', 'fische', 'aquarium', 'schildkröte', 'kleintier', 'kleintiere'];
  const istKleintier = art => !!art && KLEINTIERE.some(k => art.toLowerCase().includes(k));

  IK.VORGABE_LABEL = {
    haustiere: { nein: 'keine Haustiere', kleintiere: 'nur Kleintiere', absprache: 'Haustiere nach Absprache', ja: 'Haustiere erlaubt' },
    raucher: { nein: 'Nichtraucher', ja: 'Rauchen erlaubt' },
    wg: { nein: 'keine WG', ja: 'WG erlaubt' },
    wbs: { nein: 'kein WBS nötig', ja: 'WBS nötig' },
    schufa: { nein: 'Schufa nicht nötig', ja: 'Schufa gewünscht' }
  };

  /* Welche Angaben der Assistent bei dieser Wohnung erfragen muss. */
  IK.pflichtfelder = function (w) {
    const v = w.vorgaben, p = ['name', 'personen', 'haustiere', 'einzug_wunsch'];
    if (v.raucher === 'nein') p.push('raucher');
    if (v.wg === 'nein') p.push('wg');
    if (v.wbs === 'ja') p.push('wbs');
    if (Number(v.einkommen_faktor) > 0) p.push('einkommen_netto');
    return p;
  };

  IK.FRAGE = {
    personen: 'wie viele Personen einziehen, Kinder eingeschlossen',
    einkommen_netto: 'das monatliche Nettoeinkommen Ihres Haushalts',
    haustiere: 'ob Haustiere mit einziehen und wenn ja, welche',
    raucher: 'ob in Ihrem Haushalt geraucht wird',
    wg: 'ob Sie als Wohngemeinschaft einziehen möchten',
    wbs: 'ob ein Wohnberechtigungsschein vorliegt',
    einzug_wunsch: 'Ihren gewünschten Einzugstermin'
  };
  /* Ergebnis: Kriterien mit Ampel, Hinweise, fehlende Angaben, Empfehlung. */
  IK.pruefe = function (w, e) {
    const v = w.vorgaben, k = [], hinweise = [], fehlend = [], klaeren = [];
    const add = (key, label, ampel, text) => { k.push({ key, label, ampel, text }); if (ampel === 'gelb' && text.endsWith('fehlt.')) fehlend.push(key); };
    if (!e) return { kriterien: [], hinweise, fehlend: [], klaeren, empfehlung: 'leer', grund: '' };
    if (e.ist_bewerbung === false) return { kriterien: [], hinweise, fehlend: [], klaeren, empfehlung: 'sonstige', grund: 'Keine Wohnungsanfrage, als sonstige Post abgelegt.' };

    // Personen
    if (e.personen == null) add('personen', 'Personen', 'gelb', 'Personenzahl fehlt.');
    else if (e.personen > v.max_personen) add('personen', 'Personen', 'rot', `${e.personen} Personen, vorgesehen sind höchstens ${v.max_personen}.`);
    else add('personen', 'Personen', 'gruen', `${e.personen} ${e.personen === 1 ? 'Person' : 'Personen'}, vorgesehen sind höchstens ${v.max_personen}.`);

    // Haustiere
    const ht = e.haustiere || {}, art = ht.art || 'Haustier';
    if (ht.hat == null) add('haustiere', 'Haustiere', 'gelb', 'Angabe zu Haustieren fehlt.');
    else if (ht.hat === false) add('haustiere', 'Haustiere', 'gruen', 'Keine Haustiere.');
    else if (v.haustiere === 'ja') add('haustiere', 'Haustiere', 'gruen', `${art}, Haustiere sind erlaubt.`);
    else if (v.haustiere === 'nein') add('haustiere', 'Haustiere', 'rot', `${art} angegeben, Haustiere sind ausgeschlossen.`);
    else if (v.haustiere === 'kleintiere') {
      if (!ht.art) add('haustiere', 'Haustiere', 'gelb', 'Haustier angegeben, Art ist unklar.');
      else if (istKleintier(ht.art)) add('haustiere', 'Haustiere', 'gruen', `${art}, Kleintiere sind erlaubt.`);
      else add('haustiere', 'Haustiere', 'rot', `${art} angegeben, erlaubt sind nur Kleintiere.`);
    } else { add('haustiere', 'Haustiere', 'gelb', `${art} angegeben, mit dem Eigentümer abstimmen.`); klaeren.push(`${art}: mit dem Eigentümer abstimmen`); }

    // Rauchen
    if (v.raucher === 'nein') {
      if (e.raucher == null) add('raucher', 'Rauchen', 'gelb', 'Angabe zum Rauchen fehlt.');
      else if (e.raucher) add('raucher', 'Rauchen', 'rot', 'Raucherhaushalt, die Wohnung ist für Nichtraucher.');
      else add('raucher', 'Rauchen', 'gruen', 'Nichtraucherhaushalt.');
    }

    // WG
    if (v.wg === 'nein') {
      if (e.wg === true) add('wg', 'Wohngemeinschaft', 'rot', 'Einzug als WG, eine WG ist nicht vorgesehen.');
      else if (e.wg === false) add('wg', 'Wohngemeinschaft', 'gruen', 'Kein Einzug als WG.');
      else if (e.personen === 1) add('wg', 'Wohngemeinschaft', 'gruen', 'Einzelperson.');
      else add('wg', 'Wohngemeinschaft', 'gelb', 'Angabe zur Haushaltsform fehlt.');
    } else if (e.wg === true) add('wg', 'Wohngemeinschaft', 'gruen', 'Einzug als WG, eine WG ist erlaubt.');

    // WBS
    if (v.wbs === 'ja') {
      if (e.wbs == null) add('wbs', 'Wohnberechtigungsschein', 'gelb', 'Angabe zum WBS fehlt.');
      else if (e.wbs) add('wbs', 'Wohnberechtigungsschein', 'gruen', 'WBS liegt vor.');
      else add('wbs', 'Wohnberechtigungsschein', 'rot', 'Kein WBS, für die Wohnung ist ein WBS nötig.');
    }

    // Einkommen
    const f = Number(v.einkommen_faktor) || 0;
    if (f > 0) {
      const noetig = f * w.kalt, fx = String(f).replace('.', ',');
      if (e.einkommen_netto == null) add('einkommen_netto', 'Einkommen', 'gelb', 'Nettoeinkommen fehlt.' + (e.einkommen_hinweis ? ' Hinweis: ' + e.einkommen_hinweis : ''));
      else if (e.einkommen_netto < noetig) add('einkommen_netto', 'Einkommen', 'rot', `${euro(e.einkommen_netto)} netto, Vorgabe ${euro(noetig)} (${fx}× Kaltmiete).`);
      else add('einkommen_netto', 'Einkommen', 'gruen', `${euro(e.einkommen_netto)} netto, Vorgabe ${euro(noetig)} (${fx}× Kaltmiete).`);
    }
    if (k.length && k[k.length - 1].key === 'einkommen_netto' && k[k.length - 1].ampel === 'gelb' && !fehlend.includes('einkommen_netto')) fehlend.push('einkommen_netto');

    // Einzug
    if (!e.einzug_wunsch) add('einzug_wunsch', 'Einzug', 'gelb', 'Einzugstermin fehlt.');
    else if (v.einzug_bis && e.einzug_wunsch > v.einzug_bis) add('einzug_wunsch', 'Einzug', 'rot', `Wunsch ${datum(e.einzug_wunsch)}, spätestens möglich ${datum(v.einzug_bis)}.`);
    else if (v.einzug_von && e.einzug_wunsch < v.einzug_von) add('einzug_wunsch', 'Einzug', 'gruen', `Wunsch ab ${datum(e.einzug_wunsch)}, frei ab ${datum(v.einzug_von)}.`);
    else add('einzug_wunsch', 'Einzug', 'gruen', `Wunsch ${datum(e.einzug_wunsch)}, passt ins Fenster bis ${datum(v.einzug_bis || v.einzug_von)}.`);

    if (v.schufa === 'ja') hinweise.push(e.schufa_erwaehnt ? 'Schufa-Auskunft wird angeboten.' : 'Schufa-Auskunft wird mit der Einladung angefordert.');
    if (e.nachmieter_vom_altmieter) hinweise.push('Vom bisherigen Mieter vorgeschlagen. Wird wie jede Anfrage geprüft.');
    if (v.sonstiges) hinweise.push('Vorgabe Sonstiges: ' + v.sonstiges);

    const rot = k.filter(x => x.ampel === 'rot'), gelb = k.filter(x => x.ampel === 'gelb');
    let empfehlung, grund;
    if (rot.length) { empfehlung = 'absage'; grund = rot.map(x => x.text).join(' '); }
    else if (gelb.length) { empfehlung = 'rueckfrage'; grund = gelb.map(x => x.text).join(' '); }
    else { empfehlung = 'einladen'; grund = 'Alle Vorgaben erfüllt.'; }
    return { kriterien: k, hinweise, fehlend, klaeren, empfehlung, grund };
  };

  IK.EMPFEHLUNG = {
    einladen: { label: 'Passt · Einladen', kurz: 'Einladen', ton: 'gruen' },
    rueckfrage: { label: 'Rückfrage offen', kurz: 'Rückfrage', ton: 'gelb' },
    absage: { label: 'Passt nicht · Absage', kurz: 'Absage', ton: 'rot' },
    sonstige: { label: 'Sonstige Post', kurz: 'Sonstige Post', ton: 'grau' },
    leer: { label: 'Wird gelesen', kurz: '…', ton: 'grau' }
  };

  /* 10-Minuten-Einzeltermine aus den Besichtigungstagen, vergangene fallen weg. */
  IK.slots = function (w, anfragen) {
    const jetzt = new Date(), out = [];
    const belegt = {};
    anfragen.filter(a => a.wohnungId === w.id && a.termin).forEach(a => { belegt[a.termin.datum + ' ' + a.termin.zeit] = a; });
    (w.besichtigung || []).slice().sort((a, b) => (a.datum + a.von).localeCompare(b.datum + b.von)).forEach(t => {
      if (!t.datum || !t.von || !t.bis) return;
      const [hv, mv] = t.von.split(':').map(Number), [hb, mb] = t.bis.split(':').map(Number);
      for (let m = hv * 60 + mv; m + 10 <= hb * 60 + mb; m += 10) {
        const zeit = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
        const [y, mo, d] = t.datum.split('-').map(Number);
        if (new Date(y, mo - 1, d, Math.floor(m / 60), m % 60) < jetzt) continue;
        const a = belegt[t.datum + ' ' + zeit];
        out.push({ datum: t.datum, zeit, frei: !a, anfrageId: a ? a.id : null });
      }
    });
    return out;
  };
})(window.IK);
