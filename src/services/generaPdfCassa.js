/* ----------------------------------------------------------------------- */
/*  generaPdfCassa.js – PDF riepilogo cassa                                */
/* ----------------------------------------------------------------------- */
/*  dipendenze:
      npm i jspdf jspdf-autotable
*/

import jsPDF     from 'jspdf';
import autoTable from 'jspdf-autotable';

/* tavolozza Tailwind (200) --------------------------------------------- */
const emerald200 = [167, 243, 208];
const rose200    = [254, 202, 202];
const zinc500    = [113, 113, 122];

/* opzionale logo/intestazione ----------------------------------------- */
const LOGO_PATH  = 'src/assets/Campeggio_San_Fermo.png';   // '' = nessuna immagine
const LOGO_W     = 75;
const LOGO_H     = 75;

/* helpers -------------------------------------------------------------- */
function writeCentered(doc, text, { x, y, w }, size = 12, bold = false) {
  doc.setFontSize(size).setFont(undefined, bold ? 'bold' : 'normal');
  doc.text(text, x + w / 2, y, { align: 'center', baseline: 'middle' });
}

function loadImage(src) {
  return new Promise((res, rej) => {
    if (!src) return rej();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => res(img);
    img.onerror = rej;
    img.src     = src;
  });
}

/* --------------------------------------------------------------------- */
/*  silent = true  →  ritorna stringa Base-64 “pulita”                    */
/*  silent = false →  salva il PDF in download                           */
/* --------------------------------------------------------------------- */
export default async function generaPdfCassa(anag, cassa, turno, silent = false) {
  const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();
  let   y   = 40;

  /* ---------------- Header (logo facoltativo) --------------------- */
  if (LOGO_PATH) {
    try {
      const img = await loadImage(LOGO_PATH);
      doc.addImage(img, 'PNG', (pw - LOGO_W) / 2, y, LOGO_W, LOGO_H);
      y += LOGO_H + 16;
    } catch { /* immagine non critica */ }
  }

  /* ---------------- Titoli ---------------------------------------- */
  doc.setFontSize(18).setFont(undefined, 'bold');
  doc.text(`${anag.cognome} ${anag.nome}`, pw / 2, y + 10, { align: 'center' });

  y += 30;
  doc.setFontSize(12).setFont(undefined, 'normal').setTextColor(...zinc500);
  doc.text(turno.titolo ?? `Turno ${turno.id}`, pw / 2, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 15;

  /* ---------------- Card saldo ------------------------------------ */
  const saldoCard = { w: 220, h: 60, x: (pw - 220) / 2, y };
  const good      = cassa.totaleInCassa >= 0;
  doc.setFillColor(...(good ? emerald200 : rose200));
  doc.roundedRect(saldoCard.x, saldoCard.y, saldoCard.w, saldoCard.h, 8, 8, 'FD');
    writeCentered(doc, 'SALDO', {
    x: saldoCard.x, y: saldoCard.y + 18, w: saldoCard.w,
  }, 11, true);

  writeCentered(doc, cassa.totaleInCassa.toFixed(2) + ' €', {
    x: saldoCard.x, y: saldoCard.y + 40, w: saldoCard.w,
  }, 16);
  y += saldoCard.h + 28;

  /* ---------------- Cards ENTRATE/USCITE -------------------------- */
  const mini = { w: 150, h: 60, gap: 24 };
  const startX = (pw - (mini.w * 2 + mini.gap)) / 2;
  [
    { lab: 'TOTALE VERSATO', val: cassa.totaleVersato, col: emerald200 },
    { lab: 'TOTALE SPESO',   val: cassa.totaleSpesa,   col: rose200    },
  ].forEach((o, i) => {
    const x = startX + i * (mini.w + mini.gap);
    doc.setFillColor(...o.col);
    doc.roundedRect(x, y, mini.w, mini.h, 8, 8, 'FD');
    writeCentered(doc, o.lab, { x, y: y + 18, w: mini.w }, 9, true);
    writeCentered(doc, `${o.val.toFixed(2)} €`, { x, y: y + 40, w: mini.w }, 12);
  });
  y += mini.h + 28;

  /* ---------------- Tabella movimenti ----------------------------- */
  autoTable(doc, {
    headStyles : { fillColor: zinc500, halign: 'left' },
    styles     : { halign: 'left', fontSize: 9 },
    head       : [['Data', 'Valore', 'Tipo']],
    body       : cassa.inserimenti.map((v) => [
      new Date(v.insert_date).toLocaleDateString(),
      `${v.value >= 0 ? '+' : ''}${v.value.toFixed(2)} €`,
      v.type || '-',
    ]),
    startY     : y,
    margin     : { left: 40, right: 40 },
  });

  /* ---------------- Output ---------------------------------------- */
  const filename = `${anag.cognome} ${anag.nome} (${turno.titolo || turno.id}).pdf`;

  if (silent) {
    /* 1) ottieni ArrayBuffer grezzo          */
    const buf = doc.output('arraybuffer');
    /* 2) ArrayBuffer → stringa Base-64 “pulita” */
    const uint8  = new Uint8Array(buf);
    let binary   = '';
    for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
    return btoa(binary);                      // ← solo base64, niente header
  }

  /* download normale */
  doc.save(filename);
  return null;
}
