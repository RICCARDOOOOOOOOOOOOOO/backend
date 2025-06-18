/* -------------------------------------------------------------------------- */
/*  SERVIZI “CASSA” – tutte le chiamate PHP                                   */
/* -------------------------------------------------------------------------- */

const API_BASE =
  'https://gestione.parrocchiacarpaneto.com/servizi/api/turni';

/* intestazione con JWT salvato in localStorage ---------------------------- */
const authHeader = () => ({
  'Content-Type': 'application/json',
  Customauthorization: 'Bearer ' + localStorage.getItem('token'),
});

/* helper POST (gestisce “/” facoltativo, salva eventuale nuovo token) ------ */
async function post(endpoint, payload = {}) {
  const url = endpoint.startsWith('/')
    ? `${API_BASE}${endpoint}`
    : `${API_BASE}/${endpoint}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`${endpoint} → ${res.status}`);

  const data = await res.json();
  if (data.token) localStorage.setItem('token', data.token);

  /* molti script PHP rispondono con { returnObject: [...] } */
  return data.returnObject ?? data;
}

/* builder: array grezzo → oggetto Cassa “pronto” -------------------------- */
function buildCassa(list = []) {
  if (!Array.isArray(list)) list = []; // forma di sicurezza

  const cassa = {
    nome:            '',
    cognome:         '',
    inserimenti:     [],
    totaleVersato:   0,
    totaleSpesa:     0,
    totaleInCassa:   0,
  };

  list.forEach((e) => {
    if (!cassa.nome) {
      cassa.nome    = e.nome    ?? e.Nome    ?? '';
      cassa.cognome = e.cognome ?? e.Cognome ?? '';
    }

    const val = Number(e.value ?? e.Value ?? 0);

    cassa.inserimenti.push({
      id:          e.id,
      insert_date: e.insert_date,
      value:       val,
      type:        e.type,
    });

    if (val > 0) cassa.totaleVersato += val;
    else         cassa.totaleSpesa   += Math.abs(val);
  });

  cassa.totaleInCassa = cassa.totaleVersato - cassa.totaleSpesa;
  return cassa;
}

/* API PUBBLICHE ----------------------------------------------------------- */
export async function recuperaCassa(id_anag, id_turno) {
  const raw = await post('recuperaCassa.php', { id_anag, id_turno });
  return buildCassa(raw);
}

export async function inserisciInCassa(id_anag, id_turno, value, type) {
  const raw = await post('inserisciInCassa.php', {
    id_anag,
    id_turno,
    value,
    type,
  });
  return buildCassa(raw);
}

export async function eliminaVoceCassa(id, id_anag, id_turno) {
  const raw = await post('eliminaVoceCassa.php', { id, id_anag, id_turno });
  return buildCassa(raw);
}

/* facoltative ------------------------------------------------------------- */
export const recuperaRiepilogoCassa = (id_turno) =>
  post('recuperaRiepilogoCassa.php', { id_turno });

export const recuperaTotaliCassa = (id_turno) =>
  post('recuperaTotaliCassa.php', { id_turno });

export const creaPdfCassa = (id_turno, id_anag) =>
  post('creaPdfCassa.php', { id_turno, id_anag });

export const invioMailCassa = (id_turno, id_anag) =>
  post('invioMailCassa.php', [{ id_turno, id_anag }]);
