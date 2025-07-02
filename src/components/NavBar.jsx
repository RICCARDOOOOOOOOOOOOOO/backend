/* ------------------------------------------------------------------- */
/*  NavBar                                                             */
/* ------------------------------------------------------------------- */
import { useState } from 'react';
import { Menu, X, Home } from 'lucide-react';

export default function NavBar({
  showSummary,
  toggleSummary,
  showPdf,
  togglePdf,
  toggleSelectors,
  onTurnoPdf
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
      {/* riga principale */}
      <div className="relative mx-auto flex items-center h-14 px-4 sm:px-8 max-w-7xl">
        {/* hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-2 -ml-2 rounded hover:bg-muted"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* titolo centrato */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Cassa
          </span>
        </div>

        {/* home a destra */}
        <a
          href="https://gestione.parrocchiacarpaneto.com/userhome/"
          className="ml-auto p-2 rounded hover:bg-muted"
          title="Home"
        >
          <Home size={20} />
        </a>
      </div>

      {/* menu a scomparsa */}
      {open && (
        <div className="border-t bg-white dark:bg-zinc-900 px-6 py-5 space-y-5">
          {/* SWITCH riepilogo */}
          <label className="toggle-container">
            <input
              type="checkbox"
              className="toggle-checkbox"
              checked={showSummary}
              onChange={toggleSummary}
            />
            <span className="toggle-label toggle-scale" />
            <span className="text-sm">Riepilogo finanziario</span>
          </label>

          {/* SWITCH mostra PDF / saldo */}
          <label className="toggle-container">
            <input
              type="checkbox"
              className="toggle-checkbox"
              checked={showPdf}
              onChange={togglePdf}
            />
            <span className="toggle-label toggle-scale" />
            <span className="text-sm">
              {showPdf ? 'Mostra PDF' : 'Mostra saldo'}
            </span>
          </label>

          {/* bottone cambio selezione */}
          <button
            onClick={() => {
                toggleSelectors();   // apre il picker anno/turno
                setOpen(false);      // chiude subito il menu a scomparsa
            }}
            className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            Cambio selezione anno/turno
          </button>

          {/* PDF riepilogo turno */}
          <button
            onClick={() => {
                onTurnoPdf?.();     // genera il PDF
                setOpen(false);     // chiude il menu
            }}
          className="w-full rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
          Scarica PDF turno
          </button>

        </div>
      )}
    </header>
  );
}
