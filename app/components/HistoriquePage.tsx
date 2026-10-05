import React, { useState } from 'react';
import { type Commande, formatDate, formatFCFA, statutColor, statutLabel } from '../lib/commandes';
import { formatPrixTexte } from '../lib/menu';
import '../HistoriquePage.css';

type Props = {
  commandes: Commande[];
};

// Lundi 00:00 de la semaine en cours
function debutDeSemaine(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function estAujourdhui(cmd: Commande): boolean {
  return !!cmd.dateCommande && cmd.dateCommande.toDate().toDateString() === new Date().toDateString();
}

// jsPDF ne gère pas l'espace fine insécable de toLocaleString('fr-FR')
const formatPrixPDF = (valeur: number): string =>
  valeur.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA';

const HistoriquePage: React.FC<Props> = ({ commandes: toutesCommandes }) => {
  const [expandedCommandes, setExpandedCommandes] = useState<Set<string>>(new Set());
  const [periodeStats, setPeriodeStats] = useState<'tout' | 'semaine'>('tout');
  const [generating, setGenerating] = useState(false);

  // L'historique ne contient que les commandes livrées
  const commandes = toutesCommandes.filter(cmd => cmd.statut === 'livree');

  const commandesDePeriode = (periode: 'tout' | 'semaine') => {
    if (periode === 'tout') return commandes;
    const debut = debutDeSemaine();
    return commandes.filter(cmd => cmd.dateCommande && cmd.dateCommande.toDate() >= debut);
  };

  const commandesStats = commandesDePeriode(periodeStats);
  const chiffreAffaires = commandesStats.reduce((acc, cmd) => acc + (cmd.total || 0), 0);
  const commandesAujourdhui = commandes.filter(estAujourdhui).length;

  const toggleCommande = (commandeId: string) => {
    setExpandedCommandes(prev => {
      const next = new Set(prev);
      if (next.has(commandeId)) next.delete(commandeId);
      else next.add(commandeId);
      return next;
    });
  };

  const genererPDF = async (periode: 'tout' | 'semaine') => {
    setGenerating(true);
    try {
      // jsPDF n'est chargé que lorsqu'on exporte
      const { default: jsPDF } = await import('jspdf');
      const commandesPDF = commandesDePeriode(periode);
      const chiffreAffairesPDF = commandesPDF.reduce((acc, cmd) => acc + (cmd.total || 0), 0);

      const doc = new jsPDF();

      doc.setFontSize(18);
      const titre = periode === 'semaine' ? 'Historique - Cette semaine' : 'Historique des commandes';
      doc.text(titre, 105, 20, { align: 'center' });
      doc.setFontSize(9);
      doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 105, 27, { align: 'center' });

      // Statistiques en 3 colonnes
      const stats: [string, string, number][] = [
        ['Total commandes', commandesPDF.length.toString(), 14],
        ["Chiffre d'affaires", formatPrixPDF(chiffreAffairesPDF), 12],
        ["Aujourd'hui", commandesPDF.filter(estAujourdhui).length.toString(), 14],
      ];
      stats.forEach(([libelle, valeur, taille], i) => {
        const x = 20 + i * 60;
        doc.rect(x, 35, 50, 25);
        doc.setFontSize(10);
        doc.text(libelle, x + 25, 45, { align: 'center' });
        doc.setFontSize(taille);
        doc.text(valeur, x + 25, 55, { align: 'center' });
      });

      let y = 80;
      commandesPDF.forEach(commande => {
        if (y > 250) {
          doc.addPage();
          y = 30;
        }

        doc.rect(20, y - 5, 170, 30);
        doc.setFontSize(12);
        doc.text(`${commande.clientPrenom} ${commande.clientNom}`, 25, y + 5);
        doc.setFontSize(9);
        doc.text(`${formatDate(commande.dateCommande)} - ${commande.localisation}`, 25, y + 12);
        doc.setFontSize(11);
        doc.text(formatPrixPDF(commande.total || 0), 185, y + 5, { align: 'right' });

        if (commande.items.length > 0) {
          doc.setFontSize(8);
          const itemsText = commande.items.slice(0, 3).map(item => `${item.nom} x${item.quantité}`).join(', ');
          const suite = commande.items.length > 3 ? ` ... (+${commande.items.length - 3})` : '';
          const lignes = doc.splitTextToSize(itemsText + suite, 160) as string[];
          doc.text(lignes.slice(0, 1), 25, y + 20);
        }

        y += 40;
      });

      doc.save(periode === 'semaine' ? 'historique-semaine.pdf' : 'historique-commandes.pdf');
    } catch (err) {
      console.error('Erreur lors de la génération du PDF:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="historique-container">
      <div className="historique-toolbar">
        <h2 className="historique-title">Historique des commandes</h2>
        <div className="historique-actions">
          <button type="button" className="historique-pdf-btn" onClick={() => genererPDF('tout')} disabled={generating}>
            📄 PDF complet
          </button>
          <button type="button" className="historique-pdf-btn secondary" onClick={() => genererPDF('semaine')} disabled={generating}>
            📅 PDF semaine
          </button>
        </div>
      </div>

      {/* Sélecteur de période pour les statistiques */}
      <div className="historique-filter">
        <label htmlFor="periode-stats">Période des statistiques :</label>
        <select
          id="periode-stats"
          value={periodeStats}
          onChange={e => setPeriodeStats(e.target.value as 'tout' | 'semaine')}
        >
          <option value="tout">Tout l'historique</option>
          <option value="semaine">Cette semaine</option>
        </select>
      </div>

      {/* Statistiques */}
      <div className="historique-stats">
        <div className="historique-stat-card">
          <h3 className="historique-stat-title">Commandes livrées</h3>
          <p className="historique-stat-value">{commandesStats.length}</p>
        </div>
        <div className="historique-stat-card">
          <h3 className="historique-stat-title">Chiffre d'affaires</h3>
          <p className="historique-stat-value">{formatFCFA(chiffreAffaires)}</p>
        </div>
        <div className="historique-stat-card">
          <h3 className="historique-stat-title">Aujourd'hui</h3>
          <p className="historique-stat-value">{commandesAujourdhui}</p>
        </div>
      </div>

      {/* Liste des commandes */}
      {commandesStats.length === 0 ? (
        <p className="historique-no-data">Aucune commande livrée sur cette période.</p>
      ) : (
        <div className="historique-commandes">
          {commandesStats.map(commande => {
            const isExpanded = expandedCommandes.has(commande.id);
            return (
              <div key={commande.id} className="historique-commande-card">
                <button
                  type="button"
                  className="historique-commande-header"
                  onClick={() => toggleCommande(commande.id)}
                  aria-expanded={isExpanded}
                >
                  <div className="historique-client-info">
                    <h3>
                      {commande.clientPrenom} {commande.clientNom}
                      <span className={`historique-expand-icon ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">▼</span>
                    </h3>
                    <p>{formatDate(commande.dateCommande)} • {commande.localisation}</p>
                  </div>
                  <div className="historique-commande-right">
                    <span className="historique-commande-status" style={{ backgroundColor: statutColor(commande.statut) }}>
                      {statutLabel(commande.statut)}
                    </span>
                    <p className="historique-commande-total">{formatFCFA(commande.total || 0)}</p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="historique-commande-details">
                    <h4 className="historique-items-title">Articles commandés :</h4>
                    <ul className="historique-items-list">
                      {commande.items.map((item, index) => (
                        <li key={index}>
                          {item.nom} × {item.quantité} ({formatPrixTexte(item.prix) || 'prix sur demande'})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoriquePage;
