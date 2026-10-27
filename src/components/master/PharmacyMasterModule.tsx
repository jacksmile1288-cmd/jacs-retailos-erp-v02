import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Product,
  PharmacyClass,
  PharmacyPackagingUnit,
  PharmacyFormulaCosting,
  PharmacyFormulaComponent,
} from '../../types';
import {
  Pill,
  FlaskConical,
  Calculator,
  Plus,
  Trash2,
  X,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Check,
  AlertTriangle,
  Clock,
  Shield,
} from 'lucide-react';

interface PharmacyMasterModuleProps {
  onBackToOverview?: () => void;
}

// Initial canonical pharmacy catalog for immediate rich experience
const INITIAL_PHARMACY_MEDICINES: Product[] = [
  {
    id: 'MED-001',
    plu: 'MED-001',
    barcode: '89920011001',
    name: 'Paracetamol 500mg Strip 10 Kaplet',
    brand: 'Kimia Farma',
    category: 'Analgesik & Antipiretik',
    pharmacyClass: 'OBAT_BEBAS',
    drugClass: 'Obat Bebas',
    batchNumber: 'BATCH-PCT2401',
    batchNo: 'BATCH-PCT2401',
    expiryDate: '2027-08-31',
    expDate: '2027-08-31',
    packagingUnit: 'Strip',
    unit: 'Strip',
    cost_price: 4500,
    sell_price: 7000,
    stock: 150,
    min_stock: 20,
    status: 'Active',
    businessModel: 'pharmacy',
  },
  {
    id: 'MED-002',
    plu: 'MED-002',
    barcode: '89920011002',
    name: 'Amoxicillin Trihydrate 500mg Kapsul',
    brand: 'Bernofarm',
    category: 'Antibiotik',
    pharmacyClass: 'OBAT_KERAS',
    drugClass: 'Obat Keras (Resep)',
    batchNumber: 'BATCH-AMX2403',
    batchNo: 'BATCH-AMX2403',
    expiryDate: '2026-11-30',
    expDate: '2026-11-30',
    packagingUnit: 'Strip',
    unit: 'Strip',
    cost_price: 8000,
    sell_price: 12500,
    stock: 95,
    min_stock: 15,
    status: 'Active',
    businessModel: 'pharmacy',
  },
  {
    id: 'MED-003',
    plu: 'MED-003',
    barcode: '89920011003',
    name: 'Betadine Antiseptic Solution 60ml',
    brand: 'Mundipharma',
    category: 'Antiseptik & Desinfektan',
    pharmacyClass: 'OBAT_BEBAS_TERBATAS',
    drugClass: 'Obat Bebas Terbatas',
    batchNumber: 'BATCH-BTD2405',
    batchNo: 'BATCH-BTD2405',
    expiryDate: '2028-02-28',
    expDate: '2028-02-28',
    packagingUnit: 'Botol',
    unit: 'Botol',
    cost_price: 24000,
    sell_price: 31000,
    stock: 45,
    min_stock: 10,
    status: 'Active',
    businessModel: 'pharmacy',
  },
  {
    id: 'MED-004',
    plu: 'MED-004',
    barcode: '89920011004',
    name: 'Cefixime 100mg Kapsul Strip 10s',
    brand: 'Dexa Medica',
    category: 'Antibiotik Sefalosforin',
    pharmacyClass: 'OBAT_KERAS',
    drugClass: 'Obat Keras (Resep)',
    batchNumber: 'BATCH-CFX2409',
    batchNo: 'BATCH-CFX2409',
    expiryDate: '2026-12-15',
    expDate: '2026-12-15',
    packagingUnit: 'Strip',
    unit: 'Strip',
    cost_price: 22000,
    sell_price: 32000,
    stock: 40,
    min_stock: 10,
    status: 'Active',
    businessModel: 'pharmacy',
  },
  {
    id: 'MED-005',
    plu: 'MED-005',
    barcode: '89920011005',
    name: 'Dexamethasone 0.5mg Tablet',
    brand: 'Harsen',
    category: 'Kortikosteroid',
    pharmacyClass: 'OBAT_KERAS',
    drugClass: 'Obat Keras (Resep)',
    batchNumber: 'BATCH-DEX2407',
    batchNo: 'BATCH-DEX2407',
    expiryDate: '2027-04-30',
    expDate: '2027-04-30',
    packagingUnit: 'Tablet',
    unit: 'Tablet',
    cost_price: 250,
    sell_price: 500,
    stock: 800,
    min_stock: 100,
    status: 'Active',
    businessModel: 'pharmacy',
  },
  {
    id: 'MED-006',
    plu: 'MED-006',
    barcode: '89920011006',
    name: 'Cetirizine 10mg Strip 10 Tablet',
    brand: 'Kalbe Farma',
    category: 'Antihistamin & Alergi',
    pharmacyClass: 'OBAT_BEBAS_TERBATAS',
    drugClass: 'Obat Bebas Terbatas',
    batchNumber: 'BATCH-CTZ2411',
    batchNo: 'BATCH-CTZ2411',
    expiryDate: '2027-09-30',
    expDate: '2027-09-30',
    packagingUnit: 'Strip',
    unit: 'Strip',
    cost_price: 6000,
    sell_price: 10000,
    stock: 120,
    min_stock: 20,
    status: 'Active',
    businessModel: 'pharmacy',
  },
  {
    id: 'MED-007',
    plu: 'MED-007',
    barcode: '89920011007',
    name: 'Ambroxol HCl 30mg Tablet',
    brand: 'Indofarma',
    category: 'Mukolitik & Batuk',
    pharmacyClass: 'OBAT_BEBAS_TERBATAS',
    drugClass: 'Obat Bebas Terbatas',
    batchNumber: 'BATCH-AMB2404',
    batchNo: 'BATCH-AMB2404',
    expiryDate: '2027-06-30',
    expDate: '2027-06-30',
    packagingUnit: 'Tablet',
    unit: 'Tablet',
    cost_price: 300,
    sell_price: 600,
    stock: 650,
    min_stock: 100,
    status: 'Active',
    businessModel: 'pharmacy',
  },
  {
    id: 'MED-008',
    plu: 'MED-008',
    barcode: '89920011008',
    name: 'Salbutamol 2mg Tablet',
    brand: 'GlaxoSmithKline',
    category: 'Antiasma & Bronkodilator',
    pharmacyClass: 'OBAT_KERAS',
    drugClass: 'Obat Keras (Resep)',
    batchNumber: 'BATCH-SBT2406',
    batchNo: 'BATCH-SBT2406',
    expiryDate: '2026-10-31',
    expDate: '2026-10-31',
    packagingUnit: 'Tablet',
    unit: 'Tablet',
    cost_price: 350,
    sell_price: 700,
    stock: 500,
    min_stock: 80,
    status: 'Active',
    businessModel: 'pharmacy',
  },
  {
    id: 'MED-009',
    plu: 'MED-009',
    barcode: '89920011009',
    name: 'Antasida Doen Suspensi Botol 60ml',
    brand: 'Erela',
    category: 'Lambung & Pencernaan',
    pharmacyClass: 'OBAT_BEBAS',
    drugClass: 'Obat Bebas',
    batchNumber: 'BATCH-ATD2402',
    batchNo: 'BATCH-ATD2402',
    expiryDate: '2027-07-31',
    expDate: '2027-07-31',
    packagingUnit: 'Botol',
    unit: 'Botol',
    cost_price: 7500,
    sell_price: 11500,
    stock: 60,
    min_stock: 15,
    status: 'Active',
    businessModel: 'pharmacy',
  },
  {
    id: 'MED-RCK-001',
    plu: 'RCK-001',
    barcode: '89990010001',
    name: 'Puyer Racikan Batuk & Flu Anak (10 Bungkus)',
    brand: 'Instalasi Farmasi',
    category: 'Obat Racikan Anak',
    pharmacyClass: 'RACIKAN',
    drugClass: 'Racikan Apoteker',
    batchNumber: 'RCK-BFL-01',
    batchNo: 'RCK-BFL-01',
    expiryDate: '2026-12-31',
    expDate: '2026-12-31',
    packagingUnit: 'Box',
    unit: 'Paket',
    cost_price: 13950,
    sell_price: 24500,
    stock: 30,
    min_stock: 5,
    status: 'Active',
    businessModel: 'pharmacy',
    pharmacyFormula: {
      components: [
        { medicineId: 'MED-001', medicineName: 'Paracetamol 500mg', dosageQty: 3, unit: 'Tablet', costPerUnit: 450, subtotal: 1350 },
        { medicineId: 'MED-007', medicineName: 'Ambroxol HCl 30mg', dosageQty: 2, unit: 'Tablet', costPerUnit: 300, subtotal: 600 },
        { medicineId: 'MED-006', medicineName: 'Cetirizine 10mg', dosageQty: 1, unit: 'Tablet', costPerUnit: 600, subtotal: 600 },
      ],
      embalaseCost: 2500,
      tuslahFee: 5000,
      medicineCost: 2550,
      totalCost: 10050,
      targetMarginPercent: 35,
      recommendedPrice: 15500,
    },
  },
  {
    id: 'MED-RCK-002',
    plu: 'RCK-002',
    barcode: '89990010002',
    name: 'Kapsul Racikan Bronkodilator & Asma (15 Kapsul)',
    brand: 'Instalasi Farmasi',
    category: 'Obat Racikan Dewasa',
    pharmacyClass: 'RACIKAN',
    drugClass: 'Racikan Apoteker',
    batchNumber: 'RCK-ASM-02',
    batchNo: 'RCK-ASM-02',
    expiryDate: '2026-12-31',
    expDate: '2026-12-31',
    packagingUnit: 'Strip',
    unit: 'Paket',
    cost_price: 12550,
    sell_price: 25000,
    stock: 20,
    min_stock: 5,
    status: 'Active',
    businessModel: 'pharmacy',
    pharmacyFormula: {
      components: [
        { medicineId: 'MED-008', medicineName: 'Salbutamol 2mg', dosageQty: 4, unit: 'Tablet', costPerUnit: 350, subtotal: 1400 },
        { medicineId: 'MED-005', medicineName: 'Dexamethasone 0.5mg', dosageQty: 3, unit: 'Tablet', costPerUnit: 250, subtotal: 750 },
        { medicineId: 'MED-007', medicineName: 'Ambroxol HCl 30mg', dosageQty: 3, unit: 'Tablet', costPerUnit: 300, subtotal: 900 },
      ],
      embalaseCost: 3500,
      tuslahFee: 6000,
      medicineCost: 3050,
      totalCost: 12550,
      targetMarginPercent: 30,
      recommendedPrice: 18000,
    },
  },
];

export const PharmacyMasterModule: React.FC<PharmacyMasterModuleProps> = ({ onBackToOverview }) => {
  const { products, addProduct, updateProduct, theme, language, showToast } = useApp();

  const isLight = theme === 'light';
  const isEn = language === 'en';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<'ALL' | PharmacyClass>('ALL');

  // New Custom Medicines state added in session
  const [customMedicines, setCustomMedicines] = useState<Product[]>([]);

  // Combined Pharmacy Medicine Catalog
  const pharmacyCatalog: Product[] = useMemo(() => {
    // 1. Gather pharmacy products from AppContext
    const fromContext = products.filter(
      (p) =>
        p.businessModel === 'pharmacy' ||
        p.pharmacyClass ||
        (p.category && p.category.toLowerCase().includes('obat')) ||
        (p.id && p.id.startsWith('MED-'))
    );

    const map = new Map<string, Product>();
    // Initial medicines
    INITIAL_PHARMACY_MEDICINES.forEach((m) => map.set(m.id, m));
    // Session custom medicines
    customMedicines.forEach((m) => map.set(m.id, m));
    // Context products (overrides/updates)
    fromContext.forEach((m) => map.set(m.id, m));

    const list = Array.from(map.values());

    return list.filter((med) => {
      // Pharmacy Class filter
      if (classFilter !== 'ALL' && med.pharmacyClass !== classFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = med.name.toLowerCase().includes(q);
        const matchId = med.id.toLowerCase().includes(q);
        const matchBatch = (med.batchNumber || med.batchNo || '').toLowerCase().includes(q);
        const matchCategory = (med.category || '').toLowerCase().includes(q);
        const matchBrand = (med.brand || '').toLowerCase().includes(q);
        return matchName || matchId || matchBatch || matchCategory || matchBrand;
      }

      return true;
    });
  }, [products, customMedicines, classFilter, searchQuery]);

  // Available medicines for Formula Racikan dropdown (excluding racikan itself to prevent loop)
  const availableBaseMedicines = useMemo(() => {
    return pharmacyCatalog.filter((m) => m.pharmacyClass !== 'RACIKAN');
  }, [pharmacyCatalog]);

  // Modal Racikan State
  const [selectedRacikanMedicine, setSelectedRacikanMedicine] = useState<Product | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [formulaComponents, setFormulaComponents] = useState<PharmacyFormulaComponent[]>([]);
  const [embalaseCost, setEmbalaseCost] = useState<number>(2500);
  const [tuslahFee, setTuslahFee] = useState<number>(5000);
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(30);

  // Modal Tambah Obat Baru
  const [isAddMedicineModalOpen, setIsAddMedicineModalOpen] = useState(false);
  const [newMedBarcode, setNewMedBarcode] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [newMedBrand, setNewMedBrand] = useState('Kimia Farma');
  const [newMedCategory, setNewMedCategory] = useState('Obat-Obatan');
  const [newMedClass, setNewMedClass] = useState<PharmacyClass>('OBAT_BEBAS');
  const [newMedBatch, setNewMedBatch] = useState(`BATCH-${Date.now().toString().slice(-4)}`);
  const [newMedExp, setNewMedExp] = useState('2027-12-31');
  const [newMedUnit, setNewMedUnit] = useState<PharmacyPackagingUnit>('Strip');
  const [newMedCost, setNewMedCost] = useState<number | ''>(5000);
  const [newMedSell, setNewMedSell] = useState<number | ''>(7500);
  const [newMedStock, setNewMedStock] = useState<number | ''>(100);

  // Open Racikan Calculator Modal
  const handleOpenRacikanModal = (medicine: Product) => {
    setSelectedRacikanMedicine(medicine);

    if (medicine.pharmacyFormula && medicine.pharmacyFormula.components.length > 0) {
      setFormulaComponents(medicine.pharmacyFormula.components);
      setEmbalaseCost(medicine.pharmacyFormula.embalaseCost ?? 2500);
      setTuslahFee(medicine.pharmacyFormula.tuslahFee ?? 5000);
      setTargetMarginPercent(medicine.pharmacyFormula.targetMarginPercent ?? 30);
    } else {
      // Default initial formula rows
      const firstTwo = availableBaseMedicines.slice(0, 2);
      if (firstTwo.length > 0) {
        setFormulaComponents(
          firstTwo.map((m) => {
            const unitCost = m.packagingUnit === 'Strip' ? Math.round(m.cost_price / 10) : m.cost_price;
            return {
              medicineId: m.id,
              medicineName: m.name,
              dosageQty: 2,
              unit: m.packagingUnit === 'Strip' ? 'Tablet' : m.packagingUnit || 'Tablet',
              costPerUnit: unitCost,
              subtotal: 2 * unitCost,
            };
          })
        );
      } else {
        setFormulaComponents([
          {
            medicineId: '',
            medicineName: '',
            dosageQty: 1,
            unit: 'Tablet',
            costPerUnit: 0,
            subtotal: 0,
          },
        ]);
      }
      setEmbalaseCost(2500);
      setTuslahFee(5000);
      setTargetMarginPercent(30);
    }

    setIsCalculatorOpen(true);
  };

  // Add component row in Racikan modal
  const handleAddComponentRow = () => {
    setFormulaComponents((prev) => [
      ...prev,
      {
        medicineId: '',
        medicineName: '',
        dosageQty: 1,
        unit: 'Tablet',
        costPerUnit: 0,
        subtotal: 0,
      },
    ]);
  };

  // Update component row in Racikan modal
  const handleUpdateComponent = (index: number, updates: Partial<PharmacyFormulaComponent>) => {
    setFormulaComponents((prev) => {
      const next = [...prev];
      const cur = { ...next[index], ...updates };

      if (updates.medicineId !== undefined) {
        if (!updates.medicineId) {
          cur.medicineId = '';
          cur.medicineName = '';
          cur.unit = 'Tablet';
          cur.costPerUnit = 0;
          cur.subtotal = 0;
        } else {
          const matched = availableBaseMedicines.find((m) => m.id === updates.medicineId);
          if (matched) {
            cur.medicineName = matched.name;
            cur.unit = matched.packagingUnit === 'Strip' ? 'Tablet' : matched.packagingUnit || 'Tablet';
            cur.costPerUnit = matched.packagingUnit === 'Strip' ? Math.round(matched.cost_price / 10) : matched.cost_price;
          }
        }
      }

      const qty = typeof cur.dosageQty === 'number' ? cur.dosageQty : Number(cur.dosageQty) || 0;
      const cost = typeof cur.costPerUnit === 'number' ? cur.costPerUnit : Number(cur.costPerUnit) || 0;
      cur.subtotal = Math.round(qty * cost);

      next[index] = cur;
      return next;
    });
  };

  // Remove component row
  const handleRemoveComponent = (index: number) => {
    setFormulaComponents((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Live Calculations
  const liveMedicineCost = useMemo(() => {
    return formulaComponents.reduce((acc, c) => acc + (c.subtotal || 0), 0);
  }, [formulaComponents]);

  const liveTotalCost = useMemo(() => {
    return liveMedicineCost + (Number(embalaseCost) || 0) + (Number(tuslahFee) || 0);
  }, [liveMedicineCost, embalaseCost, tuslahFee]);

  const liveRecommendedPrice = useMemo(() => {
    const margin = Math.min(95, Math.max(0, Number(targetMarginPercent) || 0));
    if (margin >= 100) return liveTotalCost;
    const rawPrice = liveTotalCost / (1 - margin / 100);
    // Round to nearest Rp 500 for clean Indonesian cashier pricing
    return Math.ceil(rawPrice / 500) * 500;
  }, [liveTotalCost, targetMarginPercent]);

  // Save Formula Racikan & Apply to POS Cashier
  const handleSaveFormulaRacikan = (applyToCashierPrice: boolean) => {
    if (!selectedRacikanMedicine) return;

    if (formulaComponents.length === 0) {
      showToast('Masukkan minimal 1 komponen obat racikan!');
      return;
    }

    const formulaCosting: PharmacyFormulaCosting = {
      components: formulaComponents,
      embalaseCost: Number(embalaseCost) || 0,
      tuslahFee: Number(tuslahFee) || 0,
      medicineCost: liveMedicineCost,
      totalCost: liveTotalCost,
      targetMarginPercent: Number(targetMarginPercent) || 0,
      recommendedPrice: liveRecommendedPrice,
    };

    const targetPrice = applyToCashierPrice ? liveRecommendedPrice : selectedRacikanMedicine.sell_price;

    const updatedMed: Product = {
      ...selectedRacikanMedicine,
      cost_price: liveTotalCost,
      sell_price: targetPrice,
      pharmacyFormula: formulaCosting,
    };

    // Update in Context & custom list
    updateProduct(selectedRacikanMedicine.id, {
      cost_price: liveTotalCost,
      sell_price: targetPrice,
      pharmacyFormula: formulaCosting,
    });

    setCustomMedicines((prev) => {
      const idx = prev.findIndex((m) => m.id === selectedRacikanMedicine.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updatedMed;
        return next;
      }
      return [updatedMed, ...prev];
    });

    setIsCalculatorOpen(false);
    showToast(
      applyToCashierPrice
        ? `Formula racikan "${selectedRacikanMedicine.name}" disimpan! Harga kasir disinkronkan ke Rp ${targetPrice.toLocaleString('id-ID')}`
        : `Formula racikan "${selectedRacikanMedicine.name}" berhasil disimpan!`
    );
  };

  // Save New Medicine
  const handleSaveNewMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) {
      showToast('Nama obat wajib diisi!');
      return;
    }

    const costVal = Number(newMedCost) || 0;
    const sellVal = Number(newMedSell) || 0;
    const stockVal = Number(newMedStock) || 0;
    const newId = `MED-${Date.now().toString().slice(-4)}`;

    const newMed: Product = {
      id: newId,
      plu: newId,
      barcode: newMedBarcode.trim() || `899${Date.now().toString().slice(-8)}`,
      name: newMedName.trim(),
      brand: newMedBrand.trim() || 'Apotek Mandiri',
      category: newMedCategory.trim() || 'Obat Farmasi',
      pharmacyClass: newMedClass,
      drugClass:
        newMedClass === 'OBAT_BEBAS'
          ? 'Obat Bebas'
          : newMedClass === 'OBAT_BEBAS_TERBATAS'
          ? 'Obat Bebas Terbatas'
          : newMedClass === 'OBAT_KERAS'
          ? 'Obat Keras (Resep)'
          : 'Obat Racikan',
      batchNumber: newMedBatch.trim() || `BATCH-${newId}`,
      batchNo: newMedBatch.trim() || `BATCH-${newId}`,
      expiryDate: newMedExp || '2027-12-31',
      expDate: newMedExp || '2027-12-31',
      packagingUnit: newMedUnit,
      unit: newMedUnit,
      cost_price: costVal,
      sell_price: sellVal,
      stock: stockVal,
      min_stock: 15,
      status: 'Active',
      businessModel: 'pharmacy',
    };

    addProduct(newMed);
    setCustomMedicines((prev) => [newMed, ...prev]);

    setIsAddMedicineModalOpen(false);
    showToast(`Obat "${newMed.name}" berhasil ditambahkan ke katalog farmasi!`);

    // Reset Form
    setNewMedName('');
    setNewMedCost(5000);
    setNewMedSell(7500);
    setNewMedStock(100);
  };

  // Helper Badge Golongan Obat (Sesuai Regulasi BPOM RI)
  const renderPharmacyClassBadge = (pharmClass?: PharmacyClass) => {
    switch (pharmClass) {
      case 'OBAT_BEBAS':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/40"
            title="Obat Bebas: Dapat dibeli tanpa resep dokter di apotek dan toko obat berizin."
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] border border-emerald-300 shrink-0" />
            <span>Bebas (Hijau)</span>
          </span>
        );
      case 'OBAT_BEBAS_TERBATAS':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-500/15 text-[#0052FF] dark:text-[#58a6ff] border border-blue-500/40"
            title="Obat Bebas Terbatas: Obat keras yang dapat dibeli tanpa resep dokter dengan tanda peringatan khusus P.No. 1 - 6."
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#0052FF] dark:bg-[#58a6ff] shadow-[0_0_8px_rgba(96,165,250,0.8)] border border-blue-300 shrink-0" />
            <span>Bebas Terbatas (Biru)</span>
          </span>
        );
      case 'OBAT_KERAS':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/40"
            title="Obat Keras: Harus dengan Resep Dokter. Lingkaran bulat merah dengan garis tepi hitam dan huruf K di tengah."
          >
            <span className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-black text-[9px] flex items-center justify-center border border-black shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0">
              K
            </span>
            <span>Keras (Merah 'K')</span>
          </span>
        );
      case 'RACIKAN':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.25)]"
            title="Obat Racikan: Diformulasikan khusus oleh Apoteker dari kombinasi bahan obat, biaya embalase & tuslah."
          >
            <FlaskConical className="w-3 h-3 text-purple-400 shrink-0 animate-pulse" />
            <span>Racikan (Ungu)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-600/30">
            Standar
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner / Header */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-400 flex items-center justify-center font-black shadow-[0_0_15px_rgba(20,184,166,0.3)]">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Pharmacy & Healthcare
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-tambah-obat-baru"
            onClick={() => setIsAddMedicineModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Obat Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className={`p-4 border-2 rounded-2xl relative overflow-hidden flex items-center gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl active:scale-95 border-teal-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(45,212,191,0.4)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent ${
          isLight ? 'bg-white' : 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Total Obat Terdaftar</span>
            <span className="text-lg font-black font-mono text-teal-400">{pharmacyCatalog.length} SKU Obat</span>
          </div>
        </div>

        <div className={`p-4 border-2 rounded-2xl relative overflow-hidden flex items-center gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl active:scale-95 border-purple-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(168,85,247,0.4)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent ${
          isLight ? 'bg-white' : 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Formula Racikan Aktif</span>
            <span className="text-lg font-black font-mono text-purple-400">
              {pharmacyCatalog.filter((m) => m.pharmacyClass === 'RACIKAN').length} Formula
            </span>
          </div>
        </div>

        <div className={`p-4 border-2 rounded-2xl relative overflow-hidden flex items-center gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl active:scale-95 border-rose-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(244,63,94,0.4)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent ${
          isLight ? 'bg-white' : 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Obat Keras (K / Resep)</span>
            <span className="text-lg font-black font-mono text-rose-400">
              {pharmacyCatalog.filter((m) => m.pharmacyClass === 'OBAT_KERAS').length} SKU Resep
            </span>
          </div>
        </div>

        <div className={`p-4 border-2 rounded-2xl relative overflow-hidden flex items-center gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl active:scale-95 border-amber-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(245,158,11,0.4)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent ${
          isLight ? 'bg-white' : 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Jasa Tuslah Standar</span>
            <span className="text-lg font-black font-mono text-amber-400">Rp 5.000 / Rck</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Golongan */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#161b22] border-[#30363d]'
      }`}>
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode obat, nama generik/paten, no batch, atau kategori farmasi..."
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                  : 'bg-[#0d1117] border-[#30363d] text-white focus:border-teal-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Golongan Obat */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'ALL', label: 'Semua Golongan' },
                { id: 'OBAT_BEBAS', label: 'Bebas (Hijau)' },
                { id: 'OBAT_BEBAS_TERBATAS', label: 'Bebas Terbatas (Biru)' },
                { id: 'OBAT_KERAS', label: 'Keras (K)' },
                { id: 'RACIKAN', label: 'Racikan' },
              ] as const
            ).map((filterItem) => (
              <button
                key={filterItem.id}
                type="button"
                onClick={() => setClassFilter(filterItem.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  classFilter === filterItem.id
                    ? 'bg-teal-500 text-slate-950 font-black shadow-xs'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    : 'bg-[#0d1117] hover:bg-[#21262d] text-gray-400 border border-[#30363d]'
                }`}
              >
                {filterItem.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-400 font-mono">
          Menampilkan <strong className="text-teal-400 font-black">{pharmacyCatalog.length}</strong> obat
        </div>
      </div>

      {/* Tabel Katalog Obat Farmasi */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`border-b text-[11px] font-black uppercase tracking-wider ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0d1117] text-gray-400 border-[#30363d]'
            }`}>
              <tr>
                <th className="py-3.5 px-4">Kode & Nama Obat</th>
                <th className="py-3.5 px-3">Golongan Obat (Regulasi)</th>
                <th className="py-3.5 px-3">No. Batch</th>
                <th className="py-3.5 px-3">Tgl Kadaluarsa (Exp)</th>
                <th className="py-3.5 px-3 text-center">Satuan Eceran</th>
                <th className="py-3.5 px-3 text-right">Stok Gudang</th>
                <th className="py-3.5 px-3 text-right">Harga Modal (HPP)</th>
                <th className="py-3.5 px-3 text-right">Harga Kasir (POS)</th>
                <th className="py-3.5 px-4 text-center">Aksi / Tuslah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#30363d]/60">
              {pharmacyCatalog.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <Pill className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <p className="font-semibold text-sm">Tidak ada obat farmasi yang ditemukan</p>
                    <p className="text-xs text-gray-500 mt-0.5">Silakan ganti kata kunci pencarian atau filter golongan obat</p>
                  </td>
                </tr>
              ) : (
                pharmacyCatalog.map((med, medIdx) => {
                  const isRacikan = med.pharmacyClass === 'RACIKAN';
                  const formulaCount = med.pharmacyFormula?.components?.length || 0;

                  return (
                    <tr
                      key={`pharma-med-row-${med.id}-${medIdx}`}
                      className={`transition ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-[#1f242c]'
                      } ${isRacikan ? (isLight ? 'bg-purple-50/40' : 'bg-purple-950/10') : ''}`}
                    >
                      {/* Kode & Nama Obat */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isRacikan
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                          }`}>
                            {isRacikan ? <FlaskConical className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-xs block text-slate-900 dark:text-white line-clamp-1">
                              {med.name}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-mono">
                              Kode: <strong className="text-teal-600 dark:text-teal-400">{med.id}</strong> {med.barcode ? `• Barcode: ${med.barcode}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Golongan Obat */}
                      <td className="py-3 px-3">
                        {renderPharmacyClassBadge(med.pharmacyClass)}
                      </td>

                      {/* No. Batch */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-gray-300 text-[11px]">
                        {med.batchNumber || med.batchNo || '-'}
                      </td>

                      {/* Tgl Kadaluarsa */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-700 dark:text-gray-300">
                          <Calendar className="w-3 h-3 text-slate-400 dark:text-gray-400" />
                          <span>{med.expiryDate || med.expDate || '-'}</span>
                        </div>
                      </td>

                      {/* Satuan Eceran */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/80 dark:bg-black/30 border border-slate-300 dark:border-gray-700 text-slate-700 dark:text-gray-300 font-mono">
                          {med.packagingUnit || med.unit || 'Pcs'}
                        </span>
                      </td>

                      {/* Stok Gudang */}
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={med.stock <= 15 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-800 dark:text-gray-200'}>
                          {med.stock.toLocaleString('id-ID')}
                        </span>
                      </td>

                      {/* Harga Modal HPP */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-gray-300">
                        Rp {med.cost_price.toLocaleString('id-ID')}
                      </td>

                      {/* Harga Jual Kasir */}
                      <td className="py-3 px-3 text-right font-mono font-black text-teal-600 dark:text-teal-400 text-sm">
                        Rp {med.sell_price.toLocaleString('id-ID')}
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-3 px-4 text-center">
                        {isRacikan ? (
                          <button
                            type="button"
                            id={`btn-atur-racikan-${med.id.toLowerCase()}`}
                            onClick={() => handleOpenRacikanModal(med)}
                            className="px-3 py-1.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                            title="Atur Skema Bahan Racikan & Biaya Tuslah"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            <span>Atur Racikan & Tuslah</span>
                            {formulaCount > 0 && (
                              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-purple-900 border border-purple-400">
                                {formulaCount}
                              </span>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenRacikanModal(med)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-300 dark:border-gray-700 text-gray-400 hover:text-white hover:bg-slate-800 transition cursor-pointer inline-flex items-center gap-1"
                            title="Buat formula racikan berbasis obat ini"
                          >
                            <Calculator className="w-3 h-3" />
                            <span>Racik</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL KALKULATOR OBAT RACIKAN & BIAYA TUSLAH                              */}
      {/* ========================================================================= */}
      {isCalculatorOpen && selectedRacikanMedicine && (
        <div
          id="modal-kalkulator-racikan"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsCalculatorOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center font-black shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                    <span>Kalkulator Obat Racikan & Tuslah Apoteker:</span>
                    <span className="text-purple-400">{selectedRacikanMedicine.name}</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Kode: <strong className="text-white">{selectedRacikanMedicine.id}</strong> • Satuan:{' '}
                    {selectedRacikanMedicine.packagingUnit || 'Paket'} • Harga Kasir Saat Ini:{' '}
                    <strong className="text-teal-400">Rp {selectedRacikanMedicine.sell_price.toLocaleString('id-ID')}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Tutup Modal [Esc]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Bagian 1: Skema Komposisi Obat (BOM Farmasi) */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-gray-200">
                      1. Komposisi Bahan Baku Obat (BOM Farmasi / Takaran Dosis)
                    </h4>
                  </div>
                  <button
                    type="button"
                    id="btn-tambah-komponen-obat"
                    onClick={handleAddComponentRow}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1 cursor-pointer transition shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Komponen Obat</span>
                  </button>
                </div>

                {/* Tabel Komponen */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b text-[10px] font-black uppercase text-gray-400 ${
                      isLight ? 'bg-slate-200/60' : 'bg-black/20'
                    }`}>
                      <tr>
                        <th className="py-2 px-2.5">Pilih Obat dari Gudang</th>
                        <th className="py-2 px-2 text-right w-28">Dosis Takaran</th>
                        <th className="py-2 px-2 text-center w-24">Satuan Dosis</th>
                        <th className="py-2 px-2 text-right w-28">Biaya / Satuan</th>
                        <th className="py-2 px-2 text-right w-32">Subtotal Modal</th>
                        <th className="py-2 px-2 text-center w-12">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
                      {formulaComponents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-gray-400">
                            Belum ada obat dalam racikan. Klik "+ Tambah Komponen Obat" untuk menambahkan.
                          </td>
                        </tr>
                      ) : (
                        formulaComponents.map((row, rIdx) => (
                          <tr key={`formula-row-${rIdx}`} className="hover:bg-black/10">
                            {/* Dropdown Obat */}
                            <td className="py-2 px-2">
                              <select
                                value={row.medicineId || ''}
                                onChange={(e) => handleUpdateComponent(rIdx, { medicineId: e.target.value })}
                                className={`w-full py-1.5 px-2 rounded-lg text-xs border font-medium outline-none cursor-pointer ${
                                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                                } ${!row.medicineId ? 'border-amber-500/70 text-amber-500 font-bold' : ''}`}
                              >
                                <option value="">-- Pilih Obat dari Gudang Farmasi --</option>
                                {availableBaseMedicines.map((med, medIdx) => (
                                  <option key={`base-med-opt-${med.id}-${medIdx}`} value={med.id}>
                                    {med.name} ({med.packagingUnit || 'Pcs'}) - Rp {med.cost_price.toLocaleString('id-ID')}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Dosis Takaran */}
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={row.dosageQty === 0 ? '' : row.dosageQty}
                                onChange={(e) => handleUpdateComponent(rIdx, { dosageQty: Number(e.target.value) || 0 })}
                                placeholder="1"
                                className={`w-full py-1.5 px-2 rounded-lg text-right font-mono font-bold text-xs border outline-none ${
                                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                                }`}
                              />
                            </td>

                            {/* Satuan Dosis */}
                            <td className="py-2 px-2 text-center text-gray-400 font-mono">
                              {row.medicineId ? row.unit : '-'}
                            </td>

                            {/* Biaya per unit */}
                            <td className="py-2 px-2 text-right font-mono text-gray-400">
                              {row.medicineId ? `Rp ${row.costPerUnit.toLocaleString('id-ID')}` : 'Rp 0'}
                            </td>

                            {/* Subtotal Biaya */}
                            <td className="py-2 px-2 text-right font-mono font-black text-slate-900 dark:text-purple-300">
                              Rp {row.subtotal.toLocaleString('id-ID')}
                            </td>

                            {/* Tombol Hapus */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveComponent(rIdx)}
                                className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                                title="Hapus komponen obat"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-gray-800 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Subtotal Biaya Bahan Obat Murni:</span>
                  <span className="font-mono font-black text-sm text-purple-400">
                    Rp {liveMedicineCost.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Bagian 2: Embalase & Tuslah Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Biaya Embalase */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-400" />
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-gray-200">
                      2. Biaya Embalase (Kemasan / Wadah)
                    </h4>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Biaya cangkang kapsul kosong, pot salep plastik, klip obat beretiket, atau kertas puyer per racikan.
                  </p>
                  <div className="relative pt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-gray-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={embalaseCost || ''}
                      onChange={(e) => setEmbalaseCost(Number(e.target.value) || 0)}
                      className={`w-full py-2 pl-10 pr-3 rounded-xl font-mono font-black text-sm border outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                          : 'bg-[#161b22] border-[#30363d] text-white focus:border-blue-500'
                      }`}
                      placeholder="2500"
                    />
                  </div>
                </div>

                {/* Biaya Tuslah Jasa Apoteker */}
                <div className={`p-4 rounded-xl border space-y-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-gray-200">
                      3. Biaya Tuslah (Jasa Racik Apoteker)
                    </h4>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Kompensasi keahlian teknis farmasis/apoteker dalam peracikan, penghalusan, dan pengemasan resep.
                  </p>
                  <div className="relative pt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-gray-400">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={tuslahFee || ''}
                      onChange={(e) => setTuslahFee(Number(e.target.value) || 0)}
                      className={`w-full py-2 pl-10 pr-3 rounded-xl font-mono font-black text-sm border outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
                          : 'bg-[#161b22] border-[#30363d] text-white focus:border-amber-500'
                      }`}
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>

              {/* Target Margin Slider */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-gray-200">
                    4. Target Margin Keuntungan Apotek (%)
                  </h4>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={targetMarginPercent}
                    onChange={(e) => setTargetMarginPercent(Number(e.target.value))}
                    className="flex-1 accent-teal-500 cursor-pointer"
                  />
                  <div className="relative w-24">
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={targetMarginPercent}
                      onChange={(e) => setTargetMarginPercent(Number(e.target.value) || 0)}
                      className={`w-full py-1.5 px-2 text-right font-mono font-black rounded-lg border outline-none text-sm ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                      }`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-gray-400 pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Live Hasil Kalkulasi Otomatis */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-black/60 border border-purple-500/40 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                    <h4 className="font-black text-sm uppercase tracking-wide text-white">
                      Hasil Kalkulasi HPP Racikan & Rekomendasi Harga Jual
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold text-[10px]">
                    Formula: (Bahan + Embalase + Tuslah) / (1 - Margin%)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Subtotal Obat</span>
                    <span className="font-mono font-bold text-sm text-gray-200">
                      Rp {liveMedicineCost.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Embalase + Tuslah</span>
                    <span className="font-mono font-bold text-sm text-blue-400">
                      Rp {((Number(embalaseCost) || 0) + (Number(tuslahFee) || 0)).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Total HPP Racikan</span>
                    <span className="font-mono font-black text-sm text-rose-400">
                      Rp {liveTotalCost.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-500/40">
                    <span className="text-[10px] text-teal-300 uppercase font-extrabold block mb-1">Estimasi Laba Bersih</span>
                    <span className="font-mono font-black text-sm text-teal-400">
                      +Rp {Math.max(0, liveRecommendedPrice - liveTotalCost).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Highlight Rekomendasi Harga Jual Kasir */}
                <div className="p-4 rounded-xl bg-black/50 border border-teal-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-gray-300 block font-medium">
                      Rekomendasi Harga Jual Kasir Baru (Target {targetMarginPercent}% Margin):
                    </span>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-teal-400 tracking-tight">
                      Rp {liveRecommendedPrice.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 block">Harga Kasir POS Saat Ini:</span>
                    <span className="text-sm font-mono font-bold text-gray-300 line-through">
                      Rp {selectedRacikanMedicine.sell_price.toLocaleString('id-ID')}
                    </span>
                    {selectedRacikanMedicine.sell_price !== liveRecommendedPrice && (
                      <span className="text-[11px] text-teal-400 block font-bold">
                        Selisih:{' '}
                        {liveRecommendedPrice > selectedRacikanMedicine.sell_price ? '+' : ''}
                        Rp {(liveRecommendedPrice - selectedRacikanMedicine.sell_price).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}>
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition cursor-pointer"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveFormulaRacikan(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isLight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                      : 'bg-slate-800 hover:bg-slate-700 text-gray-300 border-gray-700'
                  }`}
                  title="Simpan formula racikan tanpa mengubah harga jual di kasir POS"
                >
                  Simpan Formula Saja
                </button>

                <button
                  type="button"
                  id="btn-simpan-formula-racikan"
                  onClick={() => handleSaveFormulaRacikan(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  title="Simpan formula racikan dan perbarui harga jual di kasir POS secara instan"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Formula Racikan & Terapkan ke Kasir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INPUT OBAT BARU                                                     */}
      {/* ========================================================================= */}
      {isAddMedicineModalOpen && (
        <div
          id="modal-tambah-obat-baru"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsAddMedicineModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-bold">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Tambah Obat Baru ke Master Farmasi</h3>
                  <p className="text-[11px] text-gray-400">Registrasi obat generik / paten / racikan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMedicineModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewMedicine} className="p-4 sm:p-5 space-y-3.5 text-xs">
              {/* Barcode Scanner Full-Width Paling Atas (Posisi 1) */}
              <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                isLight ? 'bg-teal-50/90 border-teal-300 shadow-sm' : 'bg-teal-500/10 border-teal-500/40'
              }`}>
                <label className="block text-[11px] font-extrabold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. Barcode / SKU Scanner Obat (Auto-Fill Atas) *</span>
                </label>
                <input
                  type="text"
                  value={newMedBarcode}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewMedBarcode(val);
                    const found = products.find(p => p.id === val || p.barcode === val);
                    if (found) {
                      setNewMedName(found.name);
                      setNewMedBrand(found.brand || 'Kimia Farma');
                      setNewMedCategory(found.category || 'Obat-Obatan');
                      setNewMedCost(found.cost_price || 5000);
                      setNewMedSell(found.sell_price || 7500);
                      setNewMedStock(found.stock ?? 100);
                      showToast(`Auto-fill obat: ${found.name}`);
                    }
                  }}
                  placeholder="Scan barcode fisik atau ketik kode obat..."
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-mono font-bold outline-none ${
                    isLight ? 'bg-white border-teal-400 text-slate-900' : 'bg-slate-950 border-teal-500 text-teal-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Nama Obat & Dosis <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="Contoh: Ibuprofen 400mg Strip 10 Tablet"
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold outline-none transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-teal-500'
                      : 'bg-[#0d1117] border-[#30363d] text-white focus:border-teal-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Golongan Regulasi BPOM <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newMedClass}
                    onChange={(e) => setNewMedClass(e.target.value as PharmacyClass)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <option value="OBAT_BEBAS">Obat Bebas (Hijau)</option>
                    <option value="OBAT_BEBAS_TERBATAS">Obat Bebas Terbatas (Biru)</option>
                    <option value="OBAT_KERAS">Obat Keras (Merah 'K')</option>
                    <option value="RACIKAN">Obat Racikan (Ungu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Satuan Eceran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newMedUnit}
                    onChange={(e) => setNewMedUnit(e.target.value as PharmacyPackagingUnit)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold outline-none cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  >
                    <option value="Strip">Strip</option>
                    <option value="Tablet">Tablet / Kaplet</option>
                    <option value="Botol">Botol</option>
                    <option value="Tube">Tube</option>
                    <option value="Box">Box</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Nomor Batch Pabrik
                  </label>
                  <input
                    type="text"
                    value={newMedBatch}
                    onChange={(e) => setNewMedBatch(e.target.value)}
                    placeholder="BATCH-IBU2401"
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-semibold outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Tanggal Kadaluarsa (Exp)
                  </label>
                  <input
                    type="date"
                    value={newMedExp}
                    onChange={(e) => setNewMedExp(e.target.value)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-semibold outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Harga Modal (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newMedCost === '' ? '' : newMedCost}
                    onChange={(e) => setNewMedCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Harga Jual Kasir <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newMedSell === '' ? '' : newMedSell}
                    onChange={(e) => setNewMedSell(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-black text-teal-400 outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-[#0d1117] border-[#30363d]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMedStock === '' ? '' : newMedStock}
                    onChange={(e) => setNewMedStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-semibold outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Form Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMedicineModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-simpan-obat-baru"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition active:scale-95 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Obat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
