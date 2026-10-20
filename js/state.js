/* Zustand nur im Browser (localStorage). Keine Datenbank, nichts geht an TuneFlow außer dem Text an den Assistenten. */
(function (IK) {
  const KEY = 'ik-demo-v1';
  let S = null;
  const neu = () => ({
    v: 1, rolle: 'verwaltung', tab: 'anfragen',
    wohnungen: IK.beispielWohnungen(), anfragen: [],
    zaehler: { gelesen: 0, rueckfragen: 0, termine: 0 },
    sel: { anfrage: null, thread: null, neu: null, filter: 'alle', edit: null }
  });
  IK.S = () => S;
  IK.laden = () => {
    try { const r = localStorage.getItem(KEY); if (r) { const d = JSON.parse(r); if (d && d.v === 1 && Array.isArray(d.wohnungen)) { S = d; S.anfragen.forEach(a => { a.wartet = false; }); auffrischen(); return; } } } catch (e) { /* privat oder blockiert */ }
    S = neu();
  };
  /* Liegen alle Besichtigungstage einer Wohnung in der Vergangenheit, rücken sie auf die nächsten Werktage. */
  function auffrischen() {
    const heute = IK.iso(new Date());
    S.wohnungen.forEach((w, i) => {
      const b = w.besichtigung || [];
      if (b.length && b.every(t => t.datum < heute)) b.forEach((t, k) => { t.datum = IK.werktag(2 + i + k * 2); });
    });
  }
  IK.speichern = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ohne Speicher weiter */ } };
  IK.zuruecksetzen = () => { S = neu(); IK.speichern(); };
  IK.uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  IK.wohnung = id => S.wohnungen.find(w => w.id === id);
  IK.anfrage = id => S.anfragen.find(a => a.id === id);

  IK.neueWohnung = () => {
    const w = {
      id: IK.uid('w'), titel: 'Neue Wohnung', strasse: '', stadtteil: 'Findorff', zimmer: 2, flaeche: 60, kalt: 700, warm: 900,
      etage: '1. OG', frei_ab: IK.iso(new Date(Date.now() + 40 * 864e5)), bild: 'neubau', beschreibung: '',
      vorgaben: { max_personen: 2, haustiere: 'nein', raucher: 'nein', wg: 'nein', wbs: 'nein', einkommen_faktor: 3, einzug_von: '', einzug_bis: '', schufa: 'ja', sonstiges: '' },
      besichtigung: [{ datum: IK.iso(new Date(Date.now() + 3 * 864e5)), von: '16:00', bis: '17:00' }]
    };
    w.vorgaben.einzug_von = w.frei_ab;
    S.wohnungen.push(w); IK.speichern(); return w;
  };
  IK.loescheWohnung = id => { S.wohnungen = S.wohnungen.filter(w => w.id !== id); S.anfragen = S.anfragen.filter(a => a.wohnungId !== id); IK.speichern(); };

  IK.neueAnfrage = (wohnungId, portal, beispielId) => {
    const a = { id: IK.uid('a'), wohnungId, portal, beispielId: beispielId || null, erstellt: Date.now(), extraktion: null, nachrichten: [], status: 'offen', termin: null, agentMs: null, wartet: false };
    S.anfragen.unshift(a); IK.speichern(); return a;
  };

  IK.beispielText = (b, w) => b.text.replace(/\{TITEL\}/g, w.titel).replace(/\{STADTTEIL\}/g, w.stadtteil);

  const inserat = w => ({ titel: w.titel, lage: `${w.strasse.replace(/\s*\d+\w*$/, '')}, ${w.stadtteil}`, stadtteil: w.stadtteil, zimmer: +w.zimmer, flaeche: +w.flaeche, kalt: +w.kalt, warm: +w.warm, etage: w.etage, frei_ab: w.frei_ab, beschreibung: w.beschreibung });

  function merge(alt, neu, erste) {
    if (!alt) return neu;
    const out = Object.assign({}, alt);
    for (const k of Object.keys(neu)) {
      if (k === 'haustiere') { out.haustiere = { hat: neu.haustiere.hat != null ? neu.haustiere.hat : alt.haustiere.hat, art: neu.haustiere.art || alt.haustiere.art }; continue; }
      if (k === 'ist_bewerbung') { out.ist_bewerbung = erste ? neu.ist_bewerbung : (alt.ist_bewerbung || neu.ist_bewerbung); continue; }
      if (neu[k] != null && neu[k] !== '') out[k] = neu[k];
    }
    out.schufa_erwaehnt = !!(alt.schufa_erwaehnt || neu.schufa_erwaehnt);
    out.nachmieter_vom_altmieter = !!(alt.nachmieter_vom_altmieter || neu.nachmieter_vom_altmieter);
    return out;
  }
  const msg = (a, m) => { a.nachrichten.push(Object.assign({ id: IK.uid('m'), ts: Date.now() }, m)); };

  function fehlerText(r) {
    if (r.status === 429) return `Der Assistent hat gerade viele Anfragen bekommen. Bitte versuchen Sie es in ${r.warten || 'einigen'} Minuten erneut.`;
    if (r.status === 413) return 'Die Nachricht ist zu lang. Bitte kürzen Sie sie auf höchstens 4.000 Zeichen.';
    return 'Der Assistent ist gerade nicht erreichbar. Bitte versuchen Sie es gleich noch einmal.';
  }

  /* Der Bewerber schreibt. Der Assistent liest aus, die Seite prüft und antwortet. */
  IK.bewerberSchreibt = async function (anfrageId, text, onUpdate) {
    const a = IK.anfrage(anfrageId); if (!a) return;
    const w = IK.wohnung(a.wohnungId);
    const erste = !a.nachrichten.some(m => m.von === 'bewerber');
    const verlauf = a.nachrichten.filter(m => (m.von === 'bewerber' || m.von === 'agent') && m.typ !== 'slots').map(m => ({ rolle: m.von, text: m.text }));
    msg(a, { von: 'bewerber', text, typ: erste ? 'mail' : null });
    a.wartet = true; IK.speichern(); onUpdate();
    const phase = { offen: 'anfrage', eingeladen: 'eingeladen', termin: 'termin_gebucht', abgesagt: 'abgesagt' }[a.status];
    const t0 = performance.now();
    const r = await IK.frageAgent({ modus: 'bewerber', inserat: inserat(w), pflichtfelder: IK.pflichtfelder(w), bisherige_extraktion: a.extraktion, verlauf, nachricht: text, phase });
    a.wartet = false;
    if (r.ok) {
      a.agentMs = Math.round(performance.now() - t0); a.modell = r.data.modell; a.offline = false;
      a.extraktion = merge(a.extraktion, r.data.extraktion, erste);
      if (erste) S.zaehler.gelesen++;
      antworte(a, w, r.data.antwort, r.data.absicht, false, erste);
    } else if (erste && a.beispielId) {
      const b = IK.beispielAnfragen.find(x => x.id === a.beispielId);
      a.extraktion = JSON.parse(JSON.stringify(b.fallback)); a.agentMs = null; a.offline = true;
      S.zaehler.gelesen++;
      antworte(a, w, null, 'anfrage', true, true);
    } else {
      msg(a, { von: 'system', typ: 'fehler', text: fehlerText(r) });
    }
    IK.speichern(); onUpdate();
  };

  function antworte(a, w, antwort, absicht, offline, erste) {
    const e = a.extraktion, p = IK.pruefe(w, e);
    if (e.ist_bewerbung === false) {
      if (erste) msg(a, { von: 'system', typ: 'sonstige', text: 'Keine Wohnungsanfrage erkannt. Die Nachricht ist als sonstige Post abgelegt und geht an das Postfach der Verwaltung. Es wird keine Antwort verschickt.' });
      else msg(a, { von: 'agent', text: IK.vorlage.agent(w, e, { offen: false, kern: IK.kernSaeubern(antwort) }) });
      return;
    }
    const kern = offline ? '' : IK.kernSaeubern(antwort);
    if (a.status === 'offen') {
      msg(a, { von: 'agent', text: IK.vorlage.agent(w, e, { offen: true, erste, kern, fehlend: p.fehlend }), offline });
      if (p.fehlend.length) {
        S.zaehler.rueckfragen++;
        msg(a, { von: 'system', text: p.fehlend.length === 1 ? 'Der Assistent hat eine fehlende Angabe selbst nachgefragt.' : `Der Assistent hat ${p.fehlend.length} fehlende Angaben selbst nachgefragt.` });
      } else {
        msg(a, { von: 'system', typ: 'wartet', text: 'Angaben vollständig. Die Anfrage liegt jetzt mit Empfehlung bei der Verwaltung.' });
      }
      return;
    }
    msg(a, { von: 'agent', text: IK.vorlage.agent(w, e, { offen: false, kern }) });
    if (absicht === 'umbuchen' && (a.status === 'eingeladen' || a.status === 'termin')) {
      if (a.termin) { a.termin = null; a.status = 'eingeladen'; }
      msg(a, { von: 'agent', typ: 'slots', text: 'Freie Termine' });
    }
  }

  /* Die Verwaltung gibt frei. */
  IK.entscheide = function (anfrageId, aktion, text) {
    const a = IK.anfrage(anfrageId); if (!a) return;
    msg(a, { von: 'agent', quelle: 'verwaltung', text });
    if (aktion === 'einladen') { a.status = 'eingeladen'; msg(a, { von: 'agent', typ: 'slots', text: 'Freie Termine' }); }
    if (aktion === 'absage') { a.status = 'abgesagt'; a.termin = null; }
    if (aktion === 'rueckfrage') S.zaehler.rueckfragen++;
    a.entschieden = { aktion, ts: Date.now() };
    IK.speichern();
  };
  IK.bucheTermin = function (anfrageId, datum, zeit) {
    const a = IK.anfrage(anfrageId), w = IK.wohnung(a.wohnungId);
    const s = IK.slots(w, S.anfragen).find(x => x.datum === datum && x.zeit === zeit);
    if (!s || !s.frei || a.status !== 'eingeladen') return false;
    a.termin = { datum, zeit }; a.status = 'termin';
    msg(a, { von: 'bewerber', text: `Ich nehme den Termin am ${IK.fmt.tagKurz(datum)} um ${zeit} Uhr.` });
    msg(a, { von: 'agent', typ: 'bestaetigung', text: IK.vorlage.bestaetigung(w, a.extraktion, a.termin) });
    msg(a, { von: 'system', text: 'Der Termin steht im Kalender der Verwaltung. Eine Bestätigung von Hand ist nicht mehr nötig.' });
    S.zaehler.termine++; IK.speichern(); return true;
  };
  IK.sageTerminAb = function (anfrageId) {
    const a = IK.anfrage(anfrageId), w = IK.wohnung(a.wohnungId);
    if (!a.termin) return;
    const s = a.termin; a.termin = null; a.status = 'eingeladen';
    msg(a, { von: 'agent', quelle: 'verwaltung', text: IK.vorlage.terminAbgesagt(w, a.extraktion, s) });
    msg(a, { von: 'agent', typ: 'slots', text: 'Freie Termine' });
    IK.speichern();
  };
})(window.IK);
