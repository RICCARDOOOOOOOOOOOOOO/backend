/* ----------------------------------------------------------------------- */
/*  generaPdfTurno.js – PDF riepilogo di un intero turno                   */
/* ----------------------------------------------------------------------- */
/*  dipendenze:
      npm i jspdf jspdf-autotable
*/

import jsPDF     from 'jspdf';
import autoTable from 'jspdf-autotable';

/* tavolozza Tailwind (200) --------------------------------------------- */
const emerald200 = [167, 243, 208];  // #a7f3d0
const rose200    = [254, 202, 202];  // #fecaca
const zinc500    = [113, 113, 122];  // #71717a

/* logo (facoltativo) ---------------------------------------------------- */
const LOGO_PATH  = 'src/assets/Campeggio_San_Fermo.png';
const LOGO_W     = 75;
const LOGO_H     = 75;

/* helpers --------------------------------------------------------------- */
const writeCentered = (doc, txt, { x, y, w }, sz = 12, bold = false) => {
  doc.setFontSize(sz).setFont(undefined, bold ? 'bold' : 'normal');
  doc.text(txt, x + w / 2, y, { align: 'center', baseline: 'middle' });
};
const loadImage = (src) =>
  new Promise((res, rej) => {
    if (!src) return rej();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

/* ----------------------------------------------------------------------- */
/*  turno       : { id, titolo, ... }                                      */
/*  riepilogo   : array di recuperaRiepilogoCassa()                        */
/*  movimenti   : array di tutte le voci (serve solo per le etichette)     */
/*  silent=true : ritorna Base-64 (senza header)                           */
/* ----------------------------------------------------------------------- */
export default async function generaPdfTurno(
  turno,
  riepilogo,
  movimenti,
  silent = false,
) {
  /* --- 1. ordinamento alfabetico ------------------------------------ */
  riepilogo = [...riepilogo].sort((a, b) =>
    (a.cognome + a.nome).localeCompare(b.cognome + b.nome, 'it', {
      sensitivity: 'base',
    }),
  );

  /* --- 2. totali per etichetta -------------------------------------- */
  const labelTotals = {};
  (movimenti ?? []).forEach((v) => {
    if (!v.type) return;
    labelTotals[v.type] =
      (labelTotals[v.type] ?? 0) + Math.abs(Number(v.value));
  });

  /* --- 3. calcoli complessivi --------------------------------------- */
  const totVersato = riepilogo.reduce(
    (s, r) => s + Number(r.totale_versato ?? r.totaleVersato ?? 0),
    0,
  );
  const totSpeso = riepilogo.reduce(
    (s, r) => s + Number(r.totale_spesa ?? r.totaleSpesa ?? 0),
    0,
  );
  const totCassa = totVersato - totSpeso;

  /* --- 4. PDF setup -------------------------------------------------- */
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();
  let   y   = 40;

  /* Header con logo --------------------------------------------------- */
  if (LOGO_PATH) {
    try {
      const img = await loadImage(LOGO_PATH);
      doc.addImage(img, 'PNG', (pw - LOGO_W) / 2, y, LOGO_W, LOGO_H);
      y += LOGO_H + 16;
    } catch {/* non blocca */}
  }

  /* Titolo turno ------------------------------------------------------ */
  doc.setFontSize(18).setFont(undefined, 'bold');
  doc.text(turno.titolo ?? `Turno ${turno.id}`, pw / 2, y + 12, {
    align: 'center',
  });
  y += 42;

  /* Card saldo complessivo ------------------------------------------- */
  const saldoCard = { w: 260, h: 70, x: (pw - 260) / 2, y };
  doc.setFillColor(...(totCassa >= 0 ? emerald200 : rose200));
  doc.roundedRect(saldoCard.x, saldoCard.y, saldoCard.w, saldoCard.h, 8, 8, 'FD');
  writeCentered(doc, 'SALDO DEL TURNO', { ...saldoCard, y: saldoCard.y + 22 }, 11, true);
  writeCentered(
    doc,
    totCassa.toFixed(2) + ' €',
    { ...saldoCard, y: saldoCard.y + 48 },
    16,
  );
  y += saldoCard.h + 28;

  /* Card Entrate / Uscite -------------------------------------------- */
  const mini = { w: 160, h: 60, gap: 24 };
  const startX = (pw - (mini.w * 2 + mini.gap)) / 2;
  [
    { lab: 'TOTALE VERSATO', val: totVersato, col: emerald200 },
    { lab: 'TOTALE SPESO',   val: totSpeso,    col: rose200    },
  ].forEach((o, i) => {
    const x = startX + i * (mini.w + mini.gap);
    doc.setFillColor(...o.col);
    doc.roundedRect(x, y, mini.w, mini.h, 8, 8, 'FD');
    writeCentered(doc, o.lab, { x, y: y + 18, w: mini.w }, 9, true);
    writeCentered(doc, `${o.val.toFixed(2)} €`, { x, y: y + 40, w: mini.w }, 12);
  });
  y += mini.h + 28;

  /* Riepilogo etichette ---------------------------------------------- */
  if (Object.keys(labelTotals).length) {
    autoTable(doc, {
      headStyles   : { fillColor: zinc500, halign: 'left' },
      styles       : { fontSize: 9 },
      columnStyles : { 1: { halign: 'right' } },     // col 2 → destra
      head         : [['Etichetta', 'Totale €']],
      body         : Object.entries(labelTotals)
        .sort((a, b) => a[0].localeCompare(b[0], 'it', { sensitivity: 'base' }))
        .map(([lab, tot]) => [lab || '-', tot.toFixed(2)]),
      startY       : y,
      margin       : { left: 60, right: 60 },
      theme        : 'grid',
    });
    y = doc.lastAutoTable.finalY + 28;
  }

  /* Tabella riepilogo per partecipante --------------------------------*/
  autoTable(doc, {
    headStyles   : { fillColor: zinc500 },
    styles       : { fontSize: 9 },
    columnStyles : {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    head : [['Nome', 'Versato', 'Speso', 'Saldo']],
    body : riepilogo.map((r) => {
      const nome = `${r.cognome} ${r.nome}`;
      const vers = Number(r.totale_versato ?? r.totaleVersato ?? 0).toFixed(2);
      const spes = Number(r.totale_spesa   ?? r.totaleSpesa   ?? 0).toFixed(2);
      const sald = Number(r.totale_in_cassa ?? r.totaleInCassa ?? 0).toFixed(2);
      return [nome, vers, spes, sald];
    }),
    startY : y,
    margin : { left: 40, right: 40 },
    theme  : 'grid',
  });

  /* Salvataggio / ritorno --------------------------------------------- */
  const filename = `Riepilogo – ${turno.titolo || 'Turno ' + turno.id}.pdf`;

  if (silent) {
    const buf  = doc.output('arraybuffer');
    const view = new Uint8Array(buf);
    let bin    = '';
    for (let i = 0; i < view.length; i++) bin += String.fromCharCode(view[i]);
    return btoa(bin);           // ← base-64 “pulito”
  }

  doc.save(filename);
  return null;
}
