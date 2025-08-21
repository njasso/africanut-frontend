import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Edit, FileText, BookOpen, Plus, Download, Upload, FileCheck } from 'lucide-react';
import { api } from '../services/api.js'; // Votre service API
import { companies } from '../data/companies.js'; // Vos données d'entreprise
import toast from 'react-hot-toast'; // or another toast library
import * as XLSX from 'xlsx'; // Importation de la bibliothèque xlsx


// Plan comptable OHADA simplifié (extrait)
const OHADA_ACCOUNTS = [
  { number: '101', name: 'Capital', class: '1', type: 'CREDIT' },
  { number: '106', name: 'Report à nouveau', class: '1', type: 'CREDIT' },
  { number: '121', name: 'Résultat net', class: '1', type: 'CREDIT' },
  { number: '201', name: 'Immobilisations incorporelles', class: '2', type: 'DEBIT' },
  { number: '211', name: 'Terrains', class: '2', type: 'DEBIT' },
  { number: '241', name: 'Matériel industriel', class: '2', type: 'DEBIT' },
  { number: '311', name: 'Matières premières', class: '3', type: 'DEBIT' },
  { number: '312', name: 'Produits intermédiaires', class: '3', type: 'DEBIT' },
  { number: '313', name: 'Produits finis', class: '3', type: 'DEBIT' },
  { number: '401', name: 'Fournisseurs', class: '4', type: 'CREDIT' },
  { number: '411', name: 'Clients', class: '4', type: 'DEBIT' },
  { number: '421', name: 'Personnel', class: '4', type: 'CREDIT' },
  { number: '445', name: 'État - Taxes et impôts', class: '4', type: 'CREDIT' },
  { number: '511', name: 'Caisse', class: '5', type: 'DEBIT' },
  { number: '512', name: 'Banque', class: '5', type: 'DEBIT' },
  { number: '601', name: 'Achats de matières premières', class: '6', type: 'DEBIT' },
  { number: '602', name: 'Achats de fournitures', class: '6', type: 'DEBIT' },
  { number: '603', name: 'Achats de fournitures externes', class: '6', type: 'DEBIT' },
  { number: '604', name: 'Achats de fournitures d\'entretien', class: '6', type: 'DEBIT' },
  { number: '605', name: 'Achats de marchandises', class: '6', type: 'DEBIT' },
  { number: '607', name: 'Services extérieurs', class: '6', type: 'DEBIT' },
  { number: '613', name: 'Locations', class: '6', type: 'DEBIT' },
  { number: '614', name: 'Charges de personnel', class: '6', type: 'DEBIT' },
  { number: '615', name: 'Impôts et taxes', class: '6', type: 'DEBIT' },
  { number: '621', name: 'Rémunération du personnel', class: '6', type: 'DEBIT' },
  { number: '701', name: 'Ventes de produits finis', class: '7', type: 'CREDIT' },
  { number: '702', name: 'Ventes de produits intermédiaires', class: '7', type: 'CREDIT' },
  { number: '703', name: 'Ventes de produits résiduels', class: '7', type: 'CREDIT' },
  { number: '704', name: 'Travaux', class: '7', type: 'CREDIT' },
  { number: '705', name: 'Études', class: '7', type: 'CREDIT' },
  { number: '706', name: 'Prestations de services', class: '7', type: 'CREDIT' },
  { number: '708', name: 'Produits annexes', class: '7', type: 'CREDIT' },
];

// Types de journaux comptables OHADA
const ACCOUNTING_JOURNALS = [
  { code: 'ACH', name: 'Journal des achats' },
  { code: 'VTE', name: 'Journal des ventes' },
  { code: 'BNQ', name: 'Journal de banque' },
  { code: 'CSS', name: 'Journal de caisse' },
  { code: 'OD', name: 'Journal des opérations diverses' },
];

// Types de justificatifs
const DOCUMENT_TYPES = [
  { code: 'FACT', name: 'Facture' },
  { code: 'BL', name: 'Bon de livraison' },
  { code: 'BC', name: 'Bon de commande' },
  { code: 'CHEQ', name: 'Chèque' },
  { code: 'TRANS', name: 'Ordre de virement' },
  { code: 'AVOIR', name: 'Avoir' },
  { code: 'CONTRAT', name: 'Contrat' },
  { code: 'DECL', name: 'Déclaration' },
];

// Composant KPI pour afficher les indicateurs de performance clés
function KPI({ title, value, isCurrency = true }) {
  const isPositive = value >= 0;
  const colorClass = title === 'Solde' ? (isPositive ? 'bg-green-600' : 'bg-red-600') : 'bg-gray-800';
  const displayValue = isCurrency 
    ? Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })
    : value;

  return (
    <div className={`rounded-2xl p-5 text-center text-white ${colorClass}`}>
      <div className="text-sm opacity-90">{title}</div>
      <div className="text-2xl font-bold">{displayValue}</div>
    </div>
  );
}

// Composant principal de l'application de comptabilité
export default function Accounting() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ 
    journalCode: 'OD',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    debitAccount: '',
    creditAccount: '',
    label: '', 
    amount: '', 
    companySlug: '',
    documentType: 'FACT',
    documentNumber: '',
    documentDate: new Date().toISOString().split('T')[0],
    type: 'EXPENSE', 
  });
  const [companyFilter, setCompanyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [fiscalYearEnd, setFiscalYearEnd] = useState(`${new Date().getFullYear()}-12-31`);
  const [showLedgerModal, setShowLedgerModal] = useState(false); // Nouvel état pour le grand livre
  const [exportFormat, setExportFormat] = useState('CSV'); // Format d'exportation
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Charger les données de l'API au montage du composant
  const loadItems = async () => {
    try {
      const fetchedItems = await api('/api/accounting');
      setItems(fetchedItems);
    } catch (error) {
      handleError('Erreur lors du chargement des données. Veuillez réessayer.');
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Définir la fonction initialFormState pour la réinitialisation du formulaire
  const initialFormState = {
    journalCode: 'OD',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    debitAccount: '',
    creditAccount: '',
    label: '',
    amount: '',
    companySlug: '',
    documentType: 'FACT',
    documentNumber: '',
    documentDate: new Date().toISOString().split('T')[0],
    type: 'EXPENSE',
  };

  // Créer une fonction pour fermer la modale et réinitialiser le formulaire
  const handleCloseModal = () => {
    setForm(initialFormState);
    setEditMode(false);
    setCurrentId(null);
  };

  // Gérer l'ajout ou la mise à jour d'une transaction
  const addOrUpdate = async (e) => {
    e.preventDefault();
    try {
        setLoading(true);
        setErrors({}); // Réinitialisation des erreurs à chaque soumission

        // Validation client-side pour l'entreprise
        if (!form.companySlug) {
            setErrors({ companySlug: 'Veuillez sélectionner une entité valide.' });
            toast.error('Veuillez sélectionner une entité valide.');
            setLoading(false);
            return;
        }

        let finalForm = { ...form };
        
        // Si un fichier de document est sélectionné, on le télécharge d'abord
        if (form.documentFile) {
            const formData = new FormData();
            formData.append('file', form.documentFile);
            formData.append('companySlug', form.companySlug);
            formData.append('documentType', form.documentType);
            formData.append('documentNumber', form.documentNumber);
            formData.append('documentDate', finalForm.documentDate);
            formData.append('label', finalForm.label);

            const uploadRes = await api('/api/documents', {
                method: 'POST',
                body: formData,
            });
            
            finalForm = {
                ...finalForm,
                documentId: uploadRes.id,
                documentPath: uploadRes.path,
                documentType: uploadRes.documentType,
                documentNumber: uploadRes.documentNumber,
                documentDate: uploadRes.documentDate ? uploadRes.documentDate.split('T')[0] : '',
                documentFile: null,
            };
        }

        let resultData;
        if (editMode) {
            resultData = await api(`/api/accounting/${currentId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...finalForm,
                    amount: Number(finalForm.amount),
                }),
            });
        } else {
            resultData = await api('/api/accounting', {
                method: 'POST',
                body: JSON.stringify({
                    ...finalForm,
                    amount: Number(finalForm.amount),
                }),
            });
        }

        setItems(editMode ? items.map(item => item.id === currentId ? resultData : item) : [resultData, ...items]);
        handleCloseModal(); // Appel à la fonction corrigée
        toast.success(`Élément ${editMode ? 'mis à jour' : 'ajouté'} avec succès!`);

    } catch (err) {
        console.error('Erreur lors de l\'ajout/mise à jour', err);
        let errorMsg = 'Une erreur est survenue.';
        try {
            // Correction ici : ne pas utiliser `await` et gérer le JSON correctement
            // Cette ligne tente de parser le message de l'erreur, mais si ce n'est pas un JSON, cela échoue
            const errorData = JSON.parse(err.message); 
            if (errorData.errors) {
                setErrors(errorData.errors);
            }
            errorMsg = errorData.error || errorMsg;
        } catch (e) {
            // Si le message n'est pas un JSON valide, l'utiliser tel quel.
            errorMsg = err.message;
        }
        toast.error(`Erreur: ${errorMsg}`);
    } finally {
        setLoading(false);
    }
  };


  // Afficher la modale de confirmation pour la suppression
  const remove = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Confirmer et exécuter la suppression
  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await api(`/api/accounting/${itemToDelete.id}`, { method: 'DELETE' });
      setItems(prevItems => prevItems.filter(i => i.id !== itemToDelete.id));
    } catch (error) {
      handleError('Erreur lors de la suppression de la transaction. Veuillez réessayer.');
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  // Annuler la suppression
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Gérer les erreurs et afficher la modale d'erreur
  const handleError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  // Lancer le mode édition avec les données de l'élément sélectionné
  // Fonction startEdit corrigée
  const startEdit = (item) => {
    setCurrentId(item.id);
    setEditMode(true);

    setForm({
      label: item.label || '',
      type: item.type || 'EXPENSE',
      amount: Number.isFinite(item.amount) ? item.amount : '',
      journalCode: item.journalCode || '',
      reference: item.reference || '',
      debitAccount: item.debitAccount || '',
      creditAccount: item.creditAccount || '',
      documentType: item.documentType || '',
      documentNumber: item.documentNumber || '',
      documentDate: (item.documentDate && !isNaN(new Date(item.documentDate)))
        ? new Date(item.documentDate).toISOString().split('T')[0]
        : '',
      companySlug: item.company?.slug || '',   
      documentFile: null,
      date: item.date
        ? new Date(item.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    });
  };


  // Afficher les détails d'une transaction
  const showDetails = (item) => {
    setSelectedTransaction(item);
    setShowTransactionDetails(true);
  };

  // Gérer le téléchargement de fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
    }
  };

  // Filtrer les éléments en fonction de la compagnie et de la recherche
  const filteredItems = useMemo(() => {
    let tempItems = items;
    if (companyFilter !== '') {
      tempItems = tempItems.filter(i => i.company?.slug === companyFilter); // Ligne corrigée
    }
    if (searchQuery !== '') {
      const query = searchQuery.toLowerCase();
      tempItems = tempItems.filter(i => 
        i.label.toLowerCase().includes(query) || 
        i.debitAccount.includes(query) ||
        i.creditAccount.includes(query) ||
        i.reference?.toLowerCase().includes(query) ||
        i.company?.slug.toLowerCase().includes(query) // Optionnel: pour filtrer par le slug de l'entreprise
      );
    }
    return tempItems;
  }, [items, companyFilter, searchQuery]);

  // Calculer les totaux pour les KPI
  const totals = useMemo(() => {
    const totalDebit = filteredItems.reduce((s, i) => s + i.amount, 0);
    const totalCredit = filteredItems.reduce((s, i) => s + i.amount, 0);
    return { totalDebit, totalCredit, balance: totalDebit - totalCredit };
  }, [filteredItems]);

  // Vérifier l'équilibre du bilan
  const isBalanceValid = totals.totalDebit === totals.totalCredit;

  // Obtenir le nom du compte à partir de son numéro
  const getAccountName = (accountNumber) => {
    const account = OHADA_ACCOUNTS.find(acc => acc.number === accountNumber);
    return account ? `${account.number} - ${account.name}` : 'Compte inconnu';
  };
// Fonction pour exporter les données
const exportData = () => {
  let content = '';
  let filename = '';

  if (exportFormat === 'CSV') {
    // En-têtes CSV
    const headers = ['Date', 'Journal', 'Référence', 'Compte Débit', 'Compte Crédit', 'Libellé', 'Montant (XAF)', 'Entité', 'Type de justificatif', 'Numéro de justificatif'];
    content = headers.join(';') + '\n';
    
    // Données
    filteredItems.forEach(item => {
      const row = [
        new Date(item.date).toLocaleDateString('fr-FR'),
        item.journalCode || 'OD',
        item.reference || '-',
        getAccountName(item.debitAccount),
        getAccountName(item.creditAccount),
        `"${item.label.replace(/"/g, '""')}"`, // Échapper les guillemets
        item.company?.name || 'Inconnue',
        item.documentType || '-',
        item.documentNumber || '-'
      ];
      content += row.join(';') + '\n';
    });
    
    filename = `export-comptable-${new Date().toISOString().split('T')[0]}.csv`;
    
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } else if (exportFormat === 'JSON') {
    content = JSON.stringify(filteredItems, null, 2);
    filename = `export-comptable-${new Date().toISOString().split('T')[0]}.json`;

    const blob = new Blob([content], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } else if (exportFormat === 'Excel') {
    // Préparation des données pour Excel
    const dataForExcel = filteredItems.map(item => ({
      'Date': new Date(item.date).toLocaleDateString('fr-FR'),
      'Journal': item.journalCode || 'OD',
      'Référence': item.reference || '-',
      'Compte Débit': getAccountName(item.debitAccount),
      'Compte Crédit': getAccountName(item.creditAccount),
      'Libellé': item.label,
      'Montant (XAF)': Number(item.amount),
      'Entité': item.company?.name || 'Inconnue',
      'Type de justificatif': item.documentType || '-',
      'Numéro de justificatif': item.documentNumber || '-',
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Écritures Comptables');
    
    filename = `export-comptable-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  }
};
  // Fonction pour afficher le grand livre
  const showLedger = () => {
    setShowLedgerModal(true);
  };

  // Fonction pour regrouper les transactions par compte
  const getLedgerData = () => {
    const ledger = {};
    
    filteredItems.forEach(item => {
      // Traiter le compte débit
      if (!ledger[item.debitAccount]) {
        ledger[item.debitAccount] = {
          account: item.debitAccount,
          name: getAccountName(item.debitAccount),
          debit: 0,
          credit: 0,
          transactions: []
        };
      }
      
      ledger[item.debitAccount].debit += item.amount;
      ledger[item.debitAccount].transactions.push({
        date: item.date,
        journal: item.journalCode,
        reference: item.reference,
        label: item.label,
        debit: item.amount,
        credit: 0
      });
      
      // Traiter le compte crédit
      if (!ledger[item.creditAccount]) {
        ledger[item.creditAccount] = {
          account: item.creditAccount,
          name: getAccountName(item.creditAccount),
          debit: 0,
          credit: 0,
          transactions: []
        };
      }
      
      ledger[item.creditAccount].credit += item.amount;
      ledger[item.creditAccount].transactions.push({
        date: item.date,
        journal: item.journalCode,
        reference: item.reference,
        label: item.label,
        debit: 0,
        credit: item.amount
      });
    });
    
    return Object.values(ledger).sort((a, b) => a.account.localeCompare(b.account));
  };

  return (
    <section className="font-sans antialiased p-4 md:p-8 bg-gray-100 min-h-screen space-y-6">
      <h2 className="text-2xl font-bold">Saisie Comptable - Système OHADA</h2>

      {/* Configuration de l'exercice comptable */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Exercice Comptable</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Année fiscale</label>
            <input
              type="number"
              className="border rounded-xl px-3 py-2 w-full"
              value={fiscalYear}
              onChange={e => setFiscalYear(parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de clôture</label>
            <input
              type="date"
              className="border rounded-xl px-3 py-2 w-full"
              value={fiscalYearEnd}
              onChange={e => setFiscalYearEnd(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center">
              <FileCheck size={18} className="mr-2" />
              Clôturer l'exercice
            </button>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout/édition */}
      <form onSubmit={addOrUpdate} className="bg-white rounded-2xl p-5 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">{editMode ? "Modifier l'écriture" : "Nouvelle écriture comptable"}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
            <select 
              className="border rounded-xl px-3 py-2 w-full" 
              value={form.journalCode} 
              onChange={e => setForm({ ...form, journalCode: e.target.value })}
              required
            >
              <option value="">Sélectionner un journal</option>
              {ACCOUNTING_JOURNALS.map(j => <option key={j.code} value={j.code}>{j.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
            <input 
              className="border rounded-xl px-3 py-2 w-full" 
              placeholder="Référence" 
              value={form.reference} 
              onChange={e => setForm({ ...form, reference: e.target.value })} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date opération</label>
            <input 
              type="date"
              className="border rounded-xl px-3 py-2 w-full" 
              value={form.date} 
              onChange={e => setForm({ ...form, date: e.target.value })} 
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entité</label>
            <select 
              className="border rounded-xl px-3 py-2 w-full" 
              value={form.companySlug} 
              onChange={e => setForm({ ...form, companySlug: e.target.value })} 
              required
            >
              <option value="">Sélectionner une entité</option>
              {companies.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
  
          <label className="block text-sm font-medium text-gray-700 mb-1">Type d'écriture</label>
          <select 
            className="border rounded-xl px-3 py-2 w-full" 
            value={form.type} 
            onChange={e => setForm({ ...form, type: e.target.value })}
            required
          >
            <option value="EXPENSE">Dépense</option>
            <option value="PRODUCT">Produit</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compte Débit</label>
            <select 
              className="border rounded-xl px-3 py-2 w-full" 
              value={form.debitAccount} 
              onChange={e => setForm({ ...form, debitAccount: e.target.value })}
              required
            >
              <option value="">Sélectionner un compte</option>
              {OHADA_ACCOUNTS.filter(acc => acc.type === 'DEBIT').map(acc => (
                <option key={acc.number} value={acc.number}>{acc.number} - {acc.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Compte Crédit</label>
            <select 
              className="border rounded-xl px-3 py-2 w-full" 
              value={form.creditAccount} 
              onChange={e => setForm({ ...form, creditAccount: e.target.value })}
              required
            >
              <option value="">Sélectionner un compte</option>
              {OHADA_ACCOUNTS.filter(acc => acc.type === 'CREDIT').map(acc => (
                <option key={acc.number} value={acc.number}>{acc.number} - {acc.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Libellé</label>
            <input 
              className="border rounded-xl px-3 py-2 w-full" 
              placeholder="Libellé de l'opération" 
              value={form.label} 
              onChange={e => setForm({ ...form, label: e.target.value })} 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (XAF)</label>
            <input 
              type="number" 
              className="border rounded-xl px-3 py-2 w-full" 
              placeholder="Montant" 
              value={form.amount} 
              onChange={e => {
                const value = e.target.value;
                setForm({
                  ...form,
                  amount: value === '' ? '' : parseFloat(value)
                });
              }}
              required 
            />
          </div>
        </div>
        
        <div className="border-t pt-4 mb-4">
          <h4 className="text-md font-medium mb-3">Justificatif</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de document</label>
              <select 
                className="border rounded-xl px-3 py-2 w-full" 
                value={form.documentType} 
                onChange={e => setForm({ ...form, documentType: e.target.value })}
              >
                {DOCUMENT_TYPES.map(doc => <option key={doc.code} value={doc.code}>{doc.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro du document</label>
              <input 
                className="border rounded-xl px-3 py-2 w-full" 
                placeholder="N° document" 
                value={form.documentNumber} 
                onChange={e => setForm({ ...form, documentNumber: e.target.value })} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date du document</label>
              <input 
                type="date"
                className="border rounded-xl px-3 py-2 w-full" 
                value={form.documentDate} 
                onChange={e => setForm({ ...form, documentDate: e.target.value })} 
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Fichier du justificatif</label>
            <div className="flex items-center">
              <label className="flex items-center px-4 py-2 bg-gray-200 rounded-xl cursor-pointer hover:bg-gray-300">
                <Upload size={18} className="mr-2" />
                Choisir un fichier
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
              {documentFile && <span className="ml-3 text-sm">{documentFile.name}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button type="submit" className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-700 flex items-center">
            <Plus size={18} className="mr-2" />
            {editMode ? "Mettre à jour" : "Enregistrer l'écriture"}
          </button>
        </div>
      </form>

      {/* Totaux et équilibre */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPI title="Total Débit" value={totals.totalDebit} />
        <KPI title="Total Crédit" value={totals.totalCredit} />
        <div className={`rounded-2xl p-5 text-center text-white ${isBalanceValid ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="text-sm opacity-90">Équilibre</div>
          <div className="text-2xl font-bold">{isBalanceValid ? 'Équilibré' : 'Déséquilibré'}</div>
          {!isBalanceValid && (
            <div className="text-sm mt-1">
              Différence: {Math.abs(totals.totalDebit - totals.totalCredit).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
            </div>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-5 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <input
              placeholder="Rechercher par libellé, compte ou référence..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border rounded-xl px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par entité</label>
            <select
              className="border rounded-xl px-3 py-2 w-full"
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
            >
              <option value="">Toutes les entités</option>
              {companies.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Format d'export</label>
              <select
                className="border rounded-xl px-3 py-2 w-full"
                value={exportFormat}
                onChange={e => setExportFormat(e.target.value)}
              >
                <option value="CSV">CSV</option>
                <option value="JSON">JSON</option>
                <option value="Excel">Excel</option>
              </select>
            </div>
            <button 
              className="px-4 py-2 rounded-xl border text-gray-800 bg-white hover:bg-gray-100 flex items-center"
              onClick={exportData}
            >
              <Download size={18} className="mr-2" />
              Exporter
            </button>
            <button 
              className="px-4 py-2 rounded-xl border text-gray-800 bg-white hover:bg-gray-100 flex items-center"
              onClick={showLedger}
            >
              <BookOpen size={18} className="mr-2" />
              Grand livre
            </button>
          </div>
        </div>
      </div>

      {/* Tableau des transactions */}
      <div className="bg-white rounded-2xl p-5 overflow-auto shadow-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="py-2">Date</th>
              <th>Journal</th>
              <th>Réf.</th>
              <th>Débit</th>
              <th>Crédit</th>
              <th>Libellé</th>
              <th>Montant</th>
              <th>Entité</th>
              <th>Justificatif</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="py-2">{new Date(item.date).toLocaleDateString('fr-FR')}</td>
                  <td>{item.journalCode || 'OD'}</td>
                  <td>{item.reference || '-'}</td>
                  <td>{getAccountName(item.debitAccount)}</td>
                  <td>{getAccountName(item.creditAccount)}</td>
                  <td>{item.label}</td>
                  <td>{Number(item.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                  <td>{item.company?.name || 'Inconnue'}</td>
                  <td>
                    {item.documentNumber ? (
                      <span className="text-blue-600">{item.documentType}: {item.documentNumber}</span>
                    ) : (
                      <span className="text-gray-400">Aucun</span>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button type="button" onClick={() => showDetails(item)}>
                        <FileText size={18} className="text-blue-500 hover:text-blue-700" />
                      </button>
                      <button type="button" onClick={() => startEdit(item)}>
                        <Edit size={18} className="text-gray-500 hover:text-gray-700" />
                      </button>
                      <button type="button" onClick={() => remove(item)}>
                        <Trash2 size={18} className="text-red-500 hover:text-red-700" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center text-gray-500 p-4">
                  Aucune transaction trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modale de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-auto">
            <h3 className="text-lg font-bold mb-4">Confirmer la suppression</h3>
            <p className="text-sm text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer l'écriture "{itemToDelete?.label}" ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'erreur */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-auto">
            <h3 className="text-lg font-bold text-red-600 mb-4">Erreur</h3>
            <p className="text-sm text-gray-700 mb-6">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de détails de transaction */}
      {showTransactionDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-auto">
            <h3 className="text-lg font-bold mb-4">Détails de l'écriture comptable</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{new Date(selectedTransaction.date).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Journal:</span>
                <span>{selectedTransaction.journalCode || 'OD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Référence:</span>
                <span>{selectedTransaction.reference || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Compte Débit:</span>
                <span>{getAccountName(selectedTransaction.debitAccount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Compte Crédit:</span>
                <span>{getAccountName(selectedTransaction.creditAccount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Libellé:</span>
                <span>{selectedTransaction.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Montant:</span>
                <span>{Number(selectedTransaction.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Type de justificatif:</span>
                <span>{selectedTransaction.documentType || 'Aucun'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">N° de justificatif:</span>
                <span>{selectedTransaction.documentNumber || 'Aucun'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date du justificatif:</span>
                <span>{selectedTransaction.documentDate ? new Date(selectedTransaction.documentDate).toLocaleDateString('fr-FR') : 'Aucune'}</span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTransactionDetails(false)}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale du grand livre */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-auto max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Grand Livre Comptable</h3>
            
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Exercice: {fiscalYear}</span>
                <span className="font-medium">Date d'extraction: {new Date().toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            
            {getLedgerData().map(account => (
              <div key={account.account} className="mb-6 border-b pb-4">
                <h4 className="font-semibold text-blue-700">{account.account} - {account.name}</h4>
                
                <table className="min-w-full text-sm mt-2">
                  <thead>
                    <tr className="text-left text-neutral-500 border-b">
                      <th className="py-1">Date</th>
                      <th>Journal</th>
                      <th>Référence</th>
                      <th>Libellé</th>
                      <th className="text-right">Débit</th>
                      <th className="text-right">Crédit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.transactions.map((transaction, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-1">{new Date(transaction.date).toLocaleDateString('fr-FR')}</td>
                        <td>{transaction.journal || 'OD'}</td>
                        <td>{transaction.reference || '-'}</td>
                        <td>{transaction.label}</td>
                        <td className="text-right">{transaction.debit > 0 ? Number(transaction.debit).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' }) : '-'}</td>
                        <td className="text-right">{transaction.credit > 0 ? Number(transaction.credit).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' }) : '-'}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-gray-50">
                      <td colSpan="4" className="py-1 text-right">Total:</td>
                      <td className="text-right">{Number(account.debit).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                      <td className="text-right">{Number(account.credit).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                    </tr>
                    <tr className="font-semibold">
                      <td colSpan="4" className="py-1 text-right">Solde:</td>
                      <td colSpan="2" className="text-right">
                        {Number(account.debit - account.credit).toLocaleString('fr-FR', { 
                          style: 'currency', 
                          currency: 'XAF' 
                        })}
                        <span className="ml-2 text-xs">
                          ({account.debit > account.credit ? 'Débiteur' : 'Créditeur'})
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowLedgerModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}