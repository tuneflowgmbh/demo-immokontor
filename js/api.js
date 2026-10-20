/* Einziger Weg nach draußen: der Text an den Assistenten. Der KI-Schlüssel liegt im Backend, nicht hier. */
(function (IK) {
  IK.API_URL = 'https://n8n.tune-flow.com/webhook/demo-immokontor';
  IK.frageAgent = async function (payload) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), 30000);
    try {
      const r = await fetch(IK.API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: c.signal });
      let d = null; try { d = await r.json(); } catch (e) { /* kein JSON */ }
      if (r.ok && d && d.ok) return { ok: true, data: d };
      return { ok: false, status: r.status, grund: d && d.grund, warten: d && d.warten_min };
    } catch (e) {
      return { ok: false, status: 0, grund: e.name === 'AbortError' ? 'zeit' : 'netz' };
    } finally { clearTimeout(t); }
  };
})(window.IK);
