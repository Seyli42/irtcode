import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Intervention, User } from '../types';
import { PROVIDERS, SERVICE_TYPES } from '../constants/pricing';

export function generateCSV(interventions: Intervention[], selectedUser?: User | null): string {
  const headers = [
    'Date',
    'Heure',
    'ND',
    'Opérateur',
    'Type de service',
    'Prix',
    'Statut',
    selectedUser ? '' : 'Utilisateur'
  ].filter(Boolean);

  const rows = interventions.map(intervention => {
    const row = [
      format(new Date(intervention.date), 'dd/MM/yyyy', { locale: fr }),
      intervention.time,
      intervention.ndNumber,
      PROVIDERS.find(p => p.id === intervention.provider)?.label || intervention.provider,
      SERVICE_TYPES.find(s => s.id === intervention.serviceType)?.label || intervention.serviceType,
      `${intervention.price}€`,
      intervention.status === 'success' ? 'Succès' : 'Échec',
      selectedUser ? '' : intervention.userName
    ].filter(Boolean);
    return row.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function generatePDF(interventions: Intervention[], selectedUser?: User | null) {
  const doc = new jsPDF();
  
  // Ajouter le logo
  const logoImg = document.querySelector('img[alt="IRT Logo"]') as HTMLImageElement;
  if (logoImg) {
    doc.addImage(logoImg.src, 'PNG', 14, 10, 30, 30);
  }
  
  // Ajouter le titre
  doc.setFontSize(20);
  doc.text('Rapport des Interventions', 50, 30);
  
  // Ajouter les informations de période
  doc.setFontSize(12);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 45);
  
  if (selectedUser) {
    doc.text(`Utilisateur : ${selectedUser.name}`, 14, 55);
  }
  
  // Préparer les données du tableau
  const headers = [
    ['Date', 'ND', 'Opérateur', 'Service', 'Prix', 'Statut', selectedUser ? '' : 'Utilisateur'].filter(Boolean)
  ];
  
  const data = interventions.map(intervention => [
    format(new Date(intervention.date), 'dd/MM/yyyy', { locale: fr }),
    intervention.ndNumber,
    PROVIDERS.find(p => p.id === intervention.provider)?.label || intervention.provider,
    SERVICE_TYPES.find(s => s.id === intervention.serviceType)?.label || intervention.serviceType,
    `${intervention.price}€`,
    intervention.status === 'success' ? 'Succès' : 'Échec',
    selectedUser ? '' : intervention.userName
  ].filter(Boolean));
  
  // Ajouter le tableau
  (doc as any).autoTable({
    head: headers,
    body: data,
    startY: selectedUser ? 60 : 50,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  
  // Ajouter le résumé
  const totalAmount = interventions.reduce((sum, item) => sum + item.price, 0);
  const successCount = interventions.filter(i => i.status === 'success').length;
  const totalCount = interventions.length;
  const successRate = totalCount > 0 ? (successCount / totalCount * 100).toFixed(1) : '0';
  
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  
  doc.text('Résumé :', 14, finalY + 10);
  doc.text(`Montant total : ${totalAmount}€`, 14, finalY + 20);
  doc.text(`Taux de succès : ${successRate}%`, 14, finalY + 30);
  doc.text(`Nombre d'interventions : ${totalCount}`, 14, finalY + 40);
  
  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}