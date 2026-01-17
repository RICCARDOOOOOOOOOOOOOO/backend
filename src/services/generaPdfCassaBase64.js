/* ----------------------------------------------------------------------- */
/*  generaPdfCassa.js – PDF riepilogo cassa                                */
/* ----------------------------------------------------------------------- */
/*  dipendenze:
      npm i jspdf jspdf-autotable
*/

import jsPDF     from 'jspdf';
import autoTable from 'jspdf-autotable';

/* tavolozza Tailwind (200) --------------------------------------------- */
const emerald200 = [167, 243, 208];   // #a7f3d0
const rose200    = [254, 202, 202];   // #fecaca
const zinc500    = [113, 113, 122];   // #71717a

/* opzionale: logo/intestazione ---------------------------------------- */
/* 1) Salva un'immagine (png / jpg) in public/ (es. /logo.png)           */
/* 2) Imposta qui il percorso relative alla build Vite                   */
const LOGO_PATH  = 'src/assets/Campeggio_San_Fermo.png';      // '' se non vuoi alcuna immagine
const LOGO_W     = 75;              // larghezza immagine sul PDF (pt)
const LOGO_H     = 75;               // altezza (proporzionata)

/* helper testo centrato in card --------------------------------------- */
function writeCentered(doc, text, { x, y, w }, size = 12, bold = false) {
  doc.setFontSize(size).setFont(undefined, bold ? 'bold' : 'normal');
  doc.text(text, x + w / 2, y, { align: 'center', baseline: 'middle' });
}

/* ----------------------------------------------------------------------- */
export default async function generaPdfCassaBase64(anag, cassa, turno) {
  const doc  = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pw   = doc.internal.pageSize.getWidth();
  let   y    = 40;

  /* ------------ Logo (se presente) ---------------------------------- */
  if (LOGO_PATH) {
    try {
      const img  = await loadImage(LOGO_PATH);
      doc.addImage(img, 'PNG', (pw - LOGO_W) / 2, y, LOGO_W, LOGO_H);
      y += LOGO_H + 16;
    } catch {
      /* se l'immagine non si carica proseguiamo comunque */
    }
  }

  /* ------------ Nome + sottotitolo ---------------------------------- */
  doc.setFontSize(18).setFont(undefined, 'bold');
  doc.text(`${anag.cognome} ${anag.nome}`, pw / 2, y+10, { align: 'center' });

  y += 30;
  doc.setFontSize(12).setFont(undefined, 'normal').setTextColor(...zinc500);
  const subtitle = turno.titolo
    ? turno.titolo
    : `${turno.id} Turno ${new Date().getFullYear()}`;
  doc.text(subtitle, pw / 2, y, { align: 'center' });

  /* reset colore testo normale */
  doc.setTextColor(0, 0, 0);
  y += 15;

  /* ------------ CARD SALDO ----------------------------------------- */
  const saldoCard = { w: 220, h: 60, x: (pw - 220) / 2, y };
  const saldoOK   = cassa.totaleInCassa >= 0;
  doc.setFillColor(...(saldoOK ? emerald200 : rose200));
  doc.roundedRect(saldoCard.x, saldoCard.y, saldoCard.w, saldoCard.h, 8, 8, 'FD');

  writeCentered(doc, 'SALDO', {
    x: saldoCard.x, y: saldoCard.y + 18, w: saldoCard.w,
  }, 11, true);

  writeCentered(doc, cassa.totaleInCassa.toFixed(2) + ' €', {
    x: saldoCard.x, y: saldoCard.y + 40, w: saldoCard.w,
  }, 16);

  y += saldoCard.h + 28;

  /* ------------ Cards Versato / Speso ------------------------------ */
  const mini = { w: 150, h: 60, gap: 24 };
  const startX = (pw - (mini.w * 2 + mini.gap)) / 2;

  [
    { label: 'TOTALE VERSATO', value: cassa.totaleVersato, col: emerald200 },
    { label: 'TOTALE SPESO',   value: cassa.totaleSpesa,   col: rose200    },
  ].forEach((obj, idx) => {
    const x = startX + idx * (mini.w + mini.gap);

    doc.setFillColor(...obj.col);
    doc.roundedRect(x, y, mini.w, mini.h, 8, 8, 'FD');

    writeCentered(doc, obj.label, { x, y: y + 18, w: mini.w }, 9, true);
    writeCentered(
      doc,
      obj.value.toFixed(2) + ' €',
      { x, y: y + 40, w: mini.w },
      12,
    );
  });

  y += mini.h + 28;

  /* ------------ Tabella movimenti ---------------------------------- */
  const rows = cassa.inserimenti.map((v) => [
    new Date(v.insert_date).toLocaleDateString(),
    (v.value >= 0 ? '+' : '') + v.value.toFixed(2) + ' €',
    v.type || '-',
  ]);

  autoTable(doc, {
    headStyles : { fillColor: zinc500, halign: 'left' },
    styles     : { halign: 'left', fontSize: 9 },
    head       : [['Data', 'Valore', 'Tipo']],
    body       : rows,
    startY     : y,
    margin     : { left: 40, right: 40 },
  });


// you can generate in another format also  like blob
     var out = doc.output('blob');
    return out;
    
}

/* helper asincrono per caricare un'immagine e restituire i dati         */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src     = src;
  });
}
