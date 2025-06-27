/* ------------------------------------------------------------------ */
/*  services/auth.js – piccola utilità per il token                    */
/* ------------------------------------------------------------------ */
const API_BASE =
  'https://gestione.parrocchiacarpaneto.com/servizi/api/login';   // ⬅ endpoint protetto

/* legge / scrive token in localStorage ----------------------------- */
export const getToken    = () => localStorage.getItem('token') || null;
export const setToken    = (t) => localStorage.setItem('token', t);
export const clearToken  = () => localStorage.removeItem('token');

/* header comune ---------------------------------------------------- */
export const authHeader = () => ({
  'Content-Type': 'application/json',
  Customauthorization: 'Bearer ' + getToken(),
});

/* verifica che il token sia ancora valido (GET “ping”) -------------- */
export async function isTokenValid() {
  const tk = getToken();
  if (!tk) return false;

  try {
    const res = await fetch(`${API_BASE}/checkSession.php`, { headers: authHeader() });
    return res.ok;                     // 200 ⇒ valido, 401/403 ⇒ non valido
  } catch {
    return false;
  }
}
