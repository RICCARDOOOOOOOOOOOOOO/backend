import { useEffect, useState } from 'react';
import { recuperaRiepilogoCassa, recuperaTotaliCassa } from '../services/cassa';
import Card from './card';
import SectionTitle from './Titoli';

/**
 * Mostra:
 * • Entrate Totali   (somma di “totale_versato” di tutti i ragazzi)
 * • Uscite  Totali   (somma di “totale_spesa”   di tutti i ragazzi)
 * • Elenco etichette con valore (da /recuperaTotaliCassa.php)
 */
export default function TotaliCassa({ turnoId, refreshKey }) {
  const [loading, setLoading] = useState(true);
  const [entrate, setEntrate] = useState(0);
  const [uscite, setUscite] = useState(0);
  const [labels, setLabels] = useState([]);        // [{ type, value }]

  /* carica dati ogni volta che cambia il turno */
  useEffect(() => {
    if (!turnoId) return;

    (async () => {
      try {
        setLoading(true);

        /* ---------------- riepilogo per partecipante ---------------- */
        const riepilogo = await recuperaRiepilogoCassa(turnoId);
        const totVersato = riepilogo.reduce(
          (s, r) => s + Number(r.totale_versato ?? r.totaleVersato ?? 0),
          0,
        );
        const totSpesa = riepilogo.reduce(
          (s, r) => s + Number(r.totale_spesa   ?? r.totaleSpesa   ?? 0),
          0,
        );
        setEntrate(totVersato);
        setUscite(totSpesa);

        /* ----------------  etichette complessive ------------------- */
        const etichette = await recuperaTotaliCassa(turnoId);   // [{type,value}]
        setLabels(Array.isArray(etichette) ? etichette : []);
      } catch (e) {
        console.error('Errore TotaliCassa:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [turnoId, refreshKey]);

  if (loading) return null;               // niente spazio vuoto mentre attende

  return (
    <Card className="w-full sm:max-w-2xl lg:max-w-5xl space-y-6">
      <SectionTitle>Riepilogo Finanziario</SectionTitle>

      {/* BOX – Entrate / Uscite ------------------------------------------------ */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl bg-emerald-50 py-6 text-center">
          <p className="text-sm font-medium text-emerald-700">Entrate Totali</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            € {entrate.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl bg-rose-50 py-6 text-center">
          <p className="text-sm font-medium text-rose-700">Uscite Totali</p>
          <p className="mt-1 text-2xl font-bold text-rose-600">
            € {uscite.toFixed(2)}
          </p>
        </div>
      </div>

      {/* LISTA etichette ------------------------------------------------------- */}
      {labels.length > 0 && (
        <>
          <h4 className="text-center font-medium mt-2">Etichette</h4>

          <ul className="flex flex-col gap-1 text-sm">
            {labels.map((l) => (
              <li
                key={l.type}
                className="flex justify-between border-b last:border-b-0 px-4 py-1"
              >
                <span>{l.type || '-'}</span>
                <span className="font-medium">
                  € {Number(l.value).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}