// src/services/cassa.js
const API = 'https://gestione.parrocchiacarpaneto.com/servizi/api';

const auth = () => ({
  'Content-Type': 'application/json',
  Customauthorization: 'Bearer ' + localStorage.getItem('token'),
});

const post = async (url, body) => {
  const res = await fetch(`${API}${url}`, {
    method: 'POST',
    headers: auth(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${url} → ${res.status}`);
  return res.json();
};

/* wrapper delle funzioni che usavi nel vecchio progetto  */
export const recuperaCassa       = (id_anag, id_turno) =>
  post('/turni/recuperaCassa.php',       { id_anag, id_turno });

export const inserisciInCassa    = (id_anag, id_turno, value, type) =>
  post('/turni/inserisciInCassa.php',    { id_anag, id_turno, value, type });

export const eliminaVoceCassa    = (id, id_anag, id_turno) =>
  post('/turni/eliminaVoceCassa.php',    { id, id_anag, id_turno });
