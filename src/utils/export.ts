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
    ...(selectedUser ? [] : ['Utilisateur', 'Email', 'Rôle', 'SIREN', 'Adresse'])
  ];

  const rows = interventions.map(intervention => {
    const user = selectedUser || allUsers?.find(u => u.id === intervention.userId);
    
    const baseRow = [
      format(new Date(intervention.date), 'dd/MM/yyyy', { locale: fr }),
      intervention.time,
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
        user?.email || '',
        user?.role || '',
        user?.role === 'auto-entrepreneur' ? user?.siren || '' : '',
        user?.role === 'auto-entrepreneur' ? user?.address || '' : ''
      ];
    }
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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
  
  let currentY = 20;
  
  // Ajouter le titre
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('IRT - Rapport des Interventions', 14, currentY);
  
  // Informations de génération
  currentY += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, currentY);
  
  // Informations utilisateur sélectionné
  if (selectedUser) {
    currentY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text(`Utilisateur : ${selectedUser.name}`, 14, currentY);
    doc.setFont('helvetica', 'normal');
    
    if (selectedUser.role === 'auto-entrepreneur') {
      if (selectedUser.siren) {
        currentY += 7;
        doc.text(`SIREN : ${selectedUser.siren}`, 14, currentY);
      }
      if (selectedUser.address) {
        currentY += 7;
        doc.text(`Adresse : ${selectedUser.address}`, 14, currentY);
      }
    }
  }
  
  // Informations de l'entreprise IRT
  currentY += 15;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('IRT - 5 rue Fénelon, 33000 BORDEAUX', 14, currentY);
  
  // Ligne de séparation
  currentY += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, currentY, 196, currentY);
  
  // Préparer les données du tableau
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
  
  // Position de départ du tableau
  const tableStartY = currentY + 10;
  
  // Ajouter le tableau
  (doc as any).autoTable({
    head: headers,
    body: data,
    startY: tableStartY,
    styles: { 
      fontSize: 8,
      cellPadding: 3
    },
    headStyles: { 
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    },
    columnStyles: selectedUser ? {} : {
      6: { cellWidth: 25 }, // Utilisateur column
      7: { cellWidth: 20 }, // SIREN column
      8: { cellWidth: 30 }  // Adresse column
    },
    margin: { left: 14, right: 14 }
  });
  
  // Ajouter le résumé
  const totalAmount = interventions.reduce((sum, item) => sum + item.price, 0);
  const successCount = interventions.filter(i => i.status === 'success').length;
  const totalCount = interventions.length;
  const successRate = totalCount > 0 ? (successCount / totalCount * 100).toFixed(1) : '0';
  
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  
  // Cadre pour le résumé
  doc.setDrawColor(79, 70, 229);
  doc.setFillColor(248, 249, 250);
  doc.rect(14, finalY + 10, 182, 35, 'FD');
  
  // Titre du résumé
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('Résumé des interventions', 20, finalY + 20);
  
  // Données du résumé
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Nombre d'interventions : ${totalCount}`, 20, finalY + 28);
  doc.text(`Montant total : ${totalAmount}€`, 20, finalY + 35);
  doc.text(`Taux de succès : ${successRate}%`, 20, finalY + 42);
  
  // Pied de page
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Document généré automatiquement par IRT', 14, pageHeight - 10);
  doc.text(`Page 1`, 196 - 20, pageHeight - 10);
  
  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}