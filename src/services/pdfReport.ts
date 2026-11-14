import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DayHistoryRow } from '../types';
import { formatMinutesToHours } from '../utils/dateUtils';

interface GenerateReportOptions {
  workerName: string;
  workerId: string;
  workerEmail: string;
  monthName: string;
  year: number;
  historyRows: DayHistoryRow[];
  totalWorkedMinutes: number;
}

export function generateMonthlyTimesheetPDF(options: GenerateReportOptions): void {
  const {
    workerName,
    workerId,
    workerEmail,
    monthName,
    year,
    historyRows,
    totalWorkedMinutes,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Header Banner
  doc.setFillColor(15, 23, 42); // #0F172A slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent stripe
  doc.setFillColor(245, 158, 11); // #F59E0B amber-500
  doc.rect(0, 42, pageWidth, 2.5, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BAUMEISTER APP', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Offizieller Monatsbericht & Arbeitszeitnachweis', 14, 25);
  doc.text(`Abrechnungszeitraum: ${monthName} ${year}`, 14, 32);

  // Right side generated info
  const generatedDateStr = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Erstellt am: ${generatedDateStr} Uhr`, pageWidth - 14, 20, { align: 'right' });
  doc.text('Bauunternehmen & Handwerksbetrieb', pageWidth - 14, 26, { align: 'right' });

  // Worker Info Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 50, pageWidth - 28, 26, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Mitarbeiterinformationen', 20, 58);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(`Name:`, 20, 65);
  doc.setFont('helvetica', 'bold');
  doc.text(workerName || 'Nicht angegeben', 42, 65);

  doc.setFont('helvetica', 'normal');
  doc.text(`Mitarbeiter-ID:`, 20, 71);
  doc.setFont('helvetica', 'bold');
  doc.text(workerId || '-', 48, 71);

  doc.setFont('helvetica', 'normal');
  doc.text(`E-Mail:`, 110, 65);
  doc.setFont('helvetica', 'bold');
  doc.text(workerEmail || '-', 125, 65);

  doc.setFont('helvetica', 'normal');
  doc.text(`Monat / Jahr:`, 110, 71);
  doc.setFont('helvetica', 'bold');
  doc.text(`${monthName} ${year}`, 135, 71);

  // Table Data Preparation (sorted chronologically 1st to today)
  const sortedRows = [...historyRows].sort((a, b) => a.date.localeCompare(b.date));

  const tableBody = sortedRows.map((row) => {
    const [y, m, d] = row.date.split('-');
    const dateFormatted = `${d}.${m}.${y}`;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(dateObj);

    return [
      dateFormatted,
      weekday,
      row.startTime !== '--:--' ? `${row.startTime} Uhr` : '-',
      row.endTime !== '--:--' ? `${row.endTime} Uhr` : '-',
      row.pauseFormatted !== '0 Min.' ? row.pauseFormatted : '-',
      row.totalWorkedFormatted,
      row.rawWorkedMinutes > 0 ? 'Erfasst' : 'Keine Arbeit',
    ];
  });

  autoTable(doc, {
    startY: 82,
    head: [
      ['Datum', 'Wochentag', 'Beginn', 'Feierabend', 'Pause', 'Gesamtstunden', 'Status']
    ],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // #1E293B
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 24 },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
      6: { halign: 'center', cellWidth: 28 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Summary card & Signatures at the bottom
  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 220;

  // Check if we need a new page for signatures
  let currentY = finalY;
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  // Summary box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 3, 3, 'FD');

  const workedDaysCount = historyRows.filter((r) => r.rawWorkedMinutes > 0).length;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Monatliche Gesamtarbeitszeit: ${formatMinutesToHours(totalWorkedMinutes)}`, 20, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Geleistete Arbeitstage: ${workedDaysCount} Tage  |  Durchschnitt pro Arbeitstag: ${workedDaysCount > 0 ? formatMinutesToHours(Math.round(totalWorkedMinutes / workedDaysCount)) : '00:00 Std.'}`, 20, currentY + 16);

  // Signature lines
  const sigY = currentY + 36;
  if (sigY + 20 < 285) {
    doc.setDrawColor(148, 163, 184);
    doc.line(20, sigY, 85, sigY);
    doc.line(pageWidth - 85, sigY, pageWidth - 20, sigY);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Unterschrift Mitarbeiter', 20, sigY + 5);
    doc.text('Unterschrift Bauleitung / Prüfer', pageWidth - 85, sigY + 5);
  }

  // File download name
  const safeName = (workerName || 'Mitarbeiter').replace(/\s+/g, '_');
  const fileName = `Baumeister_Stundennachweis_${safeName}_${year}_${monthName}.pdf`;

  doc.save(fileName);
}
