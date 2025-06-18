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

// Fonction pour convertir une image en base64
const getImageAsBase64 = async (imagePath: string): Promise<string | null> => {
  try {
    const response = await fetch(imagePath);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Impossible de charger le logo:', error);
    return null;
  }
};

export async function generatePDF(interventions: Intervention[], selectedUser?: User | null, allUsers?: User[]) {
  const doc = new jsPDF();
  
  // Essayer de charger et ajouter le logo
  let logoHeight = 0;
  try {
    const logoBase64 = await getImageAsBase64('/images/logo.svg');
    if (logoBase64) {
      // Ajouter le logo en haut à gauche
      doc.addImage(logoBase64, 'SVG', 14, 10, 30, 15);
      logoHeight = 20;
    }
  } catch (error) {
    console.warn('Impossible d\'ajouter le logo au PDF:', error);
  }
  
  // Ajuster la position du titre en fonction de la présence du logo
  const titleY = logoHeight > 0 ? 15 : 20;
  
  // Ajouter le titre à côté du logo
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('IRT - Rapport des Interventions', logoHeight > 0 ? 50 : 14, titleY);
  
  // Informations de génération
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const infoY = titleY + 10;
  doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, infoY);
  
  let currentY = infoY + 5;
  
  // Informations utilisateur sélectionné
  if (selectedUser) {
    currentY += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Utilisateur : ${selectedUser.name}`, 14, currentY);
    doc.setFont('helvetica', 'normal');
    
    if (selectedUser.role === 'auto-entrepreneur') {
      if (selectedUser.siren) {
        currentY += 5;
        doc.text(`SIREN : ${selectedUser.siren}`, 14, currentY);
      }
      if (selectedUser.address) {
        currentY += 5;
        doc.text(`Adresse : ${selectedUser.address}`, 14, currentY);
      }
    }
  }
  
  // Informations de l'entreprise IRT
  currentY += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('IRT - 5 rue Fénelon, 33000 BORDEAUX', 14, currentY);
  
  // Ligne de séparation
  currentY += 5;
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