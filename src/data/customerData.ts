import { CustomerMaster } from '../types';

export const DUMMY_STORE_CUSTOMERS: CustomerMaster[] = [
  {
    id: "CUST-STR-001",
    customer_code: "STR-001",
    name: "H. Ridwan Effendi",
    phone: "081234567890",
    has_store: true,
    store_name: "Toko Sembako Berkah Jaya",
    store_address: "Jl. Pasar Lama No. 14, Blok B, Jakarta Timur",
    tier_level: "Platinum",
    allowed_tiers: ["retail", "member", "wholesale"],
    total_spending_current_period: 28500000,
    credit_limit: 15000000,
    outstanding_balance: 0,
    is_active: true,
    notes: "Mitra grosir utama sembako dan minuman galon"
  },
  {
    id: "CUST-STR-002",
    customer_code: "STR-002",
    name: "Ibu Suryati",
    phone: "081987654321",
    has_store: true,
    store_name: "Warung Suryati Kelontong",
    store_address: "Jl. Melati Raya No. 45, RT 02/05, Bekasi",
    tier_level: "Gold",
    allowed_tiers: ["retail", "member", "wholesale"],
    total_spending_current_period: 14200000,
    credit_limit: 5000000,
    outstanding_balance: 1200000,
    is_active: true,
    notes: "Reseller mie instan dan air mineral"
  },
  {
    id: "CUST-STR-003",
    customer_code: "STR-003",
    name: "Ko Kevin Hendrawan",
    phone: "085211223344",
    has_store: true,
    store_name: "Minimarket Kevin Mart",
    store_address: "Ruko Sentra Niaga Blok C-8, Cibubur",
    tier_level: "Platinum",
    allowed_tiers: ["retail", "member", "wholesale"],
    total_spending_current_period: 45000000,
    credit_limit: 25000000,
    outstanding_balance: 0,
    is_active: true,
    notes: "Pengambilan rutin mingguan partai besar"
  },
  {
    id: "CUST-STR-004",
    customer_code: "STR-004",
    name: "Pak Darsono",
    phone: "087799887766",
    has_store: true,
    store_name: "Kios Darsono Podomoro",
    store_address: "Kios Pasar Inpres No. 12, Depok",
    tier_level: "Silver",
    allowed_tiers: ["retail", "member", "wholesale"],
    total_spending_current_period: 4800000,
    credit_limit: 3000000,
    outstanding_balance: 0,
    is_active: true,
    notes: "Mitra toko baru terverifikasi"
  }
];
