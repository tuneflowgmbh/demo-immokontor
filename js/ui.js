/* Darstellung beider Rollen. Ein Zustand, ein render(), Klicks über data-act. */
(function (IK) {
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const F = IK.fmt;
  const UI = { aktion: {}, entwurf: {}, basis: null, postfach: null };
  const S = () => IK.S();
  const klein = () => window.matchMedia('(max-width: 899px)').matches;

  /* ---------- Hilfen ---------- */
  const dot = ton => `<i class="dot dot-${ton}" aria-hidden="true"></i>`;
  const portalBadge = p => `<span class="portal portal-${p}">${esc(IK.PORTALE[p] || p)}</span>`;
  const uhr = ts => { const d = new Date(ts); return `${F.pad(d.getHours())}:${F.pad(d.getMinutes())}`; };
  const minuten = m => (m < 60 ? `${m} Min.` : `${Math.floor(m / 60)} Std. ${m % 60 ? (m % 60) + ' Min.' : ''}`.trim());
  const sek = ms => (ms == null ? null : (ms / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + ' s');
  const name = a => (a.extraktion && a.extraktion.name) || (a.wartet ? 'Neue Anfrage' : 'Ohne Namen');

  function pruefung(a) { const w = IK.wohnung(a.wohnungId); return w ? IK.pruefe(w, a.extraktion) : null; }
  function statusInfo(a) {
    if (a.wartet && !a.extraktion) return { label: 'Wird gelesen', ton: 'grau' };
    const p = pruefung(a);
    if (p && p.empfehlung === 'sonstige') return { label: 'Abgelegt', ton: 'grau' };
    if (a.status === 'eingeladen') return { label: 'Eingeladen, Terminwahl läuft', ton: 'gruen' };
    if (a.status === 'termin') return { label: `Termin ${F.tagKurz(a.termin.datum)} ${a.termin.zeit}`, ton: 'gruen' };
    if (a.status === 'abgesagt') return { label: 'Abgesagt', ton: 'grau' };
    if (p && p.fehlend.length) return { label: 'Rückfrage läuft', ton: 'gelb' };
    return { label: 'Vollständig, wartet auf Sie', ton: 'gruen' };
  }
  const empBadge = p => { const e = IK.EMPFEHLUNG[p ? p.empfehlung : 'leer']; return `<span class="emp emp-${e.ton}">${dot(e.ton)}${esc(e.label)}</span>`; };

  /* ---------- Kopf: Rollen ---------- */
  function rollenSchalter() {
    document.querySelectorAll('[data-act="rolle"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.rolle === S().rolle)));
    document.documentElement.dataset.rolle = S().rolle;
  }

  /* ================= VERWALTUNG ================= */
  function kpis() {
    const z = S().zaehler, gespart = z.gelesen * 2 + z.termine * 2;
    const t = (wert, label) => `<div class="kpi"><b>${wert}</b><span>${label}</span></div>`;
    return `<div class="kpis">${t(z.gelesen, 'Anfragen gelesen')}${t(z.rueckfragen, 'Rückfragen gestellt')}${t(z.termine, 'Termine gebucht')}${t(minuten(gespart), 'Zeit gespart')}</div>
      <p class="annahme">Annahme aus der Präsentation: von Hand zwei Minuten je Anfrage und je Terminbestätigung. Bei 300 Anfragen je Inserat sind das rund zehn Stunden.</p>`;
  }
  function tabs() {
    const s = S(), n = s.anfragen.length, t = s.anfragen.filter(a => a.termin).length;
    const tab = (id, label) => `<button class="tab" role="tab" data-act="tab" data-tab="${id}" aria-selected="${s.tab === id}">${label}</button>`;
    return `<div class="tabs" role="tablist">${tab('anfragen', `Anfragen <span class="zahl">${n}</span>`)}${tab('wohnungen', `Wohnungen <span class="zahl">${s.wohnungen.length}</span>`)}${tab('termine', `Termine <span class="zahl">${t}</span>`)}</div>`;
  }
  function vVerwaltung() {
    const s = S();
    const body = s.tab === 'wohnungen' ? vWohnungen() : s.tab === 'termine' ? vTermine() : vAnfragen();
    return `${kpis()}${tabs()}<div class="tabbody">${body}</div>`;
  }

  /* ---------- Anfragen ---------- */
  function vAnfragen() {
    const s = S();
    const liste = s.anfragen.filter(a => s.sel.filter === 'alle' || a.wohnungId === s.sel.filter);
    const opts = `<option value="alle">Alle Wohnungen</option>` + s.wohnungen.map(w => `<option value="${w.id}" ${s.sel.filter === w.id ? 'selected' : ''}>${esc(w.titel)}</option>`).join('');
    const pf = UI.postfach;
    const pfBtn = `<button class="btn btn-2" data-act="postfach" ${pf ? 'disabled' : ''}>${pf ? `Postfach wird gelesen: ${pf.fertig} von ${pf.gesamt}` : 'Beispiel-Postfach einspielen'}</button>`;
    const sel = s.sel.anfrage && IK.anfrage(s.sel.anfrage);
    const leer = `<div class="leer"><h3>Noch keine Anfragen</h3><p>Spielen Sie das Beispiel-Postfach ein: zehn typische Anfragen aus ImmoScout24, Immowelt, Kleinanzeigen und E-Mail, dazu eine Handwerkerrechnung. Oder schalten Sie oben auf Bewerber und schreiben Sie selbst eine Anfrage.</p><div class="row-btn">${pfBtn}<button class="btn btn-2" data-act="rolle" data-rolle="bewerber">Als Bewerber anfragen</button></div></div>`;
    const items = liste.map(a => {
      const p = pruefung(a), st = statusInfo(a), w = IK.wohnung(a.wohnungId);
      const ampeln = p ? p.kriterien.map(k => dot(k.ampel)).join('') : '';
      return `<button class="item ${sel && sel.id === a.id ? 'aktiv' : ''}" data-act="anfrage" data-id="${a.id}">
        <span class="item-top"><span class="item-name">${esc(name(a))}</span>${portalBadge(a.portal)}</span>
        <span class="item-sub">${esc(w ? w.titel : '')} · ${uhr(a.erstellt)}</span>
        <span class="item-bot">${a.wartet && !a.extraktion ? '<span class="tippt">Assistent liest</span>' : empBadge(p)}<span class="ampeln" aria-hidden="true">${ampeln}</span></span>
        <span class="item-status">${esc(st.label)}</span>
      </button>`;
    }).join('');
    return `<div class="toolbar"><label class="inline"><span class="label">Wohnung</span><select data-act="filter">${opts}</select></label>${s.anfragen.length ? pfBtn : ''}</div>
      ${s.anfragen.length ? `<div class="split ${sel ? 'hat-detail' : ''}"><div class="liste">${items || '<p class="muted pad">Zu dieser Wohnung gibt es noch keine Anfragen.</p>'}</div><div class="detail">${sel ? vDetail(sel) : '<div class="leer klein"><p>Wählen Sie links eine Anfrage. Der Assistent hat sie schon gelesen, geprüft und eine Antwort vorbereitet.</p></div>'}</div></div>` : leer}`;
  }

  function vDetail(a) {
    const w = IK.wohnung(a.wohnungId), e = a.extraktion, p = pruefung(a), st = statusInfo(a);
    const kopf = `<button class="zurueck" data-act="anfrage-zu">${chevron()}Alle Anfragen</button>
      <div class="d-head"><div><h3>${esc(name(a))}</h3><div class="muted">${portalBadge(a.portal)} ${esc(w.titel)} · eingegangen ${uhr(a.erstellt)} Uhr</div></div><span class="status status-${st.ton}">${esc(st.label)}</span></div>`;
    if (!e) return `<div class="panel">${kopf}<div class="leer klein"><span class="tippt">Der Assistent liest die Anfrage</span></div></div>`;
    const emp = IK.EMPFEHLUNG[p.empfehlung];
    const empBox = `<div class="empbox empbox-${emp.ton}"><div class="label">Empfehlung des Assistenten</div><div class="emp-titel">${dot(emp.ton)}${esc(emp.label)}</div><p>${esc(p.grund)}</p>${p.empfehlung !== 'sonstige' ? '<p class="small">Der Assistent empfiehlt nur. Einladung und Absage gehen erst raus, wenn Sie freigeben. Fehlende Angaben fragt er selbst nach.</p>' : ''}</div>`;
    const zeit = `<p class="small zeit">${a.offline ? 'Offline-Auswertung aus der Demo, der Assistent war nicht erreichbar.' : `Gelesen in ${sek(a.agentMs)}. Von Hand rund zwei Minuten.`}</p>`;
    if (p.empfehlung === 'sonstige') {
      return `<div class="panel">${kopf}${empBox}<section><h4 class="label">Inhalt</h4><p>${esc(e.zusammenfassung || '')}</p>${zeit}</section>${verlaufBlock(a)}</div>`;
    }
    const pflicht = IK.pflichtfelder(w);
    const zeile = (k, v, f) => `<div><dt>${k}</dt><dd>${v == null || v === '' ? (f && pflicht.includes(f) ? '<span class="fehlt">fehlt</span>' : '<span class="nv">nicht angegeben</span>') : esc(v)}</dd></div>`;
    const jn = v => (v == null ? null : v ? 'ja' : 'nein');
    const ht = e.haustiere || {};
    const daten = `<dl class="daten">
      ${zeile('Name', e.name)}${zeile('Kontakt', e.kontakt)}
      ${zeile('Personen', e.personen == null ? null : e.personen + (e.kinder ? `, davon ${e.kinder} ${e.kinder === 1 ? 'Kind' : 'Kinder'}` : ''), 'personen')}
      ${zeile('Einkommen netto', e.einkommen_netto == null ? null : F.euro(e.einkommen_netto), 'einkommen_netto')}
      ${zeile('Beruf', e.beruf)}${zeile('Haustiere', ht.hat == null ? null : ht.hat ? (ht.art || 'ja') : 'keine', 'haustiere')}
      ${zeile('Raucher', jn(e.raucher), 'raucher')}${zeile('WG', jn(e.wg), 'wg')}
      ${zeile('Einzug', e.einzug_wunsch ? F.datum(e.einzug_wunsch) : null, 'einzug_wunsch')}${w.vorgaben.wbs === 'ja' ? zeile('WBS', jn(e.wbs), 'wbs') : ''}
      ${zeile('Schufa', e.schufa_erwaehnt ? 'angeboten' : 'nicht erwähnt')}
    </dl>${e.zusammenfassung ? `<p class="zusammen">${esc(e.zusammenfassung)}</p>` : ''}`;
    const pr = `<ul class="pruef">${p.kriterien.map(k => `<li>${dot(k.ampel)}<span class="pk">${esc(k.label)}</span><span class="pt">${esc(k.text)}</span></li>`).join('')}</ul>
      ${p.hinweise.length ? `<ul class="hinweise">${p.hinweise.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}`;
    return `<div class="panel">${kopf}${empBox}
      <section><h4 class="label">Angaben aus der Anfrage</h4>${daten}${zeit}</section>
      <section><h4 class="label">Prüfung gegen Ihre Vorgaben</h4>${pr}</section>
      <section class="entscheidung"><h4 class="label">Ihre Entscheidung</h4>${vEntscheidung(a, w, p)}</section>
      ${verlaufBlock(a)}</div>`;
  }

  function entwurfText(a, w, p, aktion) {
    const key = a.id + ':' + aktion;
    if (UI.entwurf[key] != null) return UI.entwurf[key];
    if (aktion === 'einladen') return IK.vorlage.einladen(w, a.extraktion);
    if (aktion === 'absage') return IK.vorlage.absage(w, a.extraktion);
    return IK.vorlage.rueckfrage(w, a.extraktion, p);
  }
  function vEntscheidung(a, w, p) {
    if (a.status === 'eingeladen') return `<div class="info">${dot('gruen')}Eingeladen. Der Bewerber wählt seinen Termin direkt im Chat.</div><div class="row-btn"><button class="btn btn-2" data-act="zum-chat" data-id="${a.id}">Chat des Bewerbers öffnen</button><button class="btn btn-2" data-act="spaet-absage" data-id="${a.id}">Doch absagen</button></div>`;
    if (a.status === 'termin') return `<div class="info">${dot('gruen')}Termin gebucht: ${esc(F.tagLang(a.termin.datum))}, ${esc(a.termin.zeit)} Uhr.</div><div class="row-btn"><button class="btn btn-2" data-act="termin-ab" data-id="${a.id}">Termin absagen und neu anbieten</button><button class="btn btn-2" data-act="spaet-absage" data-id="${a.id}">Doch absagen</button></div>`;
    if (a.status === 'abgesagt') return `<div class="info">${dot('grau')}Absage gesendet.</div>`;
    const vorschlag = p.empfehlung === 'einladen' ? 'einladen' : p.empfehlung === 'absage' ? 'absage' : 'rueckfrage';
    const akt = UI.aktion[a.id] || vorschlag;
    const seg = [['einladen', 'Einladen'], ['rueckfrage', 'Rückfrage'], ['absage', 'Absage']].map(([k, l]) =>
      `<button class="seg-btn" data-act="aktion" data-id="${a.id}" data-a="${k}" aria-pressed="${akt === k}">${l}${k === vorschlag ? '<span class="vorschlag">Vorschlag</span>' : ''}</button>`).join('');
    const hinweis = akt === 'einladen' && p.empfehlung !== 'einladen' ? '<p class="small warn">Sie weichen von der Empfehlung ab. Das ist Ihre Entscheidung, der Assistent hält sich daran.</p>'
      : akt === 'absage' && p.empfehlung !== 'absage' ? '<p class="small warn">Sie weichen von der Empfehlung ab. Die Absage geht ohne Begründung raus.</p>' : '';
    return `<div class="seg" role="group" aria-label="Entscheidung">${seg}</div>${hinweis}
      <label class="label" for="entwurf-${a.id}">Antwortentwurf, Sie können ihn ändern</label>
      <textarea id="entwurf-${a.id}" class="entwurf" rows="10" data-act="entwurf" data-id="${a.id}" data-a="${akt}">${esc(entwurfText(a, w, p, akt))}</textarea>
      <button class="btn" data-act="freigeben" data-id="${a.id}" data-a="${akt}">Freigeben und senden</button>
      ${akt === 'einladen' ? '<p class="small">Nach der Freigabe bietet der Assistent dem Bewerber die freien Zehn-Minuten-Termine an und bestätigt die Buchung selbst.</p>' : ''}`;
  }
  function verlaufBlock(a) {
    const n = a.nachrichten.filter(m => m.von !== 'system').length;
    return `<details class="verlauf"><summary>Originalnachricht und Verlauf (${n})</summary><div class="msgs kompakt">${a.nachrichten.map(m => vMsg(a, m, true)).join('')}</div></details>
      <button class="link" data-act="zum-chat" data-id="${a.id}">Chat aus Sicht des Bewerbers öffnen</button>`;
  }

  /* ---------- Wohnungen ---------- */
  function chips(w) {
    const v = w.vorgaben, L = IK.VORGABE_LABEL, f = Number(v.einkommen_faktor);
    const c = [`max. ${v.max_personen} ${v.max_personen == 1 ? 'Person' : 'Personen'}`, L.haustiere[v.haustiere], L.raucher[v.raucher], L.wg[v.wg]];
    if (v.wbs === 'ja') c.push(L.wbs.ja);
    if (f > 0) c.push(`Einkommen ${String(f).replace('.', ',')}× Kaltmiete`);
    if (v.einzug_von || v.einzug_bis) c.push(`Einzug ${v.einzug_von ? F.datum(v.einzug_von) : 'sofort'} bis ${v.einzug_bis ? F.datum(v.einzug_bis) : 'offen'}`);
    if (v.schufa === 'ja') c.push(L.schufa.ja);
    return `<div class="chips">${c.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>`;
  }
  const eck = w => `${w.zimmer} Zi. · ${w.flaeche} m² · ${F.euro(w.kalt)} kalt · ${F.euro(w.warm)} warm · ${esc(w.etage)} · frei ab ${F.datum(w.frei_ab)}`;
  function vWohnungen() {
    const s = S();
    if (s.sel.edit && IK.wohnung(s.sel.edit)) return vWohnungForm(IK.wohnung(s.sel.edit));
    const karten = s.wohnungen.map(w => {
      const n = s.anfragen.filter(a => a.wohnungId === w.id).length, t = s.anfragen.filter(a => a.wohnungId === w.id && a.termin).length;
      return `<article class="w-card">${IK.bildSvg(w.bild)}<div class="w-body"><h3>${esc(w.titel)}</h3><div class="muted">${esc(w.strasse)}, ${esc(w.stadtteil)}</div><div class="eck">${eck(w)}</div>${chips(w)}
        <div class="w-foot"><span class="muted">${n} ${n === 1 ? 'Anfrage' : 'Anfragen'} · ${t} ${t === 1 ? 'Termin' : 'Termine'}</span><button class="btn btn-2" data-act="w-edit" data-id="${w.id}">Bearbeiten</button></div></div></article>`;
    }).join('');
    return `<div class="w-grid">${karten}<button class="w-neu" data-act="w-neu"><span class="plus" aria-hidden="true">+</span>Neue Wohnung anlegen</button></div>`;
  }
  function feld(label, inner, cls) { return `<label class="f ${cls || ''}"><span class="label">${label}</span>${inner}</label>`; }
  const inp = (f, v, type, extra) => `<input data-f="${f}" type="${type || 'text'}" value="${esc(v)}" ${extra || ''}>`;
  const sel = (f, v, opts) => `<select data-f="${f}">${opts.map(([k, l]) => `<option value="${k}" ${String(v) === String(k) ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  function vWohnungForm(w) {
    const v = w.vorgaben;
    const jn = [['nein', 'nein'], ['ja', 'ja']];
    const bilder = Object.keys(IK.BILDER).map(k => `<label class="bildwahl"><input type="radio" name="bild" data-f="bild" value="${k}" ${w.bild === k ? 'checked' : ''}>${IK.bildSvg(k, 'mini')}<span class="small">${IK.BILDER[k].name}</span></label>`).join('');
    const tage = (w.besichtigung || []).map((t, i) => `<div class="tag-row">${inp(`besichtigung.${i}.datum`, t.datum, 'date')}${inp(`besichtigung.${i}.von`, t.von, 'time', 'step="600"')}<span class="bis">bis</span>${inp(`besichtigung.${i}.bis`, t.bis, 'time', 'step="600"')}<button type="button" class="icon-btn" data-act="tag-weg" data-i="${i}" aria-label="Tag entfernen">${xIcon()}</button></div>`).join('');
    const slots = IK.slots(w, S().anfragen).length;
    return `<div class="edit-grid">
      <form class="panel w-form" onsubmit="return false" data-wid="${w.id}">
        <div class="form-head"><button type="button" class="zurueck sichtbar" data-act="w-fertig">${chevron()}Zur Übersicht</button><span class="small gespeichert" id="gespeichert">Änderungen werden sofort gespeichert</span></div>
        <h3>Eckdaten</h3>
        <div class="fgrid">
          ${feld('Titel des Inserats', inp('titel', w.titel, 'text', 'maxlength="90"'), 'voll')}
          ${feld('Straße und Hausnummer', inp('strasse', w.strasse, 'text', 'maxlength="60"'))}
          ${feld('Stadtteil (Bremen)', sel('stadtteil', w.stadtteil, IK.STADTTEILE.map(x => [x, x])))}
          ${feld('Zimmer', inp('zimmer', w.zimmer, 'number', 'min="1" max="9" step="0.5" inputmode="decimal"'))}
          ${feld('Wohnfläche in m²', inp('flaeche', w.flaeche, 'number', 'min="10" max="400" inputmode="numeric"'))}
          ${feld('Kaltmiete in €', inp('kalt', w.kalt, 'number', 'min="0" step="10" inputmode="numeric"'))}
          ${feld('Warmmiete in €', inp('warm', w.warm, 'number', 'min="0" step="10" inputmode="numeric"'))}
          ${feld('Etage', inp('etage', w.etage, 'text', 'maxlength="20"'))}
          ${feld('Frei ab', inp('frei_ab', w.frei_ab, 'date'))}
          ${feld('Beschreibung im Inserat', `<textarea data-f="beschreibung" rows="3" maxlength="600">${esc(w.beschreibung)}</textarea>`, 'voll')}
        </div>
        <div class="label abst">Bild fürs Inserat</div><div class="bilder">${bilder}</div>
        <h3>Vorgaben des Eigentümers</h3>
        <p class="small">Danach prüft der Assistent jede Anfrage. Ändern Sie etwas, sehen Sie rechts sofort, wie sich die Bewertung verschiebt.</p>
        <div class="fgrid">
          ${feld('Höchstens Personen', sel('vorgaben.max_personen', v.max_personen, [1, 2, 3, 4, 5, 6, 7, 8].map(n => [n, n])))}
          ${feld('Haustiere', sel('vorgaben.haustiere', v.haustiere, [['nein', 'nein'], ['kleintiere', 'nur Kleintiere'], ['absprache', 'nach Absprache'], ['ja', 'ja']]))}
          ${feld('Raucher erlaubt', sel('vorgaben.raucher', v.raucher, jn))}
          ${feld('WG erlaubt', sel('vorgaben.wg', v.wg, jn))}
          ${feld('WBS nötig', sel('vorgaben.wbs', v.wbs, jn))}
          ${feld('Mindesteinkommen netto', sel('vorgaben.einkommen_faktor', v.einkommen_faktor, [[0, 'keine Vorgabe'], [2.5, '2,5 × Kaltmiete'], [3, '3 × Kaltmiete'], [3.5, '3,5 × Kaltmiete']]))}
          ${feld('Einzug frühestens', inp('vorgaben.einzug_von', v.einzug_von, 'date'))}
          ${feld('Einzug spätestens', inp('vorgaben.einzug_bis', v.einzug_bis, 'date'))}
          ${feld('Schufa gewünscht', sel('vorgaben.schufa', v.schufa, jn))}
          ${feld('Sonstiges', `<textarea data-f="vorgaben.sonstiges" rows="2" maxlength="300" placeholder="z. B. Eigentümer wünscht langfristige Mieter">${esc(v.sonstiges)}</textarea>`, 'voll')}
        </div>
        <p class="small">„Sonstiges“ zeigt der Assistent der Verwaltung als Hinweis an, bewertet es aber nicht.</p>
        <h3>Besichtigungstage</h3>
        <p class="small">Daraus entstehen Einzeltermine von zehn Minuten. Eingeladene Bewerber buchen sie selbst im Chat.</p>
        <div class="tage">${tage || '<p class="muted">Noch kein Besichtigungstag.</p>'}</div>
        <div class="row-btn"><button type="button" class="btn btn-2" data-act="tag-neu">Besichtigungstag hinzufügen</button><span class="small" id="slotzahl">${slots} freie oder belegte Termine in der Zukunft</span></div>
        <div class="gefahr"><button type="button" class="link rot" data-act="w-del" data-id="${w.id}">Wohnung löschen</button></div>
      </form>
      <aside class="panel wirkung" id="wirkung">${vWirkung(w)}</aside>
    </div>`;
  }
  function vWirkung(w) {
    const liste = S().anfragen.filter(a => a.wohnungId === w.id && a.extraktion && a.extraktion.ist_bewerbung !== false);
    if (!liste.length) return `<h3>Auswirkung auf Anfragen</h3><p class="small">Zu dieser Wohnung gibt es noch keine Anfragen. Spielen Sie das Beispiel-Postfach ein, dann sehen Sie hier live, wie jede Änderung an den Vorgaben die Bewertung verschiebt.</p><button class="btn btn-2" data-act="postfach" data-wid="${w.id}" ${UI.postfach ? 'disabled' : ''}>${UI.postfach ? `Wird gelesen: ${UI.postfach.fertig} von ${UI.postfach.gesamt}` : 'Beispiel-Postfach für diese Wohnung einspielen'}</button>`;
    const z = { einladen: 0, rueckfrage: 0, absage: 0 };
    const rows = liste.map(a => {
      const p = IK.pruefe(w, a.extraktion); z[p.empfehlung] = (z[p.empfehlung] || 0) + 1;
      const vorher = UI.basis && UI.basis[a.id];
      const neu = vorher && vorher !== p.empfehlung;
      return `<li class="${neu ? 'geaendert' : ''}"><span class="wn">${esc(a.extraktion.name || 'Ohne Namen')}</span>${empBadge(p)}${neu ? `<span class="vorher">vorher ${esc(IK.EMPFEHLUNG[vorher].kurz)}</span>` : ''}</li>`;
    }).join('');
    return `<h3>Auswirkung auf Anfragen</h3><p class="small">So bewertet der Assistent die ${liste.length} Anfragen zu dieser Wohnung mit den aktuellen Vorgaben. Ohne neue KI-Auswertung, sofort.</p>
      <div class="mini-kpis"><span>${dot('gruen')}${z.einladen} einladen</span><span>${dot('gelb')}${z.rueckfrage} Rückfrage</span><span>${dot('rot')}${z.absage} Absage</span></div><ul class="wirk">${rows}</ul>`;
  }

  /* ---------- Termine ---------- */
  function vTermine() {
    const s = S();
    return s.wohnungen.map(w => {
      const slots = IK.slots(w, s.anfragen);
      const offen = s.anfragen.filter(a => a.wohnungId === w.id && a.status === 'eingeladen');
      const tage = {};
      slots.forEach(x => { (tage[x.datum] = tage[x.datum] || []).push(x); });
      const tagHtml = Object.keys(tage).map(d => `<div class="tag"><div class="tag-kopf">${esc(F.tagLang(d))}</div><div class="slots">${tage[d].map(x => {
        if (x.frei) return `<div class="slot frei"><b>${x.zeit}</b><span>frei</span></div>`;
        const a = IK.anfrage(x.anfrageId);
        return `<div class="slot belegt"><b>${x.zeit}</b><span>${esc(name(a))}</span><button class="link" data-act="termin-ab" data-id="${a.id}">absagen</button></div>`;
      }).join('')}</div></div>`).join('');
      return `<section class="panel termine"><div class="t-kopf"><h3>${esc(w.titel)}</h3><button class="btn btn-2" data-act="w-edit" data-id="${w.id}">Besichtigungstage bearbeiten</button></div>
        <p class="muted">${esc(w.strasse)}, ${esc(w.stadtteil)} · Einzeltermine à zehn Minuten</p>
        ${offen.length ? `<p class="small">Eingeladen, Termin noch nicht gewählt: ${offen.map(a => esc(name(a))).join(', ')}</p>` : ''}
        ${tagHtml || '<p class="muted">Keine kommenden Besichtigungstage hinterlegt.</p>'}</section>`;
    }).join('');
  }

  /* ================= BEWERBER ================= */
  function vBewerber() {
    const s = S();
    const thread = s.sel.thread && IK.anfrage(s.sel.thread);
    const neu = s.sel.neu && IK.wohnung(s.sel.neu);
    const inserate = s.wohnungen.map(w => `<article class="inserat">${IK.bildSvg(w.bild)}<div class="i-body"><h3>${esc(w.titel)}</h3><div class="eck">${eck(w)}</div><button class="btn ${neu && neu.id === w.id ? '' : 'btn-2'}" data-act="neu" data-id="${w.id}">Anfrage schreiben</button></div></article>`).join('');
    const threads = s.anfragen.map(a => {
      const w = IK.wohnung(a.wohnungId), st = statusInfo(a);
      return `<button class="item ${thread && thread.id === a.id ? 'aktiv' : ''}" data-act="thread" data-id="${a.id}"><span class="item-top"><span class="item-name">${esc(name(a))}</span>${portalBadge(a.portal)}</span><span class="item-sub">${esc(w ? w.titel : '')}</span><span class="item-status">${dot(st.ton)}${esc(st.label)}</span></button>`;
    }).join('');
    const rechts = thread ? vThread(thread) : neu ? vNeu(neu) : `<div class="leer"><h3>Sie suchen jetzt eine Wohnung</h3><p>Wählen Sie links ein Inserat und schreiben Sie eine Anfrage, so wie sie über ein Portal ankommen würde. Der Assistent der Verwaltung antwortet in Sekunden.</p></div>`;
    return `<div class="split ${thread || neu ? 'hat-detail' : ''}"><div class="liste b-liste"><h2 class="label">Inserate</h2>${inserate}<h2 class="label abst">Ihre Anfragen</h2>${threads || '<p class="muted">Noch keine Anfrage gesendet.</p>'}<p class="small">In dieser Demo spielen Sie alle Bewerber. Jede Anfrage ist ein eigener Chat.</p></div><div class="detail">${rechts}</div></div>`;
  }
  function vNeu(w) {
    const opts = `<option value="">Eigene Anfrage schreiben</option>` + IK.beispielAnfragen.map((b, i) => `<option value="${b.id}">${i + 1}. ${IK.PORTALE[b.portal]} · ${esc(b.fall)}</option>`).join('');
    return `<div class="panel chat"><button class="zurueck" data-act="b-zu">${chevron()}Inserate</button>
      <div class="chat-head"><div><div class="label">Neue Anfrage</div><h3>${esc(w.titel)}</h3></div></div>
      <div class="neu-form">
        ${feld('Beispielanfrage einfügen', `<select id="bsp" data-act="bsp">${opts}</select>`)}
        ${feld('Kommt über', `<select id="portal">${Object.keys(IK.PORTALE).map(k => `<option value="${k}" ${k === 'mail' ? 'selected' : ''}>${IK.PORTALE[k]}</option>`).join('')}</select>`)}
        ${feld('Ihre Nachricht', `<textarea id="neu-text" class="keep" rows="12" maxlength="4000" placeholder="Schreiben Sie so, wie ein Bewerber schreiben würde. Gern auch unvollständig, dann fragt der Assistent nach."></textarea>`, 'voll')}
        <p class="small hinweis-demo">Demo: bitte keine echten Bewerberdaten eingeben.</p>
        <button class="btn" data-act="senden-neu" data-wid="${w.id}">Anfrage senden</button>
      </div></div>`;
  }
  function vThread(a) {
    const w = IK.wohnung(a.wohnungId), st = statusInfo(a);
    const p = pruefung(a), sonst = p && p.empfehlung === 'sonstige';
    return `<div class="panel chat"><button class="zurueck" data-act="b-zu">${chevron()}Inserate und Anfragen</button>
      <div class="chat-head"><div><div class="label">${esc(name(a))} · ${esc(IK.PORTALE[a.portal])}</div><h3>${esc(w.titel)}</h3></div><span class="status status-${st.ton}">${esc(st.label)}</span></div>
      <div class="msgs" id="msgs">${a.nachrichten.map(m => vMsg(a, m, false)).join('')}${a.wartet ? `<div class="msg agent"><div class="m-kopf">${signet()}Assistent · Immo Kontor Bremen</div><div class="tippt">schreibt</div></div>` : ''}</div>
      ${sonst ? '' : `<div class="composer"><textarea id="antwort-${a.id}" class="keep" rows="2" maxlength="4000" placeholder="Antwort schreiben" ${a.wartet ? 'disabled' : ''}></textarea><button class="btn" data-act="senden" data-id="${a.id}" ${a.wartet ? 'disabled' : ''}>Senden</button></div>`}
      <button class="link" data-act="zur-verwaltung" data-id="${a.id}">So sieht die Verwaltung diese Anfrage</button></div>`;
  }
  function vMsg(a, m, kompakt) {
    if (m.von === 'system') {
      const extra = !kompakt && m.typ === 'wartet' ? `<button class="link" data-act="zur-verwaltung" data-id="${a.id}">Zur Verwaltung wechseln und freigeben</button>`
        : !kompakt && m.typ === 'fehler' && m === a.nachrichten[a.nachrichten.length - 1] ? `<button class="link" data-act="retry" data-id="${a.id}">Erneut senden</button>` : '';
      return `<div class="sys ${m.typ === 'fehler' ? 'fehler' : ''}">${esc(m.text)}${extra}</div>`;
    }
    if (m.von === 'bewerber') {
      if (m.typ === 'mail') return `<div class="msg bewerber mail"><div class="m-kopf">${portalBadge(a.portal)}<span>${uhr(m.ts)}</span></div><div class="m-text">${esc(m.text)}</div></div>`;
      return `<div class="msg bewerber"><div class="m-text">${esc(m.text)}</div><div class="m-zeit">${uhr(m.ts)}</div></div>`;
    }
    if (m.typ === 'slots') {
      const letzte = a.nachrichten.filter(x => x.typ === 'slots').pop() === m;
      if (kompakt) return `<div class="sys">Terminauswahl angeboten</div>`;
      if (!letzte || a.status !== 'eingeladen') return `<div class="sys">${a.status === 'abgesagt' ? 'Terminauswahl geschlossen.' : 'Terminauswahl abgeschlossen.'}</div>`;
      const w = IK.wohnung(a.wohnungId), frei = IK.slots(w, S().anfragen).filter(x => x.frei);
      if (!frei.length) return `<div class="msg agent"><div class="m-kopf">${signet()}Assistent · Immo Kontor Bremen</div><div class="m-text">Im Moment sind alle Termine vergeben. Sobald die Verwaltung neue Besichtigungstage freigibt, erscheinen sie hier.</div></div>`;
      const tage = {};
      frei.slice(0, 12).forEach(x => { (tage[x.datum] = tage[x.datum] || []).push(x); });
      return `<div class="msg agent slots-msg"><div class="m-kopf">${signet()}Assistent · Immo Kontor Bremen</div><div class="m-text">Freie Einzeltermine, je zehn Minuten:</div>${Object.keys(tage).map(d => `<div class="slot-tag">${esc(F.tagKurz(d))}</div><div class="slot-btns">${tage[d].map(x => `<button class="slot-btn" data-act="buchen" data-id="${a.id}" data-d="${x.datum}" data-z="${x.zeit}">${x.zeit}</button>`).join('')}</div>`).join('')}${frei.length > 12 ? `<div class="small">und ${frei.length - 12} weitere</div>` : ''}</div>`;
    }
    const kopf = m.quelle === 'verwaltung' ? 'von der Verwaltung freigegeben' : m.offline ? 'Offline-Antwort' : '';
    return `<div class="msg agent ${m.typ === 'bestaetigung' ? 'bestaetigt' : ''}"><div class="m-kopf">${signet()}Assistent · Immo Kontor Bremen${kopf ? `<span class="m-quelle">${kopf}</span>` : ''}</div><div class="m-text">${esc(m.text)}</div><div class="m-zeit">${uhr(m.ts)}</div></div>`;
  }

  /* ---------- Icons ---------- */
  function chevron() { return '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function xIcon() { return '<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'; }
  function signet() { return '<svg class="signet" viewBox="0 0 870 527" aria-hidden="true"><path fill="#22B36B" fill-rule="evenodd" d="M263.5,0 H606.5 A263.5,263.5 0 0 1 606.5,527 H263.5 A263.5,263.5 0 0 1 263.5,0 Z M263.5,118 H606.5 A145.5,145.5 0 0 1 606.5,409 H263.5 A145.5,145.5 0 0 1 263.5,118 Z" transform="translate(0,527) scale(1,-1)"/><circle fill="#22B36B" cx="606.5" cy="263.5" r="105"/></svg>'; }

  /* ================= RENDER ================= */
  function render() {
    const app = $('#app');
    const keep = {};
    app.querySelectorAll('textarea.keep').forEach(t => { keep[t.id] = t.value; });
    const scroll = window.scrollY;
    rollenSchalter();
    app.innerHTML = S().rolle === 'verwaltung' ? vVerwaltung() : vBewerber();
    Object.keys(keep).forEach(id => { const t = document.getElementById(id); if (t && !t.disabled) t.value = keep[id]; });
    const msgs = $('#msgs'); if (msgs) msgs.scrollTop = msgs.scrollHeight;
    window.scrollTo(0, scroll);
  }
  IK.render = render;
  const detailNachOben = () => { if (klein()) { const d = $('.detail'); if (d) d.scrollIntoView({ block: 'start' }); } };

  async function postfach(wohnungId) {
    if (UI.postfach) return;
    const w = IK.wohnung(wohnungId) || S().wohnungen[0];
    const jobs = IK.beispielAnfragen.map(b => ({ b }));
    UI.postfach = { fertig: 0, gesamt: jobs.length };
    // in umgekehrter Reihenfolge anlegen, damit Nr. 1 oben steht
    jobs.slice().reverse().forEach(j => { j.a = IK.neueAnfrage(w.id, j.b.portal, j.b.id); j.a.wartet = true; });
    render();
    let i = 0;
    const lauf = async () => { while (i < jobs.length) { const j = jobs[i++]; j.a.wartet = false; await IK.bewerberSchreibt(j.a.id, IK.beispielText(j.b, w), () => {}); UI.postfach.fertig++; render(); } };
    await Promise.all([lauf(), lauf(), lauf()]);
    UI.postfach = null; render();
  }

  /* ---------- Ereignisse ---------- */
  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]'); if (!el || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return;
    const s = S(), act = el.dataset.act, id = el.dataset.id;
    switch (act) {
      case 'rolle': s.rolle = el.dataset.rolle; IK.speichern(); render(); window.scrollTo({ top: $('#app').offsetTop - 80, behavior: 'smooth' }); return;
      case 'tab': s.tab = el.dataset.tab; s.sel.edit = null; UI.basis = null; IK.speichern(); render(); return;
      case 'postfach': postfach(el.dataset.wid || (s.sel.filter !== 'alle' ? s.sel.filter : s.wohnungen[0] && s.wohnungen[0].id)); return;
      case 'anfrage': s.sel.anfrage = id; IK.speichern(); render(); detailNachOben(); return;
      case 'anfrage-zu': s.sel.anfrage = null; render(); return;
      case 'aktion': UI.aktion[id] = el.dataset.a; render(); return;
      case 'freigeben': {
        const t = document.getElementById('entwurf-' + id);
        if (!t || !t.value.trim()) return;
        IK.entscheide(id, el.dataset.a, t.value.trim());
        delete UI.entwurf[id + ':' + el.dataset.a]; render(); return;
      }
      case 'spaet-absage': {
        const a = IK.anfrage(id), w = IK.wohnung(a.wohnungId);
        if (!confirm('Absage an ' + name(a) + ' senden? Der Text ist neutral und nennt keinen Grund.')) return;
        IK.entscheide(id, 'absage', IK.vorlage.absage(w, a.extraktion)); render(); return;
      }
      case 'termin-ab': IK.sageTerminAb(id); render(); return;
      case 'zum-chat': s.rolle = 'bewerber'; s.sel.thread = id; s.sel.neu = null; IK.speichern(); render(); detailNachOben(); return;
      case 'zur-verwaltung': s.rolle = 'verwaltung'; s.tab = 'anfragen'; s.sel.anfrage = id; s.sel.filter = 'alle'; IK.speichern(); render(); detailNachOben(); return;
      case 'w-edit': s.tab = 'wohnungen'; s.sel.edit = id; UI.basis = {}; s.anfragen.filter(a => a.wohnungId === id && a.extraktion).forEach(a => { UI.basis[a.id] = IK.pruefe(IK.wohnung(id), a.extraktion).empfehlung; }); IK.speichern(); render(); window.scrollTo({ top: $('#app').offsetTop - 80 }); return;
      case 'w-fertig': s.sel.edit = null; UI.basis = null; IK.speichern(); render(); return;
      case 'w-neu': { const w = IK.neueWohnung(); s.sel.edit = w.id; UI.basis = {}; render(); return; }
      case 'w-del': { const w = IK.wohnung(id); if (w && confirm(`„${w.titel}“ und alle Anfragen dazu löschen?`)) { IK.loescheWohnung(id); s.sel.edit = null; render(); } return; }
      case 'tag-neu': { const w = IK.wohnung(s.sel.edit); const letzte = w.besichtigung[w.besichtigung.length - 1]; const d = letzte ? new Date(letzte.datum + 'T12:00') : new Date(); d.setDate(d.getDate() + 1); w.besichtigung.push({ datum: IK.iso(d), von: '16:00', bis: '17:00' }); IK.speichern(); render(); return; }
      case 'tag-weg': { const w = IK.wohnung(s.sel.edit); w.besichtigung.splice(+el.dataset.i, 1); IK.speichern(); render(); return; }
      case 'neu': s.sel.neu = id; s.sel.thread = null; render(); detailNachOben(); return;
      case 'thread': s.sel.thread = id; s.sel.neu = null; IK.speichern(); render(); detailNachOben(); return;
      case 'b-zu': s.sel.thread = null; s.sel.neu = null; render(); return;
      case 'senden-neu': {
        const t = $('#neu-text'), txt = t.value.trim(); if (!txt) { t.focus(); return; }
        const bsp = $('#bsp').value, portal = $('#portal').value;
        const a = IK.neueAnfrage(el.dataset.wid, portal, bsp && IK.beispielText(IK.beispielAnfragen.find(b => b.id === bsp), IK.wohnung(el.dataset.wid)) === txt ? bsp : null);
        s.sel.thread = a.id; s.sel.neu = null;
        IK.bewerberSchreibt(a.id, txt, render); return;
      }
      case 'senden': {
        const t = document.getElementById('antwort-' + id), txt = t.value.trim(); if (!txt) return;
        t.value = ''; IK.bewerberSchreibt(id, txt, render); return;
      }
      case 'retry': {
        const a = IK.anfrage(id); const iF = a.nachrichten.length - 1;
        if (a.nachrichten[iF].typ !== 'fehler') return;
        a.nachrichten.pop(); const letzte = a.nachrichten.pop();
        if (letzte && letzte.von === 'bewerber') IK.bewerberSchreibt(id, letzte.text, render); return;
      }
      case 'buchen': if (!IK.bucheTermin(id, el.dataset.d, el.dataset.z)) alert('Dieser Termin ist inzwischen vergeben. Bitte wählen Sie einen anderen.'); render(); return;
      case 'reset': if (confirm('Demo zurücksetzen? Alle Anfragen und Änderungen in diesem Browser werden gelöscht.')) { IK.zuruecksetzen(); UI.aktion = {}; UI.entwurf = {}; UI.basis = null; render(); window.scrollTo({ top: 0 }); } return;
    }
  });

  document.addEventListener('change', ev => {
    const el = ev.target;
    if (el.dataset.act === 'filter') { S().sel.filter = el.value; S().sel.anfrage = null; IK.speichern(); render(); return; }
    if (el.dataset.act === 'bsp') {
      const w = IK.wohnung(S().sel.neu), b = IK.beispielAnfragen.find(x => x.id === el.value);
      $('#neu-text').value = b ? IK.beispielText(b, w) : '';
      $('#portal').value = b ? b.portal : 'mail'; return;
    }
    if (el.dataset.f) formFeld(el, true);
  });
  document.addEventListener('input', ev => {
    const el = ev.target;
    if (el.dataset.act === 'entwurf') { UI.entwurf[el.dataset.id + ':' + el.dataset.a] = el.value; return; }
    if (el.dataset.f && (el.tagName === 'TEXTAREA' || el.type === 'text' || el.type === 'number')) formFeld(el, false);
  });

  /* Formularfeld direkt in die Wohnung schreiben, dann nur die Wirkung neu zeichnen. */
  function formFeld(el, change) {
    const w = IK.wohnung(S().sel.edit); if (!w) return;
    const pfad = el.dataset.f.split('.');
    const zahlen = ['zimmer', 'flaeche', 'kalt', 'warm', 'max_personen', 'einkommen_faktor'];
    let wert = el.value;
    if (zahlen.includes(pfad[pfad.length - 1])) { wert = parseFloat(String(wert).replace(',', '.')); if (!isFinite(wert)) return; }
    if (el.type === 'radio' && !el.checked) return;
    let ziel = w;
    for (let i = 0; i < pfad.length - 1; i++) ziel = ziel[pfad[i]];
    ziel[pfad[pfad.length - 1]] = wert;
    IK.speichern();
    const wi = $('#wirkung'); if (wi) wi.innerHTML = vWirkung(w);
    const sz = $('#slotzahl'); if (sz) sz.textContent = `${IK.slots(w, S().anfragen).length} freie oder belegte Termine in der Zukunft`;
    const g = $('#gespeichert'); if (g) { g.textContent = 'Gespeichert'; clearTimeout(formFeld.t); formFeld.t = setTimeout(() => { g.textContent = 'Änderungen werden sofort gespeichert'; }, 1400); }
    if (change && el.type === 'radio') render();
  }

  /* ---------- Start ---------- */
  IK.laden();
  render();
})(window.IK);
