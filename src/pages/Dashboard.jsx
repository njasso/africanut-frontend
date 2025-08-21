import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  Download, Filter, TrendingUp, TrendingDown, FileText,
  Building, CreditCard, DollarSign, PieChart as PieChartIcon,
  BookOpen, AlertTriangle, BarChart3, Lightbulb, Target,
  Sparkles, Brain, Zap, RefreshCw
} from 'lucide-react';
import { companies } from '../data/companies.js';
import { api } from '../services/api';
import * as XLSX from 'xlsx';

// Plan comptable OHADA simplifié
const OHADA_ACCOUNT_CLASSES = [
  { id: '1', name: 'Financement permanent', color: '#3B82F6' },
  { id: '2', name: 'Actif immobilisé', color: '#10B981' },
  { id: '3', name: 'Stocks et en-cours', color: '#F59E0B' },
  { id: '4', name: 'Comptes de tiers', color: '#EF4444' },
  { id: '5', name: 'Comptes financiers', color: '#8B5CF6' },
  { id: '6', name: 'Charges', color: '#EC4899' },
  { id: '7', name: 'Produits', color: '#06B6D4' },
  { id: '8', name: 'Comptes spéciaux', color: '#F97316' }
];

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

const getAccountName = (accountNumber) => {
  const account = OHADA_ACCOUNTS.find(acc => acc.number === accountNumber);
  return account ? `${account.number} - ${account.name}` : 'Compte inconnu';
};

export default function Dashboard() {
  const [accounting, setAccounting] = useState([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [accountClassFilter, setAccountClassFilter] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Charger les données comptables
  const loadAccounting = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (companyFilter) params.append('companySlug', companyFilter);
      if (accountClassFilter) params.append('accountClass', accountClassFilter);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api(`/api/accounting${query}`);

      const enhancedData = data.map(item => {
        const debitAccount = OHADA_ACCOUNTS.find(acc => acc.number === item.debitAccount);
        const creditAccount = OHADA_ACCOUNTS.find(acc => acc.number === item.creditAccount);
        return {
          ...item,
          accountClass: debitAccount?.class || creditAccount?.class || ''
        };
      });
      setAccounting(enhancedData);
    } catch (err) {
      console.error('Erreur récupération compta:', err);
      setAccounting([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyFilter, accountClassFilter, dateRange]);

  // Préparer les données mensuelles selon les classes OHADA
  const monthlyData = useMemo(() => {
    if (accounting.length === 0) return [];
    const map = {};
    for (const item of accounting) {
      if (!item.date || !item.amount) continue;
      const date = new Date(item.date);
      const key = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' });
      if (!map[key]) {
        map[key] = {
          month: monthName,
          produits: 0,
          charges: 0,
          solde: 0,
          classe1: 0, classe2: 0, classe3: 0, classe4: 0,
          classe5: 0, classe6: 0, classe7: 0, classe8: 0
        };
      }
      if (!item.accountClass) continue;
      if (item.accountClass === '7' || item.type === 'PRODUCT') {
        map[key].produits += item.amount;
        map[key].classe7 += item.amount;
        map[key].solde += item.amount;
      } else if (item.accountClass === '6' || item.type === 'EXPENSE') {
        map[key].charges += item.amount;
        map[key].classe6 += item.amount;
        map[key].solde -= item.amount;
      }
      const classeKey = `classe${item.accountClass}`;
      if (map[key].hasOwnProperty(classeKey)) {
        map[key][classeKey] += item.amount;
      }
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [accounting]);

  // Calcul du compte de résultat total selon OHADA
  const totalPnl = useMemo(() => {
    if (accounting.length === 0) {
      return {
        produits: 0,
        charges: 0,
        benefice: 0,
        tauxMarge: 0
      };
    }
    const produits = accounting
      .filter(i => i.accountClass === '7' || i.type === 'PRODUCT')
      .reduce((s, i) => s + i.amount, 0);
    const charges = accounting
      .filter(i => i.accountClass === '6' || i.type === 'EXPENSE')
      .reduce((s, i) => s + i.amount, 0);
    return {
      produits,
      charges,
      benefice: produits - charges,
      tauxMarge: produits > 0 ? ((produits - charges) / produits * 100) : 0
    };
  }, [accounting]);

  // Calcul du bilan selon les normes OHADA
  const balanceSheet = useMemo(() => {
    if (accounting.length === 0) {
      return {
        actif: { immobilisations: 0, stocks: 0, disponibilites: 0, total: 0 },
        passif: { capitauxPermanents: 0, dettes: 0, total: 0 },
        equilibre: false
      };
    }
    const actifImmobilise = accounting
      .filter(i => i.accountClass === '2')
      .reduce((s, i) => s + i.amount, 0);
    const stocks = accounting
      .filter(i => i.accountClass === '3')
      .reduce((s, i) => s + i.amount, 0);
    const disponibilites = accounting
      .filter(i => i.accountClass === '5')
      .reduce((s, i) => s + i.amount, 0);
    const capitauxPermanents = accounting
      .filter(i => i.accountClass === '1')
      .reduce((s, i) => s + i.amount, 0);
    const dettes = accounting
      .filter(i => i.accountClass === '4')
      .reduce((s, i) => s + i.amount, 0);
    const totalActif = actifImmobilise + stocks + disponibilites;
    const totalPassif = capitauxPermanents + dettes;
    return {
      actif: {
        immobilisations: actifImmobilise,
        stocks,
        disponibilites,
        total: totalActif
      },
      passif: {
        capitauxPermanents,
        dettes,
        total: totalPassif
      },
      equilibre: Math.abs(totalActif - totalPassif) < 0.01
    };
  }, [accounting]);

  // Données pour le graphique circulaire des classes de comptes
  const accountClassData = useMemo(() => {
    return OHADA_ACCOUNT_CLASSES.map(classe => {
      const total = accounting
        .filter(i => i.accountClass === classe.id)
        .reduce((s, i) => s + i.amount, 0);
      return {
        name: classe.name,
        value: total,
        color: classe.color
      };
    }).filter(item => item.value > 0);
  }, [accounting]);

  // Données pour le graphique en radar des classes OHADA
  const radarData = useMemo(() => {
    return OHADA_ACCOUNT_CLASSES.map(classe => {
      const total = accounting
        .filter(i => i.accountClass === classe.id)
        .reduce((s, i) => s + i.amount, 0);
      return {
        subject: classe.name,
        A: total,
        fullMark: Math.max(1000000, total * 1.5)
      };
    });
  }, [accounting]);

  // Générer l'analyse IA via le backend
  const generateAIAnalysis = useCallback(async () => {
    setAiLoading(true);
    try {
      console.log("Envoi des données à l'API IA...");
      const response = await api('/api/deepseek-analyze', {
        method: 'POST',
        data: {
          accountingData: accounting,
          monthlyData,
          totalPnl,
          balanceSheet,
        },
      });

      console.log("Réponse reçue de l'API IA:", response);

      // Gestion flexible des différents formats de réponse
      let analysis;
      if (response.choices && response.choices[0]?.message?.content) {
        // Format OpenAI-style
        try {
          analysis = JSON.parse(response.choices[0].message.content);
        } catch (e) {
          console.error("Erreur de parsing JSON:", e);
          analysis = { 
            error: "Format de réponse inattendu",
            rawContent: response.choices[0].message.content
          };
        }
      } else if (response.analysis) {
        // Format direct avec champ analysis
        analysis = response.analysis;
      } else if (response.message) {
        // Format avec message direct
        analysis = {
          profitabilityAnalysis: { message: response.message },
          recommendations: [],
          anomalies: []
        };
      } else {
        // Utiliser la réponse telle quelle
        analysis = response;
      }

      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'API IA:', error);
      setAiAnalysis({ 
        error: "Erreur de connexion à l'API IA",
        details: error.message 
      });
    } finally {
      setAiLoading(false);
    }
  }, [accounting, monthlyData, totalPnl, balanceSheet]);

  // Charger les données au montage et au changement des filtres
  useEffect(() => {
    loadAccounting();
  }, [loadAccounting]);

  // Générer l'analyse IA après le chargement des données
  useEffect(() => {
    if (accounting.length > 0 && !aiAnalysis && !aiLoading) {
      console.log("Données comptables chargées, génération de l'analyse IA");
      generateAIAnalysis();
    }
  }, [accounting, generateAIAnalysis, aiAnalysis, aiLoading]);

  // Téléchargement des fichiers
  const downloadFile = async (fileType, filename) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Vous devez être connecté pour télécharger ce fichier.");
      return;
    }
    if (accounting.length === 0) {
      alert("Aucune donnée disponible pour la période sélectionnée.");
      return;
    }
    const params = new URLSearchParams();
    if (companyFilter) params.append('companySlug', companyFilter);
    if (dateRange.startDate) params.append('startDate', dateRange.startDate);
    if (dateRange.endDate) params.append('endDate', dateRange.endDate);
    try {
      const response = await fetch(`/api/reports/${fileType}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        return;
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur serveur:", errorText);
        alert("Erreur lors de la génération du fichier.");
        return;
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        alert("Aucune donnée disponible pour la période sélectionnée.");
        return;
      }
      const tempUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = tempUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(tempUrl);
    } catch (err) {
      console.error("Erreur de téléchargement:", err);
      alert("Impossible de télécharger le fichier. Vérifiez votre connexion.");
    }
  };

  // Préparation des données pour le Grand Livre
  const getLedgerData = () => {
    if (accounting.length === 0) return [];
    const ledger = {};
    accounting.forEach(item => {
      if (!item.debitAccount || !item.creditAccount) return;
      // Compte Débit
      if (!ledger[item.debitAccount]) {
        ledger[item.debitAccount] = {
          account: item.debitAccount,
          name: getAccountName(item.debitAccount),
          transactions: []
        };
      }
      ledger[item.debitAccount].transactions.push({
        date: new Date(item.date).toLocaleDateString('fr-FR'),
        journal: item.journalCode || 'OD',
        reference: item.reference || '-',
        label: item.label,
        debit: Number(item.amount),
        credit: 0,
        companyName: item.company?.name || 'Inconnue'
      });
      // Compte Crédit
      if (!ledger[item.creditAccount]) {
        ledger[item.creditAccount] = {
          account: item.creditAccount,
          name: getAccountName(item.creditAccount),
          transactions: []
        };
      }
      ledger[item.creditAccount].transactions.push({
        date: new Date(item.date).toLocaleDateString('fr-FR'),
        journal: item.journalCode || 'OD',
        reference: item.reference || '-',
        label: item.label,
        debit: 0,
        credit: Number(item.amount),
        companyName: item.company?.name || 'Inconnue'
      });
    });
    return Object.values(ledger).sort((a, b) => a.account.localeCompare(b.account));
  };

  // Téléchargement du Grand Livre en Excel
  const downloadLedger = () => {
    const ledgerData = getLedgerData();
    if (ledgerData.length === 0) {
      alert("Aucune donnée disponible pour le Grand Livre.");
      return;
    }
    const workbook = XLSX.utils.book_new();
    ledgerData.forEach(account => {
      const dataForSheet = account.transactions.map(t => ({
        'Date': t.date,
        'Journal': t.journal,
        'Référence': t.reference,
        'Libellé': t.label,
        'Entité': t.companyName,
        'Débit': t.debit > 0 ? t.debit : '',
        'Crédit': t.credit > 0 ? t.credit : '',
      }));
      const debitTotal = account.transactions.reduce((sum, t) => sum + t.debit, 0);
      const creditTotal = account.transactions.reduce((sum, t) => sum + t.credit, 0);
      const balance = debitTotal - creditTotal;
      dataForSheet.push(
        {},
        { 'Libellé': 'Total', 'Débit': debitTotal, 'Crédit': creditTotal },
        { 'Libellé': 'Solde', 'Débit': balance > 0 ? balance : '', 'Crédit': balance < 0 ? Math.abs(balance) : '' }
      );
      const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
      XLSX.utils.book_append_sheet(workbook, worksheet, account.name.substring(0, 31));
    });
    const filename = `grand-livre-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Composant KPI moderne
  const KPI = ({ title, value, trend, icon: Icon, currency = true }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-blue-50">
          <Icon size={20} className="text-blue-600" />
        </div>
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
          trend > 0 ? 'bg-green-100 text-green-800' :
          trend < 0 ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {trend > 0 ? `+${trend}%` : `${trend}%`}
        </span>
      </div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {currency ?
            Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' }) :
            `${value}%`
          }
        </p>
      </div>
    </div>
  );

  // Composant d'analyse IA
  const AIAnalysisCard = () => {
    if (aiLoading) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100 mb-8">
          <div className="flex items-center justify-center">
            <RefreshCw size={20} className="animate-spin text-blue-600 mr-2" />
            <span>Analyse IA en cours...</span>
          </div>
        </div>
      );
    }

    if (!aiAnalysis) return null;

    // Gestion des différents formats de réponse
    const analysis = aiAnalysis.analysis || aiAnalysis;
    const generatedDate = analysis.generatedAt ? new Date(analysis.generatedAt) : new Date();

    // Si erreur
    if (analysis.error) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100 mb-8">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Erreur d'analyse IA</h3>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-xs">
            <p className="text-sm text-gray-600">{analysis.error}</p>
            {analysis.details && (
              <p className="text-xs text-gray-500 mt-2">Détails: {analysis.details}</p>
            )}
            {analysis.rawContent && (
              <div className="mt-4">
                <p className="text-xs font-semibold">Contenu brut:</p>
                <pre className="text-xs bg-gray-100 p-2 mt-1 overflow-auto">
                  {analysis.rawContent}
                </pre>
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <button
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              onClick={generateAIAnalysis}
            >
              <RefreshCw size={14} className="mr-1" />
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100 mb-8">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-lg bg-blue-100">
            <Sparkles size={20} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 ml-3">Analyse IA</h3>
          <span className="ml-auto text-xs text-blue-600">
            Généré le {generatedDate.toLocaleDateString('fr-FR')}
          </span>
        </div>
        
        {/* Affichage conditionnel basé sur le format des données */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profitabilité */}
          <div className="bg-white rounded-lg p-4 shadow-xs">
            <div className="flex items-center mb-3">
              <TrendingUp size={16} className="mr-2 text-green-600" />
              <h4 className="font-medium">Profitabilité</h4>
            </div>
            <p className="text-sm text-gray-600">
              {analysis.profitabilityAnalysis?.message || 
               "Analyse de profitabilité non disponible"}
            </p>
          </div>
          
          {/* Anomalies */}
          <div className="bg-white rounded-lg p-4 shadow-xs">
            <div className="flex items-center mb-3">
              <AlertTriangle size={16} className="text-yellow-600 mr-2" />
              <h4 className="font-medium">Anomalies détectées</h4>
            </div>
            {analysis.anomalies && analysis.anomalies.length > 0 ? (
              analysis.anomalies.slice(0, 2).map((anomaly, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <p className="text-sm text-gray-600">{anomaly.message}</p>
                  {anomaly.suggestions && (
                    <ul className="text-xs text-gray-500 mt-1 ml-4 list-disc">
                      {anomaly.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">Aucune anomalie détectée</p>
            )}
          </div>
          
          {/* Recommandations */}
          <div className="bg-white rounded-lg p-4 shadow-xs">
            <div className="flex items-center mb-3">
              <Lightbulb size={16} className="text-indigo-600 mr-2" />
              <h4 className="font-medium">Recommandations</h4>
            </div>
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              analysis.recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="mb-2 last:mb-0">
                  <p className="text-sm font-medium text-gray-700">{rec.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{rec.suggestion}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">Aucune recommandation disponible</p>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <button
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            onClick={generateAIAnalysis}
          >
            <RefreshCw size={14} className="mr-1" />
            Actualiser l'analyse
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Comptable</h1>
              <p className="text-gray-600 mt-2">Surveillance financière conforme OHADA avec analyse IA</p>
            </div>
          </div>
        </div>
      </header>
      {/* Navigation par onglets */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Vue d\'ensemble', icon: PieChartIcon },
              { id: 'profit', name: 'Rentabilité', icon: TrendingUp },
              { id: 'balance', name: 'Bilan', icon: CreditCard },
              { id: 'cashflow', name: 'Trésorerie', icon: DollarSign },
              { id: 'analysis', name: 'Analyse IA', icon: Brain }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon size={18} className="mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entité</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={companyFilter}
                onChange={e => setCompanyFilter(e.target.value)}
              >
                <option value="">Toutes les entités</option>
                {companies.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Classe de compte</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={accountClassFilter}
                onChange={e => setAccountClassFilter(e.target.value)}
              >
                <option value="">Toutes les classes</option>
                {OHADA_ACCOUNT_CLASSES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={dateRange.startDate}
                onChange={e => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={dateRange.endDate}
                onChange={e => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={loadAccounting}
            >
              <RefreshCw size={18} className="mr-2" />
              Rafraîchir
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Analyse IA */}
            <AIAnalysisCard />
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <KPI
                title="Total Produits"
                value={totalPnl.produits}
                trend={12.5}
                icon={TrendingUp}
              />
              <KPI
                title="Total Charges"
                value={totalPnl.charges}
                trend={8.2}
                icon={TrendingDown}
              />
              <KPI
                title="Bénéfice Net"
                value={totalPnl.benefice}
                trend={25.3}
                icon={DollarSign}
              />
              <KPI
                title="Marge Nette"
                value={totalPnl.tauxMarge}
                trend={4.1}
                icon={PieChartIcon}
                currency={false}
              />
            </div>
            {/* Graphiques principaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Graphique des tendances */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution Produits vs Charges</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="produitsColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="chargesColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month"/>
                      <YAxis/>
                      <Tooltip
                        formatter={value => Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                      />
                      <Legend/>
                      <Area type="monotone" dataKey="produits" stroke="#2563eb" fill="url(#produitsColor)" />
                      <Area type="monotone" dataKey="charges" stroke="#ef4444" fill="url(#chargesColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Graphique circulaire des classes */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par Classe OHADA</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accountClassData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {accountClassData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={value => Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            {/* Graphiques supplémentaires */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Graphique en barres des classes OHADA */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition des Comptes par Classe</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accountClassData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={value => Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8">
                        {accountClassData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Graphique en radar des classes OHADA */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyse Radar des Classes Comptables</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis />
                      <Tooltip
                        formatter={value => Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                      />
                      <Radar name="Valeur" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            {/* Bilan et données détaillées */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bilan */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bilan Simplifié</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Actif</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Immobilisations</span>
                        <span className="font-medium">
                          {Number(balanceSheet.actif.immobilisations).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stocks</span>
                        <span className="font-medium">
                          {Number(balanceSheet.actif.stocks).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Disponibilités</span>
                        <span className="font-medium">
                          {Number(balanceSheet.actif.disponibilites).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total Actif</span>
                        <span>
                          {Number(balanceSheet.actif.total).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Passif</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capitaux permanents</span>
                        <span className="font-medium">
                          {Number(balanceSheet.passif.capitauxPermanents).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dettes</span>
                        <span className="font-medium">
                          {Number(balanceSheet.passif.dettes).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total Passif</span>
                        <span>
                          {Number(balanceSheet.passif.total).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!balanceSheet.equilibre && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Bilan déséquilibré</h3>
                          <p className="text-sm text-red-600 mt-1">
                            Différence: {Math.abs(balanceSheet.actif.total - balanceSheet.passif.total).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Dernières transactions */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dernières Transactions</h3>
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libellé</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accounting.slice(0, 5).map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(item.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">{item.label}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <span className={item.type === 'PRODUCT' ? 'text-green-600' : 'text-red-600'}>
                              {Number(item.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* Actions d'export */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                onClick={() => downloadFile('accounting.xlsx', 'comptabilité.xlsx')}
              >
                <Download size={18} className="mr-2" />
                Exporter Excel
              </button>
              <button
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                onClick={() => downloadFile('accounting.pdf', 'transactions.pdf')}
              >
                <FileText size={18} className="mr-2" />
                PDF Transactions
              </button>
              <button
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                onClick={() => downloadFile('pnl.pdf', 'compte-resultat.pdf')}
              >
                <TrendingUp size={18} className="mr-2" />
                PDF Compte de Résultat
              </button>
              <button
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                onClick={() => downloadFile('balance-sheet.pdf', 'bilan.pdf')}
              >
                <CreditCard size={18} className="mr-2" />
                PDF Bilan
              </button>
              <button
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                onClick={downloadLedger}
              >
                <BookOpen size={18} className="mr-2" />
                Grand Livre (Excel)
              </button>
              <button
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={generateAIAnalysis}
              >
                <Brain size={18} className="mr-2" />
                Générer Rapport IA
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
