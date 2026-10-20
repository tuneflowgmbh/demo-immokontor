/* Vorlagen für alles, was die Verwaltung freigibt. Sie-Form, neutral, AGG-sicher. */
(function (IK) {
  const GRUSS = 'Viele Grüße\nIhr Team von Immo Kontor Bremen';
  IK.anrede = function (e) {
    if (!e || !e.name) return 'Guten Tag,';
    const teile = e.name.trim().split(/\s+/);
    if (e.anrede && teile.length > 1) return `Guten Tag ${e.anrede} ${teile[teile.length - 1]},`;
    return `Guten Tag ${e.name.trim()},`;
  };
  const mitbringen = (w, e) => (w.vorgaben.schufa === 'ja' ? `Bitte bringen Sie Ihren Ausweis und ${e && e.schufa_erwaehnt ? 'Ihre' : 'eine aktuelle'} Schufa-Auskunft mit.` : 'Bitte bringen Sie Ihren Ausweis mit.');
  const liste = a => a.map(x => '- ' + x).join('\n');

  IK.vorlage = {
    einladen: (w, e) => `${IK.anrede(e)}

vielen Dank für Ihr Interesse an der Wohnung „${w.titel}“. Wir laden Sie gern zu einer Besichtigung ein. Es sind Einzeltermine von zehn Minuten.

Bitte wählen Sie direkt unter dieser Nachricht einen freien Termin aus. Sie bekommen sofort eine Bestätigung.

${GRUSS}`,
    rueckfrage: (w, e, p) => {
      const teile = [];
      if (p.fehlend.length) teile.push(`damit wir Ihre Anfrage zur Wohnung „${w.titel}“ prüfen können, fehlen uns noch folgende Angaben:\n${liste(p.fehlend.map(f => IK.FRAGE[f]))}`);
      if (p.klaeren.length) teile.push(`${p.fehlend.length ? 'Außerdem stimmen' : `vielen Dank für Ihre Anfrage zur Wohnung „${w.titel}“. Wir stimmen`} wir einen Punkt noch mit dem Eigentümer ab und melden uns dazu:\n${liste(p.klaeren)}`);
      if (!teile.length) teile.push(`vielen Dank für Ihre Anfrage zur Wohnung „${w.titel}“. Wir haben noch eine kurze Rückfrage:\n- `);
      return `${IK.anrede(e)}\n\n${teile.join('\n\n')}\n\n${p.fehlend.length ? 'Antworten Sie einfach auf diese Nachricht.\n\n' : ''}${GRUSS}`;
    },
    absage: (w, e) => `${IK.anrede(e)}

vielen Dank für Ihr Interesse an der Wohnung „${w.titel}“ und Ihre Anfrage. Nach Abgleich mit den Vorgaben des Eigentümers können wir Ihnen für diese Wohnung leider keinen Besichtigungstermin anbieten.

Wir wünschen Ihnen viel Erfolg bei der Wohnungssuche.

${GRUSS}`,
    bestaetigung: (w, e, s) => `${IK.anrede(e)}

Ihr Besichtigungstermin ist gebucht:
${IK.fmt.tagLang(s.datum)}, ${s.zeit} Uhr, zehn Minuten
${w.strasse}, ${w.stadtteil}, ${w.etage}

${mitbringen(w, e)} Falls Sie den Termin nicht wahrnehmen können, schreiben Sie uns hier kurz. Dann bekommen Sie neue Termine.

${GRUSS}`,
    terminAbgesagt: (w, e, s) => `${IK.anrede(e)}

leider müssen wir Ihren Besichtigungstermin am ${IK.fmt.tagLang(s.datum)} um ${s.zeit} Uhr absagen. Bitte wählen Sie unten einen neuen Termin aus.

${GRUSS}`,
    vollstaendig: (w, e) => `${IK.anrede(e)}

vielen Dank für Ihre Anfrage zur Wohnung „${w.titel}“. Ihre Angaben sind vollständig. Die Verwaltung prüft Ihre Anfrage und meldet sich in der Regel noch am selben Tag.

${GRUSS}`
  };

  /* Antwort des Assistenten an den Bewerber: Kern von der KI, Rahmen und Rückfragen aus den Regeln. */
  /* Sätze trennen, ohne an Abkürzungen wie „Nr.“ oder „z. B.“ zu brechen. */
  const saetze = t => t.replace(/\b(Nr|ca|bzw|ggf|inkl|Str|evtl|z\. ?B|u\. ?a|d\. ?h)\. /g, '$1.\u00a0').split(/(?<=[.!?]) +(?=[A-ZÄÖÜ„"])/);
  IK.kernSaeubern = function (t, nachricht) {
    if (!t || !/\?/.test(nachricht || '')) return '';
    let x = t.trim().replace(/^guten (tag|morgen|abend)[^\n]*\n+/i, '').replace(/^(hallo|liebe[rs]?|sehr geehrte[rs]?)[^\n]*,\s*\n+/i, '');
    const g = x.search(/\n\s*(viele|beste|freundliche|liebe) grüße/i); if (g >= 0) x = x.slice(0, g);
    x = x.replace(/^vielen dank[^.!\n]*[.!]\s*/i, '').trim();
    x = saetze(x).filter(z => !/^bitte\b/i.test(z)).join(' ').trim();
    return x.length > 500 ? x.slice(0, 500).replace(/\s+\S*$/, '') + ' …' : x;
  };
  IK.vorlage.agent = function (w, e, o) {
    const teile = [];
    let kern = o.kern || '';
    if (o.offen) kern = saetze(kern).filter(x => !/verwaltung prüft|meldet sich in der regel|angaben sind vollständig/i.test(x)).join(' ').trim();
    teile.push(o.offen ? (o.erste ? `vielen Dank für Ihre Anfrage zur Wohnung „${w.titel}“.` : 'vielen Dank für Ihre Angaben.') : 'vielen Dank für Ihre Nachricht.');
    if (kern) teile.push(kern);
    if (o.offen) teile.push(o.fehlend.length
      ? `Damit wir Ihre Anfrage prüfen können, fehlen uns noch folgende Angaben:\n${liste(o.fehlend.map(f => IK.FRAGE[f]))}\n\nAntworten Sie einfach auf diese Nachricht.`
      : 'Ihre Angaben sind vollständig. Die Verwaltung prüft Ihre Anfrage und meldet sich in der Regel noch am selben Tag.');
    return `${IK.anrede(e)}\n\n${teile.join('\n\n')}\n\n${GRUSS}`;
  };
})(window.IK);
