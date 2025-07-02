/* -------------------------------------------------------------------------- */
/*  MODAL “CASSA”                                                             */
/* -------------------------------------------------------------------------- */

import { useEffect, useState } from 'react';
import {
  recuperaCassa,
  inserisciInCassa,
  eliminaVoceCassa,
} from '../services/cassa';
import { Trash2 } from 'lucide-react';

/* categorie disponibili (puoi aggiungerne) -------------------------------- */
const CATEGORIE = ['', 'BAR', 'GITA', 'STRUDEL', 'SPECK'];

/* utilità: ricava id_anag da qualunque forma arrivi ----------------------- */
const getIdAnag = (p) =>
  p?.id_anag ?? p?.idanag ?? p?.id ?? p?.idAnag ?? null;

export default function CassaModal({
  open,
  onClose,
  partecipante,
  turno,
  onChanged,
}) {
  const [cassa, setCassa] = useState(null);
  const [busy, setBusy] = useState(false);

  const [value, setValue] = useState('');
  const [tipo, setTipo] = useState('');

  /* carica cassa quando il modal si apre ---------------------------------- */
  useEffect(() => {
    if (!open || !partecipante || !turno) return;

    const id_anag = getIdAnag(partecipante);
    if (!id_anag) return;

    (async () => {
      setBusy(true);
      try {
        const data = await recuperaCassa(id_anag, turno.id);
        setCassa(data);
      } finally {
        setBusy(false);
      }
    })();
  }, [open, partecipante, turno]);

  /* inserisci voce -------------------------------------------------------- */
  const addVoce = async (modo /* in | out */) => {
    const num = parseFloat(String(value).replace(',', '.'));
    if (!num || Number.isNaN(num)) return;

    if (modo === 'out' && !tipo) {
      alert('Seleziona un tipo per la spesa');
      return;
    }

    const id_anag = getIdAnag(partecipante);
    const signed = modo === 'in' ? Math.abs(num) : -Math.abs(num);
    const categoria = modo === 'in' ? 'VERS' : tipo;

    const data = await inserisciInCassa(id_anag, turno.id, signed, categoria);
    setCassa(data);
    onChanged?.();

    setValue('');
    if (modo === 'out') setTipo('');
  };

  /* elimina voce ---------------------------------------------------------- */
  const delVoce = async (voce) => {
    const id_anag = getIdAnag(partecipante);
    const data = await eliminaVoceCassa(voce.id, id_anag, turno.id);
    setCassa(data);
    onChanged?.();
  };

  if (!open) return null;

  /* ---------------------------------------------------------------------- */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-lg"
        onClick={(e) => e.stopPropagation()}       /* blocca chiusura interna */
      >
        {/* × chiusura */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl leading-none hover:scale-110 transition"
        >
          &times;
        </button>

        {/* NOME */}
        <h2 className="text-center text-2xl font-semibold tracking-wide mb-6">
          {partecipante?.nome || partecipante?.Nome}{' '}
          {partecipante?.cognome || partecipante?.Cognome}
        </h2>

        {/* SALDO */}
        <div
          className={`text-3xl font-bold text-center mb-4 ${
            (cassa?.totaleInCassa ?? 0) >= 0
              ? 'text-emerald-600'
              : 'text-rose-600'
          }`}
        >
          {busy || !cassa ? '…' : cassa.totaleInCassa.toFixed(2) + ' €'}
        </div>

        {/* STATISTICHE */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <Stat
            label="Totale versato"
            positive
            value={
              busy || !cassa ? '…' : cassa.totaleVersato.toFixed(2) + ' €'
            }
          />
          <Stat
            label="Totale speso"
            value={busy || !cassa ? '…' : cassa.totaleSpesa.toFixed(2) + ' €'}
          />
        </div>

        {/* LISTA VOCI ------------------------------------------------------- */}
        <div className="max-h-60 overflow-y-auto border rounded-xl">
          <table className="min-w-full table-fixed text-xs sm:text-sm">
            {/* larghezze fisse */}
            <colgroup>
              <col className="w-24" />{/* Data */}
              <col className="w-20" />{/* Valore */}
              <col />{/* Tipo */}
            </colgroup>

            <thead className="sticky top-0 bg-muted/50 backdrop-blur">
              <tr className="text-left">
                <th className="py-2 px-4">Data</th>
                <th className="py-2">Valore</th>
                <th className="py-2">Tipo</th>
                <th className="py-2 px-4 w-10" />
              </tr>
            </thead>

            <tbody>
              {!busy && cassa?.inserimenti?.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="py-6 text-center text-zinc-500 italic"
                  >
                    Nessuna voce
                  </td>
                </tr>
              )}

              {cassa?.inserimenti?.map((v) => (
                <tr key={v.id} className="border-t last:border-b-0">
                  <td className="py-2 px-4 whitespace-nowrap">
                    {new Date(v.insert_date).toLocaleDateString()}
                  </td>

                  <td
                    className={`py-2 whitespace-nowrap ${
                      v.value >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {v.value.toFixed(2).replace('.', ',')} €
                  </td>

                  <td className="py-2 truncate">{v.type}</td>

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

        {/* FORM RAPIDO ------------------------------------------------------ */}
        <div className="mt-6 space-y-4">
          {/* input importo */}
          <input
            type="number"
            inputMode="decimal"
            pattern="[0-9]*"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0,00"
            className="w-full sm:flex-1 rounded-lg border px-3 py-2 text-sm
                       dark:bg-zinc-800 dark:border-zinc-700"
          />

          {/* bottoni salvati */}
          <div className="flex gap-4 sm:flex-1">
            <button
              onClick={() => addVoce('in')}
              className="keep-tw-border flex-1 rounded-lg border border-emerald-500
                         bg-emerald-300 hover:bg-emerald-500
                         text-white font-semibold shadow-md py-2 transition-colors"
            >
              Versamento
            </button>

            <button
              onClick={() => addVoce('out')}
              className="keep-tw-border flex-1 rounded-lg border border-rose-500
                         bg-rose-300 hover:bg-rose-500
                         text-white font-semibold shadow-md py-2 transition-colors"
            >
              Spesa
            </button>
          </div>

          {/* select tipo */}
          <div className="flex justify-center">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full sm:w-1/2 rounded-lg border px-3 py-2 text-sm
                         dark:bg-zinc-800 dark:border-zinc-700"
            >
              {CATEGORIE.map((c) => (
                <option key={c} value={c}>
                  {c || '-'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat – piccola card                                                       */
/* -------------------------------------------------------------------------- */
function Stat({ label, value, positive = false }) {
  return (
    <div
      className={`rounded-xl p-4 text-center border ${
        positive
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-rose-200 bg-rose-50'
      }`}
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
