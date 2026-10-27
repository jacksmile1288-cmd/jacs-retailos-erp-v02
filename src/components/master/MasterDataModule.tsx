import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, BrandMaster, CategoryMaster, SupplierMaster, CustomerMaster, Sale } from '../../types';
import { getReactiveNeonGlowStyle } from '../../utils/neonGlow';
import {
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_SUPPLIERS,
  INITIAL_ERP_MASTER_PRODUCTS,
  ERP_CATEGORIES,
  ERP_CATEGORY_MAPPING,
  getErpCategoryInfo,
  getBrandCategoryMapping,
  getCleanCategoryName,
  getCleanDepartmentName,
  ERP_CATALOG_MAPPING,
  MASTER_LOCAL_SUPPLIERS,
  getDefaultSupplierForCategory,
  formatWhatsAppLink,
  generateInternalProductCode,
  LocalSupplierItem,
  ErpCatalogItem,
  ErpCategoryItem,
} from '../../data/canonicalMasterData';
import {
  BUSINESS_MODEL_TEMPLATES,
  BusinessModelType,
  validateCsvContent,
  ColumnValidationReport,
} from '../../data/businessModelTemplates';
import {
  Database,
  Building2,
  Layers,
  Package,
  Truck,
  Users,
  Search,
  HardHat,
  Lock,
  Plus,
  Upload,
  Download,
  Printer,
  Save,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  ArrowLeft,
  Filter,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  RefreshCw,
  ShoppingCart,
  UtensilsCrossed,
  Pill,
  Shirt,
  Smartphone,
  Sparkles,
  AlertTriangle,
  FileText,
  Check,
  Scan,
  Wrench,
  Scissors,
  Tag,
  MessageCircle,
  Phone,
  ExternalLink,
  Zap,
  MapPin,
} from 'lucide-react';
import { QuickBarcodeModal } from './QuickBarcodeModal';
import { AiSmartMapperModal } from './AiSmartMapperModal';
import { BarcodeLabelStudioModal } from './BarcodeLabelStudioModal';
import { BomRecipeModal } from './BomRecipeModal';
import { FBMasterModule } from './FBMasterModule';
import { PharmacyMasterModule } from './PharmacyMasterModule';
import { BuildingMaterialsMasterModule } from './BuildingMaterialsMasterModule';
import { DataMigrationModal } from './DataMigrationModal';
import { fuzzyMatchAny } from '../../utils/fuzzySearch';

// Helper to format string into Title Case
export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => {
      if (!word) return '';
      // Keep measure units lowercase suffix like 600ml, 85g, 2L, 250ml, 5kg
      if (/^\d+[a-zA-Z]+$/.test(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

export interface SessionUpdateItem {
  id: string;
  timestamp: string;
  date: string;
  barcode: string;
  name: string;
  variant: string;
  category: string;
  brand: string;
  manufacture: string;
  supplier: string;
  uom: string;
  qty: number;
  costPrice: number;
  priceRetail: number;
  priceMember: number;
  priceWholesale: number;
  paymentMethod: string;
}

// Official Master Data re-exports
export {
  ERP_CATEGORIES,
  ERP_CATEGORY_MAPPING,
  getErpCategoryInfo,
  ERP_CATALOG_MAPPING,
  MASTER_LOCAL_SUPPLIERS,
  getDefaultSupplierForCategory,
  formatWhatsAppLink,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_SUPPLIERS,
  INITIAL_ERP_MASTER_PRODUCTS,
};
export type { ErpCategoryItem, ErpCatalogItem, LocalSupplierItem };

// 30 Official Canonical ERP Master Products (re-exported)
export const RAW_ERP_MASTER_PRODUCTS: Product[] = INITIAL_ERP_MASTER_PRODUCTS;
export const INITIAL_30_DUMMY_PRODUCTS = INITIAL_ERP_MASTER_PRODUCTS;

export type IndustryId =
  | 'retail'
  | 'fnb'
  | 'pharmacy'
  | 'fashion'
  | 'electronics'
  | 'automotive'
  | 'building'
  | 'services';

export type IndustryBarId = IndustryId;

export type MasterTab =
  | IndustryId
  | 'portal'
  | 'overview'
  | 'brand'
  | 'category'
  | 'product'
  | 'supplier'
  | 'customer'
  | 'fnb_costing'
  | 'pharmacy_master'
  | 'building_material';

export interface IndustryBlockDef {
  id: IndustryId;
  name: string;
  emoji: string;
  subFeature: string;
  tag?: string;
  desc?: string;
  colorName?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  borderClass: string;
  hoverBorder: string;
  glowShadow: string;
  hoverGlow: string;
  activeRing: string;
  solidBg: string;
  lightBg: string;
  badgeBg?: string;
  buttonColor: string;
  features?: string[];
}

export type IndustryBarDef = IndustryBlockDef;

export const EIGHT_INDUSTRY_BLOCKS: IndustryBlockDef[] = [
  {
    id: 'retail',
    name: 'Retail & Wholesaler Modern',
    emoji: '🛒',
    icon: ShoppingCart,
    iconColor: 'text-cyan-300',
    subFeature: 'Toko Kelontong, Minimarket & Grosir',
    borderClass: 'border-cyan-400/90',
    hoverBorder: 'hover:border-cyan-300',
    glowShadow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    hoverGlow: 'hover:shadow-[0_0_35px_rgba(6,182,212,0.65)]',
    activeRing: 'active:ring-cyan-400',
    solidBg: 'bg-[#0c1424]',
    lightBg: 'bg-cyan-50/90',
    buttonColor: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
  },
  {
    id: 'fnb',
    name: 'Food & Beverage (F&B)',
    emoji: '🍳',
    icon: UtensilsCrossed,
    iconColor: 'text-amber-300',
    subFeature: 'Resto, Kafe & Resep BOM HPP',
    borderClass: 'border-amber-400/90',
    hoverBorder: 'hover:border-amber-300',
    glowShadow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    hoverGlow: 'hover:shadow-[0_0_35px_rgba(245,158,11,0.65)]',
    activeRing: 'active:ring-amber-400',
    solidBg: 'bg-[#1a1409]',
    lightBg: 'bg-amber-50/90',
    buttonColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy & Pet Shop',
    emoji: '💊🐾',
    icon: Pill,
    iconColor: 'text-rose-300',
    subFeature: 'Apotek, Obat Hewan, Pakan & Pet Care',
    borderClass: 'border-rose-400/90',
    hoverBorder: 'hover:border-rose-300',
    glowShadow: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]',
    hoverGlow: 'hover:shadow-[0_0_35px_rgba(244,63,94,0.65)]',
    activeRing: 'active:ring-rose-400',
    solidBg: 'bg-[#1a0c12]',
    lightBg: 'bg-rose-50/90',
    buttonColor: 'bg-rose-500 hover:bg-rose-400 text-white',
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    emoji: '👗',
    icon: Shirt,
    iconColor: 'text-fuchsia-300',
    subFeature: 'Matriks Varian Size & Warna',
    borderClass: 'border-fuchsia-400/90',
    hoverBorder: 'hover:border-fuchsia-300',
    glowShadow: 'shadow-[0_0_20px_rgba(217,70,239,0.4)]',
    hoverGlow: 'hover:shadow-[0_0_35px_rgba(217,70,239,0.65)]',
    activeRing: 'active:ring-fuchsia-400',
    solidBg: 'bg-[#1a0a1e]',
    lightBg: 'bg-fuchsia-50/90',
    buttonColor: 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white',
  },
  {
    id: 'building',
    name: 'Building Materials & Hardware',
    emoji: '🏗️',
    icon: HardHat,
    iconColor: 'text-emerald-300',
    subFeature: 'Semen, Cat, Besi & Alat Teknik',
    borderClass: 'border-emerald-400/90',
    hoverBorder: 'hover:border-emerald-300',
    glowShadow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    hoverGlow: 'hover:shadow-[0_0_35px_rgba(16,185,129,0.65)]',
    activeRing: 'active:ring-emerald-400',
    solidBg: 'bg-[#0b1a13]',
    lightBg: 'bg-emerald-50/90',
    buttonColor: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
  },
  {
    id: 'electronics',
    name: 'Electronics & Gadgets',
    emoji: '📱',
    icon: Smartphone,
    iconColor: 'text-violet-300',
    subFeature: 'Serial IMEI & Garansi Toko/Resmi',
    borderClass: 'border-violet-400/90',
    hoverBorder: 'hover:border-violet-300',
    glowShadow: 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
    hoverGlow: 'hover:shadow-[0_0_35px_rgba(139,92,246,0.65)]',
    activeRing: 'active:ring-violet-400',
    solidBg: 'bg-[#0f0c24]',
    lightBg: 'bg-violet-50/90',
    buttonColor: 'bg-violet-500 hover:bg-violet-400 text-white',
  },
  {
    id: 'automotive',
    name: 'Automotive & Workshop',
    emoji: '🔧',
    icon: Wrench,
    iconColor: 'text-orange-300',
    subFeature: 'Jasa Servis, Sparepart & Nopol',
    borderClass: 'border-orange-400/90',
    hoverBorder: 'hover:border-orange-300',
    glowShadow: 'shadow-[0_0_20px_rgba(249,115,22,0.4)]',
    hoverGlow: 'hover:shadow-[0_0_35px_rgba(249,115,22,0.65)]',
    activeRing: 'active:ring-orange-400',
    solidBg: 'bg-[#1c1108]',
    lightBg: 'bg-orange-50/90',
    buttonColor: 'bg-orange-500 hover:bg-orange-400 text-white',
  },
  {
    id: 'services',
    name: 'Salon & Barbershop',
    emoji: '💈',
    icon: Scissors,
    iconColor: 'text-teal-300',
    subFeature: 'Antrean Layanan, Kapster & Perawatan',
    borderClass: 'border-teal-400/90',
    hoverBorder: 'hover:border-teal-300',
    glowShadow: 'shadow-[0_0_20px_rgba(45,212,191,0.4)]',
    hoverGlow: 'hover:shadow-[0_0_35px_rgba(45,212,191,0.65)]',
    activeRing: 'active:ring-teal-400',
    solidBg: 'bg-[#0a1818]',
    lightBg: 'bg-teal-50/90',
    buttonColor: 'bg-teal-500 hover:bg-teal-400 text-slate-950',
  },
];

export const EIGHT_INDUSTRY_BARS = EIGHT_INDUSTRY_BLOCKS;

const RestockRow: React.FC<{ product: Product; isLight: boolean; updateProduct: any; showToast: any; addAuditLog: any }> = ({ product, isLight, updateProduct, showToast, addAuditLog }) => {
  const [stockVal, setStockVal] = useState(product.stock ?? 0);
  const [costVal, setCostVal] = useState(product.cost_price ?? 0);
  const [retailVal, setRetailVal] = useState(product.price_retail ?? product.sell_price ?? 0);
  const [memberVal, setMemberVal] = useState(product.price_member ?? Math.round((product.price_retail ?? product.sell_price ?? 0) * 0.95));
  const [wholesaleVal, setWholesaleVal] = useState(product.price_wholesale ?? Math.round((product.price_retail ?? product.sell_price ?? 0) * 0.90));
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    updateProduct(product.id, {
      stock: Number(stockVal) || 0,
      cost_price: Number(costVal) || 0,
      price_retail: Number(retailVal) || 0,
      sell_price: Number(retailVal) || 0,
      price_member: Number(memberVal) || 0,
      price_wholesale: Number(wholesaleVal) || 0,
      status: Number(stockVal) > 0 ? 'Active' : 'Out of Stock',
    });
    setIsSaved(true);
    showToast(`Stok & Harga "${product.name}" berhasil diperbarui!`);
    addAuditLog(`Restock / Update: ${product.name} (Stok: ${stockVal}, Ecer: Rp ${retailVal})`, 'MASTER_DATA');
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <tr className={`border-b ${isLight ? 'hover:bg-slate-50' : 'hover:bg-cyan-500/5'} transition`}>
      <td className="px-3.5 py-2 font-mono text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap">
        {product.barcode || product.id}
      </td>
      <td className="px-3.5 py-2 font-bold max-w-[200px] truncate" title={product.name}>
        {product.name}
      </td>
      <td className="px-3.5 py-2 text-center">
        <input
          type="number"
          value={stockVal}
          onChange={(e) => setStockVal(parseInt(e.target.value) || 0)}
          className={`w-20 px-2 py-1 rounded text-center font-mono font-bold text-xs border ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-black/30 border-gray-700 text-white'
          }`}
        />
      </td>
      <td className="px-3.5 py-2 text-right font-mono">
        <input
          type="number"
          value={costVal}
          onChange={(e) => setCostVal(parseFloat(e.target.value) || 0)}
          className={`w-28 px-2 py-1 rounded text-right font-mono text-xs border ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-black/30 border-gray-700 text-white'
          }`}
        />
      </td>
      <td className="px-3.5 py-2 text-right font-mono">
        <input
          type="number"
          value={retailVal}
          onChange={(e) => {
            const v = parseFloat(e.target.value) || 0;
            setRetailVal(v);
            setMemberVal(Math.round(v * 0.95));
            setWholesaleVal(Math.round(v * 0.90));
          }}
          className={`w-28 px-2 py-1 rounded text-right font-mono font-bold text-xs border ${
            isLight ? 'bg-white border-teal-400 text-emerald-900' : 'bg-black/30 border-cyan-500/50 text-cyan-200'
          }`}
        />
      </td>
      <td className="px-3.5 py-2 text-right font-mono">
        <input
          type="number"
          value={memberVal}
          onChange={(e) => setMemberVal(parseFloat(e.target.value) || 0)}
          className={`w-28 px-2 py-1 rounded text-right font-mono text-xs border ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-black/30 border-gray-700 text-white'
          }`}
        />
      </td>
      <td className="px-3.5 py-2 text-right font-mono">
        <input
          type="number"
          value={wholesaleVal}
          onChange={(e) => setWholesaleVal(parseFloat(e.target.value) || 0)}
          className={`w-28 px-2 py-1 rounded text-right font-mono text-xs border ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-black/30 border-gray-700 text-white'
          }`}
        />
      </td>
      <td className="px-3.5 py-2 text-center whitespace-nowrap">
        <button
          type="button"
          onClick={handleSave}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            isSaved
              ? 'bg-emerald-500 text-white'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm'
          }`}
        >
          {isSaved ? '✓ Tersimpan' : 'Simpan'}
        </button>
      </td>
    </tr>
  );
};

export const MasterDataModule: React.FC = () => {
  const {
    products,
    setProducts,
    addProduct,
    addProductsBulk,
    updateProduct,
    deleteProduct,
    brands,
    setBrands,
    categoriesMaster,
    setCategoriesMaster,
    suppliers,
    setSuppliers,
    customers,
    setCustomers,
    sales,
    showToast,
    addAuditLog,
    createPurchaseOrder,
    addFinanceEntry,
    setJournalEntries,
    theme,
    activeTerminal,
    language,
  } = useApp();

  const isLight = theme === 'light';
  const isEn = language === 'en';

  // Navigation state: Portal 8 Balok Besar Neon Solid vs Sub-Fitur Industri
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryId | null>(null);
  const [currentTab, setCurrentTab] = useState<MasterTab>('portal');
  const [mainFeatureTab, setMainFeatureTab] = useState<'input_data' | 'input_data_baru' | 'master_data_barang'>('input_data_baru');

  // Sub-navigasi entitas internal Retail & Wholesaler
  const [retailSubTab, setRetailSubTab] = useState<'product' | 'brand' | 'category' | 'supplier' | 'customer'>('product');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Fast Horizontal Entry State (1-Baris Tab & Enter) Khusus Retail & Wholesaler
  const [isRetailQuickAddOpen, setIsRetailQuickAddOpen] = useState(true);
  const [quickPrefix, setQuickPrefix] = useState('');
  const [quickBarcode, setQuickBarcode] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickVariant, setQuickVariant] = useState('');
  const [quickManufacture, setQuickManufacture] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickBrand, setQuickBrand] = useState('');
  const [quickSupplier, setQuickSupplier] = useState('');
  const [quickUom, setQuickUom] = useState('PCS');
  const [quickCostPrice, setQuickCostPrice] = useState<number | ''>('');
  const [quickPriceRetail, setQuickPriceRetail] = useState<number | ''>('');
  const [quickPriceMember, setQuickPriceMember] = useState<number | ''>('');
  const [quickPriceWholesale, setQuickPriceWholesale] = useState<number | ''>('');
  const [quickPaymentMethod, setQuickPaymentMethod] = useState('Tempo 30 Hari');
  const quickBarcodeRef = useRef<HTMLInputElement>(null);
  const quickWholesaleRef = useRef<HTMLInputElement>(null);

  // Business model selection for Product Import (Ritel, F&B, Apotek, Fashion, Gadget)
  const defaultBusinessModel: BusinessModelType = useMemo(() => {
    const model = (activeTerminal?.businessModel || '').toLowerCase();
    if (model.includes('fnb') || model.includes('resto') || model.includes('cafe')) return 'fnb';
    if (model.includes('apotek') || model.includes('farmasi') || model.includes('obat')) return 'pharmacy';
    if (model.includes('fashion') || model.includes('butik') || model.includes('distro')) return 'fashion';
    if (model.includes('gadget') || model.includes('elektronik') || model.includes('hp')) return 'gadget';
    return 'retail';
  }, [activeTerminal]);

  const [selectedBusinessModel, setSelectedBusinessModel] = useState<BusinessModelType>('retail');

  // Sync selected model when terminal changes
  useEffect(() => {
    setSelectedBusinessModel(defaultBusinessModel);
  }, [defaultBusinessModel]);

  // Auto-seed standard official ERP master products if products list is empty
  useEffect(() => {
    if (products.length === 0) {
      setProducts(INITIAL_ERP_MASTER_PRODUCTS);
      localStorage.setItem('jacs_erp_products', JSON.stringify(INITIAL_ERP_MASTER_PRODUCTS));
    }

    // Ensure official local suppliers exist in system without duplicates
    const supIdCheck = new Set<string>();
    const hasDuplicateSupplierIds = suppliers.some((s) => {
      if (supIdCheck.has(s.id)) return true;
      supIdCheck.add(s.id);
      return false;
    });

    if (hasDuplicateSupplierIds) {
      const deduped: SupplierMaster[] = [];
      const seen = new Set<string>();
      suppliers.forEach((s) => {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          deduped.push(s);
        }
      });
      setSuppliers(deduped);
      localStorage.setItem('jacs_erp_suppliers', JSON.stringify(deduped));
    } else {
      const existingSupNames = new Set(suppliers.map((s) => s.name.toLowerCase()));
      const existingSupIds = new Set(suppliers.map((s) => s.id));
      const newSups: SupplierMaster[] = [];
      MASTER_LOCAL_SUPPLIERS.forEach((sup, idx) => {
        if (!existingSupNames.has(sup.name.toLowerCase()) && !existingSupIds.has(sup.id)) {
          existingSupNames.add(sup.name.toLowerCase());
          existingSupIds.add(sup.id);
          newSups.push({
            id: sup.id,
            code: `VND-LOC-${String(idx + 1).padStart(2, '0')}`,
            name: sup.name,
            contactPerson: sup.contactPerson || 'Account Manager',
            phone: sup.phone,
            email: `orders@${sup.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.co.id`,
            address: `${sup.address} (${sup.region})`,
            paymentTerms: sup.paymentTerms,
            activePoCount: 1,
            status: 'Active',
          });
        }
      });
      if (newSups.length > 0) {
        setSuppliers((prev) => [...prev, ...newSups]);
      }
    }

    // Ensure brands from official ERP dataset exist in system
    // Ensure canonical master brands exist cleanly without bracket abbreviations or duplicates
    const brandNameSet = new Set(brands.map((b) => (b.name || '').toLowerCase().trim()));
    const hasBrandDupes = brandNameSet.size !== brands.length;
    const hasBrandIdDupes = new Set(brands.map((b) => b.id)).size !== brands.length;
    const isMissingCanonicalBrands = INITIAL_BRANDS.some((ib) => !brandNameSet.has(ib.name.toLowerCase()));
    const needsBrandCategoryFix = brands.some((b) => {
      const mapping = getBrandCategoryMapping(b.name, b);
      return !b.categoryCode || b.categoryCode !== mapping.categoryCode;
    });

    if (hasBrandDupes || hasBrandIdDupes || isMissingCanonicalBrands || needsBrandCategoryFix || brands.length < INITIAL_BRANDS.length) {
      setBrands(INITIAL_BRANDS);
      localStorage.setItem('jacs_erp_brands', JSON.stringify(INITIAL_BRANDS));
    }

    // Ensure official ERP categories exist in system cleanly without duplicates
    const hasCatDuplicates = new Set(categoriesMaster.map((c) => String(c.code))).size !== categoriesMaster.length;
    const isMissingCategories = categoriesMaster.length < INITIAL_CATEGORIES.length;

    if (hasCatDuplicates || isMissingCategories) {
      setCategoriesMaster(INITIAL_CATEGORIES);
      localStorage.setItem('jacs_erp_categories_master', JSON.stringify(INITIAL_CATEGORIES));
    } else {
      const existingCatCodes = new Set(categoriesMaster.map((c) => String(c.code).toLowerCase()));
      const existingCatNames = new Set(categoriesMaster.map((c) => c.name.toLowerCase()));
      const newCategories: CategoryMaster[] = [];
      ERP_CATEGORIES.forEach((cat) => {
        if (!existingCatCodes.has(String(cat.code)) && !existingCatNames.has(cat.name.toLowerCase())) {
          newCategories.push({
            id: `CAT-${String(cat.code).padStart(3, '0')}`,
            code: String(cat.code),
            name: cat.name,
            department: cat.department,
            taxRate: 11,
            marginTarget: 25,
            productCount: INITIAL_ERP_MASTER_PRODUCTS.filter((p) => p.categoryCode === cat.code).length,
            status: 'Active',
          });
        }
      });
      if (newCategories.length > 0) {
        setCategoriesMaster((prev) => [...prev, ...newCategories]);
      }
    }
  }, []);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);
  const [printTargetTab, setPrintTargetTab] = useState<'product' | 'category' | 'brand' | 'supplier' | 'customer' | null>(null);
  const [isQuickBarcodeOpen, setIsQuickBarcodeOpen] = useState(false);
  const [isAiSmartMapOpen, setIsAiSmartMapOpen] = useState(false);
  const [isDataMigrationOpen, setIsDataMigrationOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkMarginPercent, setBulkMarginPercent] = useState({
    retail: 20,
    member: 15,
    wholesale: 10,
  });
  const [isBarcodeStudioOpen, setIsBarcodeStudioOpen] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedRecipeProduct, setSelectedRecipeProduct] = useState<Product | null>(null);
  const [selectedDetailCustomer, setSelectedDetailCustomer] = useState<CustomerMaster | null>(null);
  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);

  // Restock / Input Data Form States
  const [restockBarcode, setRestockBarcode] = useState('');
  const [restockName, setRestockName] = useState('');
  const [restockVariant, setRestockVariant] = useState('');
  const [restockCategory, setRestockCategory] = useState('');
  const [restockBrand, setRestockBrand] = useState('');
  const [restockManufacture, setRestockManufacture] = useState('');
  const [restockSupplier, setRestockSupplier] = useState('');
  const [restockUom, setRestockUom] = useState('PCS');
  const [restockCostPrice, setRestockCostPrice] = useState<number | ''>('');
  const [restockPriceRetail, setRestockPriceRetail] = useState<number | ''>('');
  const [restockPriceMember, setRestockPriceMember] = useState<number | ''>('');
  const [restockPriceWholesale, setRestockPriceWholesale] = useState<number | ''>('');
  const [restockQty, setRestockQty] = useState<number | ''>(10);
  const [restockPaymentMethod, setRestockPaymentMethod] = useState('Cash');
  const restockBarcodeRef = useRef<HTMLInputElement>(null);

  const [sessionUpdates, setSessionUpdates] = useState<SessionUpdateItem[]>(() => {
    try {
      const saved = localStorage.getItem('jacs_erp_session_updates');
      const today = new Date().toISOString().slice(0, 10);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && parsed[0].date === today) {
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('jacs_erp_session_updates', JSON.stringify(sessionUpdates));
  }, [sessionUpdates]);

  const handleEditSessionItem = (item: SessionUpdateItem) => {
    setRestockBarcode(item.barcode);
    setRestockName(item.name);
    setRestockVariant(item.variant);
    setRestockCategory(item.category);
    setRestockBrand(item.brand);
    setRestockManufacture(item.manufacture);
    setRestockSupplier(item.supplier);
    setRestockUom(item.uom);
    setRestockCostPrice(item.costPrice);
    setRestockPriceRetail(item.priceRetail);
    setRestockPriceMember(item.priceMember);
    setRestockPriceWholesale(item.priceWholesale);
    setRestockQty(item.qty);
    setRestockPaymentMethod(item.paymentMethod);
    setSessionUpdates(prev => prev.filter(s => s.id !== item.id));
    showToast(`Memuat data "${item.name}" ke form atas untuk dikoreksi.`);
    if (restockBarcodeRef.current) restockBarcodeRef.current.focus();
  };

  const handleDeleteSessionItem = (id: string) => {
    setSessionUpdates(prev => prev.filter(s => s.id !== id));
    showToast('Baris riwayat sesi dihapus.');
  };

  const handleResetSession = () => {
    setSessionUpdates([]);
    showToast('Selesai batch / Reset sesi berhasil dibersihkan.');
  };

  const handleRestockScanOrType = (barcodeVal: string) => {
    setRestockBarcode(barcodeVal);
    const found = products.find(p => (p.barcode || '').toLowerCase() === barcodeVal.toLowerCase() || (p.id || '').toLowerCase() === barcodeVal.toLowerCase());
    if (found) {
      setRestockName(found.name.split(' (')[0] || found.name);
      setRestockVariant(found.name.includes('(') ? found.name.split('(')[1].replace(')', '') : '');
      setRestockCategory(found.category || '');
      setRestockBrand(found.brand || '');
      setRestockManufacture(found.manufacturer || '');
      setRestockSupplier(found.supplier || '');
      setRestockUom(found.unit || 'PCS');
      setRestockCostPrice(found.cost_price || 0);
      setRestockPriceRetail(found.sell_price || found.price_retail || 0);
      setRestockPriceMember(found.price_member || Math.round((found.sell_price || 0) * 0.95));
      setRestockPriceWholesale(found.price_wholesale || Math.round((found.sell_price || 0) * 0.90));
      showToast(`Barang lama ditemukan: ${found.name} (Stok: ${found.stock})`);
    }
  };

  const handleSaveRestockPurchase = () => {
    if (!restockBarcode.trim() || !restockName.trim()) {
      showToast('Barcode dan Nama Produk wajib diisi!');
      return;
    }
    const qty = Number(restockQty) || 0;
    if (qty <= 0) {
      showToast('Jumlah Beli / Masuk harus lebih dari 0!');
      return;
    }

    const found = products.find(p => (p.barcode || '').toLowerCase() === restockBarcode.toLowerCase() || (p.id || '').toLowerCase() === restockBarcode.toLowerCase());
    if (found) {
      const newStock = (found.stock || 0) + qty;
      updateProduct(found.id, {
        stock: newStock,
        cost_price: Number(restockCostPrice) || found.cost_price,
        sell_price: Number(restockPriceRetail) || found.sell_price,
        price_retail: Number(restockPriceRetail) || found.price_retail,
        price_member: Number(restockPriceMember) || found.price_member,
        price_wholesale: Number(restockPriceWholesale) || found.price_wholesale,
        status: newStock > 0 ? 'Active' : 'Out of Stock',
      });
      addAuditLog(`Input Restock Pembelian: ${found.name} (+${qty} ${restockUom}), Bayar: ${restockPaymentMethod}`, 'MASTER_DATA');
      showToast(`Berhasil restock ${qty} ${restockUom} untuk ${found.name}!`);
    } else {
      const newProd: Omit<Product, 'id'> = {
        barcode: restockBarcode,
        name: restockVariant ? `${restockName} (${restockVariant})` : restockName,
        category: restockCategory || 'General Retail',
        brand: restockBrand || 'General Brand',
        manufacturer: restockManufacture || '',
        supplier: restockSupplier || '',
        unit: restockUom || 'PCS',
        stock: qty,
        cost_price: Number(restockCostPrice) || 15000,
        sell_price: Number(restockPriceRetail) || 25000,
        price_retail: Number(restockPriceRetail) || 25000,
        price_member: Number(restockPriceMember) || 23750,
        price_wholesale: Number(restockPriceWholesale) || 22500,
        status: 'Active',
        businessModel: selectedBusinessModel || 'retail',
      };
      addProduct(newProd);
      addAuditLog(`Input Pembelian Barang Baru & Masuk: ${newProd.name} (${qty} ${newProd.unit}), Bayar: ${restockPaymentMethod}`, 'MASTER_DATA');
      showToast(`Berhasil input & restock ${qty} unit barang baru!`);
    }

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const dateStr = now.toISOString().slice(0, 10);
    const sessionItem: SessionUpdateItem = {
      id: `SES-${Date.now()}`,
      timestamp: timeStr,
      date: dateStr,
      barcode: restockBarcode,
      name: restockName,
      variant: restockVariant,
      category: restockCategory,
      brand: restockBrand,
      manufacture: restockManufacture,
      supplier: restockSupplier,
      uom: restockUom,
      qty: Number(restockQty) || 0,
      costPrice: Number(restockCostPrice) || 0,
      priceRetail: Number(restockPriceRetail) || 0,
      priceMember: Number(restockPriceMember) || 0,
      priceWholesale: Number(restockPriceWholesale) || 0,
      paymentMethod: restockPaymentMethod,
    };
    setSessionUpdates(prev => [sessionItem, ...prev]);

    setRestockBarcode('');
    setRestockName('');
    setRestockVariant('');
    setRestockCategory('');
    setRestockBrand('');
    setRestockManufacture('');
    setRestockSupplier('');
    setRestockUom('PCS');
    setRestockCostPrice('');
    setRestockPriceRetail('');
    setRestockPriceMember('');
    setRestockPriceWholesale('');
    setRestockQty(10);
    setRestockPaymentMethod('Cash');
    if (restockBarcodeRef.current) restockBarcodeRef.current.focus();
  };

  const handleOpenCustomerDetail = (c: CustomerMaster) => {
    setSelectedDetailCustomer(c);
    setIsCustomerDetailOpen(true);
  };

  const handleToggleCustomerStatus = (c: CustomerMaster) => {
    const isCurrentlyActive = c.status === 'Active' || c.is_active;
    const newStatus = isCurrentlyActive ? 'Inactive' : 'Active';
    const updated: CustomerMaster = {
      ...c,
      status: newStatus,
      is_active: !isCurrentlyActive,
    };
    setCustomers((prev) => prev.map((item) => (item.id === c.id ? updated : item)));
    if (selectedDetailCustomer && selectedDetailCustomer.id === c.id) {
      setSelectedDetailCustomer(updated);
    }
    showToast(
      isCurrentlyActive
        ? `Pelanggan "${c.name}" dinonaktifkan.`
        : `Pelanggan "${c.name}" berhasil diaktifkan kembali!`
    );
    addAuditLog('UPDATE', `Ubah status pelanggan: ${c.name} -> ${newStatus}`);
  };

  // Selected item for editing
  const [editingItem, setEditingItem] = useState<any>(null);

  // Import file / CSV text state
  const [importText, setImportText] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Automated CSV column validation report
  const validationReport: ColumnValidationReport | null = useMemo(() => {
    if (currentTab === 'product' && importText.trim()) {
      return validateCsvContent(importText, selectedBusinessModel);
    }
    return null;
  }, [importText, selectedBusinessModel, currentTab]);

  // Download template format handler (.xlsx compatible) with standardized 11 official ERP columns
  const handleDownloadTemplate = (_modelKey?: BusinessModelType) => {
    const header = 'PLU,BARCODE,PRODUCT_NAME,CATEGORY,BRAND,MANUFACTURER,UOM,PRICE_RETAIL,PRICE_MEMBER,PRICE_WHOLESALE,VAT_INCLUDED';
    
    // Sample rows from all 30 official canonical ERP master products
    const sampleRows = INITIAL_ERP_MASTER_PRODUCTS.map((p) => {
      const plu = p.plu || p.id;
      const barcode = p.barcode || plu;
      const safeName = `"${p.name.replace(/"/g, '""')}"`;
      const catInfo = getErpCategoryInfo(p);
      const safeCat = `"${catInfo.categoryName.replace(/"/g, '""')}"`;
      const safeBrand = `"${(p.brand || '').replace(/"/g, '""')}"`;
      const safeMan = `"${(p.manufacturer || '').replace(/"/g, '""')}"`;
      const uom = p.unit || 'Pcs';
      const retail = p.price_retail || p.sell_price;
      const member = p.price_member || Math.round(retail * 0.95);
      const wholesale = p.price_wholesale || Math.round(retail * 0.90);
      const vat = p.taxable !== false ? 'TRUE' : 'FALSE';
      return `${plu},${barcode},${safeName},${safeCat},${safeBrand},${safeMan},${uom},${retail},${member},${wholesale},${vat}`;
    });

    const csvContent = '\uFEFF' + [header, ...sampleRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const model = _modelKey || selectedBusinessModel || 'retail';
    link.setAttribute('href', url);
    link.setAttribute('download', `pattern_master_produk_${model}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      isEn
        ? 'Pattern template (.xlsx) with 11 standardized retail columns downloaded.'
        : 'Format pola master produk (.xlsx) dengan 11 kolom standar retail berhasil diunduh.'
    );
  };

  // One-Click Auto Distribution from Quick Barcode Scanner
  const handleSaveQuickBarcode = (data: {
    barcode: string;
    name: string;
    category: string;
    brand: string;
    manufacturer: string;
    stock: number;
    unit: string;
    cost_price: number;
    sell_price: number;
    price_retail?: number;
    price_wholesale?: number;
    price_distributor?: number;
    taxable?: boolean;
    rackLocation?: string;
  }) => {
    // 1. Auto register brand if not exists, or increment count
    const existingBrand = brands.find(
      (b) => b.name.toLowerCase() === data.brand.toLowerCase()
    );
    if (!existingBrand && data.brand.trim()) {
      const newBrand: BrandMaster = {
        id: `BRD-${String(brands.length + 1).padStart(3, '0')}`,
        code: data.brand.substring(0, 4).toUpperCase(),
        name: data.brand.trim(),
        country: 'Indonesia',
        manufacturer: data.manufacturer || 'Pabrikan Mitra',
        productCount: 1,
        status: 'Active',
      };
      setBrands([...brands, newBrand]);
    } else if (existingBrand) {
      setBrands(
        brands.map((b) =>
          b.id === existingBrand.id
            ? { ...b, productCount: (b.productCount || 0) + 1 }
            : b
        )
      );
    }

    // 2. Auto register category if not exists, or increment count
    const existingCat = categoriesMaster.find(
      (c) => c.name.toLowerCase() === data.category.toLowerCase()
    );
    if (!existingCat && data.category.trim()) {
      const newCat: CategoryMaster = {
        id: `CAT-${String(categoriesMaster.length + 1).padStart(3, '0')}`,
        code: data.category.substring(0, 3).toUpperCase(),
        name: data.category.trim(),
        department: 'General Retail',
        taxRate: 11,
        marginTarget: 20,
        productCount: 1,
        status: 'Active',
      };
      setCategoriesMaster([...categoriesMaster, newCat]);
    } else if (existingCat) {
      setCategoriesMaster(
        categoriesMaster.map((c) =>
          c.id === existingCat.id
            ? { ...c, productCount: (c.productCount || 0) + 1 }
            : c
        )
      );
    }

    // 3. Add to products (automatically updates Warehouse & POS)
    const newProduct: Product = {
      id: `PRD-${Date.now()}`,
      barcode: data.barcode,
      name: data.name,
      category: data.category,
      brand: data.brand,
      stock: data.stock,
      initialStock: data.stock,
      unit: data.unit,
      cost_price: data.cost_price,
      sell_price: data.price_retail || data.sell_price,
      price_retail: data.price_retail || data.sell_price,
      price_wholesale: data.price_wholesale || Math.round((data.price_retail || data.sell_price) * 0.92),
      price_distributor: data.price_distributor || Math.round((data.price_retail || data.sell_price) * 0.85),
      rackLocation: data.rackLocation || 'Gudang Utama',
      status: data.stock > 0 ? 'Active' : 'Out of Stock',
      taxable: data.taxable !== undefined ? data.taxable : true,
      businessModel: selectedBusinessModel,
    };
    addProduct(newProduct);

    showToast(
      isEn
        ? `Product "${data.name}" and Brand/Category distributed to Master Data!`
        : `Produk "${data.name}" & entitas Merek/Kategori berhasil didistribusikan ke Master Data!`
    );
    addAuditLog('CREATE', `Quick Barcode Onboard: ${data.name} (${data.barcode})`);
  };

  const handleGenerateId = () => {
    const prefix = (quickPrefix || '').trim().toUpperCase().slice(0, 3);
    if (!prefix) return;
    let generated = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const rand6 = Math.floor(100000 + Math.random() * 900000);
      generated = `${prefix}${rand6}`;
      const conflict = products.find((p) => (p.barcode || '').trim().toUpperCase() === generated || p.id === generated);
      if (!conflict) {
        isUnique = true;
      }
      attempts++;
    }
    setQuickBarcode(generated);
  };

  // Fast Horizontal Entry Save Handler (Khusus Retail & Wholesaler Modern)
  const handleSaveQuickProduct = () => {
    if (!quickName.trim()) {
      showToast(isEn ? 'Product Name is required!' : 'Nama Produk wajib diisi!');
      return;
    }

    const cleanBarcode = quickBarcode.trim() || `899${Math.floor(100000000 + Math.random() * 900000000)}`;
    const cleanName = quickVariant.trim() ? `${quickName.trim()} (${quickVariant.trim()})` : quickName.trim();
    const cleanCat = quickCategory.trim() || 'General Retail';
    const cleanBrand = quickBrand.trim() || 'General Brand';
    const cleanMan = quickManufacture.trim() || cleanBrand;
    const cleanSup = quickSupplier.trim() || 'Distributor Lokal';
    const cleanUom = (quickUom.trim() || 'PCS').toUpperCase();

    const costNum = typeof quickCostPrice === 'number' ? quickCostPrice : Number(quickCostPrice) || 0;
    const retailNum = typeof quickPriceRetail === 'number' ? quickPriceRetail : Number(quickPriceRetail) || (costNum > 0 ? Math.round(costNum * 1.25) : 0);
    const memberNum = typeof quickPriceMember === 'number' ? quickPriceMember : Number(quickPriceMember) || Math.round(retailNum * 0.95);
    const wholesaleNum = typeof quickPriceWholesale === 'number' ? quickPriceWholesale : Number(quickPriceWholesale) || Math.round(retailNum * 0.90);

    // 1. Auto register Kategori if not exists, or increment productCount
    const existingCat = categoriesMaster.find(
      (c) => c.name.trim().toLowerCase() === cleanCat.toLowerCase()
    );
    if (!existingCat && cleanCat) {
      const newCat: CategoryMaster = {
        id: `CAT-${String(categoriesMaster.length + 1).padStart(3, '0')}`,
        code: cleanCat.substring(0, 3).toUpperCase(),
        name: cleanCat,
        department: 'General Retail',
        taxRate: 11,
        marginTarget: 20,
        productCount: 1,
        status: 'Active',
      };
      setCategoriesMaster((prev) => [...prev, newCat]);
    } else if (existingCat) {
      setCategoriesMaster((prev) =>
        prev.map((c) =>
          c.id === existingCat.id ? { ...c, productCount: (c.productCount || 0) + 1 } : c
        )
      );
    }

    // 2. Auto register Merek / Brand if not exists, or increment productCount
    const existingBrand = brands.find(
      (b) => b.name.trim().toLowerCase() === cleanBrand.toLowerCase()
    );
    if (!existingBrand && cleanBrand) {
      const newBrand: BrandMaster = {
        id: `BRD-${String(brands.length + 1).padStart(3, '0')}`,
        code: cleanBrand.substring(0, 4).toUpperCase(),
        name: cleanBrand,
        manufacturer: cleanMan,
        country: 'Indonesia',
        productCount: 1,
        status: 'Active',
      };
      setBrands((prev) => [...prev, newBrand]);
    } else if (existingBrand) {
      setBrands((prev) =>
        prev.map((b) =>
          b.id === existingBrand.id ? { ...b, productCount: (b.productCount || 0) + 1 } : b
        )
      );
    }

    // 3. Auto register Supplier if not exists
    const existingSup = suppliers.find(
      (s) => s.name.trim().toLowerCase() === cleanSup.toLowerCase()
    );
    if (!existingSup && cleanSup) {
      const newSup: SupplierMaster = {
        id: `VND-${String(suppliers.length + 1).padStart(3, '0')}`,
        code: cleanSup.substring(0, 4).toUpperCase(),
        name: cleanSup,
        contactPerson: 'PIC Distribusi',
        phone: '0812-8899-0000',
        email: `${cleanSup.toLowerCase().replace(/[^a-z0-9]/g, '')}@supplier.co.id`,
        address: 'Kawasan Pergudangan Pluit Blok C No. 12',
        paymentTerms: 'TOP 30 Hari',
        activePoCount: 0,
        status: 'Active',
      };
      setSuppliers((prev) => [...prev, newSup]);
    }

    // 4. Save Product to catalog
    const newProduct: Product = {
      id: `PRD-${Date.now()}`,
      plu: `PLU-${String(products.length + 1).padStart(3, '0')}`,
      barcode: cleanBarcode,
      name: cleanName,
      category: cleanCat,
      brand: cleanBrand,
      manufacturer: cleanMan,
      supplier: cleanSup,
      unit: cleanUom,
      cost_price: costNum,
      price_retail: retailNum,
      sell_price: retailNum,
      price_member: memberNum,
      price_wholesale: wholesaleNum,
      price_distributor: Math.round(retailNum * 0.85),
      stock: 100,
      initialStock: 100,
      min_stock: 5,
      rackLocation: 'Gudang Retail',
      status: 'Active',
      taxable: true,
      businessModel: 'retail',
    };

    addProduct(newProduct);

    // Otomasi Sinkronisasi ke Purchasing & Finance
    const totalAmount = costNum * 100;
    const nowStr = new Date().toISOString().slice(0, 10);

    if (quickPaymentMethod.startsWith('Tempo')) {
      createPurchaseOrder({
        supplier_name: cleanSup,
        date: nowStr,
        items: `${cleanName} (x100 ${cleanUom})`,
        total_amount: totalAmount,
        payment_term: quickPaymentMethod,
        status: 'Disetujui (Approved)',
        payment_status: 'Belum Bayar',
        due_date: new Date(Date.now() + (quickPaymentMethod.includes('7') ? 7 : quickPaymentMethod.includes('14') ? 14 : 30) * 86400000).toISOString().slice(0, 10),
      });
      showToast(`Tagihan jatuh tempo (${quickPaymentMethod}) otomatis tercatat di Purchasing & Finance.`);
    } else if (quickPaymentMethod === 'Cash') {
      addFinanceEntry({
        date: nowStr,
        type: 'OUT / PENGELUARAN',
        category: 'Pembelian Persediaan (Kas)',
        description: `Pembelian tunai produk ${cleanName} • Kas Utama`,
        amount: totalAmount,
        reference: `PURCHASE-CASH-${Date.now().toString().slice(-6)}`,
        payment_method: 'CASH',
        account_target: 'Kas (1-10001)',
      });
      setJournalEntries((prev: any[]) => [
        {
          id: `JRN-CASH-PUR-${Date.now()}`,
          date: nowStr,
          reference: `PURCHASE-CASH-${Date.now().toString().slice(-6)}`,
          description: `Pembelian tunai persediaan ${cleanName} • Debit Persediaan (1-10501), Kredit Kas (1-10001)`,
          type: 'CASH_PURCHASE',
          lines: [
            { accountCode: '1-10501', accountName: 'Persediaan', debit: totalAmount, credit: 0 },
            { accountCode: '1-10001', accountName: 'Kas', debit: 0, credit: totalAmount },
          ],
          totalDebit: totalAmount,
          totalCredit: totalAmount,
          created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        },
        ...prev,
      ]);
      showToast(`Pengeluaran kas tercatat di Arus Kas Keluar Finance.`);
    }

    showToast(
      isEn
        ? `Product "${cleanName}" saved & master entities auto-synced!`
        : `Produk "${cleanName}" berhasil disimpan & master tersinkronisasi!`
    );
    addAuditLog('CREATE', `Quick Retail Entry: ${cleanName} (${cleanBarcode}) - Bayar: ${quickPaymentMethod}`);

    // Reset inputs & keep focus on barcode for continuous high-speed entry
    setQuickPrefix('');
    setQuickBarcode('');
    setQuickName('');
    setQuickVariant('');
    setQuickManufacture('');
    setQuickCostPrice('');
    setQuickPriceRetail('');
    setQuickPriceMember('');
    setQuickPriceWholesale('');
    setQuickPaymentMethod('Tempo 30 Hari');

    setTimeout(() => {
      quickBarcodeRef.current?.focus();
    }, 50);
  };

  // AI Smart Mapper Import Handler
  const handleAiSmartMapImport = (
    newProductsList: Array<Partial<Product> & { manufacturer?: string; rackLocation?: string }>,
    newBrandsList: Array<{ name: string; manufacturer?: string }>,
    newCategoriesList: string[]
  ) => {
    // 1. Calculate product counts for brands & categories
    const brandCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    newProductsList.forEach((p) => {
      if (p.brand) {
        const k = p.brand.trim().toLowerCase();
        brandCounts[k] = (brandCounts[k] || 0) + 1;
      }
      if (p.category) {
        const k = p.category.trim().toLowerCase();
        categoryCounts[k] = (categoryCounts[k] || 0) + 1;
      }
    });

    // 2. Add new Brands & update existing counts
    const updatedBrands = brands.map((b) => {
      const added = brandCounts[b.name.trim().toLowerCase()] || 0;
      return added > 0 ? { ...b, productCount: (b.productCount || 0) + added } : b;
    });

    newBrandsList.forEach((nb) => {
      if (nb.name && !updatedBrands.some((b) => b.name.toLowerCase() === nb.name.toLowerCase())) {
        const addedCount = brandCounts[nb.name.trim().toLowerCase()] || 1;
        updatedBrands.push({
          id: `BRD-${String(updatedBrands.length + 1).padStart(3, '0')}`,
          code: nb.name.substring(0, 4).toUpperCase(),
          name: nb.name,
          country: 'Indonesia',
          manufacturer: nb.manufacturer || 'Pabrikan Mitra',
          productCount: addedCount,
          status: 'Active',
        });
      }
    });
    setBrands(updatedBrands);

    // 3. Add new Categories & update existing counts
    const updatedCategories = categoriesMaster.map((c) => {
      const added = categoryCounts[c.name.trim().toLowerCase()] || 0;
      return added > 0 ? { ...c, productCount: (c.productCount || 0) + added } : c;
    });

    newCategoriesList.forEach((nc) => {
      if (nc && !updatedCategories.some((c) => c.name.toLowerCase() === nc.toLowerCase())) {
        const addedCount = categoryCounts[nc.trim().toLowerCase()] || 1;
        updatedCategories.push({
          id: `CAT-${String(updatedCategories.length + 1).padStart(3, '0')}`,
          code: nc.substring(0, 3).toUpperCase(),
          name: nc,
          department: 'General Retail',
          taxRate: 11,
          marginTarget: 20,
          productCount: addedCount,
          status: 'Active',
        });
      }
    });
    setCategoriesMaster(updatedCategories);

    // 4. Add Products in Bulk (Single atomic batch update to products and inventory)
    const productsToAdd: Array<Omit<Product, 'id'> & { id?: string }> = newProductsList.map((p) => {
      const sellPrice = p.sell_price || 0;
      const costPrice = p.cost_price || 0;
      const stock = p.stock ?? 10;
      return {
        name: p.name || 'Produk Impor',
        barcode: p.barcode || `899${Math.floor(100000000 + Math.random() * 900000000)}`,
        category: p.category || 'Umum',
        brand: p.brand || 'Umum',
        cost_price: costPrice,
        sell_price: sellPrice,
        price_retail: p.price_retail || sellPrice,
        price_wholesale: p.price_wholesale || Math.round(sellPrice * 0.92),
        price_distributor: p.price_distributor || Math.round(sellPrice * 0.85),
        stock,
        initialStock: stock,
        min_stock: 5,
        unit: p.unit || 'PCS',
        rackLocation: p.rackLocation || 'Gudang Utama',
        status: stock > 0 ? 'Active' : 'Out of Stock',
        taxable: true,
        businessModel: selectedBusinessModel,
      };
    });

    const successMessage = isEn
      ? `Successfully imported ${newProductsList.length} new products via AI Smart Mapper`
      : `Berhasil mengimpor ${newProductsList.length} produk baru via AI Smart Mapper`;

    addProductsBulk(productsToAdd, successMessage);
    addAuditLog('IMPORT', `AI Smart Map imported ${newProductsList.length} products`);
  };

  // Load sample data into editor handler
  const handleUseSampleData = (modelKey: BusinessModelType) => {
    const tmpl = BUSINESS_MODEL_TEMPLATES[modelKey];
    setImportText(tmpl.sampleCsv);
    setImportFileName(`contoh_${modelKey}.csv`);
    setImportStatus(`Menggunakan data contoh template ${tmpl.label} (${tmpl.sampleRows.length} baris).`);
    showToast(`Contoh data ${tmpl.label} dimuat ke editor.`);
  };

  // Form states for adding/editing entities
  const [brandForm, setBrandForm] = useState<Omit<BrandMaster, 'id' | 'productCount'>>({
    code: '',
    name: '',
    manufacturer: '',
    country: 'Indonesia',
    status: 'Active',
  });

  const [categoryForm, setCategoryForm] = useState<Omit<CategoryMaster, 'id' | 'productCount'>>({
    code: '',
    name: '',
    department: 'Food & Beverage',
    taxRate: 11,
    marginTarget: 20,
    status: 'Active',
  });

  const [supplierForm, setSupplierForm] = useState<Omit<SupplierMaster, 'id' | 'activePoCount'>>({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: 'TOP 30 Hari',
    status: 'Active',
  });

  const [customerForm, setCustomerForm] = useState<{
    code: string;
    name: string;
    store_name: string;
    phone: string;
    store_address: string;
    memberTier: string;
    email: string;
    points: number;
    totalSpent: number;
    status: 'Active' | 'Inactive';
  }>({
    code: '',
    name: '',
    store_name: '',
    phone: '',
    store_address: '',
    memberTier: 'Member',
    email: '',
    points: 100,
    totalSpent: 0,
    status: 'Active',
  });

  // Helper tier kasir aktif: Retail / Ecer, Member, Grosir / Toko
  const getCustomerTierKey = (tier?: string): 'RETAIL' | 'MEMBER' | 'WHOLESALE' => {
    const t = (tier || '').toLowerCase();
    if (t.includes('grosir') || t.includes('wholesale') || t.includes('toko') || t.includes('platinum')) return 'WHOLESALE';
    if (t.includes('member') || t.includes('gold') || t.includes('silver')) return 'MEMBER';
    return 'RETAIL';
  };

  // Neon Industry Modal State (Fashion, Electronics, Automotive, Services)
  const [isNeonModalOpen, setIsNeonModalOpen] = useState(false);
  const [neonIndustryTitle, setNeonIndustryTitle] = useState('');
  const [neonBarcode, setNeonBarcode] = useState('');
  const [neonName, setNeonName] = useState('');
  const [neonCategory, setNeonCategory] = useState('');
  const [neonStock, setNeonStock] = useState<number | ''>(50);

  // Standardized HPP & Tier Pricing
  const [neonCostPrice, setNeonCostPrice] = useState<number | ''>(35000);
  const [neonMarginPercent, setNeonMarginPercent] = useState<number>(30);
  const [neonPriceRetail, setNeonPriceRetail] = useState<number | ''>(50000);
  const [neonPriceMember, setNeonPriceMember] = useState<number | ''>(47500);
  const [neonPriceWholesale, setNeonPriceWholesale] = useState<number | ''>(45000);

  // Tax State (PPN ON/OFF, Include/Exclude, Rate 11%/12%)
  const [neonTaxOn, setNeonTaxOn] = useState(true);
  const [neonTaxType, setNeonTaxType] = useState<'INCLUDE' | 'EXCLUDE'>('EXCLUDE');
  const [neonTaxRate, setNeonTaxRate] = useState<number>(11);

  // Specific Module Fields
  const [neonFashionVariant, setNeonFashionVariant] = useState('Size: All-Size, Color: Black');
  const [neonElectronicsWarranty, setNeonElectronicsWarranty] = useState<number | ''>(15000);
  const [neonAutoPartPrice, setNeonAutoPartPrice] = useState<number | ''>(40000);
  const [neonAutoServiceFee, setNeonAutoServiceFee] = useState<number | ''>(25000);
  const [neonSalonMaterialCost, setNeonSalonMaterialCost] = useState<number | ''>(15000);
  const [neonSalonStylistFee, setNeonSalonStylistFee] = useState<number | ''>(35000);

  // Auto-calculated retail from cost & margin
  const neonCalculatedRetail = useMemo(() => {
    const cost = Number(neonCostPrice) || 0;
    const margin = Number(neonMarginPercent) || 0;
    return Math.round(cost + (cost * margin / 100));
  }, [neonCostPrice, neonMarginPercent]);

  // Tax calculations
  const neonTaxBreakdown = useMemo(() => {
    const retail = Number(neonPriceRetail) || neonCalculatedRetail;
    if (!neonTaxOn) {
      return { dpp: retail, ppn: 0, total: retail };
    }
    if (neonTaxType === 'INCLUDE') {
      const dpp = Math.round(retail / (1 + neonTaxRate / 100));
      const ppn = retail - dpp;
      return { dpp, ppn, total: retail };
    } else {
      const dpp = retail;
      const ppn = Math.round(dpp * neonTaxRate / 100);
      const total = dpp + ppn;
      return { dpp, ppn, total };
    }
  }, [neonPriceRetail, neonCalculatedRetail, neonTaxOn, neonTaxType, neonTaxRate]);

  const handleSaveNeonProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!neonName.trim()) {
      showToast('Nama produk / layanan wajib diisi!');
      return;
    }
    const finalId = neonBarcode.trim() || `NEON-${Date.now().toString().slice(-4)}`;
    const retailFinal = Number(neonPriceRetail) || neonCalculatedRetail;
    const costFinal = Number(neonCostPrice) || 35000;

    const newItem: Product = {
      id: finalId,
      plu: finalId,
      barcode: finalId,
      name: neonName.trim(),
      category: neonCategory.trim() || 'General',
      cost_price: costFinal,
      sell_price: neonTaxBreakdown.total,
      price_retail: neonTaxBreakdown.total,
      price_member: Number(neonPriceMember) || Math.round(retailFinal * 0.95),
      price_wholesale: Number(neonPriceWholesale) || Math.round(retailFinal * 0.90),
      stock: Number(neonStock) || 50,
      status: 'Active',
      taxable: neonTaxOn,
      taxRate: neonTaxOn ? neonTaxRate : 0,
      taxType: neonTaxType,
      businessModel: neonIndustryTitle.toLowerCase().includes('fashion') ? 'fashion' : neonIndustryTitle.toLowerCase().includes('electronic') ? 'electronics' : neonIndustryTitle.toLowerCase().includes('automotive') ? 'automotive' : 'services',
      ...(neonIndustryTitle.toLowerCase().includes('fashion') && { variantDetails: neonFashionVariant }),
      ...(neonIndustryTitle.toLowerCase().includes('electronic') && { warrantyEstimateCost: Number(neonElectronicsWarranty) || 0 }),
      ...(neonIndustryTitle.toLowerCase().includes('automotive') && { partPrice: Number(neonAutoPartPrice) || 0, serviceFee: Number(neonAutoServiceFee) || 0 }),
      ...(neonIndustryTitle.toLowerCase().includes('salon') && { salonMaterialCost: Number(neonSalonMaterialCost) || 0, stylistFee: Number(neonSalonStylistFee) || 0 }),
    };

    addProduct(newItem);
    showToast(`Master "${neonName}" berhasil disimpan dengan kalkulasi PPN & Harga Tier!`);
    setIsNeonModalOpen(false);
  };

  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    plu: 'PLU-034',
    barcode: '',
    name: '',
    description: '',
    categoryCode: 2,
    category: 'Detergent',
    brand: 'Attack',
    manufacturer: 'PT Kao Indonesia',
    supplier: 'PT Distribusi Sejahtera',
    supplierPhone: '0812-8899-1234',
    supplierAddress: 'Kawasan Pergudangan Pluit Blok C No. 12, Jakarta Utara',
    supplierNotes: 'TOP 30 Hari (Pengiriman armada H+1 order masuk)',
    unit: 'Pack',
    price_retail: 24500,
    price_member: 23200,
    price_wholesale: 21500,
    sell_price: 24500,
    cost_price: 18500,
    stock: 50,
    initialStock: 50,
    taxable: true,
    status: 'ACTIVE',
    businessModel: 'retail',
  });

  // Deduplicated brand list strictly filtered by category for New Product Entry (Zero duplicates)
  const availableBrandsForAdd = useMemo(() => {
    const catCode = Number(productForm?.categoryCode) || 2;
    const mapped = ERP_CATALOG_MAPPING[catCode] || [];
    const seen = new Set<string>();
    const list: ErpCatalogItem[] = [];
    mapped.forEach((item) => {
      const key = (item?.brand || '').trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    });
    return list;
  }, [productForm?.categoryCode]);

  // Deduplicated brand list strictly filtered by category for Editing Product (Zero duplicates)
  const availableBrandsForEdit = useMemo(() => {
    if (!editingItem) return [];
    const catCode = Number(editingItem?.categoryCode) || 2;
    const mapped = ERP_CATALOG_MAPPING[catCode] || [];
    const seen = new Set<string>();
    const list: ErpCatalogItem[] = [];
    mapped.forEach((item) => {
      const key = (item?.brand || '').trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    });
    return list;
  }, [editingItem?.categoryCode]);

  // Calculate dynamic stats
  const brandCount = brands.length;
  const categoryCount = categoriesMaster.length;
  const productCount = products.length;
  const supplierCount = suppliers.length;
  const customerCount = customers.length;
  const fnbMenuCount = useMemo(() => {
    return products.filter(
      (p) =>
        p.itemType === 'MENU_FB' ||
        p.businessModel === 'fnb' ||
        (p.id || '').startsWith('FNB-')
    ).length;
  }, [products]);
  const pharmacyMedicineCount = useMemo(() => {
    const cnt = products.filter(
      (p) =>
        p.businessModel === 'pharmacy' ||
        p.pharmacyClass ||
        (p.category && p.category.toLowerCase().includes('obat')) ||
        (p.id && p.id.startsWith('MED-'))
    ).length;
    return cnt > 0 ? cnt : 11;
  }, [products]);
  const buildingMaterialCount = useMemo(() => {
    return products.filter(
      (p) =>
        p.businessModel === 'building' ||
        (p.id && p.id.startsWith('MAT-')) ||
        Boolean(p.materialNature) ||
        Boolean(p.isWeightFraction) ||
        (p.category && (
          p.category.includes('PASIR') ||
          p.category.includes('SEMEN') ||
          p.category.includes('BATA') ||
          p.category.includes('KAYU') ||
          p.category.includes('PERPIPAAN') ||
          p.category.includes('BESI') ||
          p.category.includes('PAKU') ||
          p.category.includes('CAT')
        ))
    ).length;
  }, [products]);

  // Filtered lists for the active entity with AI Smart Fuzzy Search
  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = brands.filter((b) => {
      const matchSearch =
        !q ||
        (b.id && b.id.toLowerCase().includes(q)) ||
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.manufacturer && b.manufacturer.toLowerCase().includes(q)) ||
        fuzzyMatchAny([b.name, b.code, b.manufacturer, b.id], q, 0.65);

      const matchStatus =
        statusFilter === 'ALL' ||
        (b.status && b.status.toLowerCase() === statusFilter.toLowerCase());

      return matchSearch && matchStatus;
    });

    const seenId = new Set<string>();
    const seenName = new Set<string>();
    const unique: BrandMaster[] = [];
    list.forEach((b) => {
      const cleanName = (b.name || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
      if (!seenId.has(b.id) && !seenName.has(cleanName)) {
        seenId.add(b.id);
        seenName.add(cleanName);
        unique.push(b);
      }
    });
    return unique;
  }, [brands, searchQuery, statusFilter]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return categoriesMaster.filter((c) => {
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        fuzzyMatchAny([c.name, c.code, c.department, c.id], q, 0.65);

      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [categoriesMaster, searchQuery, statusFilter]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const catInfo = getErpCategoryInfo(p);
      const matchCategory =
        categoryFilter === 'ALL' ||
        String(catInfo.categoryCode) === categoryFilter ||
        catInfo.categoryName.toLowerCase() === categoryFilter.toLowerCase();

      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.plu && p.plu.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
        catInfo.categoryName.toLowerCase().includes(q) ||
        String(catInfo.categoryCode) === q ||
        (p.unit && p.unit.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        fuzzyMatchAny(
          [
            p.name,
            p.description,
            p.brand,
            p.manufacturer,
            catInfo.categoryName,
            p.barcode,
            p.sku,
            p.plu,
            p.id,
            p.unit,
          ],
          q,
          0.65
        );

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'Active'
          ? String(p.status).toUpperCase() === 'ACTIVE' || p.status === 'Active'
          : String(p.status).toUpperCase() === 'DISCONTINUED' || p.status === 'Inactive' || p.status === 'Discontinued');
      return matchCategory && matchSearch && matchStatus;
    });
  }, [products, searchQuery, statusFilter, categoryFilter]);

  // Optimasi Anti-Lag: Pre-komputasi detail produk sekali di useMemo
  const enrichedProductList = useMemo(() => {
    return filteredProducts.map((p, idx) => {
      const rawCatInfo = getErpCategoryInfo(p);
      const localizedCategoryName = getCleanCategoryName(rawCatInfo.categoryCode, language as 'id' | 'en');
      const catInfo = {
        categoryCode: rawCatInfo.categoryCode,
        categoryName: localizedCategoryName || rawCatInfo.categoryName,
      };
      const defSup = getDefaultSupplierForCategory(catInfo.categoryCode);
      const barcodeCodeId = p.barcode || p.plu || p.id;
      const descriptionText = p.description || p.name;
      const retailPrice = p.price_retail ?? p.sell_price;
      const memberPrice = p.price_member ?? Math.round(retailPrice * 0.95);
      const wholesalePrice = p.price_wholesale ?? Math.round(retailPrice * 0.90);
      const isTaxable = p.taxable !== false;
      const supplierName = p.supplier || defSup.name;
      const supplierPhone = p.supplierPhone || defSup.phone;
      const isDiscontinued = String(p.status).toUpperCase() === 'DISCONTINUED';
      const hasRecipe = Boolean(
        (p.recipe && p.recipe.length > 0) ||
        p.kitchenStation ||
        p.businessModel === 'fnb'
      );
      return {
        product: p,
        idx,
        catInfo,
        barcodeCodeId,
        descriptionText,
        retailPrice,
        memberPrice,
        wholesalePrice,
        isTaxable,
        supplierName,
        supplierPhone,
        isDiscontinued,
        hasRecipe,
      };
    });
  }, [filteredProducts, language]);

  // 1. Dynamic SKU Counts per Brand based on real catalog products
  const brandProductCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const bNorm = (p.brand || '').trim().toLowerCase();
      if (bNorm) {
        map[bNorm] = (map[bNorm] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  // 2. Dynamic SKU Counts per Category based on real catalog products
  const categoryProductCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const info = getErpCategoryInfo(p);
      const codeKey = String(info.categoryCode);
      const idKey = `CAT-${String(info.categoryCode).padStart(3, '0')}`;
      const nameKey = info.categoryName.toLowerCase();
      const rawCatKey = (p.category || '').toLowerCase().trim();

      map[codeKey] = (map[codeKey] || 0) + 1;
      map[idKey] = (map[idKey] || 0) + 1;
      map[nameKey] = (map[nameKey] || 0) + 1;
      if (rawCatKey) {
        map[rawCatKey] = (map[rawCatKey] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  // Helper to dynamically calculate SKU Terkait for a Brand
  const getDynamicBrandProductCount = (b: BrandMaster): number => {
    const bLower = (b.name || '').trim().toLowerCase();
    if (brandProductCountMap[bLower] !== undefined) {
      return brandProductCountMap[bLower];
    }
    // ABC Sub-brands handling
    if (bLower.includes('battery') || bLower.includes('baterai')) {
      return products.filter((p) => {
        const pName = (p.name || '').toLowerCase();
        const pBrand = (p.brand || '').toLowerCase();
        return (pBrand.includes('abc') || pBrand.includes('battery')) && (pName.includes('baterai') || pName.includes('battery'));
      }).length;
    }
    if (bLower.includes('sarden') || bLower.includes('sardines')) {
      return products.filter((p) => {
        const pName = (p.name || '').toLowerCase();
        const pBrand = (p.brand || '').toLowerCase();
        return (pBrand.includes('abc') || pBrand.includes('botan')) && (pName.includes('sarden') || pName.includes('sardines'));
      }).length;
    }
    if (bLower === 'abc' || bLower.includes('kecap') || bLower.includes('saus') || bLower.includes('sambal')) {
      return products.filter((p) => {
        const pBrand = (p.brand || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        return pBrand === 'abc' && !pName.includes('baterai') && !pName.includes('sarden');
      }).length || brandProductCountMap['abc'] || 0;
    }
    const matched = Object.entries(brandProductCountMap).find(([k]) => bLower.includes(k) || k.includes(bLower));
    return matched ? matched[1] : (b.productCount || 0);
  };

  const getDynamicCategoryProductCount = (c: CategoryMaster): number => {
    return (
      categoryProductCountMap[c.id] ??
      categoryProductCountMap[String(c.code)] ??
      categoryProductCountMap[c.name.toLowerCase()] ??
      (c.productCount || 0)
    );
  };

  // Optimasi Anti-Lag: Pre-komputasi detail merek sekali di useMemo
  const enrichedBrandList = useMemo(() => {
    return filteredBrands.map((b, idx) => {
      const mapping = getBrandCategoryMapping(b.name, b, language as 'id' | 'en');
      const catCode = b.categoryCode || mapping.categoryCode;
      const catName = getCleanCategoryName(catCode, language as 'id' | 'en') || (isEn ? mapping.categoryNameEn : mapping.categoryNameId);
      const manufacturerName = b.manufacturer || mapping.manufacturer || (isEn ? 'Official Principal' : 'Principal Resmi');
      const defSup = getDefaultSupplierForCategory(catCode);
      const dynamicProductCount = getDynamicBrandProductCount(b);
      return {
        brand: b,
        idx,
        catCode,
        catName,
        manufacturerName,
        defSup,
        dynamicProductCount,
      };
    });
  }, [filteredBrands, brandProductCountMap, products, language, isEn]);

  // Optimasi Anti-Lag: Pre-komputasi detail kategori sekali di useMemo
  const enrichedCategoryList = useMemo(() => {
    return filteredCategories.map((c) => {
      const catCodeNum = Number(c.code);
      const defSup = getDefaultSupplierForCategory(catCodeNum);
      const dynamicProductCount = getDynamicCategoryProductCount(c);
      const localizedCatName = getCleanCategoryName(catCodeNum || c.name, language as 'id' | 'en');
      const localizedDeptName = getCleanDepartmentName(catCodeNum || c.department, language as 'id' | 'en');
      return {
        category: c,
        catCodeNum,
        defSup,
        dynamicProductCount,
        localizedCatName,
        localizedDeptName,
      };
    });
  }, [filteredCategories, categoryProductCountMap, language]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return suppliers.filter((s) => {
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        fuzzyMatchAny([s.name, s.code, s.contactPerson, s.phone, s.address], q, 0.65);
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [suppliers, searchQuery, statusFilter]);

  // Optimasi Anti-Lag: Pre-komputasi link WhatsApp supplier di useMemo
  const enrichedSupplierList = useMemo(() => {
    return filteredSuppliers.map((s, sIdx) => {
      const waLink = formatWhatsAppLink(s.phone, 'Katalog Produk & Pemesanan Grosir', undefined, s.name);
      return {
        supplier: s,
        sIdx,
        waLink,
      };
    });
  }, [filteredSuppliers]);

  const filteredCustomers = useMemo(() => {
    const codeVal = (c: any) => c.code || c.customer_code || '';
    const emailVal = (c: any) => c.email || '';
    const storeVal = (c: any) => c.store_name || '';
    const addressVal = (c: any) => c.store_address || '';
    const q = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      const cCode = codeVal(c);
      const cEmail = emailVal(c);
      const cStore = storeVal(c);
      const cAddress = addressVal(c);
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        cCode.toLowerCase().includes(q) ||
        cStore.toLowerCase().includes(q) ||
        cAddress.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        cEmail.toLowerCase().includes(q) ||
        fuzzyMatchAny([c.name, cStore, cCode, c.phone, cEmail, cAddress], q, 0.65);
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter || (statusFilter === 'Active' && c.is_active);
      return matchSearch && matchStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  // Optimasi Anti-Lag: Pre-komputasi detail pelanggan sekali di useMemo
  const enrichedCustomerList = useMemo(() => {
    return filteredCustomers.map((c) => {
      const storeName = (c.store_name || '').trim();
      const tierKey = getCustomerTierKey(c.memberTier || c.tier_level);
      return {
        customer: c,
        storeName,
        tierKey,
      };
    });
  }, [filteredCustomers]);

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = '';
    let filename = '';

    if (currentTab === 'brand') {
      filename = `Master_Brand_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,Kode,Nama Merek,Pabrikan,Negara Asal,Jumlah Produk,Status\n';
      brands.forEach((b) => {
        csvContent += `"${b.id}","${b.code}","${b.name}","${b.manufacturer}","${b.country}",${b.productCount},"${b.status}"\n`;
      });
    } else if (currentTab === 'category') {
      filename = `Master_Kategori_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,Kode,Nama Kategori,Departemen,PPN (%),Target Margin (%),Jumlah Produk,Status\n';
      categoriesMaster.forEach((c) => {
        csvContent += `"${c.id}","${c.code}","${c.name}","${c.department}",${c.taxRate},${c.marginTarget},${c.productCount},"${c.status}"\n`;
      });
    } else if (currentTab === 'product') {
      filename = `Master_Produk_ERP_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = '\uFEFFNO_URUT,BARCODE_CODE_ID,DESCRIPTION,BRAND,MANUFACTURE,CATEGORYCODE,CATEGORYNAME,UOM,SUPPLIER_NAME,SUPPLIER_WA,PRICE_RETAIL,PRICE_MEMBER,PRICE_WHOLESALE,VAT_INCLUDED\r\n';
      products.forEach((p, idx) => {
        const noUrut = idx + 1;
        const barcodeCodeId = p.barcode || p.plu || p.id;
        const safeDesc = `"${(p.description || p.name).replace(/"/g, '""')}"`;
        const safeBrand = `"${(p.brand || '').replace(/"/g, '""')}"`;
        const safeMan = `"${(p.manufacturer || '').replace(/"/g, '""')}"`;
        const catInfo = getErpCategoryInfo(p);
        const safeCatName = `"${catInfo.categoryName.replace(/"/g, '""')}"`;
        const uom = p.unit || 'PCS';
        const defSup = getDefaultSupplierForCategory(catInfo.categoryCode);
        const safeSupName = `"${(p.supplier || defSup.name).replace(/"/g, '""')}"`;
        const safeSupWa = `"${(p.supplierPhone || defSup.waNumber || defSup.phone).replace(/"/g, '""')}"`;
        const retail = p.price_retail || p.sell_price;
        const member = p.price_member || Math.round(retail * 0.95);
        const wholesale = p.price_wholesale || Math.round(retail * 0.90);
        const vat = p.taxable !== false ? 'TRUE' : 'FALSE';
        csvContent += `${noUrut},${barcodeCodeId},${safeDesc},${safeBrand},${safeMan},${catInfo.categoryCode},${safeCatName},${uom},${safeSupName},${safeSupWa},${retail},${member},${wholesale},${vat}\r\n`;
      });
    } else if (currentTab === 'supplier') {
      filename = `Master_Vendor_Supplier_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,Kode,Nama Perusahaan,Kontak Person,Telepon,Email,Alamat,Term Pembayaran,Status\n';
      suppliers.forEach((s) => {
        csvContent += `"${s.id}","${s.code}","${s.name}","${s.contactPerson}","${s.phone}","${s.email}","${s.address}","${s.paymentTerms}","${s.status}"\n`;
      });
    } else if (currentTab === 'customer') {
      filename = `Master_Pelanggan_Member_${new Date().toISOString().slice(0, 10)}.csv`;
      csvContent = 'ID,Kode,Nama Pelanggan,Tier Member,Telepon,Email,Poin,Total Belanja,Status\n';
      customers.forEach((c) => {
        csvContent += `"${c.id}","${c.code}","${c.name}","${c.memberTier}","${c.phone}","${c.email}",${c.points},${c.totalSpent},"${c.status}"\n`;
      });
    } else {
      showToast('Pilih entitas data untuk melakukan export.');
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Data ${currentTab.toUpperCase()} berhasil diekspor (${filename})!`);
    addAuditLog(`Export master data ${currentTab}`, 'MASTER_DATA', 'INFO');
  };

  // Handle Save changes / Trigger persistence
  const handleSaveChanges = () => {
    setBrands([...brands]);
    localStorage.setItem('jacs_erp_brands', JSON.stringify(brands));
    localStorage.setItem('jacs_erp_categories_master', JSON.stringify(categoriesMaster));
    localStorage.setItem('jacs_erp_suppliers', JSON.stringify(suppliers));
    localStorage.setItem('jacs_erp_customers', JSON.stringify(customers));
    localStorage.setItem('jacs_erp_products', JSON.stringify(products));
    showToast(isEn ? 'Master Data Successfully Synchronized & Saved' : 'Master Data Berhasil Disinkronkan & Disimpan');
    addAuditLog('Master Data Saved & Verified', 'MASTER_DATA', 'INFO');
  };

  // Handle File Upload for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportText(text);
      setImportStatus(`File "${file.name}" terbaca (${(file.size / 1024).toFixed(1)} KB). Klik "Proses Impor" untuk memvalidasi.`);
    };
    reader.readAsText(file);
  };

  // Process Import Data
  const handleProcessImport = () => {
    if (!importText.trim()) {
      showToast('Harap pilih file atau tempelkan teks CSV terlebih dahulu.');
      return;
    }

    try {
      const lines = importText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        showToast('File CSV tidak memiliki baris data.');
        return;
      }

      let importedCount = 0;

      if (currentTab === 'brand') {
        // Line skip header
        const newBrands: BrandMaster[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 3) {
            newBrands.push({
              id: cols[0] || `BRD-${String(brands.length + i).padStart(3, '0')}`,
              code: cols[1] || `B${i}`,
              name: cols[2],
              manufacturer: cols[3] || 'Pabrikan Mitra',
              country: cols[4] || 'Indonesia',
              productCount: parseInt(cols[5]) || 0,
              status: (cols[6] as 'Active' | 'Inactive') || 'Active',
            });
            importedCount++;
          }
        }
        setBrands((prev) => [...newBrands, ...prev]);
      } else if (currentTab === 'category') {
        const newCats: CategoryMaster[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 3) {
            newCats.push({
              id: cols[0] || `CAT-${String(categoriesMaster.length + i).padStart(3, '0')}`,
              code: cols[1] || `C${i}`,
              name: cols[2],
              department: cols[3] || 'General Merchandise',
              taxRate: parseFloat(cols[4]) || 11,
              marginTarget: parseFloat(cols[5]) || 20,
              productCount: parseInt(cols[6]) || 0,
              status: (cols[7] as 'Active' | 'Inactive') || 'Active',
            });
            importedCount++;
          }
        }
        setCategoriesMaster((prev) => [...newCats, ...prev]);
      } else if (currentTab === 'product') {
        const rawHeaderCols = lines[0].split(',').map((c) => c.replace(/^["'\s]+|["'\s]+$/g, ''));
        const normHeader = rawHeaderCols.map((c) => c.toLowerCase().replace(/[^a-z0-9]/g, ''));

        // Determine which model to parse as
        const report = validateCsvContent(importText, selectedBusinessModel);
        const activeModel: BusinessModelType =
          report.detectedModel !== 'unknown' && report.detectedModel !== 'generic'
            ? report.detectedModel
            : selectedBusinessModel;

        const findColIndex = (aliases: string[], fallbackIdx: number): number => {
          for (const alias of aliases) {
            const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
            const foundIdx = normHeader.findIndex((nh) => nh.includes(cleanAlias) || cleanAlias.includes(nh));
            if (foundIdx !== -1) return foundIdx;
          }
          return fallbackIdx;
        };

        const getCol = (cols: string[], aliases: string[], fallbackIdx: number): string => {
          const idx = findColIndex(aliases, fallbackIdx);
          return cols[idx] !== undefined ? cols[idx].trim() : '';
        };

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^["'\s]+|["'\s]+$/g, ''));
          if (cols.length < 2) continue;

          if (activeModel === 'retail') {
            const barcode = getCol(cols, ['barcode', 'kode'], 0) || `899${Math.floor(10000000 + Math.random() * 90000000)}`;
            const name = getCol(cols, ['nama barang', 'nama produk', 'nama'], 1) || 'Barang Ritel';
            const category = getCol(cols, ['kategori'], 2) || 'Sembako & Ritel';
            const unit = getCol(cols, ['satuan', 'unit'], 3) || 'PCS';
            const hpp = parseFloat(getCol(cols, ['hpp', 'harga beli', 'cost'], 4)) || 5000;
            const hargaJual = parseFloat(getCol(cols, ['harga jual', 'harga'], 5)) || Math.round(hpp * 1.25);
            const stok = parseInt(getCol(cols, ['stok', 'qty'], 6)) || 10;
            const minStok = parseInt(getCol(cols, ['min stok', 'minimum'], 7)) || 5;
            const kenaPajakRaw = getCol(cols, ['kena pajak', 'pajak', 'tax'], 8);
            const taxable = kenaPajakRaw.toUpperCase().includes('YA') || kenaPajakRaw.toUpperCase().includes('TRUE');

            addProduct({
              name,
              barcode,
              category,
              brand: 'Ritel Swalayan',
              sell_price: hargaJual,
              cost_price: hpp,
              stock: stok,
              unit,
              min_stock: minStok,
              taxable,
              businessModel: 'retail',
              status: stok > 0 ? 'Active' : 'Out of Stock',
            });
            importedCount++;
          } else if (activeModel === 'fnb') {
            const code = getCol(cols, ['kode menu', 'kode', 'barcode'], 0) || `FNB-${String(products.length + i).padStart(3, '0')}`;
            const name = getCol(cols, ['nama menu', 'nama'], 1) || 'Menu Baru';
            const category = getCol(cols, ['kategori'], 2) || 'Makanan Utama';
            const hargaJual = parseFloat(getCol(cols, ['harga jual', 'harga'], 3)) || 25000;
            const hpp = Math.round(hargaJual * 0.45);
            const kitchen = getCol(cols, ['posisi dapur', 'kot', 'dapur'], 4) || 'Dapur Utama';
            const spicy = getCol(cols, ['opsi pedas', 'pedas'], 5).toUpperCase().includes('YA');
            const topping = getCol(cols, ['opsi topping', 'topping'], 6).toUpperCase().includes('YA');
            const menuStatus = getCol(cols, ['status menu', 'status'], 7) || 'Tersedia';
            const isAvailable = !menuStatus.toLowerCase().includes('habis');

            addProduct({
              name,
              barcode: code,
              category,
              brand: 'Kitchen F&B',
              sell_price: hargaJual,
              cost_price: hpp,
              stock: isAvailable ? 99 : 0,
              unit: 'PORSI',
              kitchenStation: kitchen,
              spicyOption: spicy,
              toppingOption: topping,
              menuStatus,
              businessModel: 'fnb',
              status: isAvailable ? 'Active' : 'Out of Stock',
            });
            importedCount++;
          } else if (activeModel === 'pharmacy') {
            const barcode = getCol(cols, ['barcode', 'kode'], 0) || `899${Math.floor(20000000 + Math.random() * 80000000)}`;
            const name = getCol(cols, ['nama obat', 'nama'], 1) || 'Obat Baru';
            const drugClass = getCol(cols, ['golongan'], 2) || 'Obat Bebas';
            const batchNo = getCol(cols, ['no batch', 'batch'], 3) || `BATCH-${Date.now().toString().slice(-4)}`;
            const expDate = getCol(cols, ['exp date', 'kadaluarsa', 'expired'], 4) || '2027-12-31';
            const dosageUnit = getCol(cols, ['satuan dosis', 'satuan', 'dosis'], 5) || 'Strip';
            const hpp = parseFloat(getCol(cols, ['hpp', 'harga beli'], 6)) || 8000;
            const hargaJual = parseFloat(getCol(cols, ['harga jual', 'harga'], 7)) || Math.round(hpp * 1.3);
            const stok = parseInt(getCol(cols, ['stok'], 8)) || 50;

            addProduct({
              name,
              barcode,
              category: `Farmasi - ${drugClass}`,
              brand: 'Apotek Mandiri',
              sell_price: hargaJual,
              cost_price: hpp,
              stock: stok,
              unit: dosageUnit,
              dosageUnit,
              drugClass,
              batchNo,
              expDate,
              businessModel: 'pharmacy',
              status: stok > 0 ? 'Active' : 'Out of Stock',
            });
            importedCount++;
          } else if (activeModel === 'fashion') {
            const parentSku = getCol(cols, ['sku induk', 'sku'], 0) || `FSH-${i}`;
            const variantBarcode = getCol(cols, ['barcode varian', 'barcode'], 1) || `899${Math.floor(30000000 + Math.random() * 70000000)}`;
            const name = getCol(cols, ['nama produk', 'nama'], 2) || 'Produk Fashion';
            const size = getCol(cols, ['ukuran', 'size'], 3) || 'All Size';
            const color = getCol(cols, ['warna', 'color'], 4) || 'Standard';
            const hpp = parseFloat(getCol(cols, ['hpp', 'harga beli'], 5)) || 50000;
            const tagPrice = parseFloat(getCol(cols, ['harga tag', 'harga jual', 'harga'], 6)) || Math.round(hpp * 1.8);
            const stok = parseInt(getCol(cols, ['stok varian', 'stok'], 7)) || 20;

            addProduct({
              name: `${name} (${color}, ${size})`,
              barcode: variantBarcode,
              category: 'Pakaian & Fashion',
              brand: 'Boutique Collection',
              sell_price: tagPrice,
              tagPrice,
              cost_price: hpp,
              stock: stok,
              unit: 'PCS',
              size,
              color,
              parentSku,
              variantBarcode,
              businessModel: 'fashion',
              status: stok > 0 ? 'Active' : 'Out of Stock',
            });
            importedCount++;
          } else if (activeModel === 'gadget') {
            const deviceType = getCol(cols, ['kode tipe', 'tipe'], 0) || `GDT-${i}`;
            const name = getCol(cols, ['nama gadget', 'nama'], 1) || 'Gadget Unit';
            const imei = getCol(cols, ['no imei/serial', 'imei', 'serial', 'barcode'], 2) || `35${Math.floor(1000000000000 + Math.random() * 9000000000000)}`;
            const specs = getCol(cols, ['spek', 'spesifikasi'], 3) || 'Spesifikasi Standar';
            const hpp = parseFloat(getCol(cols, ['hpp', 'harga beli'], 4)) || 2000000;
            const hargaJual = parseFloat(getCol(cols, ['harga jual', 'harga'], 5)) || Math.round(hpp * 1.2);
            const warranty = getCol(cols, ['masa garansi', 'garansi'], 6) || '12 Bulan';

            addProduct({
              name,
              barcode: imei,
              category: 'Gadget & Elektronik',
              brand: 'Official Store',
              sell_price: hargaJual,
              cost_price: hpp,
              stock: 1,
              unit: 'UNIT',
              deviceType,
              imeiSerial: imei,
              specs,
              warrantyPeriod: warranty,
              businessModel: 'gadget',
              status: 'Active',
            });
            importedCount++;
          } else if (activeModel === 'services') {
            const serviceCode = getCol(cols, ['kode jasa', 'kode'], 0) || `SRV-${i}`;
            const serviceName = getCol(cols, ['nama layanan', 'nama jasa', 'nama'], 1) || 'Layanan Servis';
            const category = getCol(cols, ['kategori'], 2) || 'Jasa & Servis';
            const serviceFee = parseFloat(getCol(cols, ['biaya jasa', 'jasa'], 4)) || 50000;
            const partCost = parseFloat(getCol(cols, ['harga part', 'part', 'bahan'], 5)) || 0;
            const totalTarif = parseFloat(getCol(cols, ['total tarif', 'tarif', 'harga'], 6)) || (serviceFee + partCost);

            addProduct({
              name: serviceName,
              barcode: serviceCode,
              category,
              brand: 'Divisi Jasa',
              sell_price: totalTarif,
              cost_price: partCost,
              stock: 999,
              unit: 'LAYANAN',
              businessModel: 'services',
              status: 'Active',
            });
            importedCount++;
          }
        }
      } else if (currentTab === 'supplier') {
        const newSups: SupplierMaster[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 3) {
            newSups.push({
              id: cols[0] || `SUP-${String(suppliers.length + i).padStart(3, '0')}`,
              code: cols[1] || `VND-${i}`,
              name: cols[2],
              contactPerson: cols[3] || 'PIC',
              phone: cols[4] || '-',
              email: cols[5] || '-',
              address: cols[6] || '-',
              paymentTerms: cols[7] || 'TOP 30 Hari',
              activePoCount: 0,
              status: (cols[8] as 'Active' | 'Inactive') || 'Active',
            });
            importedCount++;
          }
        }
        setSuppliers((prev) => [...newSups, ...prev]);
      } else if (currentTab === 'customer') {
        const newCust: CustomerMaster[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 3) {
            newCust.push({
              id: cols[0] || `MBR-${String(customers.length + i).padStart(3, '0')}`,
              code: cols[1] || `MBR-${i}`,
              name: cols[2],
              memberTier: (cols[3] as 'Platinum' | 'Gold' | 'Silver' | 'Reguler') || 'Reguler',
              phone: cols[4] || '-',
              email: cols[5] || '-',
              points: parseInt(cols[6]) || 0,
              totalSpent: parseFloat(cols[7]) || 0,
              status: (cols[8] as 'Active' | 'Inactive') || 'Active',
            });
            importedCount++;
          }
        }
        setCustomers((prev) => [...newCust, ...prev]);
      }

      showToast(`Sukses mengimpor ${importedCount} data master ${currentTab.toUpperCase()}!`);
      addAuditLog(`Import ${importedCount} records into ${currentTab}`, 'MASTER_DATA', 'INFO');
      setIsImportModalOpen(false);
      setImportText('');
      setImportFileName('');
      setImportStatus(null);
    } catch (err: any) {
      showToast(`Gagal mengurai CSV: ${err.message}`);
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    if (currentTab === 'brand') {
      setBrandForm({
        code: `BRD-${String(brands.length + 1).padStart(3, '0')}`,
        name: '',
        manufacturer: '',
        country: 'Indonesia',
        status: 'Active',
      });
    } else if (currentTab === 'category') {
      setCategoryForm({
        code: `CAT-${String(categoriesMaster.length + 1).padStart(3, '0')}`,
        name: '',
        department: 'Food & Beverage',
        taxRate: 11,
        marginTarget: 20,
        status: 'Active',
      });
    } else if (currentTab === 'product') {
      const nextNum = products.length + 1;
      const nextPlu = `PLU-${String(nextNum).padStart(3, '0')}`;
      const defaultCat = ERP_CATEGORIES[0]; // Category 2: Detergent
      const mapped = ERP_CATALOG_MAPPING[defaultCat.code] || [];
      const firstBrand = mapped[0]?.brand || 'Attack';
      const firstMan = mapped[0]?.manufacturer || 'PT Kao Indonesia';
      const defSup = getDefaultSupplierForCategory(defaultCat.code);

      setProductForm({
        plu: nextPlu,
        barcode: '',
        name: '',
        description: '',
        categoryCode: defaultCat.code,
        category: defaultCat.name,
        brand: firstBrand,
        manufacturer: firstMan,
        supplier: defSup.name,
        supplierPhone: defSup.phone,
        supplierAddress: defSup.address,
        supplierNotes: `${defSup.paymentTerms} (${defSup.notes})`,
        unit: 'Pcs',
        sell_price: 24500,
        price_retail: 24500,
        price_member: 23200,
        price_wholesale: 21500,
        cost_price: 18500,
        stock: 50,
        initialStock: 50,
        taxable: true,
        status: 'Active',
        businessModel: selectedBusinessModel || 'retail',
      });
    } else if (currentTab === 'supplier') {
      setSupplierForm({
        code: `VND-${String(suppliers.length + 1).padStart(3, '0')}`,
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        paymentTerms: 'TOP 30 Hari',
        status: 'Active',
      });
    } else if (currentTab === 'customer' || activeRetailTab === 'customer') {
      setCurrentTab('customer');
      const nextNum = customers.length + 1;
      setCustomerForm({
        code: `MBR-${String(nextNum).padStart(3, '0')}`,
        name: '',
        store_name: '',
        phone: '',
        store_address: '',
        memberTier: 'Member',
        email: '',
        points: 100,
        totalSpent: 0,
        status: 'Active',
      });
    }
    setIsAddModalOpen(true);
  };

  // Handle Submit Add
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTab === 'brand') {
      if (!brandForm.name.trim()) return showToast('Nama Merek wajib diisi!');
      const newBrand: BrandMaster = {
        ...brandForm,
        id: `BRD-${String(brands.length + 1).padStart(3, '0')}`,
        productCount: 0,
      };
      setBrands((prev) => [newBrand, ...prev]);
      showToast(`Merek "${newBrand.name}" berhasil ditambahkan!`);
      addAuditLog(`Brand ${newBrand.name} ditambahkan`, 'MASTER_DATA');
    } else if (currentTab === 'category') {
      if (!categoryForm.name.trim()) return showToast('Nama Kategori wajib diisi!');
      const newCat: CategoryMaster = {
        ...categoryForm,
        id: `CAT-${String(categoriesMaster.length + 1).padStart(3, '0')}`,
        productCount: 0,
      };
      setCategoriesMaster((prev) => [newCat, ...prev]);
      showToast(`Kategori "${newCat.name}" berhasil ditambahkan!`);
      addAuditLog(`Category ${newCat.name} ditambahkan`, 'MASTER_DATA');
    } else if (currentTab === 'product') {
      if (!productForm.name.trim()) return showToast('Nama Produk SKU wajib diisi!');
      const rawPlu = (productForm.plu || '').trim();
      const finalPlu = rawPlu || `PLU-${String(products.length + 1).padStart(3, '0')}`;
      // Logika Auto-fill Barcode: Jika field Barcode dibiarkan kosong oleh pengguna, sistem wajib otomatis mengisinya dengan nilai dari field PLU
      const finalBarcode = (productForm.barcode || '').trim() || finalPlu;
      const duplicate = products.find((p) => p.barcode?.trim() === finalBarcode || p.id === finalBarcode);
      if (duplicate) {
        showToast(`Gagal: Barcode "${finalBarcode}" sudah terdaftar oleh produk "${duplicate.name}"!`);
        return;
      }
      const formattedName = toTitleCase(productForm.name.trim());
      const retailPrice = Number(productForm.price_retail) || Number(productForm.sell_price) || 0;
      const memberPrice = Number(productForm.price_member) || Math.round(retailPrice * 0.95);
      const wholesalePrice = Number(productForm.price_wholesale) || Math.round(retailPrice * 0.90);
      const costPrice = Number(productForm.cost_price) || Math.round(retailPrice * 0.75);
      const stockQty = Number(productForm.stock) || 50;

      const catInfo = getErpCategoryInfo({
        category: productForm.category,
        categoryCode: productForm.categoryCode,
      });

      const defSup = getDefaultSupplierForCategory(catInfo.categoryCode);

      const newProductItem: Omit<Product, 'id'> = {
        ...productForm,
        name: formattedName,
        description: productForm.description || formattedName,
        plu: finalPlu,
        barcode: finalBarcode,
        category: catInfo.categoryName,
        categoryCode: catInfo.categoryCode,
        brand: productForm.brand || availableBrandsForAdd[0]?.brand || 'Attack',
        manufacturer: productForm.manufacturer || availableBrandsForAdd[0]?.manufacturer || 'PT Kao Indonesia',
        supplier: productForm.supplier || defSup.name,
        supplierPhone: productForm.supplierPhone || defSup.phone,
        supplierAddress: productForm.supplierAddress || defSup.address,
        supplierNotes: productForm.supplierNotes || `${defSup.paymentTerms} (${defSup.notes})`,
        unit: productForm.unit || 'Pack',
        sell_price: retailPrice,
        price_retail: retailPrice,
        price_member: memberPrice,
        price_wholesale: wholesalePrice,
        cost_price: costPrice,
        stock: stockQty,
        initialStock: stockQty,
        taxable: productForm.taxable !== false,
        status: stockQty > 0 ? 'Active' : 'Out of Stock',
        businessModel: selectedBusinessModel || 'retail',
      };

      addProduct(newProductItem);
      showToast(`Produk SKU "${formattedName}" (${finalPlu}) berhasil ditambahkan dan siap dijual di POS Kasir!`);
      addAuditLog(`Tambah Produk Master: ${formattedName} (${finalPlu})`, 'MASTER_DATA');
    } else if (currentTab === 'supplier') {
      if (!supplierForm.name.trim()) return showToast('Nama Supplier / Vendor wajib diisi!');
      const newSup: SupplierMaster = {
        ...supplierForm,
        id: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
        activePoCount: 0,
      };
      setSuppliers((prev) => [newSup, ...prev]);
      showToast(`Supplier "${newSup.name}" berhasil didaftarkan!`);
      addAuditLog(`Supplier ${newSup.name} didaftarkan`, 'MASTER_DATA');
    } else if (currentTab === 'customer' || activeRetailTab === 'customer') {
      if (!customerForm.name.trim()) return showToast('Nama Pelanggan (PIC) wajib diisi!');
      const rawStore = customerForm.store_name.trim();
      const newCust: CustomerMaster = {
        id: `MBR-${Date.now().toString().slice(-6)}`,
        code: customerForm.code.trim() || `MBR-${String(customers.length + 1).padStart(3, '0')}`,
        customer_code: customerForm.code.trim() || `MBR-${String(customers.length + 1).padStart(3, '0')}`,
        name: customerForm.name.trim(),
        has_store: Boolean(rawStore),
        store_name: rawStore || undefined,
        phone: customerForm.phone.trim() || '-',
        store_address: customerForm.store_address.trim() || undefined,
        memberTier: customerForm.memberTier,
        tier_level: customerForm.memberTier,
        allowed_tiers: customerForm.memberTier === 'Grosir' ? ['RETAIL', 'MEMBER', 'WHOLESALE'] : customerForm.memberTier === 'Member' ? ['RETAIL', 'MEMBER'] : ['RETAIL'],
        email: customerForm.email.trim() || undefined,
        points: Number(customerForm.points) || 100,
        totalSpent: 0,
        status: customerForm.status || 'Active',
        is_active: true,
      };
      setCustomers((prev) => [newCust, ...prev]);
      showToast(`Pelanggan "${newCust.name}" (${newCust.store_name || 'Personal'}) berhasil ditambahkan!`);
      addAuditLog('CREATE', `Customer Baru: ${newCust.name} (${newCust.code}) - Tier: ${newCust.memberTier}`);
    }
    setIsAddModalOpen(false);
  };

  // Open Edit
  const handleOpenEdit = (item: any) => {
    if (activeRetailTab === 'product' || currentTab === 'product') {
      setCurrentTab('product');
      const retail = item.price_retail ?? item.sell_price ?? 0;
      const member = item.price_member ?? Math.round(retail * 0.95);
      const wholesale = item.price_wholesale ?? Math.round(retail * 0.90);
      setEditingItem({
        ...item,
        price_retail: retail,
        price_member: member,
        price_wholesale: wholesale,
        sell_price: retail,
      });
    } else if (activeRetailTab === 'customer' || currentTab === 'customer') {
      setCurrentTab('customer');
      setEditingItem({
        ...item,
        memberTier: item.memberTier || item.tier_level || 'Member',
        store_name: item.store_name || '',
        store_address: item.store_address || item.notes || '',
        phone: item.phone || '',
      });
    } else if (activeRetailTab === 'supplier' || currentTab === 'supplier') {
      setCurrentTab('supplier');
      setEditingItem({ ...item });
    } else if (activeRetailTab === 'category' || currentTab === 'category') {
      setCurrentTab('category');
      setEditingItem({ ...item });
    } else if (activeRetailTab === 'brand' || currentTab === 'brand') {
      setCurrentTab('brand');
      setEditingItem({ ...item });
    } else {
      setEditingItem({ ...item });
    }
    setIsEditModalOpen(true);
  };

  // Handler: Set Harga Massal Berbasis % dari HPP
  const handleApplyBulkPrice = () => {
    const { retail, member, wholesale } = bulkMarginPercent;

    // Formula: Harga = HPP + (HPP * % / 100)
    const updatedProducts = products.map((p) => {
      const hpp = Number(p.cost_price) || (p.sell_price ? Math.round(p.sell_price * 0.8) : 10000);
      const newRetail = Math.round(hpp + (hpp * retail / 100));
      const newMember = Math.round(hpp + (hpp * member / 100));
      const newWholesale = Math.round(hpp + (hpp * wholesale / 100));

      return {
        ...p,
        cost_price: hpp,
        price_retail: newRetail,
        price_member: newMember,
        price_wholesale: newWholesale,
        sell_price: newRetail,
      };
    });

    setProducts(updatedProducts);
    localStorage.setItem('jacs_erp_products', JSON.stringify(updatedProducts));

    addAuditLog(
      `Set Harga Massal (% HPP): Ecer +${retail}%, Member +${member}%, Grosir +${wholesale}% pada ${products.length} produk`,
      'MASTER_DATA'
    );
    showToast(
      isEn
        ? `Bulk prices updated for ${products.length} products (Retail +${retail}%, Member +${member}%, Wholesale +${wholesale}%).`
        : `Harga massal berhasil diterapkan ke seluruh ${products.length} produk berdasarkan HPP (Ecer +${retail}%, Member +${member}%, Grosir +${wholesale}%).`
    );
    setIsBulkPriceModalOpen(false);
  };

  // Handle Submit Edit
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (currentTab === 'brand' || activeRetailTab === 'brand') {
      const updatedBrands = brands.map((b) =>
        b.id === editingItem.id
          ? {
              ...b,
              name: editingItem.name,
              manufacturer: editingItem.manufacturer,
              country: editingItem.country || b.country,
              status: editingItem.status,
            }
          : b
      );
      setBrands(updatedBrands);
      localStorage.setItem('jacs_erp_brands', JSON.stringify(updatedBrands));
      showToast(`Merek "${editingItem.name}" diperbarui.`);
      addAuditLog(`Brand ${editingItem.name} diperbarui`, 'MASTER_DATA');
    } else if (currentTab === 'category') {
      setCategoriesMaster((prev) => prev.map((c) => (c.id === editingItem.id ? editingItem : c)));
      showToast(`Kategori "${editingItem.name}" diperbarui.`);
    } else if (currentTab === 'product') {
      const finalPlu = (editingItem.plu || '').trim() || editingItem.id;
      const finalBarcode = (editingItem.barcode || '').trim() || finalPlu;
      const formattedName = toTitleCase((editingItem.name || '').trim());
      const retailPrice = Number(editingItem.price_retail) || Number(editingItem.sell_price) || 0;
      const memberPrice = Number(editingItem.price_member) || Math.round(retailPrice * 0.95);
      const wholesalePrice = Number(editingItem.price_wholesale) || Math.round(retailPrice * 0.90);

      const catInfo = getErpCategoryInfo({
        category: editingItem.category,
        categoryCode: editingItem.categoryCode,
      });

      const defSup = getDefaultSupplierForCategory(catInfo.categoryCode);

      const updated = {
        ...editingItem,
        name: formattedName,
        description: editingItem.description || formattedName,
        category: catInfo.categoryName,
        categoryCode: catInfo.categoryCode,
        brand: editingItem.brand || 'Attack',
        manufacturer: editingItem.manufacturer || 'PT Kao Indonesia',
        supplier: editingItem.supplier || defSup.name,
        supplierPhone: editingItem.supplierPhone || defSup.phone,
        supplierAddress: editingItem.supplierAddress || defSup.address,
        supplierNotes: editingItem.supplierNotes || `${defSup.paymentTerms} (${defSup.notes})`,
        plu: finalPlu,
        barcode: finalBarcode,
        price_retail: retailPrice,
        price_member: memberPrice,
        price_wholesale: wholesalePrice,
        sell_price: retailPrice,
        taxable: editingItem.taxable !== false,
      };
      updateProduct(editingItem.id, updated);
      showToast(`Produk SKU "${formattedName}" (${finalPlu}) diperbarui di master & POS kasir.`);
      addAuditLog(`Edit Produk Master: ${formattedName} (${finalPlu})`, 'MASTER_DATA');
    } else if (currentTab === 'supplier') {
      setSuppliers((prev) => prev.map((s) => (s.id === editingItem.id ? editingItem : s)));
      showToast(`Data Supplier "${editingItem.name}" diperbarui.`);
    } else if (currentTab === 'customer' || activeRetailTab === 'customer') {
      const tierVal = editingItem.memberTier || editingItem.tier_level || 'Member';
      const updated = {
        ...editingItem,
        has_store: Boolean(editingItem.store_name && editingItem.store_name.trim()),
        memberTier: tierVal,
        tier_level: tierVal,
        allowed_tiers: tierVal === 'Grosir' ? ['RETAIL', 'MEMBER', 'WHOLESALE'] : tierVal === 'Member' ? ['RETAIL', 'MEMBER'] : ['RETAIL'],
        status: editingItem.status || 'Active',
        is_active: editingItem.status === 'Active' || editingItem.is_active !== false,
      };
      setCustomers((prev) => prev.map((c) => (c.id === editingItem.id ? updated : c)));
      if (selectedDetailCustomer && selectedDetailCustomer.id === editingItem.id) {
        setSelectedDetailCustomer(updated);
      }
      showToast(`Data Pelanggan "${editingItem.name}" diperbarui.`);
      addAuditLog('UPDATE', `Edit Pelanggan: ${editingItem.name}`);
    }

    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // Handle Delete
  const handleDelete = (id: string, name: string, count?: number) => {
    if (currentTab === 'brand') {
      const targetBrand = brands.find((b) => b.id === id);
      const skuCount = count !== undefined ? count : (targetBrand?.productCount ?? 0);

      if (skuCount > 0) {
        const alertMsg = 'Merek tidak dapat dihapus karena masih digunakan oleh produk aktif';
        showToast(alertMsg);
        try {
          if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(alertMsg);
          }
        } catch {
          // ignore if window.alert restricted
        }
        return;
      }

      if (!window.confirm(`Yakin ingin menghapus data "${name}" (ID: ${id})?`)) return;

      const updatedBrands = brands.filter((b) => b.id !== id);
      setBrands(updatedBrands);
      localStorage.setItem('jacs_erp_brands', JSON.stringify(updatedBrands));
      showToast(`Merek "${name}" dihapus.`);
      addAuditLog(`Brand ${name} dihapus`, 'MASTER_DATA');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus data "${name}" (ID: ${id})?`)) return;

    if (currentTab === 'category') {
      setCategoriesMaster((prev) => prev.filter((c) => c.id !== id));
      showToast(`Kategori "${name}" dihapus.`);
    } else if (currentTab === 'product') {
      deleteProduct(id);
    } else if (currentTab === 'supplier') {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      showToast(`Supplier "${name}" dihapus.`);
    } else if (currentTab === 'customer' || activeRetailTab === 'customer') {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedDetailCustomer && selectedDetailCustomer.id === id) {
        setIsCustomerDetailOpen(false);
        setSelectedDetailCustomer(null);
      }
      showToast(`Pelanggan "${name}" dihapus.`);
    }
  };

  // Render Official Print Preview Modal
  const renderPrintModal = () => {
    if (!isPrintModalOpen) return null;

    let titleDoc = '';
    let rows: any[] = [];
    let headers: string[] = [];

    const activePrintScope = printTargetTab || currentTab;

    if (activePrintScope === 'brand') {
      titleDoc = 'LAPORAN RESMI MASTER MEREK & PABRIKAN';
      headers = ['KODE', 'NAMA MEREK', 'PABRIKAN / PRINCIPAL', 'NEGARA', 'STATUS'];
      rows = filteredBrands.map((b) => [b.code, b.name, b.manufacturer, b.country, b.status]);
    } else if (activePrintScope === 'category') {
      titleDoc = 'LAPORAN RESMI HIERARKI KATEGORI PRODUK';
      headers = ['KODE', 'NAMA KATEGORI', 'DEPARTEMEN', 'PPN %', 'TARGET MARGIN', 'STATUS'];
      rows = filteredCategories.map((c) => [c.code, c.name, c.department, `${c.taxRate}%`, `${c.marginTarget}%`, c.status]);
    } else if (activePrintScope === 'product') {
      titleDoc = 'LAPORAN RESMI MASTER KATALOG PRODUK & HARGA (SKU)';
      headers = ['KODE / SKU', 'BARCODE', 'NAMA BARANG', 'KATEGORI', 'HARGA JUAL', 'STOK', 'STATUS'];
      rows = filteredProducts.map((p) => [
        p.id,
        p.barcode || '-',
        p.name,
        p.category,
        `Rp ${p.sell_price.toLocaleString('id-ID')}`,
        `${p.stock} ${p.unit || 'PCS'}`,
        p.status,
      ]);
    } else if (activePrintScope === 'supplier') {
      titleDoc = 'LAPORAN RESMI MITRA PENGADAAN & SUPPLIER';
      headers = ['KODE', 'NAMA VENDOR', 'PIC', 'TELEPON', 'TERM PEMBAYARAN', 'STATUS'];
      rows = filteredSuppliers.map((s) => [s.code, s.name, s.contactPerson, s.phone, s.paymentTerms, s.status]);
    } else if (activePrintScope === 'customer') {
      titleDoc = 'LAPORAN RESMI DATABASE PELANGGAN & MEMBER TOKO';
      headers = ['KODE', 'NAMA MEMBER', 'TIER', 'TELEPON', 'POIN', 'TOTAL BELANJA', 'STATUS'];
      rows = filteredCustomers.map((c) => [
        c.code || c.customer_code || '',
        c.name,
        c.memberTier || c.tier_level || 'Silver',
        c.phone,
        `${c.points ?? 0} Pts`,
        `Rp ${(c.totalSpent ?? 0).toLocaleString('id-ID')}`,
        c.status || (c.is_active ? 'Active' : 'Inactive'),
      ]);
    }

    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
        <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Print Modal Top Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-base">Pratinjau Cetak Dokumen Resmi</h3>
                <p className="text-xs text-slate-400">Siap cetak kertas A4 / Export PDF</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-sm cursor-pointer transition"
              >
                <Printer className="w-4 h-4" />
                Cetak Sekarang
              </button>
              <button
                onClick={() => {
                  setIsPrintModalOpen(false);
                  setPrintTargetTab(null);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Body */}
          <div className="p-8 overflow-y-auto font-sans text-xs space-y-6">
            {/* Kop Surat JacS RetailOS ERP */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div>
                <h1 className="text-xl font-extrabold tracking-wider text-slate-950">JACS RETAILOS ERP</h1>
                <p className="text-slate-600 font-medium">Headquarters: Grand Sudirman Office Tower, Lt. 24, Jakarta</p>
                <p className="text-slate-500">Telp: (021) 5088-7700 | Email: corporate@jacs-retailos.com | Web: www.jacs-retailos.com</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 font-mono font-bold rounded text-[11px]">
                  DOC-JACS-{Date.now().toString().slice(-6)}
                </span>
                <p className="text-slate-500 mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2">
              <h2 className="text-base font-bold tracking-wide uppercase text-slate-900">{titleDoc}</h2>
              <p className="text-slate-500 text-[11px]">Daftar Canonical Master Data Terverifikasi Otomatis</p>
            </div>

            {/* Data Table */}
            <table className="w-full border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="border border-slate-300 px-3 py-2 text-center w-10">No</th>
                  {headers.map((h, i) => (
                    <th key={`print-hdr-${h}-${i}`} className="border border-slate-300 px-3 py-2 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, idx) => (
                  <tr key={`print-row-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="border border-slate-300 px-3 py-1.5 text-center font-mono">{idx + 1}</td>
                    {row.map((cell: any, cIdx: number) => (
                      <td key={`print-cell-${idx}-${cIdx}`} className="border border-slate-300 px-3 py-1.5 font-medium">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length > 50 && (
              <p className="text-[11px] text-slate-500 italic">
                * Menampilkan 50 dari {rows.length} baris data resmi. Gunakan Export CSV untuk seluruh dataset.
              </p>
            )}

            {/* Tanda Tangan & Otorisasi */}
            <div className="pt-8 flex justify-between text-center">
              <div className="w-48">
                <p className="font-medium text-slate-600">Disusun Oleh:</p>
                <div className="h-16"></div>
                <p className="font-bold border-t border-slate-400 pt-1 text-slate-900">Administrator Master Data</p>
              </div>
              <div className="w-48">
                <p className="font-medium text-slate-600">Mengetahui:</p>
                <div className="h-16"></div>
                <p className="font-bold border-t border-slate-400 pt-1 text-slate-900">General Manager JacS ERP</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Import Modal
  const renderImportModal = () => {
    if (!isImportModalOpen) return null;

    const currentTmpl = currentTab === 'product' ? BUSINESS_MODEL_TEMPLATES[selectedBusinessModel] : null;

    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
        <div className={`w-full ${currentTab === 'product' ? 'max-w-3xl' : 'max-w-xl'} max-h-[92vh] flex flex-col rounded-2xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
        }`}>
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-700/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base tracking-[-0.01em]">
                  Impor File Data (CSV / Excel)
                </h3>
                <p className="text-xs text-gray-400">
                  Target Modul: <span className="text-cyan-400 font-semibold">{currentTab.toUpperCase()}</span>
                  {currentTab === 'product' && ` • Model: ${currentTmpl?.label}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsImportModalOpen(false);
                setImportText('');
                setImportFileName('');
                setImportStatus(null);
              }}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Business Model Selector Tabs (Only for Product module) */}
            {currentTab === 'product' && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-400">
                      PILIH TEMPLATE MODEL BISNIS:
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    Otomatis Validasi Kolom
                  </span>
                </div>

                {/* 6 Business Model Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {(
                    [
                      { id: 'retail', label: 'Ritel / Swalayan', icon: ShoppingCart },
                      { id: 'fnb', label: 'F&B (Resto)', icon: UtensilsCrossed },
                      { id: 'pharmacy', label: 'Apotek', icon: Pill },
                      { id: 'fashion', label: 'Fashion', icon: Shirt },
                      { id: 'gadget', label: 'Gadget', icon: Smartphone },
                      { id: 'services', label: 'Jasa & Servis', icon: Wrench },
                    ] as { id: BusinessModelType; label: string; icon: any }[]
                  ).map((m, mIdx) => {
                    const IconComp = m.icon;
                    const isSelected = selectedBusinessModel === m.id;
                    return (
                      <button
                        key={`biz-model-modal-${m.id}-${mIdx}`}
                        type="button"
                        onClick={() => {
                          setSelectedBusinessModel(m.id);
                          setImportStatus(null);
                        }}
                        className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 border transition cursor-pointer text-center ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-xs'
                            : isLight
                            ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            : 'bg-black/30 text-gray-400 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[11px] leading-tight">{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Model Column Spec & Quick Actions */}
                {currentTmpl && (
                  <div className="pt-2 border-t border-gray-700/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[11px] text-gray-400 block mb-1">
                        Format Kolom Terverifikasi ({currentTmpl.headers.length} kolom):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {currentTmpl.headers.map((h, i) => (
                          <span
                            key={`tmpl-hdr-${h}-${i}`}
                            className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                              currentTmpl.requiredColumns.includes(h)
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                                : isLight
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-gray-800 text-gray-300'
                            }`}
                          >
                            {h} {currentTmpl.requiredColumns.includes(h) && '*'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadTemplate(selectedBusinessModel)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Template CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUseSampleData(selectedBusinessModel)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Muat Contoh Data</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Drag & Drop or Click Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                isLight ? 'border-slate-300 hover:border-cyan-500 bg-slate-50' : 'border-slate-700 hover:border-cyan-500 bg-[#0d1117]'
              }`}
            >
              <FileSpreadsheet className="w-8 h-8 mx-auto text-cyan-400 mb-1.5" />
              <p className="font-semibold text-sm">Klik untuk memilih file .CSV / .XLSX</p>
              <p className="text-xs text-gray-500 mt-0.5">Atau seret & letakkan file spreadsheet Anda ke sini</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              {importFileName && (
                <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {importFileName}
                </div>
              )}
            </div>

            {/* Automated Validation Report Badge & Preview Table */}
            {validationReport && (
              <div className="space-y-2.5">
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                    validationReport.isValid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {validationReport.isValid ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  )}
                  <div className="flex-1 font-medium">{validationReport.message}</div>
                </div>

                {/* Live Data Preview Table (Up to 3 Rows) */}
                {validationReport.previewRows.length > 0 && (
                  <div className={`p-3 rounded-xl border overflow-x-auto ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-gray-800'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                        Pratinjau Data Terbaca ({validationReport.previewRows.length} dari {validationReport.totalDataRows} baris):
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        Model: {validationReport.detectedModel.toUpperCase()}
                      </span>
                    </div>
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-700/50 text-[10px] text-gray-400 font-semibold uppercase">
                          {validationReport.matchedHeaders.map((hdr, hIdx) => (
                            <th key={hIdx} className="pb-1.5 pr-3 font-medium whitespace-nowrap">
                              {hdr}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/40 font-mono text-[11px]">
                        {validationReport.previewRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-white/5">
                            {validationReport.matchedHeaders.map((hdr, cIdx) => (
                              <td key={cIdx} className="py-1.5 pr-3 whitespace-nowrap text-gray-300">
                                {row[hdr] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Direct Paste CSV Text */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-gray-400">
                Atau Tempel / Edit Konten Teks CSV:
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={
                  currentTmpl
                    ? currentTmpl.sampleCsv
                    : 'ID,Kode,Nama Merek/Produk,Kategori,...'
                }
                rows={4}
                className={`w-full text-xs font-mono p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-cyan-300'
                }`}
              />
            </div>

            {importStatus && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700/40 shrink-0">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleProcessImport}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition"
            >
              <Upload className="w-4 h-4" />
              Proses Impor Data
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 1. Overview Screen: 5 Canonical Cards
  const renderOverview = () => {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold tracking-widest text-[#00f2fe] uppercase">
              JACS RETAILOS ERP
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.01em] mt-0.5">
              Master Data Management
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-migrasi-data-lama-overview"
              type="button"
              onClick={() => setIsDataMigrationOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 cursor-pointer transition shadow-[0_0_15px_rgba(245,158,11,0.25)] active:scale-95"
              title="Data Migration Wizard & Smart Column Mapping (APS POS 1)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{isEn ? '⚡ Legacy Data Migration' : '⚡ Migrasi Data Lama'}</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>● TERVERIFIKASI OTOMATIS</span>
            </div>
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-2 cursor-pointer transition shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {isEn ? 'Save Master' : 'Simpan Master'}
            </button>
          </div>
        </div>

        {/* Action Control Bar: Horizontal Bar between Header and Canonical Cards */}
        <div
          id="action-control-bar"
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 w-full overflow-hidden ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
          style={{
            boxShadow: isLight
              ? '0 2px 10px rgba(0,0,0,0.04)'
              : '0 0 25px rgba(0, 242, 254, 0.05)',
          }}
        >
          {/* Sisi Kiri: Selector Tab Pola Kasir / Segmen Bisnis */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0 flex-1 w-full overflow-hidden">
            <span className={`text-[11px] font-bold tracking-wider uppercase shrink-0 ${
              isLight ? 'text-slate-800' : 'text-slate-300'
            }`}>
              {isEn ? 'BUSINESS PATTERN:' : 'POLA BISNIS:'}
            </span>
            <div
              className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-2 w-full flex-nowrap min-w-0 flex-1 scroll-smooth touch-pan-x overscroll-x-contain"
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
            >
              {(
                [
                  { id: 'retail', labelId: 'Ritel & Minimarket', labelEn: 'Retail & Supermarket', icon: ShoppingCart },
                  { id: 'fnb', labelId: 'F&B Resto & Kafe', labelEn: 'F&B Resto & Cafe', icon: UtensilsCrossed },
                  { id: 'pharmacy', labelId: 'Apotek & Medis', labelEn: 'Pharmacy & Medical', icon: Pill },
                  { id: 'fashion', labelId: 'Fashion & Butik', labelEn: 'Fashion & Boutique', icon: Shirt },
                  { id: 'gadget', labelId: 'Gadget & Elektronik', labelEn: 'Gadget & Electronics', icon: Smartphone },
                  { id: 'services', labelId: 'Jasa & Servis', labelEn: 'Services & Repair', icon: Wrench },
                ] as { id: BusinessModelType; labelId: string; labelEn: string; icon: any }[]
              ).map((m, mIdx) => {
                const IconComp = m.icon;
                const isSelected = selectedBusinessModel === m.id;
                return (
                  <button
                    key={`biz-tab-btn-${m.id}-${mIdx}`}
                    type="button"
                    onClick={() => {
                      setSelectedBusinessModel(m.id);
                      setImportStatus(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white font-bold border border-cyan-400 shadow-[0_0_14px_rgba(6,182,212,0.45)]'
                        : isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-800 font-semibold border-2 border-slate-300 hover:border-slate-400 shadow-xs'
                        : 'bg-[#0d1117] hover:bg-[#161b22] text-slate-200 font-semibold border border-[#30363d] hover:border-slate-500'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span>{isEn ? m.labelEn : m.labelId}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sisi Kanan: 3 Tombol Aksi Sejajar dengan Karakter Warna Tegas & Kontras */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0 justify-start 2xl:justify-end">
            {/* 1. [+ Input Data Produk] (Tema Emerald/Green Tegas) */}
            <button
              id="btn-scan-barcode-baru"
              type="button"
              onClick={() => {
                setCurrentTab('product');
                handleOpenAdd();
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition whitespace-nowrap ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-500 shadow-xs'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]'
              }`}
            >
              <Package className={`w-4 h-4 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`} />
              <span>{isEn ? '+ New Product Entry' : '+ Input Data Produk'}</span>
            </button>

            {/* 2. [Unduh Format Pola (.xlsx)] (Tema Amber/Orange Hangat) */}
            <button
              id="btn-unduh-format-pola"
              type="button"
              onClick={() => handleDownloadTemplate(selectedBusinessModel)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition whitespace-nowrap ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-950 border-2 border-amber-500 shadow-xs'
                  : 'bg-amber-950/40 hover:bg-amber-950/60 text-amber-300 border border-amber-500/70 shadow-xs hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              }`}
            >
              <Download className={`w-4 h-4 shrink-0 ${isLight ? 'text-amber-800' : 'text-amber-300'}`} />
              <span>{isEn ? 'Download Pattern (.xlsx)' : 'Unduh Format Pola (.xlsx)'}</span>
            </button>

            {/* 3. [Unggah & AI Smart Map] (Aksen Neon Indigo/Blue Glowing) */}
            <button
              id="btn-unggah-ai-smart-map"
              type="button"
              onClick={() => setIsAiSmartMapOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/80 shadow-[0_0_18px_rgba(37,99,235,0.45)] hover:shadow-[0_0_25px_rgba(37,99,235,0.7)] flex items-center gap-2 cursor-pointer transition whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse shrink-0" />
              <span>{isEn ? 'Upload & AI Smart Map' : 'Unggah & AI Smart Map'}</span>
            </button>

            {/* 4. [⚡ Migrasi Data Lama] (Aksen Amber Glowing) */}
            <button
              id="btn-migrasi-data-lama"
              type="button"
              onClick={() => setIsDataMigrationOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-2 cursor-pointer transition whitespace-nowrap active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isEn ? '⚡ Legacy Data Migration' : '⚡ Migrasi Data Lama'}</span>
            </button>
          </div>
        </div>

        {/* Section Header: CANONICAL MASTER DATA */}
        <div className="pt-2">
          <div className={`text-[10px] font-bold tracking-widest uppercase ${
            isLight ? 'text-cyan-800' : 'text-slate-400'
          }`}>
            MASTER DATA
          </div>
          <h2 className={`text-xl font-bold tracking-[-0.01em] mt-0.5 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}>
            CANONICAL MASTER DATA
          </h2>
          <p className={`text-xs mt-1 ${
            isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
          }`}>
            {isEn
              ? 'Manage JacS RetailOS ERP master reference data.'
              : 'Kelola data referensi utama JacS RetailOS ERP.'}
          </p>
        </div>

        {/* 8 Master Data Cards in Optimized Compact Grid (grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
          {/* Card 1: Brand */}
          <div
            id="card-master-brand"
            onMouseEnter={() => setHoveredCardId('brand')}
            onMouseLeave={() => setHoveredCardId(null)}
            className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between h-full ${
              isLight
                ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                : 'border-2 border-cyan-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.4)] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
            }`}
          >
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-slate-200'
                    : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                }`}>
                  <Building2 className="w-4 h-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-900 border-slate-200'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                }`}>
                  {brandCount} {isEn ? 'Brands' : 'Merek'}
                </span>
              </div>
              <h3 className={`text-sm font-bold tracking-[-0.01em] mb-1 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {isEn ? 'Brand' : 'Merek'}
              </h3>
              <p className={`text-xs line-clamp-2 ${
                isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
              }`}>
                {isEn ? 'Brand & manufacturer settings.' : 'Pengaturan merek & pabrikan.'}
              </p>
            </div>
            <div className="pt-2.5 mt-auto">
              <button
                id="btn-kelola-brand"
                onClick={() => setCurrentTab('brand')}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold text-center border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                <span>{isEn ? 'Manage Data' : 'Kelola Data'}</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>

          {/* Card 2: Category */}
          <div
            id="card-master-category"
            onMouseEnter={() => setHoveredCardId('category')}
            onMouseLeave={() => setHoveredCardId(null)}
            className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between h-full ${
              isLight
                ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                : 'border-2 border-cyan-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.4)] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
            }`}
          >
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-slate-200'
                    : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                }`}>
                  <Layers className="w-4 h-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-900 border-slate-200'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                }`}>
                  {categoryCount} {isEn ? 'Categories' : 'Kategori'}
                </span>
              </div>
              <h3 className={`text-sm font-bold tracking-[-0.01em] mb-1 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {isEn ? 'Category' : 'Kategori'}
              </h3>
              <p className={`text-xs line-clamp-2 ${
                isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
              }`}>
                {isEn ? 'Product hierarchy classification.' : 'Klasifikasi hierarki produk.'}
              </p>
            </div>
            <div className="pt-2.5 mt-auto">
              <button
                id="btn-kelola-category"
                onClick={() => setCurrentTab('category')}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold text-center border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                <span>{isEn ? 'Manage Data' : 'Kelola Data'}</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>

          {/* Card 3: Product */}
          <div
            id="card-master-product"
            onMouseEnter={() => setHoveredCardId('product')}
            onMouseLeave={() => setHoveredCardId(null)}
            className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between h-full ${
              isLight
                ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                : 'border-2 border-cyan-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.4)] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
            }`}
          >
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-slate-200'
                    : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                }`}>
                  <Package className="w-4 h-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-900 border-slate-200'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                }`}>
                  {productCount.toLocaleString()} SKU
                </span>
              </div>
              <h3 className={`text-sm font-bold tracking-[-0.01em] mb-1 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {isEn ? 'Product & SKU' : 'Produk & SKU'}
              </h3>
              <p className={`text-xs line-clamp-2 ${
                isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
              }`}>
                {isEn ? 'Product catalog & price master.' : 'Master katalog barang & harga.'}
              </p>
            </div>
            <div className="pt-2.5 mt-auto">
              <button
                id="btn-kelola-product"
                onClick={() => setCurrentTab('product')}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold text-center border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                <span>{isEn ? 'Manage Data' : 'Kelola Data'}</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>

          {/* Card 4: Supplier */}
          <div
            id="card-master-supplier"
            onMouseEnter={() => setHoveredCardId('supplier')}
            onMouseLeave={() => setHoveredCardId(null)}
            className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between h-full ${
              isLight
                ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                : 'border-2 border-cyan-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.4)] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
            }`}
          >
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-slate-200'
                    : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-900 border-slate-200'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                }`}>
                  {supplierCount} {isEn ? 'Vendors' : 'Vendor'}
                </span>
              </div>
              <h3 className={`text-sm font-bold tracking-[-0.01em] mb-1 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {isEn ? 'Supplier & Vendor' : 'Pemasok & Vendor'}
              </h3>
              <p className={`text-xs line-clamp-2 ${
                isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
              }`}>
                {isEn
                  ? 'Procurement partners & credit terms.'
                  : 'Mitra pengadaan & syarat kredit.'}
              </p>
            </div>
            <div className="pt-2.5 mt-auto">
              <button
                id="btn-kelola-supplier"
                onClick={() => setCurrentTab('supplier')}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold text-center border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                <span>{isEn ? 'Manage Data' : 'Kelola Data'}</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>

          {/* Card 5: Customer */}
          <div
            id="card-master-customer"
            onMouseEnter={() => setHoveredCardId('customer')}
            onMouseLeave={() => setHoveredCardId(null)}
            className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between h-full ${
              isLight
                ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                : 'border-2 border-cyan-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.4)] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
            }`}
          >
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-slate-200'
                    : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-900 border-slate-200'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                }`}>
                  {customerCount} {isEn ? 'Members' : 'Member'}
                </span>
              </div>
              <h3 className={`text-sm font-bold tracking-[-0.01em] mb-1 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {isEn ? 'Customer & Member' : 'Pelanggan & Member'}
              </h3>
              <p className={`text-xs line-clamp-2 ${
                isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
              }`}>
                {isEn
                  ? 'Customer database & loyalty points.'
                  : 'Database pelanggan & poin loyalitas.'}
              </p>
            </div>
            <div className="pt-2.5 mt-auto">
              <button
                id="btn-kelola-customer"
                onClick={() => setCurrentTab('customer')}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold text-center border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                <span>{isEn ? 'Manage Data' : 'Kelola Data'}</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>

          {/* Card 6: Master F&B & Costing HPP */}
          <div
            id="card-master-fnb-costing"
            onMouseEnter={() => setHoveredCardId('fnb_costing')}
            onMouseLeave={() => setHoveredCardId(null)}
            className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between h-full ${
              isLight
                ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                : 'border-2 border-emerald-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(16,185,129,0.4)] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
            }`}
          >
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-800 border-slate-200'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                }`}>
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-900 border-slate-200'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {fnbMenuCount} {isEn ? 'F&B Menus' : 'Menu F&B'}
                </span>
              </div>
              <h3 className={`text-sm font-bold tracking-[-0.01em] mb-1 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Master F&B
              </h3>
              <p className={`text-xs line-clamp-2 ${
                isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
              }`}>
                {isEn
                  ? 'BOM recipes, raw ingredients, portion costs & auto HPP margin calculation.'
                  : 'Skema resep BOM bahan mentah, takaran porsi, dan kalkulator HPP otomatis.'}
              </p>
            </div>
            <div className="pt-2.5 mt-auto">
              <button
                id="btn-kelola-fnb-costing"
                onClick={() => setCurrentTab('fnb_costing')}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold text-center border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                <span>{isEn ? 'Manage BOM & HPP' : 'Atur Resep & HPP'}</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>

          {/* Card 7: Master Farmasi & Obat Racikan */}
          <div
            id="card-master-pharmacy"
            onMouseEnter={() => setHoveredCardId('pharmacy_master')}
            onMouseLeave={() => setHoveredCardId(null)}
            className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between h-full ${
              isLight
                ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                : 'border-2 border-rose-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(244,63,94,0.4)] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
            }`}
          >
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight
                    ? 'bg-teal-50 text-teal-800 border-slate-200'
                    : 'bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-[0_0_12px_rgba(20,184,166,0.25)]'
                }`}>
                  <Pill className="w-4 h-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isLight
                    ? 'bg-teal-50 text-teal-900 border-slate-200'
                    : 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                }`}>
                  {pharmacyMedicineCount} {isEn ? 'Medicines' : 'Obat'}
                </span>
              </div>
              <h3 className={`text-sm font-bold tracking-[-0.01em] mb-1 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Master Farmasi
              </h3>
              <p className={`text-xs line-clamp-2 ${
                isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
              }`}>
                {isEn
                  ? 'Drug regulatory classes, batch numbers, expiry dates & compounding tuslah.'
                  : 'Katalog obat (Bebas, Terbatas, Keras K, Racikan), nomor batch, exp date, dan racikan.'}
              </p>
            </div>
            <div className="pt-2.5 mt-auto">
              <button
                id="btn-kelola-pharmacy"
                onClick={() => setCurrentTab('pharmacy_master')}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold text-center border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                    : 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30'
                }`}
              >
                <span>{isEn ? 'Manage Pharmacy' : 'Kelola Farmasi'}</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>

          {/* Card 8: Building Materials */}
          <div
            id="card-master-building-material"
            onMouseEnter={() => setHoveredCardId('building_material')}
            onMouseLeave={() => setHoveredCardId(null)}
            className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex flex-col justify-between h-full ${
              isLight
                ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                : 'border-2 border-amber-400/90 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(245,158,11,0.4)] bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
            }`}
          >
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs ${
                  isLight
                    ? 'bg-amber-50 text-amber-800 border-slate-200'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                }`}>
                  <HardHat className="w-4 h-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  isLight
                    ? 'bg-amber-50 text-amber-900 border-slate-200'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  {buildingMaterialCount} {isEn ? 'Materials' : 'Material'}
                </span>
              </div>
              <h3 className={`text-sm font-bold tracking-[-0.01em] mb-1 ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Master Bahan Bangunan
              </h3>
              <p className={`text-xs line-clamp-2 ${
                isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
              }`}>
                {isEn
                  ? 'Bulk sands, customized dimension timber, steel, bricks & transport policy.'
                  : 'Material curah, kayu custom dimensi, semen, bata & kebijakan ongkir.'}
              </p>
            </div>
            <div className="pt-2.5 mt-auto">
              <button
                id="btn-kelola-building-material"
                onClick={() => setCurrentTab('building_material')}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold text-center border cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                <span>{isEn ? 'Manage Data' : 'Kelola Data'}</span>
                <span className="text-xs">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Map any currentTab to one of the 8 industries
  const activeIndustry: IndustryBarId = useMemo(() => {
    if (currentTab === 'fnb' || currentTab === 'fnb_costing') return 'fnb';
    if (currentTab === 'pharmacy' || currentTab === 'pharmacy_master') return 'pharmacy';
    if (currentTab === 'building' || currentTab === 'building_material') return 'building';
    if (currentTab === 'fashion') return 'fashion';
    if (currentTab === 'electronics') return 'electronics';
    if (currentTab === 'automotive') return 'automotive';
    if (currentTab === 'services') return 'services';
    return 'retail';
  }, [currentTab]);

  const activeRetailTab = useMemo<'product' | 'brand' | 'category' | 'supplier' | 'customer'>(() => {
    if (currentTab === 'product') return 'product';
    if (currentTab === 'brand') return 'brand';
    if (currentTab === 'category') return 'category';
    if (currentTab === 'supplier') return 'supplier';
    if (currentTab === 'customer') return 'customer';
    return retailSubTab;
  }, [currentTab, retailSubTab]);

  // Panel Kartu Placeholder Neon Mandiri untuk 4 Industri Baru (Fashion, Elektronik, Bengkel, Barbershop)
  const renderNeonPlaceholder = (
    industry: 'fashion' | 'electronics' | 'automotive' | 'services',
    onBack?: () => void
  ) => {
    const config = {
      fashion: {
        title: 'Fashion & Apparel',
        color: '#d946ef',
        borderClass: 'border-fuchsia-400 shadow-[0_0_25px_rgba(217,70,239,0.35)]',
        badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/50',
        btnClass: 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white shadow-fuchsia-500/30',
        emoji: '👗',
        features: [
          { title: 'Matriks Varian Size & Warna', desc: 'Satu induk model baju dapat memiliki puluhan kombinasi ukuran (XS, S, M, L, XL, XXL) dan warna.' },
          { title: 'Scan Barcode SKU Varian', desc: 'Scan barcode unik per ukuran dan warna di kasir untuk memotong stok spesifik.' },
          { title: 'Integrasi Fitting Room & Retur', desc: 'Pelacakan stok baju yang sedang dicoba di kamar pas dan kemudahan tukar size di kasir.' },
        ],
        sampleItems: [
          { code: 'FSH-KEM-01', name: 'Kemeja Formal Oxford Slim-Fit', meta: 'Varian: M, L, XL • Putih, Navy, Sage', price: 185000, stock: 120 },
          { code: 'FSH-CHN-02', name: 'Celana Chino Stretch Kasual', meta: 'Varian: 28-36 • Khaki, Hitam, Abu', price: 225000, stock: 85 },
          { code: 'FSH-DRS-03', name: 'Dress Terusan Floral Motif Batik', meta: 'Varian: S, M, L • Ruby, Emerald', price: 295000, stock: 40 },
        ],
      },
      electronics: {
        title: 'Electronics & Gadgets',
        color: '#3b82f6',
        borderClass: 'border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.35)]',
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-400/50',
        btnClass: 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/30',
        emoji: '📱',
        features: [
          { title: 'Pelacakan Dual IMEI & SN Unik', desc: 'Wajib input / scan IMEI 1 & IMEI 2 saat checkout kasir untuk aktivasi garansi handphone.' },
          { title: 'Manajemen Kartu Garansi', desc: 'Cetak kartu garansi toko otomatis dengan masa garansi terhitung dari tanggal invoice.' },
          { title: 'Bundling Aksesori & Proteksi', desc: 'Paket bundling tempered glass, casing & adaptor charger dengan diskon terintegrasi.' },
        ],
        sampleItems: [
          { code: 'GDG-PHN-01', name: 'Smartphone JacS Pro 5G 8/256GB', meta: 'Dual IMEI SN Active • Garansi Resmi 12 Bulan', price: 3499000, stock: 25 },
          { code: 'GDG-TWS-02', name: 'Wireless Earbuds TWS ANC BassBoost', meta: 'SN: TWS-2026-X1 • Garansi Toko 6 Bulan', price: 450000, stock: 60 },
          { code: 'GDG-PWR-03', name: 'Power Bank Fast Charge 20.000mAh 65W', meta: 'SN: PB-65W-909 • Garansi Distributor 12 Bulan', price: 320000, stock: 45 },
        ],
      },
      automotive: {
        title: 'Automotive & Workshop',
        color: '#f97316',
        borderClass: 'border-orange-400 shadow-[0_0_25px_rgba(249,115,22,0.35)]',
        badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-400/50',
        btnClass: 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/30',
        emoji: '🔧',
        features: [
          { title: 'Pemisahan Jasa & Suku Cadang', desc: 'Memisahkan tarif jasa mekanik (tanpa stok) dan barang fisik sparepart (dengan stok gudang).' },
          { title: 'Tracking No. Polisi & Odometer KM', desc: 'Buku servis digital berbasis nomor polisi kendaraan pelanggan untuk riwayat perbaikan berkala.' },
          { title: 'Kalkulator Komisi Mekanik', desc: 'Penghitungan komisi persentase atau flat fee otomatis per pekerjaan servis mekanik bengkel.' },
        ],
        sampleItems: [
          { code: 'OTO-OIL-01', name: 'Oli Mesin Full Sintetis 10W-40 (1L)', meta: 'Sparepart Fisik • Stok Gudang Bengkel: 85 Botol', price: 85000, stock: 85 },
          { code: 'OTO-PAD-02', name: 'Kampas Rem Cakram Depan OEM', meta: 'Sparepart Fisik • Kompatibel Bebek & Matic: 40 Set', price: 65000, stock: 40 },
          { code: 'OTO-SRV-03', name: 'Jasa Servis Ringan + Tune Up & Gurah Injeksi', meta: 'Jasa Mekanik • Durasi 45 Mnt • Komisi Montir 25%', price: 95000, stock: 999 },
        ],
      },
      services: {
        title: 'Salon & Barbershop',
        color: '#a855f7',
        borderClass: 'border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.35)]',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/50',
        btnClass: 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/30',
        emoji: '💈',
        features: [
          { title: 'Paket Treatment & Durasi Layanan', desc: 'Daftar paket kombo potong rambut, cuci, pijat relaksasi, hair styling, dan creambath.' },
          { title: 'Penugasan Kursi & Kapster', desc: 'Pencatatan nomor kursi barber/salon dan stylist yang melayani untuk pembagian komisi instan.' },
          { title: 'Retail Upselling Produk Rambut', desc: 'Penjualan langsung produk styling seperti pomade, hair tonic, wax, dan sampo perawatan.' },
        ],
        sampleItems: [
          { code: 'BRB-PKT-01', name: 'Gentleman Haircut + Wash + Head Massage', meta: 'Paket Jasa • Durasi 40 Menit • Komisi Kapster 35%', price: 70000, stock: 999 },
          { code: 'BRB-SHV-02', name: 'Hot Towel Shave & Classic Beard Grooming', meta: 'Layanan Jasa • Durasi 25 Menit • Komisi Stylist 30%', price: 45000, stock: 999 },
          { code: 'BRB-RTL-03', name: 'Water-Based Matte Pomade Strong Hold 100g', meta: 'Produk Retail Grooming • Stok Display Salon: 35 Pcs', price: 85000, stock: 35 },
        ],
      },
    }[industry];

    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Panel Header & Actions */}
        <div className={`p-5 rounded-2xl relative overflow-hidden ${
          isLight
            ? 'bg-white border border-slate-200 shadow-sm'
            : `border-2 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent ${config.borderClass} bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950`
        }`}>
          {onBack && (
            <div className="mb-4 pb-3 border-b border-gray-700/40">
              <button
                type="button"
                onClick={onBack}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isEn ? '← Back to Master Portal' : '← Kembali ke Portal Master'}</span>
              </button>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 rounded-2xl bg-black/30 border border-gray-800">{config.emoji}</span>
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {config.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setNeonIndustryTitle(config.title);
                setNeonBarcode('');
                setNeonName('');
                setNeonCategory('General');
                setNeonPriceRetail(50000);
                setNeonCostPrice(35000);
                setNeonStock(50);
                setIsNeonModalOpen(true);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition cursor-pointer shadow-lg active:scale-95 shrink-0 ${config.btnClass}`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Master Baru</span>
            </button>
          </div>

          {/* 3 Core Integration Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-gray-800/60">
            {config.features.map((f, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                  isLight
                    ? 'bg-slate-50 border border-slate-200 text-slate-800 shadow-sm'
                    : 'border-2 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border-slate-700/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent text-gray-200'
                }`}
              >
                <div className="text-xs font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>{f.title}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sample SKU Table Preview */}
        <div className={`p-4 rounded-2xl relative overflow-hidden ${
          isLight
            ? 'bg-white border border-slate-200 shadow-sm'
            : 'border-2 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border-slate-700/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
        }`}>
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className={`font-bold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
              <span>📦 Contoh Master Data & Integrasi Transaksi Kasir:</span>
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              Mode Siap Pakai
            </span>
          </div>

          <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-[#30363d]'}`}>
            <table className="w-full text-left text-xs">
              <thead className={`font-bold uppercase text-[9px] border-b ${isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0d1117] text-slate-300 border-[#30363d]'}`}>
                <tr>
                  <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">Kode SKU</th>
                  <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">Nama Produk / Layanan</th>
                  <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">Spesifikasi Khusus Industri</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300">Harga Jual</th>
                  <th className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200 bg-white text-slate-900' : 'divide-[#30363d] text-gray-200'}`}>
                {config.sampleItems.map((item, idx) => (
                  <tr key={idx} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-[#0d1117]'}>
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-700 dark:text-cyan-400">{item.code}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{item.name}</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600 dark:text-slate-400">{item.meta}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      Rp {item.price.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                        Aktif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Neon Industry Modal Form with Barcode Scanner Top Bar at Position 1 */}
        {isNeonModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
            }`}>
              <div className={`p-4 border-b flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
              }`}>
                <h3 className="font-bold text-sm">Tambah Master Baru: {neonIndustryTitle}</h3>
                <button type="button" onClick={() => setIsNeonModalOpen(false)} className="p-1 rounded-lg text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveNeonProduct} className="p-4 sm:p-5 space-y-3.5 text-xs">
                {/* Barcode Scanner Full-Width Paling Atas (Posisi 1) */}
                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isLight ? 'bg-fuchsia-50/90 border-fuchsia-300 shadow-sm' : 'bg-fuchsia-500/10 border-fuchsia-500/40'
                }`}>
                  <label className="block text-[11px] font-extrabold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>1. Barcode / SKU Scanner (Auto-Fill Atas) *</span>
                  </label>
                  <input
                    type="text"
                    value={neonBarcode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNeonBarcode(val);
                      const found = products.find(p => p.id === val || p.barcode === val);
                      if (found) {
                        setNeonName(found.name);
                        setNeonCategory(found.category || 'General');
                        setNeonPriceRetail(found.sell_price || 50000);
                        setNeonCostPrice(found.cost_price || 35000);
                        setNeonStock(found.stock ?? 50);
                        showToast(`Auto-fill item: ${found.name}`);
                      }
                    }}
                    placeholder="Scan barcode fisik atau ketik kode SKU..."
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-mono font-bold outline-none ${
                      isLight ? 'bg-white border-fuchsia-400 text-slate-900' : 'bg-slate-950 border-fuchsia-500 text-fuchsia-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Nama Produk / Layanan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={neonName}
                    onChange={(e) => setNeonName(e.target.value)}
                    placeholder="Nama produk atau layanan..."
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Kategori / Varian
                    </label>
                    <input
                      type="text"
                      value={neonCategory}
                      onChange={(e) => setNeonCategory(e.target.value)}
                      placeholder="Kategori..."
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Stok Awal
                    </label>
                    <input
                      type="number"
                      value={neonStock === '' ? '' : neonStock}
                      onChange={(e) => setNeonStock(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="50"
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Nama Produk / Layanan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={neonName}
                    onChange={(e) => setNeonName(e.target.value)}
                    placeholder="Nama produk atau layanan..."
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold outline-none ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Kategori / Varian
                    </label>
                    <input
                      type="text"
                      value={neonCategory}
                      onChange={(e) => setNeonCategory(e.target.value)}
                      placeholder="Kategori..."
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Stok Awal
                    </label>
                    <input
                      type="number"
                      value={neonStock === '' ? '' : neonStock}
                      onChange={(e) => setNeonStock(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="50"
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-mono font-bold outline-none ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Standardized HPP & Tier Pricing */}
                <div className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}>
                  <span className="font-bold text-xs uppercase tracking-wider text-cyan-400 block">
                    2. HPP Modal & Tier Harga Jual
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        HPP / Harga Beli Modal (Rp)
                      </label>
                      <input
                        type="number"
                        value={neonCostPrice === '' ? '' : neonCostPrice}
                        onChange={(e) => setNeonCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="35000"
                        className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-mono font-bold outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Margin Keuntungan (%)
                      </label>
                      <input
                        type="number"
                        value={neonMarginPercent}
                        onChange={(e) => setNeonMarginPercent(Number(e.target.value) || 0)}
                        placeholder="30"
                        className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-mono font-bold outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Retail / Ecer (Rp) *
                      </label>
                      <input
                        type="number"
                        required
                        value={neonPriceRetail === '' ? neonCalculatedRetail : neonPriceRetail}
                        onChange={(e) => setNeonPriceRetail(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="50000"
                        className={`w-full py-1.5 px-2 rounded-lg border text-xs font-mono font-black text-emerald-500 outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-emerald-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Member (Rp)
                      </label>
                      <input
                        type="number"
                        value={neonPriceMember === '' ? '' : neonPriceMember}
                        onChange={(e) => setNeonPriceMember(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="47500"
                        className={`w-full py-1.5 px-2 rounded-lg border text-xs font-mono font-bold outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Grosir / Partai (Rp)
                      </label>
                      <input
                        type="number"
                        value={neonPriceWholesale === '' ? '' : neonPriceWholesale}
                        onChange={(e) => setNeonPriceWholesale(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="45000"
                        className={`w-full py-1.5 px-2 rounded-lg border text-xs font-mono font-bold outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Tax Service Toggle & DPP / PPN Breakdown */}
                <div className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-cyan-400">
                      3. Layanan Pajak (PPN)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400">Mode Pajak:</span>
                      <button
                        type="button"
                        onClick={() => setNeonTaxOn(!neonTaxOn)}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                          neonTaxOn ? 'bg-emerald-500 text-black shadow-sm' : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {neonTaxOn ? 'ON (Aktif)' : 'OFF (Nonaktif)'}
                      </button>
                    </div>
                  </div>

                  {neonTaxOn && (
                    <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-gray-800">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Tipe PPN
                          </label>
                          <select
                            value={neonTaxType}
                            onChange={(e) => setNeonTaxType(e.target.value as any)}
                            className={`w-full py-1.5 px-2 rounded-lg border text-xs font-semibold outline-none cursor-pointer ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                            }`}
                          >
                            <option value="EXCLUDE">Belum Termasuk Pajak (Exclude)</option>
                            <option value="INCLUDE">Termasuk Pajak (Include)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Tarif PPN (%)
                          </label>
                          <select
                            value={neonTaxRate}
                            onChange={(e) => setNeonTaxRate(Number(e.target.value))}
                            className={`w-full py-1.5 px-2 rounded-lg border text-xs font-semibold outline-none cursor-pointer ${
                              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                            }`}
                          >
                            <option value={11}>11% (Standar UU PPN)</option>
                            <option value={12}>12% (Tarif Baru)</option>
                          </select>
                        </div>
                      </div>

                      {/* DPP & PPN Breakdown Card */}
                      <div className="p-2.5 rounded-lg bg-black/30 border border-cyan-500/30 flex items-center justify-between text-[11px] font-mono">
                        <div>
                          <span className="text-gray-400 block">DPP (Dasar Pengenaan):</span>
                          <span className="font-bold text-cyan-300">Rp {neonTaxBreakdown.dpp.toLocaleString('id-ID')}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">PPN ({neonTaxRate}%):</span>
                          <span className="font-bold text-emerald-400">+Rp {neonTaxBreakdown.ppn.toLocaleString('id-ID')}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Total Final Kasir:</span>
                          <span className="font-bold text-white">Rp {neonTaxBreakdown.total.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Industry Specific Fields */}
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isLight ? 'bg-amber-50/60 border-amber-300' : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-400 block">
                    4. Spesifik Modul: {neonIndustryTitle}
                  </span>
                  {neonIndustryTitle.toLowerCase().includes('fashion') && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Matriks Varian (Ukuran & Warna)
                      </label>
                      <input
                        type="text"
                        value={neonFashionVariant}
                        onChange={(e) => setNeonFashionVariant(e.target.value)}
                        placeholder="Cth: Size: S, M, L, XL | Warna: Hitam, Navy"
                        className={`w-full py-1.5 px-2.5 rounded-lg border text-xs outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                        }`}
                      />
                    </div>
                  )}
                  {neonIndustryTitle.toLowerCase().includes('electronic') && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Estimasi Biaya Klaim / Garansi Toko (Rp)
                      </label>
                      <input
                        type="number"
                        value={neonElectronicsWarranty === '' ? '' : neonElectronicsWarranty}
                        onChange={(e) => setNeonElectronicsWarranty(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="15000"
                        className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-mono font-bold outline-none ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                        }`}
                      />
                    </div>
                  )}
                  {neonIndustryTitle.toLowerCase().includes('automotive') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Harga Suku Cadang / Part (Rp)
                        </label>
                        <input
                          type="number"
                          value={neonAutoPartPrice === '' ? '' : neonAutoPartPrice}
                          onChange={(e) => setNeonAutoPartPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="40000"
                          className={`w-full py-1.5 px-2 rounded-lg border text-xs font-mono font-bold outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Tarif Jasa Pasang / Mekanik (Rp)
                        </label>
                        <input
                          type="number"
                          value={neonAutoServiceFee === '' ? '' : neonAutoServiceFee}
                          onChange={(e) => setNeonAutoServiceFee(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="25000"
                          className={`w-full py-2 px-2.5 rounded-lg border text-xs font-mono font-bold outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  {neonIndustryTitle.toLowerCase().includes('salon') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Biaya Bahan / Produk Salon (Rp)
                        </label>
                        <input
                          type="number"
                          value={neonSalonMaterialCost === '' ? '' : neonSalonMaterialCost}
                          onChange={(e) => setNeonSalonMaterialCost(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="15000"
                          className={`w-full py-1.5 px-2 rounded-lg border text-xs font-mono font-bold outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Tarif Jasa Layanan / Stylist (Rp)
                        </label>
                        <input
                          type="number"
                          value={neonSalonStylistFee === '' ? '' : neonSalonStylistFee}
                          onChange={(e) => setNeonSalonStylistFee(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="35000"
                          className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-mono font-bold outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-gray-800 flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setIsNeonModalOpen(false)} className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white">
                    Batal
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950">
                    Simpan Master Baru
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 2. Dedicated Data Management Workspace for the selected industry
  const renderWorkspace = () => {
    const currentIndustry = selectedIndustry || activeIndustry;

    if (currentIndustry === 'fnb') {
      return (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="pb-1">
            <button
              type="button"
              onClick={() => {
                setSelectedIndustry(null);
                setCurrentTab('portal');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? '← Back to Master Portal' : '← Kembali ke Portal Master'}</span>
            </button>
          </div>
          <FBMasterModule onBackToOverview={() => { setSelectedIndustry(null); setCurrentTab('portal'); }} />
        </div>
      );
    }

    if (currentIndustry === 'pharmacy') {
      return (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="pb-1">
            <button
              type="button"
              onClick={() => {
                setSelectedIndustry(null);
                setCurrentTab('portal');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? '← Back to Master Portal' : '← Kembali ke Portal Master'}</span>
            </button>
          </div>
          <PharmacyMasterModule onBackToOverview={() => { setSelectedIndustry(null); setCurrentTab('portal'); }} />
        </div>
      );
    }

    if (currentIndustry === 'building') {
      return (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="pb-1">
            <button
              type="button"
              onClick={() => {
                setSelectedIndustry(null);
                setCurrentTab('portal');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border-yellow-500/40 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? '← Back to Master Portal' : '← Kembali ke Portal Master'}</span>
            </button>
          </div>
          <BuildingMaterialsMasterModule onBackToOverview={() => { setSelectedIndustry(null); setCurrentTab('portal'); }} />
        </div>
      );
    }

    if (currentIndustry === 'fashion') {
      return renderNeonPlaceholder('fashion', () => { setSelectedIndustry(null); setCurrentTab('portal'); });
    }

    if (currentIndustry === 'electronics') {
      return renderNeonPlaceholder('electronics', () => { setSelectedIndustry(null); setCurrentTab('portal'); });
    }

    if (currentIndustry === 'automotive') {
      return renderNeonPlaceholder('automotive', () => { setSelectedIndustry(null); setCurrentTab('portal'); });
    }

    if (currentIndustry === 'services') {
      return renderNeonPlaceholder('services', () => { setSelectedIndustry(null); setCurrentTab('portal'); });
    }

    // Default: Retail & Wholesaler Modern Workspace
    return (
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* BARIS 1 (Header Bar Atas - Anti-Bertumpuk) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-3 mb-4">
          <div className="flex items-center gap-3.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSelectedIndustry(null);
                setCurrentTab('portal');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{isEn ? '← Back to Master Portal' : '← Kembali ke Portal Master'}</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl shrink-0">🛒</span>
                <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Modern Retail & Wholesale
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* BARIS 2 (3 Sub-Fitur Utama Header Navigasi) */}
        <div className="flex items-center justify-between gap-3 w-full pb-3 border-b border-slate-800/80 flex-wrap">
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
            {[
              { id: 'input_data' as const, label: '[Input Data]' },
              { id: 'input_data_baru' as const, label: '[Input Data Baru]' },
              { id: 'master_data_barang' as const, label: '[Master Data Barang]' },
            ].map((tab, tIdx) => {
              const isActive = mainFeatureTab === tab.id;
              return (
                <button
                  key={`main-feature-tab-${tab.id}-${tIdx}`}
                  type="button"
                  onClick={() => {
                    setMainFeatureTab(tab.id);
                    if (tab.id === 'input_data_baru') {
                      setIsRetailQuickAddOpen(true);
                      setTimeout(() => quickBarcodeRef.current?.focus(), 50);
                    } else {
                      setIsRetailQuickAddOpen(false);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-md'
                        : 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_18px_rgba(6,182,212,0.6)] border border-cyan-300'
                      : isLight
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 font-semibold'
                      : 'bg-[#161b22] text-gray-300 hover:text-white hover:bg-white/5 border border-gray-800 font-semibold'
                  }`}
                >
                  <span className="text-sm font-black">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {mainFeatureTab === 'input_data_baru' && (
            <button
              type="button"
              onClick={() => {
                setIsRetailQuickAddOpen((prev) => {
                  const nextState = !prev;
                  if (nextState) {
                    setTimeout(() => quickBarcodeRef.current?.focus(), 50);
                  }
                  return nextState;
                });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shrink-0 whitespace-nowrap ml-auto ${
                isLight
                  ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.35)]'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{isRetailQuickAddOpen ? 'Tutup Form' : '+ Input Product'}</span>
            </button>
          )}
        </div>

        {/* Sub-Navigasi Referensi (Hanya muncul saat membuka tab Master Data Barang) */}
        {mainFeatureTab === 'master_data_barang' && (
          <div className={`flex items-center gap-2 p-3 rounded-xl border animate-in fade-in duration-150 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1117] border-[#30363d]'
          }`}>
            <span className={`text-[11px] font-bold uppercase tracking-wider mr-2 ${isLight ? 'text-slate-700' : 'text-cyan-400'}`}>
              Referensi:
            </span>
            {[
              { id: 'product' as const, label: isEn ? 'Products & SKUs' : 'Produk & SKU', icon: Package, emoji: '📦' },
              { id: 'category' as const, label: isEn ? 'Categories' : 'Kategori', icon: Layers, emoji: '🏷️' },
              { id: 'brand' as const, label: isEn ? 'Brands' : 'Merek', icon: Building2, emoji: '🏢' },
              { id: 'supplier' as const, label: isEn ? 'Suppliers' : 'Supplier', icon: Truck, emoji: '🚚' },
              { id: 'customer' as const, label: isEn ? 'Customers' : 'Pelanggan', icon: Users, emoji: '👥' },
            ].map((sub, sIdx) => {
              const isActive = activeRetailTab === sub.id;
              const IconComp = sub.icon;
              return (
                <button
                  key={`ref-sub-tab-${sub.id}-${sIdx}`}
                  type="button"
                  onClick={() => {
                    setRetailSubTab(sub.id);
                    setCurrentTab(sub.id as MasterTab);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-sm'
                        : 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.5)] border border-cyan-300'
                      : isLight
                      ? 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-300'
                      : 'bg-[#161b22] text-gray-300 hover:text-white hover:bg-white/5 border border-gray-800'
                  }`}
                >
                  <span className="text-xs shrink-0">{sub.emoji}</span>
                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Form [Input Data] - Restock & Pembelian Barang Lama */}
        {mainFeatureTab === 'input_data' && (
          <div className={`rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all text-xs animate-in fade-in slide-in-from-top-2 duration-150 space-y-4 ${
            isLight
              ? 'bg-white border border-slate-200 shadow-lg'
              : 'border-2 border-cyan-400/80 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_25px_rgba(6,182,212,0.35)]'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-cyan-500/20'}`}>
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs border ${isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                  📦 FORM INPUT PEMBELIAN / RESTOCK BARANG LAMA
                </span>
                <span className={`font-semibold text-xs ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  Scan Barcode Paling Atas untuk Auto-Fill Identitas Barang
                </span>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Baris 1: Barcode Scanner Full-Width Paling Atas */}
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-teal-700' : 'text-cyan-400'}`}>
                  1. Barcode Scanner Barang Lama (Auto-Fill) *
                </label>
                <div className="relative">
                  <Scan className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                  <input
                    ref={restockBarcodeRef}
                    type="text"
                    value={restockBarcode}
                    onChange={(e) => handleRestockScanOrType(e.target.value)}
                    placeholder="Scan barcode atau ketik ID/Nama barang lama untuk memuat data..."
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl font-mono text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* Baris 2: Nama Produk & Varian/Ukuran */}
              <div>
                <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                  2. Nama Produk SKU & Ukuran/Varian *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={restockName}
                      onChange={(e) => setRestockName(e.target.value)}
                      placeholder="Nama produk..."
                      className={`w-full px-3 py-2 rounded-xl font-semibold text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                      }`}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={restockVariant}
                      onChange={(e) => setRestockVariant(e.target.value)}
                      placeholder="Ukuran/Varian (cth: 85g / Box)"
                      className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Baris 3: Kategori, Brand, Manufacture, Supplier, Satuan (UOM) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    3. Kategori
                  </label>
                  <input
                    list="retail-quick-categories"
                    type="text"
                    value={restockCategory}
                    onChange={(e) => setRestockCategory(e.target.value)}
                    placeholder="Kategori..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    4. Merek / Brand
                  </label>
                  <input
                    list="retail-quick-brands"
                    type="text"
                    value={restockBrand}
                    onChange={(e) => setRestockBrand(e.target.value)}
                    placeholder="Merek..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    5. Manufacture (Pabrik)
                  </label>
                  <input
                    type="text"
                    value={restockManufacture}
                    onChange={(e) => setRestockManufacture(e.target.value)}
                    placeholder="Pabrikan..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    6. Supplier
                  </label>
                  <input
                    list="retail-quick-suppliers"
                    type="text"
                    value={restockSupplier}
                    onChange={(e) => setRestockSupplier(e.target.value)}
                    placeholder="Supplier..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    7. Satuan (UOM)
                  </label>
                  <input
                    list="retail-quick-uom"
                    type="text"
                    value={restockUom}
                    onChange={(e) => setRestockUom(e.target.value.toUpperCase())}
                    placeholder="PCS"
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs uppercase outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* Baris 4: HPP (Modal), Harga Ecer, Harga Member, Harga Grosir */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    8. HPP (Modal Rp)
                  </label>
                  <input
                    type="number"
                    value={restockCostPrice}
                    onChange={(e) => setRestockCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Rp 0"
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-teal-700' : 'text-cyan-300'}`}>
                    9. Harga Ecer (Retail) *
                  </label>
                  <input
                    type="number"
                    value={restockPriceRetail}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setRestockPriceRetail(val);
                      if (typeof val === 'number') {
                        setRestockPriceMember(Math.round(val * 0.95));
                        setRestockPriceWholesale(Math.round(val * 0.90));
                      }
                    }}
                    placeholder="Rp 0"
                    className={`w-full px-3 py-2 rounded-xl font-mono font-bold text-xs outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-teal-500 text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 placeholder-slate-400'
                        : 'bg-slate-950 border-cyan-500/50 text-cyan-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                    10. Harga Member
                  </label>
                  <input
                    type="number"
                    value={restockPriceMember}
                    onChange={(e) => setRestockPriceMember(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Rp 0"
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-amber-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-400'
                        : 'bg-slate-950 border-slate-700 text-amber-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                    11. Harga Grosir
                  </label>
                  <input
                    type="number"
                    value={restockPriceWholesale}
                    onChange={(e) => setRestockPriceWholesale(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Rp 0"
                    className={`w-full px-3 py-2 rounded-xl font-mono font-bold text-xs outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-emerald-400 text-emerald-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-400'
                        : 'bg-slate-950 border-emerald-500/50 text-emerald-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* Baris 5 (Khusus Input Data): Jumlah Beli / Masuk & Metode Bayar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/40">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-teal-700' : 'text-cyan-300'}`}>
                    12. Jumlah Beli / Masuk (Qty) *
                  </label>
                  <input
                    type="number"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="10"
                    className={`w-full px-3 py-2 rounded-xl font-mono font-bold text-xs outline-none border ${
                      isLight ? 'bg-teal-50/50 border-teal-500 text-teal-900' : 'bg-slate-950 border-cyan-500/50 text-cyan-200'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    13. Metode Bayar *
                  </label>
                  <select
                    value={restockPaymentMethod}
                    onChange={(e) => setRestockPaymentMethod(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl font-semibold text-xs outline-none border cursor-pointer ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Cash">Cash (Tunai / Transfer Langsung)</option>
                    <option value="Tempo 7 Hari">Tempo 7 Hari (TOP 7)</option>
                    <option value="Tempo 14 Hari">Tempo 14 Hari (TOP 14)</option>
                    <option value="Tempo 30 Hari">Tempo 30 Hari (TOP 30)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Bawah */}
            <div className={`flex items-center justify-end gap-3 pt-3.5 border-t ${isLight ? 'border-slate-200' : 'border-cyan-500/20'}`}>
              <button
                type="button"
                onClick={() => {
                  setRestockBarcode('');
                  setRestockName('');
                  setRestockVariant('');
                  setRestockCategory('');
                  setRestockBrand('');
                  setRestockManufacture('');
                  setRestockSupplier('');
                  setRestockUom('PCS');
                  setRestockCostPrice('');
                  setRestockPriceRetail('');
                  setRestockPriceMember('');
                  setRestockPriceWholesale('');
                  setRestockQty(10);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  isLight
                    ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                    : 'text-gray-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                Batal / Keluar
              </button>
              <button
                type="button"
                onClick={handleSaveRestockPurchase}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-500/30 cursor-pointer transition"
              >
                <Save className="w-4 h-4" />
                Simpan Pembelian / Restock
              </button>
            </div>
          </div>
        )}

        {/* Riwayat Update Sesi Ini (Tabel di bawah form Input Data) */}
        {mainFeatureTab === 'input_data' && (
          <div className={`rounded-2xl p-4 sm:p-5 border space-y-4 animate-in fade-in duration-150 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#161b22] border-cyan-500/30'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className={`font-bold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>🕒 Riwayat Update Sesi Ini</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {sessionUpdates.length} Item Tercatat
                  </span>
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                  Daftar transaksi input/restock barang pada sesi kerja hari ini. Data akan otomatis reset saat pergantian hari.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetSession}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-sm ${
                  isLight
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                }`}
                title="Bersihkan tabel lembar kerja sesi ini tanpa menghapus data master permanen"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Selesai Batch / Reset Sesi</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[50vh]">
              <table className="w-full text-xs text-left">
                <thead className={`border-b font-bold tracking-wider uppercase text-[10px] sticky top-0 ${
                  isLight ? 'bg-slate-100 text-slate-800 border-slate-200' : 'bg-[#0d1117] text-slate-300 border-gray-800'
                }`}>
                  <tr>
                    <th className="px-3.5 py-2.5 text-center w-12">No</th>
                    <th className="px-3.5 py-2.5">Jam</th>
                    <th className="px-3.5 py-2.5">Barcode / ID</th>
                    <th className="px-3.5 py-2.5">Nama Produk & Varian</th>
                    <th className="px-3.5 py-2.5 text-center">Qty Masuk</th>
                    <th className="px-3.5 py-2.5 text-right">HPP Baru (Rp)</th>
                    <th className="px-3.5 py-2.5 text-right">Harga Ecer (Rp)</th>
                    <th className="px-3.5 py-2.5">Metode Bayar</th>
                    <th className="px-3.5 py-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${isLight ? 'divide-slate-200 text-slate-800' : 'divide-gray-800/60 text-slate-200'}`}>
                  {sessionUpdates.map((item, idx) => (
                    <tr key={item.id} className={`border-b ${isLight ? 'hover:bg-slate-50' : 'hover:bg-cyan-500/5'} transition`}>
                      <td className="px-3.5 py-2 text-center font-mono">{idx + 1}</td>
                      <td className="px-3.5 py-2 font-mono text-cyan-600 dark:text-cyan-400 whitespace-nowrap">{item.timestamp}</td>
                      <td className="px-3.5 py-2 font-mono font-bold whitespace-nowrap">{item.barcode}</td>
                      <td className="px-3.5 py-2 font-bold max-w-[200px] truncate" title={item.variant ? `${item.name} (${item.variant})` : item.name}>
                        {item.name} {item.variant && <span className="text-slate-500 dark:text-gray-400 font-normal">({item.variant})</span>}
                      </td>
                      <td className="px-3.5 py-2 text-center font-mono font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                        +{item.qty} {item.uom}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono whitespace-nowrap">
                        Rp {item.costPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono font-bold whitespace-nowrap">
                        Rp {item.priceRetail.toLocaleString('id-ID')}
                      </td>
                      <td className="px-3.5 py-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300">
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-center whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditSessionItem(item)}
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            isLight ? 'bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-300' : 'bg-gray-800 hover:bg-gray-700 text-cyan-400 border-gray-700'
                          }`}
                          title="Koreksi / Edit data ke form atas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSessionItem(item.id)}
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            isLight ? 'bg-slate-100 hover:bg-rose-100 text-rose-700 border-slate-300' : 'bg-gray-800 hover:bg-gray-700 text-rose-400 border-gray-700'
                          }`}
                          title="Hapus baris dari sesi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sessionUpdates.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400 dark:text-gray-500 italic">
                        Belum ada riwayat update / restock barang pada sesi hari ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Toolbar: Search & Filter di Kiri, Action Buttons di Kanan (Khusus Produk & SKU) */}
        {mainFeatureTab === 'master_data_barang' && (
        <div className={`p-4 rounded-2xl relative overflow-hidden flex flex-wrap items-center justify-between gap-3 ${
          isLight
            ? 'bg-white border border-slate-200 shadow-sm'
            : 'border-2 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 border-cyan-400/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
        }`}>
          {/* Sisi Kiri: Search Bar & Filter */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-cyan-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isEn
                    ? `🔍 Smart fuzzy search in ${currentTab} (e.g. "indomi grg", "aqua 600")...`
                    : `🔍 Pencarian cerdas ${currentTab} toleran salah ketik (misal: "indomi grg", "aqua 600")...`
                }
                title={
                  isEn
                    ? 'AI Smart Fuzzy Search: Typo-tolerant search across SKU, names, brands, categories'
                    : 'Pencarian Cerdas AI: Toleran salah ketik & singkatan untuk nama, merek, kategori, SKU'
                }
                className={`w-full pl-9 ${searchQuery ? 'pr-18' : 'pr-3'} py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium ${
                  isLight ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-[#0d1117] border-[#30363d] text-white placeholder-slate-500'
                }`}
              />
              {searchQuery && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                    isLight ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    Fuzzy
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                    title={isEn ? 'Clear search' : 'Hapus pencarian'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {activeRetailTab === 'product' && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
                }`}
                title={isEn ? 'Filter Official ERP Category' : 'Filter Kategori Resmi ERP'}
              >
                <option value="ALL">{isEn ? 'All ERP Categories' : 'Semua Kategori ERP'}</option>
                {ERP_CATEGORIES.map((cat) => {
                  const localizedName = getCleanCategoryName(cat.code, language as 'id' | 'en');
                  return (
                    <option key={cat.code} value={String(cat.code)}>
                      {cat.code} - {localizedName || cat.name}
                    </option>
                  );
                })}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0d1117] border-[#30363d] text-white'
              }`}
            >
              <option value="ALL">{isEn ? 'All Status' : 'Semua Status'}</option>
              <option value="Active">{isEn ? 'Active' : 'Aktif'}</option>
              <option value="Inactive">{isEn ? 'Discontinued' : 'Dihentikan'}</option>
            </select>

            {activeRetailTab === 'customer' && (
              <button
                type="button"
                id="btn-add-customer-toolbar"
                onClick={() => {
                  setCurrentTab('customer');
                  setRetailSubTab('customer');
                  handleOpenAdd();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shrink-0 whitespace-nowrap ml-1 ${
                  isLight
                    ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}
                title={isEn ? 'Open registration modal for new customer/member' : 'Buka form pendaftaran pelanggan / member baru'}
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? 'Add Customer' : 'Tambah Pelanggan'}</span>
              </button>
            )}

            {activeRetailTab === 'brand' && (
              <button
                type="button"
                id="btn-add-brand-toolbar"
                onClick={() => {
                  setCurrentTab('brand');
                  setRetailSubTab('brand');
                  handleOpenAdd();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shrink-0 whitespace-nowrap ml-1 ${
                  isLight
                    ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}
                title={isEn ? 'Open modal for new brand' : 'Buka form pendaftaran merek baru'}
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? 'Add Brand' : 'Tambah Merek'}</span>
              </button>
            )}

            {activeRetailTab === 'category' && (
              <button
                type="button"
                id="btn-add-category-toolbar"
                onClick={() => {
                  setCurrentTab('category');
                  setRetailSubTab('category');
                  handleOpenAdd();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shrink-0 whitespace-nowrap ml-1 ${
                  isLight
                    ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}
                title={isEn ? 'Open modal for new category' : 'Buka form pendaftaran kategori baru'}
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? 'Add Category' : 'Tambah Kategori'}</span>
              </button>
            )}

            {activeRetailTab === 'supplier' && (
              <button
                type="button"
                id="btn-add-supplier-toolbar"
                onClick={() => {
                  setCurrentTab('supplier');
                  setRetailSubTab('supplier');
                  handleOpenAdd();
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shrink-0 whitespace-nowrap ml-1 ${
                  isLight
                    ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}
                title={isEn ? 'Open modal for new supplier' : 'Buka form pendaftaran supplier baru'}
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? 'Add Supplier' : 'Tambah Supplier'}</span>
              </button>
            )}
          </div>

          {/* Sisi Kanan: Tombol Utilitas Data (Import, Export, Print, Save) */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-sm ${
                isLight ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40'
              }`}
              title="Import file CSV / Excel data master"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import File</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-sm ${
                isLight ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
              }`}
              title="Export data master aktif ke format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const target: any = ['product', 'category', 'brand', 'supplier', 'customer'].includes(currentTab as any) ? currentTab : activeRetailTab;
                setPrintTargetTab(target);
                setIsPrintModalOpen(true);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-sm ${
                isLight ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40'
              }`}
              title="Cetak atau unduh PDF laporan data master"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF / Print</span>
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-sm ${
                isLight ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
              }`}
              title="Simpan & sinkronkan seluruh perubahan data master"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Data</span>
            </button>
          </div>
        </div>
      )}

        {/* Panel Form Kartu Vertikal Terstruktur (Grid 3 Kolom) */}
        {activeRetailTab === 'product' && isRetailQuickAddOpen && (
          <div
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setIsRetailQuickAddOpen(false);
              }
            }}
            className={`rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all text-xs animate-in fade-in slide-in-from-top-2 duration-150 space-y-4 ${
              isLight
                ? 'bg-white border border-slate-200 shadow-lg'
                : 'border-2 border-cyan-400/80 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5),0_0_25px_rgba(6,182,212,0.35)]'
            }`}
          >
            {/* Datalists for Auto-completion */}
            <datalist id="retail-quick-categories">
              {categoriesMaster.map((c, idx) => (
                <option key={`cat-opt-${c.id}-${idx}`} value={c.name} />
              ))}
              {ERP_CATEGORIES.map((c, idx) => (
                <option key={`erp-cat-opt-${c.code}-${idx}`} value={c.name} />
              ))}
            </datalist>

            <datalist id="retail-quick-brands">
              {brands.map((b, idx) => (
                <option key={`brand-opt-${b.id}-${idx}`} value={b.name} />
              ))}
              {INITIAL_BRANDS.map((b, idx) => (
                <option key={`init-b-${b.name}-${idx}`} value={b.name} />
              ))}
            </datalist>

            <datalist id="retail-quick-suppliers">
              {suppliers.map((s, idx) => (
                <option key={`sup-opt-${s.id}-${idx}`} value={s.name} />
              ))}
              {MASTER_LOCAL_SUPPLIERS.map((s, idx) => (
                <option key={`init-s-${s.name}-${idx}`} value={s.name} />
              ))}
            </datalist>

            <datalist id="retail-quick-uom">
              {['PCS', 'BTL', 'DUS', 'PACK', 'RENCENG', 'KARTON', 'KG', 'CAN', 'BOX', 'SASET', 'LITER', 'TUBE'].map((u, idx) => (
                <option key={`uom-opt-${u}-${idx}`} value={u} />
              ))}
            </datalist>

            {/* Header Kartu */}
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-cyan-500/20'}`}>
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs border ${isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                  ⚡ FORM INPUT PRODUK BARU
                </span>
                <span className={`font-semibold text-xs ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                  Struktur Kartu Vertikal Terstruktur (Tab Navigation)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRetailQuickAddOpen(false)}
                className={`p-1.5 rounded-lg transition cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-gray-400 hover:text-white hover:bg-slate-800'}`}
                title="Tutup Form (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields Stacked Grid */}
            <div className="space-y-3.5">
              {/* Baris 1: Barcode (Pabrik vs Repack) & Nama Produk */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-teal-700' : 'text-cyan-400'}`}>
                    1. Barcode / Kode ID (Pabrik / Repack) *
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <input
                      type="text"
                      maxLength={3}
                      value={quickPrefix}
                      onChange={(e) => setQuickPrefix(e.target.value.toUpperCase())}
                      placeholder="GL"
                      className={`w-14 px-2 py-2 rounded-xl font-mono font-bold text-center text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 uppercase ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-cyan-300 placeholder-slate-500'
                      }`}
                      title="Prefix Repack (Maks 3 huruf, cth: GL)"
                    />
                    <input
                      ref={quickBarcodeRef}
                      tabIndex={1}
                      type="text"
                      value={quickBarcode}
                      onChange={(e) => setQuickBarcode(e.target.value)}
                      placeholder="Scan pabrik atau Gen ID..."
                      className={`flex-1 min-w-[140px] px-3 py-2 rounded-xl font-mono text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                      }`}
                    />
                    <button 
                      type="button" 
                      tabIndex={2}
                      onClick={handleGenerateId}
                      disabled={!quickPrefix.trim()}
                      className={`font-bold px-2.5 py-2 text-xs rounded-xl whitespace-nowrap shrink-0 shadow-sm transition ${
                        !quickPrefix.trim() 
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50' 
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                      }`}
                      title={!quickPrefix.trim() ? 'Isi prefix terlebih dahulu (cth: GL)' : 'Generate ID Unik Repack'}
                    >
                      ⚡ Gen ID
                    </button>
                    <button
                      type="button"
                      tabIndex={3}
                      onClick={() => {
                        const tempProd: Product = {
                          id: `PRD-${Date.now()}`,
                          barcode: quickBarcode || `899${Math.floor(1000000 + Math.random() * 9000000)}`,
                          name: quickVariant ? `${quickName} (${quickVariant})` : (quickName || 'Produk Baru'),
                          category: quickCategory || 'General Retail',
                          brand: quickBrand || 'General Brand',
                          stock: 100,
                          unit: quickUom || 'PCS',
                          sell_price: Number(quickPriceRetail) || 25000,
                          cost_price: Number(quickCostPrice) || 15000,
                          status: 'Active',
                        };
                        setSelectedBarcodeProduct(tempProd);
                        setIsBarcodeStudioOpen(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-2.5 py-2 text-xs rounded-xl whitespace-nowrap shrink-0 shadow-sm transition flex items-center gap-1 cursor-pointer"
                      title="Cetak Stiker Barcode Produk (Code 128 / Thermal)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>🖨️ Cetak Stiker</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    2. Nama Produk SKU & Ukuran/Varian *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        tabIndex={4}
                        type="text"
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        placeholder="Contoh: Indomie Goreng Spesial"
                        className={`w-full px-3 py-2 rounded-xl font-semibold text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                        }`}
                      />
                    </div>
                    <div>
                      <input
                        tabIndex={5}
                        type="text"
                        value={quickVariant}
                        onChange={(e) => setQuickVariant(e.target.value)}
                        placeholder="Ukuran/Varian (cth: 85g / Box)"
                        className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                          isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Baris 2: Kategori, Merek/Brand, Manufacture, Supplier, Satuan (UOM) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    3. Kategori
                  </label>
                  <input
                    tabIndex={6}
                    list="retail-quick-categories"
                    type="text"
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    placeholder="Pilih/Ketik Kategori..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    4. Merek / Brand
                  </label>
                  <input
                    tabIndex={7}
                    list="retail-quick-brands"
                    type="text"
                    value={quickBrand}
                    onChange={(e) => setQuickBrand(e.target.value)}
                    placeholder="Pilih/Ketik Merek..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    5. Manufacture (Pabrik)
                  </label>
                  <input
                    tabIndex={8}
                    type="text"
                    value={quickManufacture}
                    onChange={(e) => setQuickManufacture(e.target.value)}
                    placeholder="Nama Pabrikan..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    6. Supplier
                  </label>
                  <input
                    tabIndex={9}
                    list="retail-quick-suppliers"
                    type="text"
                    value={quickSupplier}
                    onChange={(e) => setQuickSupplier(e.target.value)}
                    placeholder="Nama Supplier/Vendor..."
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    7. Satuan (UOM)
                  </label>
                  <input
                    tabIndex={10}
                    list="retail-quick-uom"
                    type="text"
                    value={quickUom}
                    onChange={(e) => setQuickUom(e.target.value.toUpperCase())}
                    placeholder="PCS"
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs uppercase outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* Baris 3: HPP (Modal), Harga Ecer, Harga Member, Harga Grosir, Metode Pembayaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                    8. HPP (Modal Rp)
                  </label>
                  <input
                    tabIndex={11}
                    type="number"
                    value={quickCostPrice}
                    onChange={(e) => setQuickCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Rp 0"
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs outline-none border focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400' : 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-teal-700' : 'text-cyan-300'}`}>
                    9. Harga Ecer (Retail) *
                  </label>
                  <input
                    tabIndex={12}
                    type="number"
                    value={quickPriceRetail}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setQuickPriceRetail(val);
                      if (typeof val === 'number') {
                        setQuickPriceMember(Math.round(val * 0.95));
                        setQuickPriceWholesale(Math.round(val * 0.90));
                      }
                    }}
                    placeholder="Rp 0"
                    className={`w-full px-3 py-2 rounded-xl font-mono font-bold text-xs outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-teal-500 text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 placeholder-slate-400'
                        : 'bg-slate-950 border-cyan-500/50 text-cyan-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                    10. Harga Member
                  </label>
                  <input
                    tabIndex={13}
                    type="number"
                    value={quickPriceMember}
                    onChange={(e) => setQuickPriceMember(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Rp 0"
                    className={`w-full px-3 py-2 rounded-xl font-mono text-xs outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-amber-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-400'
                        : 'bg-slate-950 border-slate-700 text-amber-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                    11. Harga Grosir
                  </label>
                  <input
                    tabIndex={14}
                    type="number"
                    value={quickPriceWholesale}
                    onChange={(e) => setQuickPriceWholesale(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Rp 0"
                    className={`w-full px-3 py-2 rounded-xl font-mono font-bold text-xs outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-emerald-400 text-emerald-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-400'
                        : 'bg-slate-950 border-emerald-500/50 text-emerald-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 placeholder-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold uppercase tracking-wider mb-1 block ${isLight ? 'text-blue-800' : 'text-blue-300'}`}>
                    12. Metode Pembayaran
                  </label>
                  <select
                    tabIndex={15}
                    value={quickPaymentMethod}
                    onChange={(e) => setQuickPaymentMethod(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveQuickProduct();
                      }
                    }}
                    className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold outline-none border cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-blue-400 text-blue-900 focus:border-blue-500'
                        : 'bg-slate-950 border-blue-500/50 text-blue-200 focus:border-blue-400'
                    }`}
                  >
                    <option value="Tempo 30 Hari">Tempo (30 Hari)</option>
                    <option value="Tempo 14 Hari">Tempo (14 Hari)</option>
                    <option value="Tempo 7 Hari">Tempo (7 Hari)</option>
                    <option value="Cash">Cash (Tunai)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Bawah yang Tegas (termasuk Set Bulk Price) */}
            <div className={`flex items-center justify-between flex-wrap gap-3 pt-3.5 border-t ${isLight ? 'border-slate-200' : 'border-cyan-500/20'}`}>
              <button
                type="button"
                onClick={() => setIsBulkPriceModalOpen(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition shadow-xs ${
                  isLight
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-400'
                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                }`}
                title="Atur harga jual massal otomatis berbasis % margin dari HPP"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Set Bulk Price (%)</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRetailQuickAddOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                    isLight
                      ? 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                      : 'text-gray-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  Batal / Keluar
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickProduct}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-500/30 cursor-pointer transition"
                >
                  <Save className="w-4 h-4" />
                  Simpan Produk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Tables based on currentTab (Hanya tampil saat tab [Master Data Barang] aktif) */}
        {mainFeatureTab === 'master_data_barang' && (
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#161b22] border-[#30363d]'
          }`}>
          {activeRetailTab === 'brand' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b font-bold tracking-wider uppercase text-[10px] ${
                  isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-[#0d1117] text-slate-300 border-[#30363d]'
                }`}>
                  <tr>
                    <th className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'ID / Code' : 'ID / Kode'}</th>
                    <th className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Brand Name' : 'Nama Merek'}</th>
                    <th className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Official Manufacturer / Principal' : 'Pabrikan / Principal Resmi'}</th>
                    <th className="px-3.5 py-3 text-center font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Official Category' : 'Kategori Resmi'}</th>
                    <th className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Local Distribution Supplier' : 'Supplier Distribusi Lokal'}</th>
                    <th className="px-3 py-3 text-center font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Linked SKUs' : 'SKU Terkait'}</th>
                    <th className="px-3 py-3 text-center font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Status' : 'Status'}</th>
                    <th className="px-3.5 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Actions' : 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${
                  isLight ? 'divide-slate-200 bg-white text-slate-800' : 'divide-gray-800/40 bg-[#161b22] text-slate-200'
                }`}>
                  {enrichedBrandList.map(({ brand: b, idx, catCode, catName, manufacturerName, defSup, dynamicProductCount }) => {
                    return (
                      <tr key={`${b.id}-${idx}`} className={`border-b border-slate-200 dark:border-slate-800 ${isLight ? 'hover:bg-slate-50' : 'hover:bg-cyan-500/5'} transition`}>
                        <td className="px-3.5 py-3 font-mono font-bold text-sky-700 dark:text-cyan-400 whitespace-nowrap">
                          {b.id} <span className="text-slate-500 dark:text-gray-500 font-normal">({b.code})</span>
                        </td>
                        <td className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {b.name}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{manufacturerName}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 block">{b.country || 'Indonesia'}</span>
                        </td>
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30">
                            <span className="font-mono">{catCode}</span> - {catName}
                          </span>
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{defSup.name}</span>
                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">{defSup.phone}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{dynamicProductCount}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                              : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-sky-700 border-slate-300'
                                : 'bg-gray-800 hover:bg-gray-700 text-cyan-400 border-gray-700'
                            }`}
                            title={isEn ? 'Edit Brand' : 'Edit Merek'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id, b.name, b.productCount)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-rose-100 text-rose-700 border-slate-300'
                                : 'bg-gray-800 hover:bg-gray-700 text-rose-400 border-gray-700'
                            }`}
                            title={isEn ? 'Delete Brand' : 'Hapus Merek'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {enrichedBrandList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500 dark:text-gray-400">
                        {isEn ? 'No brand data matching the current filter.' : 'Tidak ada data merek yang cocok.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeRetailTab === 'category' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b font-bold tracking-wider uppercase text-[10px] ${
                  isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-[#0d1117] text-slate-300 border-[#30363d]'
                }`}>
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'ID / Code' : 'ID / Kode'}</th>
                    <th className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Official ERP Category Name' : 'Nama Kategori Resmi ERP'}</th>
                    <th className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Department' : 'Departemen'}</th>
                    <th className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Regional Supplier / Distributor' : 'Supplier / Distributor Wilayah'}</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-900 dark:text-slate-100">{isEn ? 'VAT (%)' : 'PPN (%)'}</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Target Margin (%)' : 'Target Margin (%)'}</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Linked SKUs' : 'SKU Terkait'}</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Status' : 'Status'}</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Actions' : 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${
                  isLight ? 'divide-slate-200 bg-white text-slate-800' : 'divide-gray-800/40 bg-[#161b22] text-slate-200'
                }`}>
                  {enrichedCategoryList.map(({ category: c, catCodeNum, defSup, dynamicProductCount, localizedCatName, localizedDeptName }, idx) => {
                    return (
                      <tr key={`cat-row-${c.id}-${idx}`} className={`border-b border-slate-200 dark:border-slate-800 ${isLight ? 'hover:bg-slate-50' : 'hover:bg-cyan-500/5'} transition`}>
                        <td className="px-4 py-3 font-mono font-bold text-sky-700 dark:text-cyan-400 whitespace-nowrap">
                          {c.id}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <span className="font-semibold">{localizedCatName || c.name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{localizedDeptName || c.department}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{defSup.name}</span>
                            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">{defSup.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-800 dark:text-slate-200">{c.taxRate}%</td>
                        <td className="px-4 py-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">{c.marginTarget}%</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{dynamicProductCount}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                              : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-sky-700 border-slate-300'
                                : 'bg-gray-800 hover:bg-gray-700 text-cyan-400 border-gray-700'
                            }`}
                            title={isEn ? 'Edit Category' : 'Edit Kategori'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-rose-100 text-rose-700 border-slate-300'
                                : 'bg-gray-800 hover:bg-gray-700 text-rose-400 border-gray-700'
                            }`}
                            title={isEn ? 'Delete Category' : 'Hapus Kategori'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {enrichedCategoryList.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-500 dark:text-gray-400">
                        {isEn ? 'No category data matching the current filter.' : 'Tidak ada data kategori yang cocok.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeRetailTab === 'product' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b font-bold tracking-wider uppercase text-[10px] ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0d1117] text-slate-300 border-[#30363d]'
                }`}>
                  <tr>
                    <th className="px-3 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">No</th>
                    <th className="px-3.5 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">Barcode/ID</th>
                    <th className="px-3.5 py-3 font-bold text-slate-700 dark:text-slate-300">Nama Produk & Varian</th>
                    <th className="px-3.5 py-3 text-center font-bold text-slate-700 dark:text-slate-300">Satuan</th>
                    <th className="px-3.5 py-3 font-bold text-slate-700 dark:text-slate-300">Kategori</th>
                    <th className="px-3.5 py-3 font-bold text-slate-700 dark:text-slate-300">Brand</th>
                    <th className="px-3.5 py-3 font-bold text-slate-700 dark:text-slate-300">Manufacture</th>
                    <th className="px-3.5 py-3 font-bold text-slate-700 dark:text-slate-300">Supplier</th>
                    <th className="px-3.5 py-3 text-right font-bold text-slate-700 dark:text-slate-300">Harga</th>
                    <th className="px-3.5 py-3 text-center font-bold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="px-3.5 py-3 text-right font-bold text-slate-700 dark:text-slate-300">Aksi</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${
                  isLight ? 'divide-slate-200 bg-white text-slate-800' : 'divide-gray-800/40 bg-[#161b22] text-slate-200'
                }`}>
                  {enrichedProductList.map(({ product: p, idx, catInfo, barcodeCodeId, descriptionText, retailPrice, isDiscontinued, hasRecipe, supplierName }) => {
                    return (
                      <tr key={`${p.id}-${idx}`} className={`border-b border-slate-200 dark:border-slate-800 ${isLight ? 'hover:bg-slate-50' : 'hover:bg-cyan-500/5'} transition`}>
                        {/* 1. No */}
                        <td className="px-3 py-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {idx + 1}
                        </td>
                        {/* 2. Barcode/ID */}
                        <td className="px-3.5 py-3 font-mono font-bold text-sky-700 dark:text-cyan-400 whitespace-nowrap">
                          {barcodeCodeId}
                        </td>
                        {/* 3. Nama Produk & Varian */}
                        <td className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100 max-w-[240px] truncate" title={descriptionText}>
                          {descriptionText}
                        </td>
                        {/* 4. Satuan */}
                        <td className="px-3.5 py-3 text-center font-mono whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 text-[10px] uppercase font-bold">
                            {p.unit || 'PCS'}
                          </span>
                        </td>
                        {/* 5. Kategori */}
                        <td className="px-3.5 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {catInfo.categoryName}
                        </td>
                        {/* 6. Brand */}
                        <td className="px-3.5 py-3 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {p.brand || '-'}
                        </td>
                        {/* 7. Manufacture */}
                        <td className="px-3.5 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[150px] truncate" title={p.manufacturer || '-'}>
                          {p.manufacturer || '-'}
                        </td>
                        {/* 8. Supplier */}
                        <td className="px-3.5 py-3 font-medium text-slate-900 dark:text-slate-100 max-w-[150px] truncate" title={supplierName}>
                          {supplierName}
                        </td>
                        {/* 9. Harga */}
                        <td className="px-3.5 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          Rp {retailPrice.toLocaleString('id-ID')}
                        </td>
                        {/* 10. Status */}
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          {isDiscontinued ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40">
                              DISCONTINUED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        {/* 11. Aksi */}
                        <td className="px-3.5 py-3 text-right space-x-1 whitespace-nowrap">
                          {(hasRecipe || (p.recipe && p.recipe.length > 0)) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRecipeProduct(p);
                                setIsRecipeModalOpen(true);
                              }}
                              className={`px-2 py-1 rounded-lg font-bold text-xs cursor-pointer transition shadow-xs inline-flex items-center gap-1 border ${
                                isLight
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border-emerald-500/40'
                              }`}
                              title="Atur Komposisi Resep & Kalkulasi HPP Otomatis (Bill of Materials)"
                            >
                              <UtensilsCrossed className="w-3 h-3 shrink-0" />
                              <span>Resep</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedDetailProduct(p)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-cyan-100 text-cyan-700 border-slate-300'
                                : 'bg-gray-800 hover:bg-cyan-950 text-cyan-400 border-cyan-500/30'
                            }`}
                            title="Lihat Detail Produk"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-cyan-700 border-slate-300'
                                : 'bg-gray-800 hover:bg-gray-700 text-cyan-400 border-gray-700'
                            }`}
                            title="Edit Master Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-rose-100 text-rose-700 border-slate-300'
                                : 'bg-gray-800 hover:bg-gray-700 text-rose-400 border-gray-700'
                            }`}
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {enrichedProductList.length === 0 && (
                    <tr>
                      <td colSpan={11} className="text-center py-8 text-gray-400">
                        Tidak ada data produk yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeRetailTab === 'supplier' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b font-bold tracking-wider uppercase text-[10px] ${
                  isLight ? 'bg-slate-100 text-slate-900 border-slate-200' : 'bg-[#0d1117] text-slate-300 border-[#30363d]'
                }`}>
                  <tr>
                    <th className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Vendor Code' : 'Kode Vendor'}</th>
                    <th className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Distribution Vendor Name' : 'Nama Vendor Distribusi'}</th>
                    <th className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Contact Person' : 'Kontak Person'}</th>
                    <th className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Contact & WhatsApp' : 'Kontak & WhatsApp'}</th>
                    <th className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Distribution Region / Address' : 'Wilayah / Alamat Distribusi'}</th>
                    <th className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Payment Terms' : 'Term Pembayaran'}</th>
                    <th className="px-3.5 py-3 text-center font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Status' : 'Status'}</th>
                    <th className="px-3.5 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{isEn ? 'Actions' : 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${
                  isLight ? 'divide-slate-200 bg-white text-slate-800' : 'divide-gray-800/40 bg-[#161b22] text-slate-200'
                }`}>
                  {enrichedSupplierList.map(({ supplier: s, sIdx, waLink }) => {
                    return (
                      <tr key={`sup-row-${s.id}-${sIdx}`} className={`border-b border-slate-200 dark:border-slate-800 ${isLight ? 'hover:bg-slate-50' : 'hover:bg-cyan-500/5'} transition`}>
                        <td className="px-3.5 py-3 font-mono font-bold text-sky-700 dark:text-cyan-400 whitespace-nowrap">{s.code}</td>
                        <td className="px-3.5 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          <span>{s.name}</span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 block font-normal">{s.email}</span>
                        </td>
                        <td className="px-3.5 py-3 text-slate-900 dark:text-slate-100">{s.contactPerson}</td>
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-700 dark:text-slate-300">{s.phone}</span>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-400 dark:border-emerald-500/40 transition"
                              title={isEn ? `WhatsApp chat to ${s.name}` : `Chat WhatsApp ke ${s.name}`}
                            >
                              <MessageCircle className="w-2.5 h-2.5" />
                              <span>{isEn ? 'WhatsApp Order' : 'Order WA'}</span>
                            </a>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-slate-700 dark:text-slate-300 max-w-[220px] truncate" title={s.address}>
                          {s.address}
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap">{s.paymentTerms}</td>
                        <td className="px-3.5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                              : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-slate-200 text-sky-700 border-slate-300'
                                : 'bg-gray-800 hover:bg-gray-700 text-cyan-400 border-gray-700'
                            }`}
                            title={isEn ? 'Edit Supplier' : 'Edit Supplier'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${
                              isLight
                                ? 'bg-slate-100 hover:bg-rose-100 text-rose-700 border-slate-300'
                                : 'bg-gray-800 hover:bg-gray-700 text-rose-400 border-gray-700'
                            }`}
                            title={isEn ? 'Delete Supplier' : 'Hapus Supplier'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {enrichedSupplierList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500 dark:text-gray-400">
                        {isEn ? 'No supplier data matching the filter.' : 'Tidak ada data supplier yang cocok.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeRetailTab === 'customer' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className={`border-b font-bold tracking-wider uppercase text-[10px] ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0d1117] text-slate-300 border-[#30363d]'
                }`}>
                  <tr>
                    <th className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Member Code' : 'Kode Member'}</th>
                    <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Customer Name (PIC)' : 'Nama Pelanggan (PIC)'}</th>
                    <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Business / Store Name' : 'Nama Usaha / Toko'}</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">{isEn ? 'POS Price Tier' : 'Tier Harga Kasir'}</th>
                    <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Phone / WhatsApp' : 'Nomor HP / WhatsApp'}</th>
                    <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Address / Region' : 'Alamat / Wilayah'}</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Reward Points' : 'Poin Reward'}</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Total Spending' : 'Total Belanja'}</th>
                    <th className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Status' : 'Status'}</th>
                    <th className="px-4 py-3 text-right font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Actions' : 'Aksi'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-medium ${
                  isLight ? 'divide-slate-200 bg-white text-slate-800' : 'divide-gray-800/40 bg-[#161b22] text-slate-200'
                }`}>
                  {enrichedCustomerList.map(({ customer: c, storeName, tierKey }, idx) => {
                    return (
                      <tr
                        key={`cust-row-${c.id}-${idx}`}
                        onClick={() => handleOpenCustomerDetail(c)}
                        className={`border-b border-slate-200 dark:border-slate-800 cursor-pointer transition ${
                          isLight ? 'hover:bg-slate-50' : 'hover:bg-cyan-500/10'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-sky-700 dark:text-cyan-400 whitespace-nowrap">
                          {c.code || c.customer_code || c.id}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {c.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {storeName ? (
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                              <Building2 className="w-3.5 h-3.5 text-sky-700 dark:text-cyan-400 shrink-0" />
                              <span className="text-teal-700 dark:text-cyan-200">{storeName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-gray-400 text-xs flex items-center gap-1">
                              <span className="text-slate-400 dark:text-gray-500 font-mono">-</span> {isEn ? 'Non-Store / Personal' : 'Non-Toko / Personal'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {tierKey === 'WHOLESALE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 shadow-xs">
                              <span>{isEn ? 'Wholesale / Store' : 'Grosir / Toko'}</span>
                            </span>
                          ) : tierKey === 'MEMBER' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/40 shadow-xs">
                              <span className="text-amber-500">★</span>
                              <span>Member</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600/50">
                              <span>{isEn ? 'Retail' : 'Retail / Ecer'}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-gray-300 whitespace-nowrap">
                          {c.phone || '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-gray-300 max-w-[170px] truncate" title={c.store_address || c.notes || '-'}>
                          {c.store_address || c.notes || '-'}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {c.points ?? 0} Pts
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          Rp {(c.totalSpent ?? c.total_spending_current_period ?? 0).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            (c.status === 'Active' || c.is_active)
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                              : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                          }`}>
                            {c.status || (c.is_active ? 'Active' : 'Inactive')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerDetail(c)}
                            className={`p-1.5 px-2.5 rounded-lg border inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer transition shadow-xs ${
                              isLight
                                ? 'bg-slate-100 hover:bg-sky-50 text-sky-700 border-slate-300'
                                : 'bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                            }`}
                            title={isEn ? 'View Customer Details & History' : 'Lihat Rincian & Riwayat Transaksi Pelanggan'}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Detail' : 'Detail'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentTab('customer');
                              handleOpenEdit(c);
                            }}
                            className={`p-1.5 px-2 rounded-lg border inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer transition shadow-xs ${
                              isLight
                                ? 'bg-slate-100 hover:bg-amber-100 text-amber-700 border-slate-300'
                                : 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                            }`}
                            title={isEn ? 'Edit Customer Data' : 'Edit Data Pelanggan'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCustomerStatus(c)}
                            className={`p-1.5 px-2 rounded-lg border inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition shadow-xs ${
                              (c.status === 'Active' || c.is_active)
                                ? isLight
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                                : isLight
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                            }`}
                            title={(c.status === 'Active' || c.is_active) ? (isEn ? 'Deactivate Customer' : 'Nonaktifkan Pelanggan') : (isEn ? 'Activate Customer' : 'Aktifkan Pelanggan')}
                          >
                            <span>{(c.status === 'Active' || c.is_active) ? (isEn ? 'Deactivate' : 'Nonaktifkan') : (isEn ? 'Activate' : 'Aktifkan')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentTab('customer');
                              handleDelete(c.id, c.name);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer transition shadow-xs"
                            title={isEn ? 'Delete Customer' : 'Hapus Pelanggan'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {enrichedCustomerList.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-gray-400">
                        {isEn ? 'No customer data matching the filter.' : 'Tidak ada data pelanggan yang cocok.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          </div>
        )}
      </div>
    );
  };

  // 3. Modal Form: Add New Data
  const renderAddModal = () => {
    if (!isAddModalOpen) return null;

    const inputCls = `w-full p-2.5 rounded-xl border font-medium ${
      isLight
        ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
        : 'bg-black/20 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
    }`;
    const labelCls = `block font-semibold mb-1 ${isLight ? 'text-slate-900 dark:text-slate-100' : 'text-slate-200'}`;

    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
        <div className={`w-full ${currentTab === 'product' ? 'max-w-2xl max-h-[92vh] overflow-y-auto' : 'max-w-lg'} rounded-2xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-gray-700/40">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-base">
                {currentTab === 'product'
                  ? (isEn ? '+ New Product Entry (Master SKU)' : '+ Input Data Produk Master (SKU)')
                  : (currentTab === 'customer' || activeRetailTab === 'customer')
                  ? (isEn ? '+ Register New Customer / Member' : '+ Pendaftaran Pelanggan / Member Baru')
                  : `Tambah ${currentTab.toUpperCase()} Baru`}
              </h3>
            </div>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitAdd} className="py-4 space-y-3.5 text-xs">
            {currentTab === 'brand' && (
              <>
                <div>
                  <label className={labelCls}>Kode Merek:</label>
                  <input
                    type="text"
                    required
                    value={brandForm.code}
                    onChange={(e) => setBrandForm({ ...brandForm, code: e.target.value })}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nama Merek:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Aqua Danone"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Pabrikan / Principal:</label>
                  <input
                    type="text"
                    placeholder="PT Tirta Investama"
                    value={brandForm.manufacturer}
                    onChange={(e) => setBrandForm({ ...brandForm, manufacturer: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Negara Asal:</label>
                    <input
                      type="text"
                      value={brandForm.country}
                      onChange={(e) => setBrandForm({ ...brandForm, country: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Status:</label>
                    <select
                      value={brandForm.status}
                      onChange={(e) => setBrandForm({ ...brandForm, status: e.target.value as any })}
                      className={inputCls}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {currentTab === 'category' && (
              <>
                <div>
                  <label className={labelCls}>Kode Kategori:</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.code}
                    onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nama Kategori:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Minuman Segar & RTD"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Departemen:</label>
                  <input
                    type="text"
                    value={categoryForm.department}
                    onChange={(e) => setCategoryForm({ ...categoryForm, department: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>PPN (%):</label>
                    <input
                      type="number"
                      value={categoryForm.taxRate}
                      onChange={(e) => setCategoryForm({ ...categoryForm, taxRate: parseFloat(e.target.value) || 0 })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Target Margin (%):</label>
                    <input
                      type="number"
                      value={categoryForm.marginTarget}
                      onChange={(e) => setCategoryForm({ ...categoryForm, marginTarget: parseFloat(e.target.value) || 0 })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Status Keaktifan:</label>
                  <select
                    value={categoryForm.status}
                    onChange={(e) => setCategoryForm({ ...categoryForm, status: e.target.value as any })}
                    className={inputCls}
                  >
                    <option value="Active">Active (Aktif)</option>
                    <option value="Inactive">Inactive (Non-Aktif)</option>
                  </select>
                </div>
              </>
            )}

            {currentTab === 'product' && (
              <div className="space-y-3.5">
                {/* 1. PLU & 2. Barcode with Auto Kode Internal button */}
                <div className={`p-3 rounded-xl border space-y-2.5 ${
                  isLight ? 'border-teal-200 bg-teal-50/50' : 'border-cyan-500/30 bg-cyan-950/20'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-teal-800' : 'text-cyan-300'}`}>
                        <Scan className="w-3.5 h-3.5" />
                        Kode Identitas Produk (Barcode Pabrik / Non-Barcode)
                      </span>
                      <p className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-cyan-400/80'}`}>
                        Gunakan tombol Auto untuk barang non-barcode (format: [2 Inisial] + [5 Digit Urut])
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = generateInternalProductCode(
                          productForm.name,
                          productForm.category,
                          products
                        );
                        setProductForm((prev) => ({
                          ...prev,
                          plu: generated,
                          barcode: generated,
                        }));
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition cursor-pointer"
                      title="Buat kode otomatis [2 Huruf Inisial Nama/Kategori] + [5 Digit Nomor Urut], contoh: Gula Pasir 1 Liter -> GP00045"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>⚡ Auto Kode Internal</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelCls}>1. PLU (Product Look-Up):</label>
                        <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-teal-700' : 'text-cyan-400'}`}>Kode Identitas</span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: PLU-031 atau GP00045"
                        value={productForm.plu || ''}
                        onChange={(e) => setProductForm({ ...productForm, plu: e.target.value.toUpperCase() })}
                        onBlur={() => {
                          // Logika Auto-fill Barcode: Jika field Barcode kosong, otomatis isi dengan nilai dari PLU
                          if (!productForm.barcode?.trim() && productForm.plu?.trim()) {
                            setProductForm((prev) => ({ ...prev, barcode: prev.plu?.trim() || '' }));
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border font-mono font-bold tracking-wider ${
                          isLight
                            ? 'bg-white border-teal-400 text-slate-900 focus:border-teal-500 placeholder-slate-400'
                            : 'bg-black/20 border-cyan-500/50 text-cyan-300 placeholder-slate-500'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={labelCls}>2. Barcode:</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const genCode = `NON-${Math.floor(1000000 + Math.random() * 9000000)}`;
                              setProductForm((prev) => ({ ...prev, barcode: genCode }));
                              showToast(`Generated ID: ${genCode}`);
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                            title="Generate Unique Code ID"
                          >
                            <span>⚡ Gen ID</span>
                          </button>
                          <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Auto PLU jika kosong</span>
                        </div>
                      </div>
                      {(() => {
                        const trimmed = (productForm.barcode || '').trim();
                        const duplicate = trimmed ? products.find((p) => p.barcode?.trim() === trimmed || p.id === trimmed) : null;
                        return (
                          <>
                            <input
                              type="text"
                              placeholder={productForm.plu ? `Auto: ${productForm.plu}` : '899... / Auto PLU'}
                              value={productForm.barcode}
                              onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                              onBlur={(e) => setProductForm((prev) => ({ ...prev, barcode: e.target.value.trim() }))}
                              className={`${inputCls} font-mono ${duplicate ? 'border-red-500 ring-2 ring-red-500/30 text-red-300' : ''}`}
                            />
                            {duplicate && (
                              <p className="text-[10px] text-red-500 font-bold mt-1">
                                ⚠️ Barcode sudah terdaftar oleh: {duplicate.name} ({duplicate.id})
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 3. Nama Produk (Otomatis Title Case) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>3. Nama Produk:</label>
                    <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Format Title Case</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Aqua Air Mineral 600ml"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    onBlur={() => {
                      if (productForm.name.trim()) {
                        setProductForm((prev) => ({ ...prev, name: toTitleCase(prev.name.trim()) }));
                      }
                    }}
                    className={`${inputCls} font-bold`}
                  />
                </div>

                {/* 4. Category (Pilih dari Master), Brand & Manufacturer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>4. Category (Pilih dari Master):</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => {
                        const catName = e.target.value;
                        const matchedCat = ERP_CATEGORIES.find((c) => c.name === catName);
                        const catCode = matchedCat ? matchedCat.code : 2;
                        const mappedBrands = ERP_CATALOG_MAPPING[catCode] || [];
                        const firstBrand = mappedBrands[0]?.brand || 'Attack';
                        const firstMan = mappedBrands[0]?.manufacturer || 'PT Kao Indonesia';
                        const defSup = getDefaultSupplierForCategory(catCode);

                        setProductForm((prev) => ({
                          ...prev,
                          category: catName,
                          categoryCode: catCode,
                          brand: firstBrand,
                          manufacturer: firstMan,
                          supplier: defSup.name,
                          supplierPhone: defSup.phone,
                          supplierAddress: defSup.address,
                          supplierNotes: `${defSup.paymentTerms} (${defSup.notes})`,
                        }));
                      }}
                      className={`${inputCls} font-semibold`}
                    >
                      {ERP_CATEGORIES.map((c, idx) => (
                        <option key={`add-erp-cat-${c.code}-${idx}`} value={c.name}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>Brand:</label>
                      <span className={`text-[10px] font-semibold ${isLight ? 'text-teal-700' : 'text-cyan-400'}`}>Filter Kategori</span>
                    </div>
                    <select
                      value={productForm.brand}
                      onChange={(e) => {
                        const brandName = e.target.value;
                        const matched = availableBrandsForAdd.find(
                          (b) => b.brand.toLowerCase() === brandName.toLowerCase()
                        );
                        setProductForm((prev) => ({
                          ...prev,
                          brand: brandName,
                          manufacturer: matched ? matched.manufacturer : prev.manufacturer,
                        }));
                      }}
                      className={`${inputCls} font-semibold`}
                    >
                      {availableBrandsForAdd.map((b, idx) => (
                        <option key={`add-avail-brand-${b.brand}-${idx}`} value={b.brand}>
                          {b.brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>Manufacturer:</label>
                      <span className={`text-[10px] font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Otomatis Terisi</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Pabrikan / Principal Pembuat"
                      value={productForm.manufacturer || ''}
                      onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* 5. Satuan / UOM (Pcs, Btl, Box, Sachet, Can, Cup, Kg), HPP & Stok Awal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>5. Satuan / UOM:</label>
                      <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-teal-700' : 'text-cyan-400'}`}>Standar Retail</span>
                    </div>
                    <select
                      value={productForm.unit || 'Pcs'}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      className={`${inputCls} font-mono font-bold`}
                    >
                      {['Pcs', 'Btl', 'Box', 'Sachet', 'Can', 'Cup', 'Kg', 'Pack'].map((u, idx) => (
                        <option key={`add-uom-${u}-${idx}`} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>HPP / Beli (Rp):</label>
                    <input
                      type="number"
                      value={productForm.cost_price}
                      onChange={(e) => setProductForm({ ...productForm, cost_price: parseFloat(e.target.value) || 0 })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Stok Awal:</label>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                </div>

                {/* 6. Multi-Tier Harga (Harga Ecer, Member, Grosir) */}
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isLight ? 'border-teal-200 bg-teal-50/40' : 'border-cyan-500/30 bg-cyan-950/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-teal-800' : 'text-cyan-300'}`}>
                      <Tag className="w-3.5 h-3.5" />
                      6. Multi-Tier Harga: Harga Ecer, Member, Grosir
                    </span>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Kasir/POS membaca tier secara dinamis</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={`block font-bold mb-1 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>Harga Ecer (Retail Rp):</label>
                      <input
                        type="number"
                        required
                        value={productForm.price_retail ?? productForm.sell_price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setProductForm({
                            ...productForm,
                            sell_price: val,
                            price_retail: val,
                            price_member: productForm.price_member || Math.round(val * 0.95),
                            price_wholesale: productForm.price_wholesale || Math.round(val * 0.90),
                          });
                        }}
                        className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                          isLight
                            ? 'bg-white border-emerald-400 text-emerald-900 focus:border-emerald-500'
                            : 'bg-black/30 border-emerald-500/60 text-emerald-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block font-bold mb-1 ${isLight ? 'text-blue-800' : 'text-blue-400'}`}>Harga Member (Member Rp):</label>
                      <input
                        type="number"
                        value={productForm.price_member ?? Math.round((productForm.price_retail || productForm.sell_price) * 0.95)}
                        onChange={(e) => setProductForm({ ...productForm, price_member: parseFloat(e.target.value) || 0 })}
                        className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                          isLight
                            ? 'bg-white border-blue-400 text-blue-900 focus:border-blue-500'
                            : 'bg-black/30 border-blue-500/60 text-blue-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block font-bold mb-1 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>Harga Grosir (Wholesale Rp):</label>
                      <input
                        type="number"
                        value={productForm.price_wholesale ?? Math.round((productForm.price_retail || productForm.sell_price) * 0.90)}
                        onChange={(e) => setProductForm({ ...productForm, price_wholesale: parseFloat(e.target.value) || 0 })}
                        className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                          isLight
                            ? 'bg-white border-amber-400 text-amber-900 focus:border-amber-500'
                            : 'bg-black/30 border-amber-500/60 text-amber-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Status PPN 11% (Toggle ON/OFF) */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isLight ? 'border-slate-200 bg-slate-50' : 'border-gray-700 bg-black/20'
                }`}>
                  <div>
                    <label className={`font-bold text-xs block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      7. Status PPN 11% (Toggle ON/OFF)
                    </label>
                    <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      {productForm.taxable !== false
                        ? 'PPN 11% Aktif (Harga sudah termasuk PPN 11%)'
                        : 'Non-BKP / Bebas PPN (0% PPN)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, taxable: productForm.taxable === false ? true : false })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      productForm.taxable !== false ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        productForm.taxable !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 8. Field Supplier / Distributor Lokal & Status Master Produk */}
                <div className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'border-emerald-300 bg-emerald-50/40' : 'border-emerald-500/30 bg-emerald-950/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                      <Truck className="w-3.5 h-3.5" />
                      8. Pemasok & Status Produk
                    </label>
                    <span className={`text-[10px] font-mono font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>Pemasok & Status Operasional</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block font-semibold mb-1 text-[11px] ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Nama Supplier / Distributor:
                      </label>
                      <select
                        value={productForm.supplier || MASTER_LOCAL_SUPPLIERS[0].name}
                        onChange={(e) => {
                          const sup = MASTER_LOCAL_SUPPLIERS.find((s) => s.name === e.target.value);
                          if (sup) {
                            setProductForm((prev) => ({
                              ...prev,
                              supplier: sup.name,
                              supplierPhone: sup.phone,
                              supplierAddress: sup.address,
                              supplierNotes: `${sup.paymentTerms} (${sup.notes})`,
                            }));
                          } else {
                            setProductForm((prev) => ({ ...prev, supplier: e.target.value }));
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border font-semibold text-xs ${
                          isLight
                            ? 'bg-white border-emerald-300 text-slate-800 focus:border-emerald-500'
                            : 'bg-black/30 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {MASTER_LOCAL_SUPPLIERS.map((s, idx) => (
                          <option key={`sup-add-opt-${s.id}-${idx}`} value={s.name}>
                            {s.name} ({s.region})
                          </option>
                        ))}
                        <option value="Kustom / Pemasok Lain">Kustom / Pemasok Lain</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block font-semibold mb-1 text-[11px] ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Kontak Telepon / WhatsApp:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="0812-xxxx-xxxx"
                          value={productForm.supplierPhone || ''}
                          onChange={(e) => setProductForm({ ...productForm, supplierPhone: e.target.value })}
                          className={`flex-1 p-2.5 rounded-xl border font-mono text-xs ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 placeholder-slate-400'
                              : 'bg-black/30 border-gray-700 text-white placeholder-slate-500'
                          }`}
                        />
                        {productForm.supplierPhone && (
                          <a
                            href={formatWhatsAppLink(
                              productForm.supplierPhone,
                              productForm.name || 'Produk Baru',
                              productForm.stock,
                              productForm.supplier
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                            title="Buka Chat WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WA</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Alamat / Wilayah Distribusi:
                      </label>
                      <input
                        type="text"
                        placeholder="Alamat gudang / wilayah distribusi"
                        value={productForm.supplierAddress || ''}
                        onChange={(e) => setProductForm({ ...productForm, supplierAddress: e.target.value })}
                        className={`w-full p-2 rounded-lg border text-xs ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                            : 'bg-black/20 border-gray-700 text-gray-200 placeholder-slate-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Status Master Produk:
                      </label>
                      <select
                        value={productForm.status || 'ACTIVE'}
                        onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                        className={`w-full p-2 rounded-lg border font-bold text-xs ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800'
                            : 'bg-black/20 border-gray-700 text-white'
                        }`}
                      >
                        <option value="ACTIVE">ACTIVE (Aktif di Master & POS)</option>
                        <option value="DISCONTINUED">DISCONTINUED (Non-Aktif)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentTab === 'supplier' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Kode Vendor:</label>
                    <input
                      type="text"
                      required
                      value={supplierForm.code}
                      onChange={(e) => setSupplierForm({ ...supplierForm, code: e.target.value })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Term Pembayaran:</label>
                    <input
                      type="text"
                      value={supplierForm.paymentTerms}
                      onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Nama Perusahaan Vendor:</label>
                  <input
                    type="text"
                    required
                    placeholder="PT Mitra Distributor Utama"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Contact Person (PIC):</label>
                    <input
                      type="text"
                      value={supplierForm.contactPerson}
                      onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Telepon / WhatsApp:</label>
                    <input
                      type="text"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email Resmi:</label>
                  <input
                    type="email"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Alamat / Wilayah Distribusi:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Kawasan Industri Pulogadung, Jakarta Timur"
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Status Keaktifan:</label>
                  <select
                    value={supplierForm.status}
                    onChange={(e) => setSupplierForm({ ...supplierForm, status: e.target.value as any })}
                    className={inputCls}
                  >
                    <option value="Active">Active (Aktif)</option>
                    <option value="Inactive">Inactive (Non-Aktif)</option>
                  </select>
                </div>
              </>
            )}

            {(currentTab === 'customer' || activeRetailTab === 'customer') && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>Kode Member (Auto):</label>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        isLight ? 'bg-teal-50 text-teal-700 border-teal-200' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                      }`}>Auto Gen</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={customerForm.code}
                      onChange={(e) => setCustomerForm({ ...customerForm, code: e.target.value })}
                      placeholder="MBR-001"
                      className={`${inputCls} text-sky-700 dark:text-cyan-400 font-mono font-bold text-xs`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Default Tier Harga Kasir:</label>
                    <select
                      value={customerForm.memberTier}
                      onChange={(e) => setCustomerForm({ ...customerForm, memberTier: e.target.value })}
                      className={`${inputCls} font-semibold text-xs cursor-pointer`}
                    >
                      <option value="Retail">Retail / Ecer (Harga Normal Kasir)</option>
                      <option value="Member">Member (Diskon Khusus Member)</option>
                      <option value="Grosir">Grosir / Toko (Harga Khusus Toko / Grosir)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nama Pelanggan (PIC) *:</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bpk. Ir. Bambang Hermanto"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className={`${inputCls} font-medium text-xs`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nama Usaha / Toko:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Toko Berkah / Warung Madura Bu Sri (Kosongkan jika personal)"
                      value={customerForm.store_name}
                      onChange={(e) => setCustomerForm({ ...customerForm, store_name: e.target.value })}
                      className={`${inputCls} text-xs`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nomor HP / WhatsApp *:</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 0812-8899-0101"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Alamat / Wilayah:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Jl. Ahmad Yani No. 45, Surabaya"
                      value={customerForm.store_address}
                      onChange={(e) => setCustomerForm({ ...customerForm, store_address: e.target.value })}
                      className={`${inputCls} text-xs`}
                    />
                  </div>
                </div>
              </>
            )}

            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
              isLight ? 'border-slate-200' : 'border-gray-700/40'
            }`}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  isLight
                    ? 'border border-slate-300 bg-white text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Simpan & Daftarkan
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // 4. Modal Form: Edit Existing Data
  const renderEditModal = () => {
    if (!isEditModalOpen || !editingItem) return null;

    const inputCls = `w-full p-2.5 rounded-xl border font-medium ${
      isLight
        ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
        : 'bg-black/20 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
    }`;
    const labelCls = `block font-semibold mb-1 ${isLight ? 'text-slate-900 dark:text-slate-100' : 'text-slate-200'}`;

    return (
      <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
        <div className={`w-full ${currentTab === 'product' ? 'max-w-2xl max-h-[92vh] overflow-y-auto' : 'max-w-lg'} rounded-2xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-gray-700/40">
            <div className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-cyan-400" />
              <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {currentTab === 'product'
                  ? `Edit Master Produk SKU (${editingItem.plu || editingItem.id})`
                  : (currentTab === 'customer' || activeRetailTab === 'customer')
                  ? `Edit Data Pelanggan (${editingItem.name || editingItem.id})`
                  : `Edit Data ${currentTab.toUpperCase()} (${editingItem.id})`}
              </h3>
            </div>
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingItem(null);
              }}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitEdit} className="py-4 space-y-3.5 text-xs">
            {currentTab === 'product' ? (
              <div className="space-y-3.5">
                {/* 1. PLU & 2. Barcode with Auto Kode Internal button */}
                <div className={`p-3 rounded-xl border space-y-2.5 ${
                  isLight ? 'border-teal-200 bg-teal-50/50' : 'border-cyan-500/30 bg-cyan-950/20'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-teal-800' : 'text-cyan-300'}`}>
                        <Scan className="w-3.5 h-3.5" />
                        Kode Identitas Produk (Barcode Pabrik / Non-Barcode)
                      </span>
                      <p className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-cyan-400/80'}`}>
                        Gunakan tombol Auto untuk barang non-barcode (format: [2 Inisial] + [5 Digit Urut])
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const generated = generateInternalProductCode(
                          editingItem.name || '',
                          editingItem.category || '',
                          products
                        );
                        setEditingItem((prev: any) => ({
                          ...prev,
                          plu: generated,
                          barcode: generated,
                        }));
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition cursor-pointer"
                      title="Buat kode otomatis [2 Huruf Inisial Nama/Kategori] + [5 Digit Nomor Urut], contoh: Gula Pasir 1 Liter -> GP00045"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>⚡ Auto Kode Internal</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className={labelCls}>1. PLU (Product Look-Up):</label>
                      <input
                        type="text"
                        required
                        value={editingItem.plu || editingItem.id || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, plu: e.target.value.toUpperCase() })}
                        className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                          isLight
                            ? 'bg-white border-cyan-400 text-cyan-900 focus:border-cyan-500 placeholder-slate-400'
                            : 'bg-black/20 border-cyan-500/50 text-cyan-300 placeholder-slate-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>2. Barcode:</label>
                      <input
                        type="text"
                        value={editingItem.barcode || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                        placeholder="Auto PLU jika kosong"
                        className={`${inputCls} font-mono`}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Nama Produk (Title Case) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelCls}>3. Nama Produk SKU:</label>
                    <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Title Case</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    onBlur={() => {
                      if (editingItem.name?.trim()) {
                        setEditingItem((prev: any) => ({ ...prev, name: toTitleCase(prev.name.trim()) }));
                      }
                    }}
                    className={`${inputCls} font-bold`}
                  />
                </div>

                {/* 4. Category (Pilih dari Master), Brand & Manufacturer */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>4. Category (Pilih dari Master):</label>
                    <select
                      value={editingItem.category || ''}
                      onChange={(e) => {
                        const catName = e.target.value;
                        const matchedCat = ERP_CATEGORIES.find((c) => c.name === catName);
                        const catCode = matchedCat ? matchedCat.code : 2;
                        const mappedBrands = ERP_CATALOG_MAPPING[catCode] || [];
                        const firstBrand = mappedBrands[0]?.brand || 'Attack';
                        const firstMan = mappedBrands[0]?.manufacturer || 'PT Kao Indonesia';
                        const defSup = getDefaultSupplierForCategory(catCode);

                        setEditingItem((prev: any) => ({
                          ...prev,
                          category: catName,
                          categoryCode: catCode,
                          brand: firstBrand,
                          manufacturer: firstMan,
                          supplier: prev.supplier || defSup.name,
                          supplierPhone: prev.supplierPhone || defSup.phone,
                          supplierAddress: prev.supplierAddress || defSup.address,
                          supplierNotes: prev.supplierNotes || `${defSup.paymentTerms} (${defSup.notes})`,
                        }));
                      }}
                      className={`${inputCls} font-semibold`}
                    >
                      {ERP_CATEGORIES.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>Brand:</label>
                      <span className={`text-[10px] font-semibold ${isLight ? 'text-teal-700' : 'text-cyan-400'}`}>Filter Kategori</span>
                    </div>
                    <select
                      value={editingItem.brand || ''}
                      onChange={(e) => {
                        const brandName = e.target.value;
                        const matched = availableBrandsForEdit.find(
                          (b) => b.brand.toLowerCase() === brandName.toLowerCase()
                        );
                        setEditingItem((prev: any) => ({
                          ...prev,
                          brand: brandName,
                          manufacturer: matched ? matched.manufacturer : prev.manufacturer,
                        }));
                      }}
                      className={`${inputCls} font-semibold`}
                    >
                      {availableBrandsForEdit.map((b) => (
                        <option key={b.brand} value={b.brand}>
                          {b.brand}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>Manufacturer:</label>
                      <span className={`text-[10px] font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Otomatis Terisi</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Pabrikan / Principal Pembuat"
                      value={editingItem.manufacturer || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, manufacturer: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* 5. Satuan / UOM (Pcs, Btl, Box, Sachet, Can, Cup, Kg), HPP & Stok */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>5. Satuan / UOM:</label>
                      <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-teal-700' : 'text-cyan-400'}`}>Standar Retail</span>
                    </div>
                    <select
                      value={editingItem.unit || 'Pcs'}
                      onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                      className={`${inputCls} font-mono font-bold`}
                    >
                      {['Pcs', 'Btl', 'Box', 'Sachet', 'Can', 'Cup', 'Kg', 'Pack'].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>HPP / Beli (Rp):</label>
                    <input
                      type="number"
                      value={editingItem.cost_price ?? 0}
                      onChange={(e) => setEditingItem({ ...editingItem, cost_price: parseFloat(e.target.value) || 0 })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Stok:</label>
                    <input
                      type="number"
                      value={editingItem.stock ?? 0}
                      onChange={(e) => setEditingItem({ ...editingItem, stock: parseInt(e.target.value) || 0 })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                </div>

                {/* 6. Multi-Tier Harga (Harga Ecer, Member, Grosir) */}
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isLight ? 'border-teal-200 bg-teal-50/40' : 'border-cyan-500/30 bg-cyan-950/20'
                }`}>
                  <span className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-teal-800' : 'text-cyan-300'}`}>
                    <Tag className="w-3.5 h-3.5" />
                    6. Multi-Tier Harga: Harga Ecer, Member, Grosir
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={`block font-bold mb-1 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>Harga Ecer (Retail Rp):</label>
                      <input
                        type="number"
                        value={editingItem.price_retail ?? editingItem.sell_price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setEditingItem({
                            ...editingItem,
                            sell_price: val,
                            price_retail: val,
                          });
                        }}
                        className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                          isLight
                            ? 'bg-white border-emerald-400 text-emerald-900 focus:border-emerald-500'
                            : 'bg-black/30 border-emerald-500/60 text-emerald-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block font-bold mb-1 ${isLight ? 'text-blue-800' : 'text-blue-400'}`}>Harga Member (Member Rp):</label>
                      <input
                        type="number"
                        value={editingItem.price_member ?? Math.round((editingItem.price_retail || editingItem.sell_price) * 0.95)}
                        onChange={(e) => setEditingItem({ ...editingItem, price_member: parseFloat(e.target.value) || 0 })}
                        className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                          isLight
                            ? 'bg-white border-blue-400 text-blue-900 focus:border-blue-500'
                            : 'bg-black/30 border-blue-500/60 text-blue-400'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block font-bold mb-1 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>Harga Grosir (Wholesale Rp):</label>
                      <input
                        type="number"
                        value={editingItem.price_wholesale ?? Math.round((editingItem.price_retail || editingItem.sell_price) * 0.90)}
                        onChange={(e) => setEditingItem({ ...editingItem, price_wholesale: parseFloat(e.target.value) || 0 })}
                        className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                          isLight
                            ? 'bg-white border-amber-400 text-amber-900 focus:border-amber-500'
                            : 'bg-black/30 border-amber-500/60 text-amber-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Status PPN 11% (Toggle ON/OFF) */}
                <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isLight ? 'border-slate-200 bg-slate-50' : 'border-gray-700 bg-black/20'
                }`}>
                  <div>
                    <label className={`font-bold text-xs block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      7. Status PPN 11% (Toggle ON/OFF)
                    </label>
                    <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      {editingItem.taxable !== false
                        ? 'PPN 11% Aktif (Harga sudah termasuk PPN 11%)'
                        : 'Non-BKP / Bebas PPN (0% PPN)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, taxable: editingItem.taxable === false ? true : false })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      editingItem.taxable !== false ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        editingItem.taxable !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 8. Field Supplier / Distributor Lokal & Status Master Produk */}
                <div className={`p-3.5 rounded-xl border space-y-3 ${
                  isLight ? 'border-emerald-300 bg-emerald-50/40' : 'border-emerald-500/30 bg-emerald-950/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                      <Truck className="w-3.5 h-3.5" />
                      8. Pemasok & Status Produk
                    </label>
                    <span className={`text-[10px] font-mono font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>Pemasok & Status Operasional</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block font-semibold mb-1 text-[11px] ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Nama Supplier / Distributor:
                      </label>
                      <select
                        value={editingItem.supplier || MASTER_LOCAL_SUPPLIERS[0].name}
                        onChange={(e) => {
                          const sup = MASTER_LOCAL_SUPPLIERS.find((s) => s.name === e.target.value);
                          if (sup) {
                            setEditingItem((prev: any) => ({
                              ...prev,
                              supplier: sup.name,
                              supplierPhone: sup.phone,
                              supplierAddress: sup.address,
                              supplierNotes: `${sup.paymentTerms} (${sup.notes})`,
                            }));
                          } else {
                            setEditingItem((prev: any) => ({ ...prev, supplier: e.target.value }));
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border font-semibold text-xs ${
                          isLight
                            ? 'bg-white border-emerald-300 text-slate-800 focus:border-emerald-500'
                            : 'bg-black/30 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        {MASTER_LOCAL_SUPPLIERS.map((s, idx) => (
                          <option key={`sup-edit-opt-${s.id}-${idx}`} value={s.name}>
                            {s.name} ({s.region})
                          </option>
                        ))}
                        <option value="Kustom / Pemasok Lain">Kustom / Pemasok Lain</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block font-semibold mb-1 text-[11px] ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Kontak Telepon / WhatsApp:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="0812-xxxx-xxxx"
                          value={editingItem.supplierPhone || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, supplierPhone: e.target.value })}
                          className={`flex-1 p-2.5 rounded-xl border font-mono text-xs ${
                            isLight
                              ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 placeholder-slate-400'
                              : 'bg-black/30 border-gray-700 text-white placeholder-slate-500'
                          }`}
                        />
                        {editingItem.supplierPhone && (
                          <a
                            href={formatWhatsAppLink(
                              editingItem.supplierPhone,
                              editingItem.name || 'Produk',
                              editingItem.stock,
                              editingItem.supplier
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                            title="Buka Chat WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WA</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Alamat / Wilayah Distribusi:
                      </label>
                      <input
                        type="text"
                        placeholder="Alamat gudang / wilayah distribusi"
                        value={editingItem.supplierAddress || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, supplierAddress: e.target.value })}
                        className={`w-full p-2 rounded-lg border text-xs ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                            : 'bg-black/20 border-gray-700 text-gray-200 placeholder-slate-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                        Status Master Produk:
                      </label>
                      <select
                        value={String(editingItem.status).toUpperCase() === 'DISCONTINUED' ? 'DISCONTINUED' : 'ACTIVE'}
                        onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                        className={`w-full p-2 rounded-lg border font-bold text-xs ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800'
                            : 'bg-black/20 border-gray-700 text-white'
                        }`}
                      >
                        <option value="ACTIVE">ACTIVE (Aktif di Master & POS)</option>
                        <option value="DISCONTINUED">DISCONTINUED (Non-Aktif)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 9. Manajemen Resep & Bill of Materials (BOM) */}
                <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isLight ? 'border-teal-300 bg-teal-50/40' : 'border-teal-500/30 bg-teal-950/20'
                }`}>
                  <div>
                    <label className={`font-bold text-xs flex items-center gap-1.5 ${isLight ? 'text-teal-800' : 'text-teal-400'}`}>
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      9. Manajemen Resep & Bill of Materials (BOM F&B)
                    </label>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
                      {editingItem.recipe && editingItem.recipe.length > 0
                        ? `Terhubung dengan ${editingItem.recipe.length} bahan baku gudang. HPP Formula: Rp ${Number(editingItem.cost_price || 0).toLocaleString('id-ID')}`
                        : 'Atur formula takaran bahan mentah, persentase susut, kemasan & HPP otomatis.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecipeProduct(editingItem);
                      setIsRecipeModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md shadow-teal-500/20 shrink-0"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Atur Resep BOM</span>
                  </button>
                </div>
              </div>
            ) : (currentTab === 'brand' || activeRetailTab === 'brand') ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Kode Merek:</label>
                    <input
                      type="text"
                      disabled
                      value={editingItem.code || editingItem.id || ''}
                      className={`w-full p-2.5 rounded-xl border font-mono font-bold text-xs cursor-not-allowed opacity-80 ${
                        isLight ? 'bg-slate-100 border-slate-300 text-sky-700' : 'bg-black/40 border-slate-700 text-cyan-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Negara Asal:</label>
                    <input
                      type="text"
                      value={editingItem.country || 'Indonesia'}
                      onChange={(e) => setEditingItem({ ...editingItem, country: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Nama Merek:</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className={`${inputCls} font-bold`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Pabrikan / Principal:</label>
                  <input
                    type="text"
                    value={editingItem.manufacturer || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, manufacturer: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Status Keaktifan:</label>
                  <select
                    value={editingItem.status || 'Active'}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                    className={inputCls}
                  >
                    <option value="Active">Active (Aktif)</option>
                    <option value="Inactive">Inactive (Non-Aktif)</option>
                  </select>
                </div>
              </>
            ) : (currentTab === 'customer' || activeRetailTab === 'customer') ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Kode Member (Auto):</label>
                    <input
                      type="text"
                      disabled
                      value={editingItem.code || editingItem.customer_code || editingItem.id || ''}
                      className={`w-full p-2.5 rounded-xl border font-mono font-bold text-xs cursor-not-allowed opacity-80 ${
                        isLight ? 'bg-slate-100 border-slate-300 text-sky-700' : 'bg-black/40 border-gray-700 text-cyan-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tier Harga Kasir:</label>
                    <select
                      value={editingItem.memberTier || editingItem.tier_level || 'Member'}
                      onChange={(e) => setEditingItem({ ...editingItem, memberTier: e.target.value, tier_level: e.target.value })}
                      className={`${inputCls} font-semibold text-xs cursor-pointer`}
                    >
                      <option value="Retail">Retail / Ecer (Normal)</option>
                      <option value="Member">Member (Diskon Khusus)</option>
                      <option value="Grosir">Grosir / Toko (Harga Khusus Toko)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nama Pelanggan (PIC) *:</label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className={`${inputCls} font-medium text-xs`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nama Usaha / Toko:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Toko Berkah / Warung Madura Bu Sri (Kosongkan jika personal)"
                      value={editingItem.store_name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, store_name: e.target.value })}
                      className={`${inputCls} text-xs`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nomor HP / WhatsApp *:</label>
                    <input
                      type="text"
                      required
                      value={editingItem.phone || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Alamat / Wilayah:</label>
                    <input
                      type="text"
                      placeholder="Alamat atau wilayah"
                      value={editingItem.store_address || editingItem.notes || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, store_address: e.target.value })}
                      className={`${inputCls} text-xs`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Poin Reward Pelanggan:</label>
                    <input
                      type="number"
                      min={0}
                      value={editingItem.points ?? 0}
                      onChange={(e) => setEditingItem({ ...editingItem, points: Number(e.target.value) || 0 })}
                      className={`w-full p-2.5 rounded-xl border font-mono text-xs ${
                        isLight ? 'bg-slate-50 border-slate-300 text-amber-700' : 'bg-black/20 border-gray-700 text-amber-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Status Keaktifan:</label>
                    <select
                      value={editingItem.status || 'Active'}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                      className={`${inputCls} text-xs font-semibold`}
                    >
                      <option value="Active">Active (Aktif)</option>
                      <option value="Inactive">Inactive (Non-Aktif)</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (currentTab === 'category' || activeRetailTab === 'category') ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Kode Kategori:</label>
                    <input
                      type="text"
                      disabled
                      value={editingItem.code || editingItem.id || ''}
                      className={`w-full p-2.5 rounded-xl border font-mono font-bold text-xs cursor-not-allowed opacity-80 ${
                        isLight ? 'bg-slate-100 border-slate-300 text-sky-700' : 'bg-black/40 border-gray-700 text-cyan-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Departemen:</label>
                    <input
                      type="text"
                      value={editingItem.department || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, department: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Nama Kategori:</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className={`${inputCls} font-bold`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>PPN (%):</label>
                    <input
                      type="number"
                      value={editingItem.taxRate ?? 11}
                      onChange={(e) => setEditingItem({ ...editingItem, taxRate: parseFloat(e.target.value) || 0 })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Target Margin (%):</label>
                    <input
                      type="number"
                      value={editingItem.marginTarget ?? 20}
                      onChange={(e) => setEditingItem({ ...editingItem, marginTarget: parseFloat(e.target.value) || 0 })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Status Keaktifan:</label>
                  <select
                    value={editingItem.status || 'Active'}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                    className={inputCls}
                  >
                    <option value="Active">Active (Aktif)</option>
                    <option value="Inactive">Inactive (Non-Aktif)</option>
                  </select>
                </div>
              </>
            ) : (currentTab === 'supplier' || activeRetailTab === 'supplier') ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Kode Vendor:</label>
                    <input
                      type="text"
                      disabled
                      value={editingItem.code || editingItem.id || ''}
                      className={`w-full p-2.5 rounded-xl border font-mono font-bold text-xs cursor-not-allowed opacity-80 ${
                        isLight ? 'bg-slate-100 border-slate-300 text-sky-700' : 'bg-black/40 border-gray-700 text-cyan-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Term Pembayaran:</label>
                    <input
                      type="text"
                      value={editingItem.paymentTerms || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, paymentTerms: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Nama Perusahaan Vendor:</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className={`${inputCls} font-bold`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Contact Person (PIC):</label>
                    <input
                      type="text"
                      value={editingItem.contactPerson || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, contactPerson: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Telepon / WhatsApp:</label>
                    <input
                      type="text"
                      value={editingItem.phone || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email Resmi:</label>
                  <input
                    type="email"
                    value={editingItem.email || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Alamat / Wilayah Distribusi:</label>
                  <input
                    type="text"
                    value={editingItem.address || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Status Keaktifan:</label>
                  <select
                    value={editingItem.status || 'Active'}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                    className={inputCls}
                  >
                    <option value="Active">Active (Aktif)</option>
                    <option value="Inactive">Inactive (Non-Aktif)</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={labelCls}>Nama / Label Entitas:</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className={`${inputCls} font-bold`}
                  />
                </div>

                <div>
                  <label className={labelCls}>Status Keaktifan:</label>
                  <select
                    value={editingItem.status || 'Active'}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}
                    className={inputCls}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </>
            )}

            <div className={`flex items-center justify-end gap-3 pt-3 border-t ${
              isLight ? 'border-slate-200' : 'border-gray-700/40'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  isLight
                    ? 'border border-slate-300 bg-white text-slate-800 hover:text-slate-950 hover:bg-slate-100'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // 5. Modal: View Detail Product & Contact Supplier (WhatsApp)
  const renderDetailModal = () => {
    if (!selectedDetailProduct) return null;
    const p = selectedDetailProduct;
    const catInfo = getErpCategoryInfo(p);
    const defSup = getDefaultSupplierForCategory(catInfo.categoryCode);
    const supplierName = p.supplier || defSup.name;
    const supplierPhone = p.supplierPhone || defSup.phone;
    const supplierAddress = p.supplierAddress || defSup.address;
    const supplierNotes = p.supplierNotes || `${defSup.paymentTerms} (${defSup.notes})`;
    const retail = p.price_retail ?? p.sell_price;
    const member = p.price_member ?? Math.round(retail * 0.95);
    const wholesale = p.price_wholesale ?? Math.round(retail * 0.90);
    const cost = p.cost_price ?? Math.round(retail * 0.75);

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div
          className={`w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-700/40">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-sky-50 text-sky-700 border-slate-200' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-bold ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>{p.plu || p.id}</span>
                  <span className="text-gray-400 text-xs">|</span>
                  <span className="font-mono text-xs text-gray-300 flex items-center gap-1">
                    <Scan className="w-3.5 h-3.5 text-gray-400" />
                    {p.barcode || p.plu || p.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.status === 'Active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <h3 className={`font-bold text-lg mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.description || p.name}</h3>
              </div>
            </div>
            <button
              onClick={() => setSelectedDetailProduct(null)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-4 text-xs">
            {/* Catalog Info Grid */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-gray-800'
            }`}>
              <div>
                <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Official Category:' : 'Kategori Resmi:'}</span>
                <span className={`font-bold ${isLight ? 'text-teal-700' : 'text-cyan-300'}`}>
                  {catInfo.categoryCode} - {catInfo.categoryName}
                </span>
              </div>
              <div>
                <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Brand:' : 'Brand / Merek:'}</span>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.brand}</span>
              </div>
              <div>
                <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Manufacturer (Principal):' : 'Pabrikan (Principal):'}</span>
                <span className={isLight ? 'text-slate-900 font-medium' : 'text-gray-200'}>{p.manufacturer || '-'}</span>
              </div>
              <div>
                <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Packaging Unit (UOM):' : 'Satuan Kemasan (UOM):'}</span>
                <span className={`font-bold uppercase ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{p.unit || 'PCS'}</span>
              </div>
            </div>

            {/* Pricing & Stock Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-500/30'
              }`}>
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>{isEn ? 'Retail Price:' : 'Harga Eceran (Retail):'}</span>
                <span className={`text-sm font-bold font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                  Rp {retail.toLocaleString('id-ID')}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-950/20 border-blue-500/30'
              }`}>
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-blue-800' : 'text-blue-400'}`}>{isEn ? 'Member Price:' : 'Harga Member:'}</span>
                <span className={`text-sm font-bold font-mono ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
                  Rp {member.toLocaleString('id-ID')}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'
              }`}>
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>{isEn ? 'Wholesale Price:' : 'Harga Grosir (Wholesale):'}</span>
                <span className={`text-sm font-bold font-mono ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                  Rp {wholesale.toLocaleString('id-ID')}
                </span>
              </div>
              <div className={`p-3 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-gray-900 border-gray-700'
              }`}>
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Physical Stock Remaining:' : 'Sisa Stok Fisik:'}</span>
                <span className={`text-sm font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {p.stock} {p.unit || 'PCS'}
                </span>
              </div>
            </div>

            {/* Tax & Margin */}
            <div className={`flex items-center justify-between p-3 rounded-xl border text-[11px] ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-gray-800'
            }`}>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-500" />
                <span className={isLight ? 'text-slate-700' : 'text-gray-300'}>
                  {isEn ? 'Tax Status:' : 'Status Pajak:'} <strong className={isLight ? 'text-slate-900' : 'text-white'}>{p.taxable !== false ? (isEn ? 'VAT 11% (Tax Included)' : 'PPN 11% (Termasuk Pajak)') : (isEn ? 'Non-Taxable (0%)' : 'Non-BKP / Bebas Pajak (0%)')}</strong>
                </span>
              </div>
              <div className={isLight ? 'text-slate-600' : 'text-gray-400'}>
                {isEn ? 'Purchase Cost (HPP):' : 'HPP Pembelian:'} <strong className={`font-mono ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>Rp {cost.toLocaleString('id-ID')}</strong>
              </div>
            </div>

            {/* Supplier / Distributor Lokal Section */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-emerald-50/60 border-emerald-200' : 'border-emerald-500/40 bg-emerald-950/20'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className={`font-bold text-sm flex items-center gap-2 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                  <Truck className="w-4 h-4" />
                  {isEn ? 'Local Distribution Supplier' : 'Supplier Distribusi Lokal'}
                </h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {isEn ? 'Verified Distributor' : 'Distributor Terverifikasi'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Distributor Company Name:' : 'Nama Perusahaan Distributor:'}</span>
                  <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{supplierName}</span>
                </div>
                <div>
                  <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Phone / WhatsApp Contact:' : 'Kontak Telepon / WhatsApp:'}</span>
                  <span className={`font-mono font-bold text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{supplierPhone}</span>
                </div>
              </div>

              <div>
                <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Distribution Address & Territory:' : 'Alamat & Wilayah Distribusi:'}</span>
                <span className={isLight ? 'text-slate-800' : 'text-gray-200'}>{supplierAddress}</span>
              </div>

              <div>
                <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Payment Terms (TOP) & Delivery Notes:' : 'Term of Payment (TOP) & Catatan Pengiriman:'}</span>
                <span className={isLight ? 'text-slate-700' : 'text-gray-300'}>{supplierNotes}</span>
              </div>

              {/* Direct WhatsApp Call-to-action button */}
              <div className="pt-2">
                <a
                  href={formatWhatsAppLink(supplierPhone, p.name, p.stock, supplierName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isEn ? 'Send WhatsApp Message to Distributor (Restock Order)' : 'Kirim Pesan WhatsApp ke Distributor (Order Restock Cepat)'}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-700/40">
            <button
              onClick={() => setSelectedDetailProduct(null)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer border ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-gray-800 hover:bg-gray-700 text-white border-transparent'
              }`}
            >
              {isEn ? 'Close' : 'Tutup'}
            </button>
            <button
              onClick={() => {
                const itemToEdit = selectedDetailProduct;
                setSelectedDetailProduct(null);
                handleOpenEdit(itemToEdit);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <Edit2 className="w-3.5 h-3.5" />
              {isEn ? 'Edit This Product' : 'Edit Produk Ini'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 5b. Modal Rincian / Detail Pelanggan (PIC, Histori Transaksi, Tier Harga, Poin Reward, Kontak)
  const renderCustomerDetailModal = () => {
    if (!isCustomerDetailOpen || !selectedDetailCustomer) return null;
    const c = selectedDetailCustomer;

    const customerTransactions = (sales || []).filter((s) => {
      const matchId = s.customer_id && s.customer_id === c.id;
      const matchPhone = s.customer_phone && c.phone && s.customer_phone.replace(/\D/g, '') === c.phone.replace(/\D/g, '');
      const matchName = s.customer_name && s.customer_name.trim().toLowerCase() === c.name.trim().toLowerCase();
      return matchId || matchPhone || matchName;
    });

    const storeName = c.store_name || (c.has_store ? c.name : '');
    const tierKey = (c.memberTier || c.tier_level || 'Member').toUpperCase();
    const isWholesale = tierKey.includes('GROSIR') || tierKey.includes('WHOLESALE') || tierKey.includes('TOKO');
    const isMember = tierKey.includes('MEMBER') || tierKey.includes('PLATINUM') || tierKey.includes('GOLD') || tierKey.includes('SILVER');
    const isActive = c.status === 'Active' || c.is_active;

    const totalTransactionSpent = customerTransactions.reduce((acc, t) => acc + (t.total_amount || 0), 0);
    const displayTotalSpent = (c.totalSpent ?? c.total_spending_current_period ?? 0) || totalTransactionSpent;

    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div
          className={`w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 border shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#161b22] border-[#30363d] text-white'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-700/40">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl border ${isLight ? 'bg-sky-50 text-sky-700 border-slate-200 shadow-sm' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)]'}`}>
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded border ${isLight ? 'text-sky-700 bg-sky-50 border-slate-200' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'}`}>
                    {c.code || c.customer_code || c.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {isActive ? (isEn ? '● ACTIVE' : '● AKTIF') : (isEn ? '○ INACTIVE' : '○ NONAKTIF')}
                  </span>
                  {isWholesale ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {isEn ? 'Tier: Wholesale / Store' : 'Tier: Grosir / Toko'}
                    </span>
                  ) : isMember ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {isEn ? '★ Tier: Member' : '★ Tier: Member'}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50">
                      {isEn ? 'Tier: Retail' : 'Tier: Retail / Ecer'}
                    </span>
                  )}
                </div>
                <h3 className={`font-bold text-xl mt-1 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>{c.name}</span>
                  {storeName && (
                    <span className={`text-sm font-semibold ${isLight ? 'text-teal-700' : 'text-cyan-300'}`}>({storeName})</span>
                  )}
                </h3>
              </div>
            </div>
            <button
              onClick={() => {
                setIsCustomerDetailOpen(false);
                setSelectedDetailCustomer(null);
              }}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-5 space-y-5 text-xs">
            {/* Grid 4 Kartu Metrik Utama */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3.5 rounded-xl border ${isLight ? 'border-slate-200 bg-sky-50/50' : 'border-cyan-500/20 bg-cyan-500/5'}`}>
                <span className={`text-[11px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'POS Price Tier' : 'Tier Harga Kasir'}</span>
                <span className={`font-bold text-sm flex items-center gap-1.5 ${isLight ? 'text-sky-700' : 'text-cyan-300'}`}>
                  <Tag className={`w-4 h-4 shrink-0 ${isLight ? 'text-sky-700' : 'text-cyan-400'}`} />
                  {c.memberTier || c.tier_level || 'Member'}
                </span>
                <span className={`text-[10px] mt-1 block ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>{isEn ? 'Auto applied at POS checkout' : 'Otomatis saat checkout POS'}</span>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <span className="text-[11px] text-gray-400 block mb-1 font-semibold">{isEn ? 'Reward Points' : 'Poin Reward'}</span>
                <span className="font-mono font-extrabold text-sm text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  {(c.points ?? 0).toLocaleString('id-ID')} Pts
                </span>
                <span className="text-[10px] text-amber-400/80 mt-1 block">{isEn ? 'Redeem discount at register' : 'Tukar diskon di kasir'}</span>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <span className="text-[11px] text-gray-400 block mb-1 font-semibold">{isEn ? 'Total Spending' : 'Total Belanja (Spent)'}</span>
                <span className="font-mono font-extrabold text-sm text-emerald-400 flex items-center gap-1">
                  Rp {displayTotalSpent.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-gray-500 mt-1 block">{isEn ? 'Lifetime spending' : 'Akumulasi belanja'}</span>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <span className="text-[11px] text-gray-400 block mb-1 font-semibold">{isEn ? 'Transaction Frequency' : 'Frekuensi Transaksi'}</span>
                <span className="font-mono font-extrabold text-sm text-blue-300 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-blue-400 shrink-0" />
                  {customerTransactions.length} {isEn ? 'Transactions' : 'Transaksi'}
                </span>
                <span className="text-[10px] text-gray-500 mt-1 block">{isEn ? 'Logged at POS cash register' : 'Tercatat di kasir POS'}</span>
              </div>
            </div>

            {/* Profil PIC & Kontak */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'border-slate-800 bg-slate-900/60'
            }`}>
              <h4 className={`font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${
                isLight ? 'text-slate-800' : 'text-gray-200'
              }`}>
                <Users className={`w-4 h-4 ${isLight ? 'text-sky-700' : 'text-cyan-500'}`} />
                <span>{isEn ? 'Contact Info & Customer Entity Profile' : 'Informasi Kontak & Profil Entitas Pelanggan'}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <div>
                    <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'PIC / Contact Name:' : 'Nama PIC / Kontak:'}</span>
                    <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{c.name}</span>
                  </div>

                  <div>
                    <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Business / Store Name:' : 'Nama Usaha / Toko:'}</span>
                    {storeName ? (
                      <div className="flex items-center gap-1.5 font-bold mt-0.5">
                        <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-sky-700' : 'text-cyan-600 dark:text-cyan-400'}`} />
                        <span className={isLight ? 'text-teal-700' : 'text-cyan-300'}>{storeName}</span>
                      </div>
                    ) : (
                      <span className={`italic ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>{isEn ? 'Personal / Non-Store' : 'Personal / Non-Toko'}</span>
                    )}
                  </div>

                  <div>
                    <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Address / Region:' : 'Alamat / Wilayah:'}</span>
                    <div className={`flex items-start gap-1.5 mt-0.5 ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{c.store_address || c.notes || (isEn ? 'No address data on record' : 'Belum ada data alamat tercatat')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Phone / WhatsApp:' : 'Nomor HP / WhatsApp:'}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-cyan-300'}`}>{c.phone || '-'}</span>
                      {c.phone && c.phone !== '-' && (
                        <a
                          href={formatWhatsAppLink(c.phone, isEn ? `Hello ${c.name}, thank you for being our loyal customer.` : `Halo ${c.name}, terima kasih telah menjadi pelanggan setia toko kami.`)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-300 dark:border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{isEn ? 'WhatsApp Chat' : 'Chat WhatsApp'}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Email:</span>
                    <span className={`font-mono ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>{c.email || '-'}</span>
                  </div>

                  <div>
                    <span className={`text-[11px] block font-semibold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Active Status:' : 'Status Keaktifan:'}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                          : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                      }`}>
                        {isActive ? (isEn ? 'Active at POS' : 'Aktif di POS') : (isEn ? 'Inactive (Suspended)' : 'Non-Aktif (Ditangguhkan)')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleCustomerStatus(c)}
                        className={`text-[11px] underline font-semibold cursor-pointer ${isLight ? 'text-sky-700 hover:text-sky-800' : 'text-cyan-400 hover:text-cyan-300'}`}
                      >
                        {isActive ? (isEn ? 'Deactivate' : 'Nonaktifkan') : (isEn ? 'Activate' : 'Aktifkan')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Riwayat / Histori Transaksi Pelanggan */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'border-slate-800 bg-slate-900/60'
            }`}>
              <div className="flex items-center justify-between">
                <h4 className={`font-bold text-xs uppercase tracking-wider flex items-center gap-2 ${
                  isLight ? 'text-slate-800' : 'text-gray-200'
                }`}>
                  <ShoppingCart className="w-4 h-4 text-emerald-500" />
                  <span>{isEn ? `POS Register Transaction History (${customerTransactions.length})` : `Histori Transaksi Kasir POS (${customerTransactions.length})`}</span>
                </h4>
                <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{isEn ? 'Recorded in POS Register' : 'Tercatat di Register POS Kasir'}</span>
              </div>

              {customerTransactions.length > 0 ? (
                <div className="overflow-x-auto max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
                  <table className="w-full text-[11px] text-left">
                    <thead className={`border-b sticky top-0 uppercase text-[10px] font-bold ${
                      isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-[#0d1117] text-slate-300 border-gray-800'
                    }`}>
                      <tr>
                        <th className="px-3 py-2 font-mono font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Tx Receipt No.' : 'No. Transaksi'}</th>
                        <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Date / Time' : 'Waktu'}</th>
                        <th className="px-3 py-2 font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Items Summary' : 'Ringkasan Item'}</th>
                        <th className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Payment Method' : 'Metode Bayar'}</th>
                        <th className="px-3 py-2 text-right font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Total' : 'Total'}</th>
                        <th className="px-3 py-2 text-center font-bold text-slate-700 dark:text-slate-300">{isEn ? 'Status' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      isLight ? 'divide-slate-200 bg-white text-slate-800' : 'divide-gray-800/60 bg-[#161b22] text-slate-200'
                    }`}>
                      {customerTransactions.map((tx, txIdx) => (
                        <tr key={`cust-tx-${tx.transaction_id}-${txIdx}`} className={`border-b border-slate-200 dark:border-slate-800 ${
                          isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5'
                        }`}>
                          <td className="px-3 py-2 font-mono font-bold text-sky-700 dark:text-cyan-400 whitespace-nowrap">
                            {tx.receipt_number || tx.transaction_id}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-gray-300 whitespace-nowrap">
                            {tx.date || tx.created_at || '-'}
                          </td>
                          <td className="px-3 py-2 text-slate-900 dark:text-gray-200 max-w-[200px] truncate" title={tx.items_summary}>
                            {tx.items_summary || (tx.items ? `${tx.items.length} ${isEn ? 'items' : 'macam produk'}` : '-')}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                              isLight ? 'bg-slate-100 text-slate-800 border border-slate-300' : 'bg-slate-800 text-gray-300 border border-slate-700'
                            }`}>
                              {tx.payment_method}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                            Rp {(tx.total_amount || 0).toLocaleString('id-ID')}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                              {tx.status || 'PAID'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`p-6 text-center rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950/40 border-slate-800/60 text-gray-400'
                }`}>
                  <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
                  <p className={`font-semibold text-xs ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>{isEn ? 'No Transaction History Yet' : 'Belum Ada Riwayat Transaksi'}</p>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
                    {isEn
                      ? 'This customer has not completed any checkout transactions at the POS register yet. Price tiers and reward points are active and ready.'
                      : 'Pelanggan ini belum melakukan transaksi checkout di register POS. Tier harga dan poin loyalitas telah aktif siap digunakan saat kasir memilih member ini.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/40">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetCustomer = selectedDetailCustomer;
                  setIsCustomerDetailOpen(false);
                  setCurrentTab('customer');
                  setRetailSubTab('customer');
                  handleOpenEdit(targetCustomer);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEn ? 'Edit Customer Profile' : 'Edit Profil Pelanggan'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleToggleCustomerStatus(c);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                  isActive
                    ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isActive ? (isEn ? 'Deactivate Customer' : 'Nonaktifkan Pelanggan') : (isEn ? 'Activate Customer' : 'Aktifkan Pelanggan')}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCustomerDetailOpen(false);
                setSelectedDetailCustomer(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 cursor-pointer transition"
            >
              {isEn ? 'Close' : 'Tutup'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  const renderBulkPriceModal = () => {
    if (!isBulkPriceModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-lg bg-[#12161f] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-[#161b22]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {isEn ? 'Bulk Price Auto-Calculation (% from HPP)' : '⚡ Set Harga Massal Berbasis % dari HPP'}
                </h3>
                <p className="text-xs text-gray-400">
                  {isEn
                    ? 'Calculate all selling prices automatically: Price = HPP + (HPP * % / 100)'
                    : 'Hitung otomatis seluruh harga produk: Harga = HPP + (HPP × % / 100)'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsBulkPriceModalOpen(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Form */}
          <div className="p-5 space-y-4">
            {/* Info card */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{isEn ? 'Automatic Calculation Formula:' : 'Rumus Perhitungan Otomatis:'}</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                {isEn ? 'New selling prices will be calculated based on each product\'s Cost Price (HPP):' : 'Harga jual baru akan dihitung berdasarkan Harga Pokok Pembelian (HPP / Cost Price) masing-masing produk:'}
                <br />
                <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">Price = Cost + (Cost × Margin % / 100)</code>
              </p>
            </div>

            {/* 3 Input Margin % */}
            <div className="space-y-3">
              {/* 1. Ecer / Retail */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Retail Price Margin (%):' : 'Margin Harga Ecer / Retail (%):'}</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">Default: 20%</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={500}
                    step={1}
                    value={bulkMarginPercent.retail}
                    onChange={(e) =>
                      setBulkMarginPercent({
                        ...bulkMarginPercent,
                        retail: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border bg-black/40 border-emerald-500/50 text-emerald-300 font-mono font-bold text-sm focus:outline-none focus:border-emerald-400 pr-10"
                  />
                  <span className="absolute right-3 top-2.5 font-bold font-mono text-emerald-400">%</span>
                </div>
              </div>

              {/* 2. Member */}
              <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-950/15 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Member Price Margin (%):' : 'Margin Harga Khusus Member (%):'}</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">Default: 15%</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={500}
                    step={1}
                    value={bulkMarginPercent.member}
                    onChange={(e) =>
                      setBulkMarginPercent({
                        ...bulkMarginPercent,
                        member: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border bg-black/40 border-blue-500/50 text-blue-300 font-mono font-bold text-sm focus:outline-none focus:border-blue-400 pr-10"
                  />
                  <span className="absolute right-3 top-2.5 font-bold font-mono text-blue-400">%</span>
                </div>
              </div>

              {/* 3. Grosir / Wholesale */}
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/15 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Wholesale Price Margin (%):' : 'Margin Harga Grosir / Wholesale (%):'}</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">Default: 10%</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={500}
                    step={1}
                    value={bulkMarginPercent.wholesale}
                    onChange={(e) =>
                      setBulkMarginPercent({
                        ...bulkMarginPercent,
                        wholesale: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border bg-black/40 border-amber-500/50 text-amber-300 font-mono font-bold text-sm focus:outline-none focus:border-amber-400 pr-10"
                  />
                  <span className="absolute right-3 top-2.5 font-bold font-mono text-amber-400">%</span>
                </div>
              </div>
            </div>

            {/* Live Simulation Preview */}
            <div className="p-3 rounded-xl bg-black/40 border border-gray-800 space-y-1.5 text-xs">
              <div className="text-gray-400 font-semibold flex items-center justify-between text-[11px]">
                <span>{isEn ? 'Example Simulation (Base Cost = Rp 10,000):' : 'Simulasi Contoh (Jika HPP = Rp 10.000):'}</span>
                <span className="text-cyan-400 font-mono">{isEn ? 'Base Cost: Rp 10,000' : 'Base HPP: Rp 10.000'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <div className="text-[10px] text-gray-400">{isEn ? 'Retail' : 'Ecer'} (+{bulkMarginPercent.retail}%)</div>
                  <div className="font-mono font-bold text-emerald-400 text-xs">
                    Rp {(10000 + Math.round(10000 * (bulkMarginPercent.retail / 100))).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-950/30 border border-blue-500/30">
                  <div className="text-[10px] text-gray-400">{isEn ? 'Member' : 'Member'} (+{bulkMarginPercent.member}%)</div>
                  <div className="font-mono font-bold text-blue-400 text-xs">
                    Rp {(10000 + Math.round(10000 * (bulkMarginPercent.member / 100))).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/30">
                  <div className="text-[10px] text-gray-400">{isEn ? 'Wholesale' : 'Grosir'} (+{bulkMarginPercent.wholesale}%)</div>
                  <div className="font-mono font-bold text-amber-400 text-xs">
                    Rp {(10000 + Math.round(10000 * (bulkMarginPercent.wholesale / 100))).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-between bg-[#161b22]">
            <button
              type="button"
              onClick={() => {
                setBulkMarginPercent({ retail: 20, member: 15, wholesale: 10 });
              }}
              className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
            >
              {isEn ? 'Reset Default (20%, 15%, 10%)' : 'Reset Baku (20%, 15%, 10%)'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkPriceModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold cursor-pointer transition"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={handleApplyBulkPrice}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer transition"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>
                  {isEn
                    ? `Apply to All (${products.length} Products)`
                    : `Terapkan ke Semua (${products.length} Produk)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 1. Halaman Utama: 8 Balok Besar Neon Solid Mandiri (Zero-Scroll Viewport, Compact & Interactive)
  const renderPortalGrid = () => {
    return (
      <div className="h-[calc(100vh-4.5rem)] flex flex-col justify-between overflow-hidden p-4 max-w-7xl mx-auto w-full animate-in fade-in duration-200">
        {/* Header Section Ringkas (Tanpa Sub-Judul Pengantar) */}
        <div className="flex items-center justify-between gap-3 shrink-0 pb-1.5">
          <div className="flex items-center gap-3">
            <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Master Data Management
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>8 MODUL INDUSTRI SOLID</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDataMigrationOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition active:scale-95 ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-slate-200 shadow-sm'
                  : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              }`}
              title="Data Migration Wizard & Smart Column Mapping (APS POS 1)"
            >
              <Zap className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <span>{isEn ? '⚡ Legacy Data Migration' : '⚡ Migrasi Data Lama'}</span>
            </button>
            <button
              onClick={handleSaveChanges}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition active:scale-95 ${
                isLight
                  ? 'bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-sm'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-xs'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEn ? 'Save Master' : 'Simpan Master'}</span>
            </button>
          </div>
        </div>

        {/* Grid 8 Kartu Kompak (4 Kolom x 2 Baris, Gap 3.5, Zero-Scroll Viewport 3D Neon Glass) */}
        <div className="grid grid-cols-4 grid-rows-2 gap-3.5 flex-1 items-stretch py-1">
          {EIGHT_INDUSTRY_BLOCKS.map((block, bIdx) => {
            const IconComp = block.icon;
            return (
              <div
                key={`portal-block-${block.id}-${bIdx}`}
                onClick={() => {
                  setSelectedIndustry(block.id);
                  setCurrentTab(block.id);
                }}
                className={`group rounded-2xl relative overflow-hidden p-3.5 transition-all duration-200 hover:-translate-y-1 active:scale-95 cursor-pointer select-none flex flex-col justify-between items-center text-center h-[185px] max-h-[195px] min-h-[180px] ${
                  isLight
                    ? 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                    : `border-2 before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent ${block.borderClass} ${block.glowShadow} ${block.hoverBorder} ${block.hoverGlow} ${block.activeRing} bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.5)]`
                }`}
              >
                {/* Bagian Atas: Wadah Ikon 3D Berbingkai Bercahaya (Eye-Catching Icon Badge) */}
                <div className="pt-0.5">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent border border-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.5)] mb-1 transition-transform duration-300 ease-out group-hover:scale-110">
                    <div className="relative flex items-center justify-center">
                      <IconComp className={`w-6 h-6 sm:w-7 sm:h-7 ${block.iconColor} filter drop-shadow-[0_0_8px_currentColor]`} />
                      <span className="absolute -bottom-1 -right-2 text-xs filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] select-none">
                        {block.emoji}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bagian Tengah: Judul Utama & Sub-fitur ringkas */}
                <div className="my-auto py-0.5 px-1 w-full">
                  <h3 className={`text-xs font-bold leading-tight text-center px-1 ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    {block.name}
                  </h3>
                  <p className={`text-[10px] sm:text-[11px] mt-0.5 font-medium leading-tight truncate px-1 text-center ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`} title={block.subFeature}>
                    {block.subFeature}
                  </p>
                </div>

                {/* Bagian Bawah: Tombol 3D Aksi Ramping */}
                <div className="w-full pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndustry(block.id);
                      setCurrentTab(block.id);
                    }}
                    className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer group-hover:brightness-110 ${block.buttonColor}`}
                  >
                    <span>{isEn ? 'Open Module' : 'Buka Modul'}</span>
                    <span className="group-hover:translate-x-1 transition-transform text-xs">→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={selectedIndustry ? "space-y-6 pb-12" : "h-[calc(100vh-4.5rem)] overflow-hidden"}>
      {selectedIndustry ? renderWorkspace() : renderPortalGrid()}

      {/* Global Modals */}
      {renderImportModal()}
      {renderPrintModal()}
      {renderAddModal()}
      {renderEditModal()}
      {renderDetailModal()}
      {renderCustomerDetailModal()}
      {renderBulkPriceModal()}

      {/* Barcode & Label Studio Modal (Code 128 / Thermal 40x30 / A4) */}
      <BarcodeLabelStudioModal
        isOpen={isBarcodeStudioOpen}
        onClose={() => {
          setIsBarcodeStudioOpen(false);
          setSelectedBarcodeProduct(null);
        }}
        product={selectedBarcodeProduct || filteredProducts[0] || products[0] || null}
        allProducts={products}
        onSelectProduct={(p) => setSelectedBarcodeProduct(p)}
        language={String(language).toUpperCase() === 'EN' ? 'EN' : 'ID'}
        isLight={isLight}
      />

      {/* BOM Recipe & HPP Modal (F&B Bill of Materials) */}
      <BomRecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setSelectedRecipeProduct(null);
        }}
        product={selectedRecipeProduct}
      />

      {/* Quick Barcode Scanner Onboarding Modal */}
      <QuickBarcodeModal
        isOpen={isQuickBarcodeOpen}
        onClose={() => setIsQuickBarcodeOpen(false)}
        categoriesMaster={categoriesMaster}
        brands={brands}
        onSave={handleSaveQuickBarcode}
        isLight={isLight}
        isEn={isEn}
      />

      {/* AI Smart Mapper Modal for External POS/ERP formats */}
      <AiSmartMapperModal
        isOpen={isAiSmartMapOpen}
        onClose={() => setIsAiSmartMapOpen(false)}
        onImportProducts={handleAiSmartMapImport}
        isLight={isLight}
        isEn={isEn}
      />

      {/* Data Migration Wizard & Smart Column Mapping Modal (APS POS 1) */}
      <DataMigrationModal
        isOpen={isDataMigrationOpen}
        onClose={() => setIsDataMigrationOpen(false)}
      />
    </div>
  );
};

export default MasterDataModule;
