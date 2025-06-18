import { useEffect, useState } from 'react';
import { recuperaTotaliCassa } from '../services/cassa';
import Card from './card';
import SectionTitle from './Titoli';

export default function TotaliCassa({ turnoId }) {
  const [items, setItems]   = useState([]);
  const [busy,  setBusy]    = useState(false);

  /* scarica totali al cambio turno */
  useEffect(() => {
    if (!turnoId) return;
    (async () => {
      setBusy(true);
      try {
        const data = await recuperaTotaliCassa(turnoId); // [{type, value}]
        setItems(data);
      } finally {
        setBusy(false);
      }
    })();
  }, [turnoId]);

  /* calcola aggregati */
  const entrate = items
    .filter((i) => i.value > 0)
    .reduce((acc, i) => acc + i.value, 0);

  const uscite = items
    .filter((i) => i.value < 0)
    .reduce((acc, i) => acc + Math.abs(i.value), 0);

  const saldo = entrate - uscite;

  /* — UI — */
  return (
    <Card className="w-full sm:max-w-2xl lg:max-w-5xl space-y-8">
      <SectionTitle>Riepilogo Finanziario</SectionTitle>

      {/* blocchi entrate / uscite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Box color="emerald" label="Entrate Totali" value={busy ? '…' : entrate} />
        <Box color="rose"    label="Uscite Totali"  value={busy ? '…' : uscite} />
      </div>

      {/* saldo finale */}
      <div className="text-center">
        <h3 className="text-lg font-medium mb-1">Saldo Finale</h3>
        <p
          className={`text-3xl font-bold ${
            saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {busy ? '…' : saldo.toFixed(2) + ' €'}
        </p>
      </div>

      {/* breakdown per tipo */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2 px-4">Etichetta</th>
              <th className="py-2 px-4">Valore</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !busy && (
              <tr>
                <td colSpan="2" className="py-4 text-center text-zinc-500">
                  Nessun dato
                </td>
              </tr>
            )}
            {items.map((el) => (
              <tr key={el.type} className="border-t">
                <td className="py-2 px-4">{el.type}</td>
                <td
                  className={`py-2 px-4 ${
                    el.value >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {el.value.toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* — piccolo box colorato — */
function Box({ color, label, value }) {
  return (
    <div
      className={`rounded-xl p-6 text-center border bg-${color}-50 border-${color}-200`}
    >
      <p className="uppercase text-xs tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold text-${color}-600`}>
        {typeof value === 'number' ? value.toFixed(2) + ' €' : value}
      </p>
    </div>
  );
}
