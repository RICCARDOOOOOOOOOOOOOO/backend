/* src/components/ModalCassa.jsx ------------------------------------------- */
import { useEffect, useState } from 'react';
import {
  recuperaCassa,
  inserisciInCassa,
  eliminaVoceCassa,
} from '../services/cassa';

import { Trash2 } from 'lucide-react';   // icona cestino

export default function CassaModal({ open, onClose, partecipante, turno }) {
  const [cassa,  setCassa]  = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [value,  setValue]  = useState('');

  /* — carica dati cassa — */
  useEffect(() => {
    if (!open || !partecipante) return;
    (async () => {
      setBusy(true);
      try {
        const data = await recuperaCassa(partecipante.id, turno.id);
        setCassa(data);
      } finally {
        setBusy(false);
      }
    })();
  }, [open, partecipante, turno]);

  /* — helper — */
const addVoce = async (modo /* 'in' | 'out' */) => {
  if (!value) return;
  const num = parseFloat(String(value).replace(',', '.'));
  if (Number.isNaN(num) || num === 0) return;
  const signed = modo === 'in' ? Math.abs(num) : -Math.abs(num);

  /* ← il backend vuole *comunque* un “type” (categoria).  
       Finché non scegli un select dedicato, ne mandiamo uno generico. */
  const data = await inserisciInCassa(
    partecipante.id,
    turno.id,
    signed,
    'GEN'          // categoria placeholder
  );

  setCassa(data);
  setValue('');
};


  const delVoce = async (voce) => {
    const data = await eliminaVoceCassa(voce.id, partecipante.id, turno.id);
    setCassa(data);
  };

  /* — chiudi se serve — */
  if (!open) return null;

  /* — layout — */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-lg"
        onClick={(e) => e.stopPropagation()}   /* blocca chiusura sul click interno */
      >
        {/* × chiudi */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl leading-none hover:scale-110 transition"
        >
          &times;
        </button>

        {/* — NOME — */}
        <h2 className="text-center text-2xl font-semibold tracking-wide mb-6">
          {partecipante.nome} {partecipante.cognome}
        </h2>

        {/* — SALDO IN CASSA — */}
        <div
          className={`text-3xl font-bold text-center mb-4 ${
            cassa?.totaleInCassa >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {busy || !cassa ? '…' : cassa.totaleInCassa.toFixed(2) + ' €'}
        </div>

        {/* — VERSATO / SPESO — */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <Stat
            label="Totale versato"
            value={busy ? '…' : `${cassa?.totaleVersato?.toFixed(2)} €`}
            positive
          />
          <Stat
            label="Totale speso"
            value={busy ? '…' : `${cassa?.totaleSpesa?.toFixed(2)} €`}
          />
        </div>

        {/* — TABELLA SPESE — */}
        <div className="max-h-60 overflow-y-auto border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-muted/50 backdrop-blur">
              <tr className="text-left">
                <th className="py-2 px-4 w-36">Data</th>
                <th className="py-2">Valore</th>
                <th className="py-2 px-4 w-20 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {cassa?.inserimenti?.length === 0 && !busy && (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-zinc-500">
                    Nessuna voce
                  </td>
                </tr>
              )}
              {cassa?.inserimenti?.map((v) => (
                <tr key={v.id} className="border-t last:border-b-0">
                  <td className="py-2 px-4">
                    {new Date(v.insert_date).toLocaleDateString()}
                  </td>
                  <td
                    className={`py-2 ${
                      v.value >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {v.value.toFixed(2).replace('.', ',')} €
                  </td>
                  <td className="py-2 px-4 text-right">
                    <button
                      onClick={() => delVoce(v)}
                      title="Elimina"
                      className="inline-flex items-center text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* — FORM + BOTTONI — */}
        <div className="mt-6 flex items-end gap-4">
            <button
            onClick={() => addVoce('in')}
            className="flex-1 rounded-lg bg-emerald-500/80 hover:bg-emerald-500
                       py-2 text-white font-medium"
              >
            Versamento
            </button>
            <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0,00"
            className="flex-1 rounded-lg border px-3 py-2 text-sm
                       dark:bg-zinc-800 dark:border-zinc-700"
            />

            <button
            onClick={() => addVoce('out')}
            className="flex-1 rounded-lg bg-rose-500/80 hover:bg-rose-500
                       py-2 text-white font-medium"
              >
            Spesa
          </button>
        </div>
      </div>
    </div>
  );
}

/*———— piccolo componente “stat” ————*/
function Stat({ label, value, positive = false }) {
  return (
    <div
      className={`rounded-xl p-4 text-center border
                  ${positive ? 'border-emerald-200 bg-emerald-50'
                              : 'border-rose-200 bg-rose-50'}`}
    >
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1 font-semibold ${
          positive ? 'text-emerald-600' : 'text-rose-600'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
