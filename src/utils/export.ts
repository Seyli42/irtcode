import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Intervention, User } from '../types';
import { PROVIDERS, SERVICE_TYPES } from '../constants/pricing';

export function generateCSV(interventions: Intervention[], selectedUser?: User | null, allUsers?: User[]): string {
  const headers = [
    'Date',
    'Heure',
    'ND',
    'Opérateur',
    'Type de service',
    'Prix',
    'Statut',
    selectedUser ? '' : 'Utilisateur',
    selectedUser ? '' : 'Email',
    selectedUser ? '' : 'Rôle',
    selectedUser ? '' : 'SIREN',
    selectedUser ? '' : 'Adresse'
  ].filter(Boolean);

  const rows = interventions.map(intervention => {
    const user = selectedUser || allUsers?.find(u => u.id === intervention.userId);
    
    const row = [
      format(new Date(intervention.date), 'dd/MM/yyyy', { locale: fr }),
      intervention.time,
      intervention.ndNumber,
      PROVIDERS.find(p => p.id === intervention.provider)?.label || intervention.provider,
      SERVICE_TYPES.find(s => s.id === intervention.serviceType)?.label || intervention.serviceType,
      `${intervention.price}€`,
      intervention.status === 'success' ? 'Succès' : 'Échec',
      selectedUser ? '' : user?.name || 'Utilisateur inconnu',
      selectedUser ? '' : user?.email || '',
      selectedUser ? '' : user?.role || '',
      selectedUser ? '' : (user?.role === 'auto-entrepreneur' ? user?.siren || '' : ''),
      selectedUser ? '' : (user?.role === 'auto-entrepreneur' ? user?.address || '' : '')
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

export function generatePDF(interventions: Intervention[], selectedUser?: User | null, allUsers?: User[]) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Rapport des Interventions', 14, 20);
  
  // Add period info
  doc.setFontSize(12);
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 30);
  
  if (selectedUser) {
    doc.text(`Utilisateur : ${selectedUser.name}`, 14, 40);
    if (selectedUser.role === 'auto-entrepreneur') {
      let yPos = 45;
      if (selectedUser.siren) {
        doc.text(`SIREN : ${selectedUser.siren}`, 14, yPos);
        yPos += 5;
      }
      if (selectedUser.address) {
        doc.text(`Adresse : ${selectedUser.address}`, 14, yPos);
        yPos += 5;
      }
    }
  }
  
  // Prepare table data
  const headers = selectedUser 
    ? [['Date', 'ND', 'Opérateur', 'Service', 'Prix', 'Statut']]
    : [['Date', 'ND', 'Opérateur', 'Service', 'Prix', 'Statut', 'Utilisateur', 'SIREN', 'Adresse']];
  
  const data = interventions.map(intervention => {
    const user = selectedUser || allUsers?.find(u => u.id === intervention.userId);
    
    const baseRow = [
      format(new Date(intervention.date), 'dd/MM/yyyy', { locale: fr }),
      intervention.ndNumber,
      PROVIDERS.find(p => p.id === intervention.provider)?.label || intervention.provider,
      SERVICE_TYPES.find(s => s.id === intervention.serviceType)?.label || intervention.serviceType,
      `${intervention.price}€`,
      intervention.status === 'success' ? 'Succès' : 'Échec'
    ];

    if (selectedUser) {
      return baseRow;
    } else {
      return [
        ...baseRow,
        user?.name || 'Utilisateur inconnu',
        user?.role === 'auto-entrepreneur' ? user?.siren || '' : '',
        user?.role === 'auto-entrepreneur' ? user?.address || '' : ''
      ];
    }
  });
  
  // Calculate start position based on user info
  let startY = selectedUser ? 45 : 35;
  if (selectedUser?.role === 'auto-entrepreneur') {
    if (selectedUser.siren) startY += 5;
    if (selectedUser.address) startY += 5;
  }
  
  // Add table
  (doc as any).autoTable({
    head: headers,
    body: data,
    startY: startY,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] },
    columnStyles: selectedUser ? {} : {
      7: { cellWidth: 20 }, // SIREN column
      8: { cellWidth: 30 }  // Adresse column
    }
  });
  
  // Add summary
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