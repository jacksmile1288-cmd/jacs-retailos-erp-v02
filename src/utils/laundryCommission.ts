import {
  Employee,
  LaundryOrderRecord,
  LaundryStaffCommissionSummary,
} from '../types';

export interface LaundryOrderVolumeMetrics {
  kiloanKg: number;
  satuanPcs: number;
  pasangCount: number;
  areaM2: number;
  totalPhysicalPcs: number;
  hasSpecialistItems: boolean;
}

export const extractLaundryOrderMetrics = (
  order: LaundryOrderRecord
): LaundryOrderVolumeMetrics => {
  let kiloanKg = 0;
  let satuanPcs = 0;
  let pasangCount = 0;
  let areaM2 = 0;

  for (const item of order.items || []) {
    const anyItem = item as any;
    const prod = item.product as any;
    const unitType = String(prod?.laundryUnitType || '').toUpperCase();
    const unitLabel = String(item.selectedUnit || prod?.unit || '').toLowerCase();
    const qty = Number(anyItem.actualNetWeightKg ?? item.quantity ?? anyItem.qty) || 0;

    if (unitType === 'KILOAN' || unitLabel === 'kg') {
      kiloanKg += qty;
    } else if (unitType === 'PASANG' || unitLabel.includes('pasang')) {
      pasangCount += qty;
    } else if (
      unitType === 'LUAS' ||
      unitLabel.includes('m2') ||
      unitLabel.includes('m²')
    ) {
      areaM2 += qty;
    } else {
      satuanPcs += qty;
    }
  }

  return {
    kiloanKg: Number(kiloanKg.toFixed(2)),
    satuanPcs: Number(satuanPcs.toFixed(1)),
    pasangCount: Number(pasangCount.toFixed(1)),
    areaM2: Number(areaM2.toFixed(2)),
    totalPhysicalPcs: Math.max(1, Number(order.totalPieces) || 1),
    hasSpecialistItems: pasangCount > 0 || areaM2 > 0,
  };
};

export const isLaundryProductionEmployee = (
  emp?: Partial<Employee> | null
): boolean => {
  if (!emp) return false;
  const dept = String(emp.department || emp.division || '').toLowerCase();
  const role = String(emp.role || '').toLowerCase();
  return (
    dept.includes('laundry') ||
    dept.includes('produksi') ||
    role.includes('cuci') ||
    role.includes('setrika') ||
    role.includes('teknisi') ||
    role.includes('laundry')
  );
};

const matchesPeriodFilter = (isoDate: string, period?: string): boolean => {
  if (!period || period === 'ALL') return true;
  try {
    const parts = period.split('-');
    const targetYear = Number(parts[0]);
    const targetMonth = Number(parts[1]);
    if (!targetYear || !targetMonth) return true;
    const d = new Date(isoDate || Date.now());
    return d.getFullYear() === targetYear && d.getMonth() + 1 === targetMonth;
  } catch {
    return true;
  }
};

export const calculateLaundryStaffIncentives = (
  employees: Employee[],
  laundryOrders: LaundryOrderRecord[],
  period?: string
): {
  byEmployeeId: Record<string, LaundryStaffCommissionSummary>;
  list: LaundryStaffCommissionSummary[];
  totalIncentive: number;
  totalKgProcessed: number;
  totalItemsProcessed: number;
} => {
  const byEmployeeId: Record<string, LaundryStaffCommissionSummary> = {};

  for (const emp of employees) {
    byEmployeeId[emp.id] = {
      employeeId: emp.id,
      employeeName: emp.name,
      nip: emp.nip,
      role: emp.role,
      department: emp.department,
      ordersHandledCount: 0,
      washCount: 0,
      ironCount: 0,
      specialistCount: 0,
      kiloanKgProcessed: 0,
      satuanPcsProcessed: 0,
      pasangProcessed: 0,
      areaM2Processed: 0,
      ratePerKg: typeof emp.laundryRatePerKg === 'number' ? emp.laundryRatePerKg : 1000,
      ratePerItem: typeof emp.laundryRatePerItem === 'number' ? emp.laundryRatePerItem : 1500,
      rateSpecialist:
        typeof emp.laundryRateSpecialist === 'number' ? emp.laundryRateSpecialist : 4500,
      totalIncentive: 0,
    };
  }

  const resolveSummary = (id?: string, name?: string): LaundryStaffCommissionSummary | null => {
    if (id && byEmployeeId[id]) return byEmployeeId[id];
    if (name) {
      const lower = name.trim().toLowerCase();
      const found = Object.values(byEmployeeId).find(
        (s) => s.employeeName.trim().toLowerCase() === lower
      );
      if (found) return found;
    }
    return null;
  };

  let totalKgProcessed = 0;
  let totalItemsProcessed = 0;

  for (const order of laundryOrders || []) {
    if (!matchesPeriodFilter(order.createdAt, period)) continue;
    const m = extractLaundryOrderMetrics(order);
    totalKgProcessed += m.kiloanKg;
    totalItemsProcessed += m.satuanPcs + m.pasangCount + (m.areaM2 > 0 ? 1 : 0);

    const touchedEmpIds = new Set<string>();

    // 1. Operator Cuci
    const washer = resolveSummary(order.washerEmployeeId, order.washerEmployeeName);
    if (washer) {
      washer.washCount += 1;
      washer.kiloanKgProcessed = Number((washer.kiloanKgProcessed + m.kiloanKg).toFixed(2));
      washer.satuanPcsProcessed = Number((washer.satuanPcsProcessed + m.satuanPcs).toFixed(1));
      const washIncentive = Math.round(
        m.kiloanKg * washer.ratePerKg + m.satuanPcs * washer.ratePerItem
      );
      washer.totalIncentive += washIncentive;
      touchedEmpIds.add(washer.employeeId);
    }

    // 2. Operator Setrika
    const ironer = resolveSummary(order.ironerEmployeeId, order.ironerEmployeeName);
    if (ironer) {
      ironer.ironCount += 1;
      // Avoid double-adding kg stats if same person did both wash & iron, or track combined work:
      if (!touchedEmpIds.has(ironer.employeeId)) {
        ironer.kiloanKgProcessed = Number((ironer.kiloanKgProcessed + m.kiloanKg).toFixed(2));
        ironer.satuanPcsProcessed = Number((ironer.satuanPcsProcessed + m.satuanPcs).toFixed(1));
      }
      const ironIncentive = Math.round(
        m.kiloanKg * ironer.ratePerKg + m.satuanPcs * ironer.ratePerItem
      );
      ironer.totalIncentive += ironIncentive;
      touchedEmpIds.add(ironer.employeeId);
    }

    // 3. Teknisi Sepatu & Karpet
    const specialist = resolveSummary(
      order.specialistEmployeeId,
      order.specialistEmployeeName
    );
    if (specialist) {
      specialist.specialistCount += 1;
      specialist.pasangProcessed = Number((specialist.pasangProcessed + m.pasangCount).toFixed(1));
      specialist.areaM2Processed = Number((specialist.areaM2Processed + m.areaM2).toFixed(2));
      const specUnits = m.pasangCount + m.areaM2;
      const fallbackUnits = specUnits > 0 ? specUnits : Math.max(1, m.satuanPcs);
      const specIncentive = Math.round(fallbackUnits * specialist.rateSpecialist);
      specialist.totalIncentive += specIncentive;
      touchedEmpIds.add(specialist.employeeId);
    }

    touchedEmpIds.forEach((eid) => {
      if (byEmployeeId[eid]) byEmployeeId[eid].ordersHandledCount += 1;
    });
  }

  const list = Object.values(byEmployeeId).filter(
    (s) =>
      s.ordersHandledCount > 0 ||
      isLaundryProductionEmployee(employees.find((e) => e.id === s.employeeId))
  );

  const totalIncentive = Object.values(byEmployeeId).reduce(
    (acc, s) => acc + s.totalIncentive,
    0
  );

  return {
    byEmployeeId,
    list,
    totalIncentive,
    totalKgProcessed: Number(totalKgProcessed.toFixed(2)),
    totalItemsProcessed: Number(totalItemsProcessed.toFixed(1)),
  };
};
