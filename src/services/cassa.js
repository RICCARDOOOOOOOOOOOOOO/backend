/* src/services/cassa.js -------------------------------------------------- */
const API_BASE =
  'https://gestione.parrocchiacarpaneto.com/servizi/api/turni';

const authHeader = () => ({
  'Content-Type': 'application/json',
  Customauthorization: 'Bearer ' + localStorage.getItem('token'),
});

/* — helper fetch POST (ritorna già il payload “vero”) — */
async function post(endpoint, payload) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`${endpoint} → ${res.status}`);

  const data = await res.json();
  if (data.token) localStorage.setItem('token', data.token);
  return data.returnObject ?? data;
}

/* — builder: array grezzo → oggetto Cassa “pronto” — */
function buildCassa(list, id_anag) {
  if (!Array.isArray(list)) list = [];        // ← evita crash se il php torna {}

  const cassa = {
    nome: null,
    cognome: null,
    inserimenti: [],
    totaleVersato: 0,
    totaleSpesa: 0,
    totaleInCassa: 0,
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


/* — API public ----------------------------------------------------------- */
export async function recuperaCassa(id_anag, id_turno) {
  const raw = await post('/recuperaCassa.php', { id_anag, id_turno });
  return buildCassa(raw, id_anag);
}

export async function inserisciInCassa(id_anag, id_turno, value, type) {
  const raw = await post('/inserisciInCassa.php', {
    id_anag,
    id_turno,
    value,
    type,
  });
  return buildCassa(raw, id_anag);
}

export async function eliminaVoceCassa(id, id_anag, id_turno) {
  const raw = await post('/eliminaVoceCassa.php', { id, id_anag, id_turno });
  return buildCassa(raw, id_anag);
}

/* — facoltative: le altre funzioni che ti servivano — */
export const recuperaRiepilogoCassa = (id_turno) =>
  post('/recuperaRiepilogoCassa.php', { id_turno });

export const recuperaTotaliCassa = (id_turno) =>
  post('/recuperaTotaliCassa.php', { id_turno });

export const creaPdfCassa = (id_turno, id_anag) =>
  post('/creaPdfCassa.php', { id_turno, id_anag });

export const invioMailCassa = (id_turno, id_anag) =>
  post('/invioMailCassa.php', [{ id_turno, id_anag }]);
