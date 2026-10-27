import React from 'react';
import { PurchaseOrder, SupplierMaster } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X, Building2, FileCheck2, ShieldCheck } from 'lucide-react';
import { hasValidProfileValue } from '../../utils/businessProfileUtils';

interface OfficialPoPrintModalProps {
  po: PurchaseOrder;
  supplier?: SupplierMaster;
  onClose: () => void;
  isLight?: boolean;
}

export const OfficialPoPrintModal: React.FC<OfficialPoPrintModalProps> = ({
  po,
  supplier,
  onClose,
  isLight = false,
}) => {
  const { businessProfile } = useApp();
  const handlePrint = () => {
    window.print();
  };

  const subtotal =
    po.subtotal ??
    (po.item_details && po.item_details.length > 0
      ? po.item_details.reduce((acc, it) => acc + it.subtotal, 0)
      : po.include_ppn !== false
      ? Math.round(po.total_amount / 1.11)
      : po.total_amount);

  const ppnRate = po.ppn_rate ?? 11;
  const ppnAmount =
    po.ppn_amount ??
    (po.include_ppn !== false ? Math.round(subtotal * (ppnRate / 100)) : 0);

  const grandTotal = po.total_amount || subtotal + ppnAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={`w-full max-w-4xl rounded-2xl shadow-2xl relative border my-8 flex flex-col max-h-[92vh] ${
          isLight
            ? 'bg-slate-100 border-slate-300 text-slate-800'
            : 'bg-[#0f141c] border-[#30363d] text-gray-200'
        }`}
      >
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div
          className={`flex items-center justify-between p-4 border-b shrink-0 print:hidden ${
            isLight
              ? 'bg-white border-slate-200'
              : 'bg-[#161b22] border-[#30363d]'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0052FF]/20 text-[#0052FF] flex items-center justify-center font-bold">
              PO
            </div>
            <div>
              <h3 className="font-bold text-sm">
                Pratinjau Dokumen Purchase Order Resmi
              </h3>
              <p className="text-[11px] text-gray-400">
                Dokumen pengadaan barang resmi terintegrasi ERP & format cetak A4.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-[#0043d1] text-white font-bold text-xs shadow-[0_0_15px_rgba(0,82,255,0.4)] transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable PO Sheet Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div
            id="printable-po-document"
            className="bg-white text-slate-900 rounded-xl shadow-xl p-8 max-w-3xl mx-auto border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none text-xs leading-relaxed"
          >
            {/* Header Kop Surat Perusahaan */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {businessProfile?.logoUrl ? (
                    <img
                      src={businessProfile.logoUrl}
                      alt="Logo"
                      className="w-14 h-14 object-contain rounded-xl p-1 border border-slate-300 shadow-sm"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-950 text-white font-black flex items-center justify-center text-xl tracking-tighter shadow-md">
                      {businessProfile?.name?.charAt(0) || 'J'}
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                      {businessProfile?.name || 'PT JacS RetailOS Indonesia Tbk'}
                    </h1>
                    {hasValidProfileValue(businessProfile?.headerNote) && (
                      <p className="text-[11px] text-slate-600 font-medium">
                        {businessProfile!.headerNote}
                      </p>
                    )}
                    {hasValidProfileValue(businessProfile?.address) && (
                      <p className="text-[10px] text-slate-500">
                        {businessProfile!.address}
                      </p>
                    )}
                    {(hasValidProfileValue(businessProfile?.phone) || hasValidProfileValue(businessProfile?.email) || hasValidProfileValue(businessProfile?.licenseNumber)) && (
                      <p className="text-[10px] text-slate-500">
                        {[
                          hasValidProfileValue(businessProfile?.phone) ? `Telepon: ${businessProfile!.phone}` : null,
                          hasValidProfileValue(businessProfile?.email) ? `Email: ${businessProfile!.email}` : null,
                          hasValidProfileValue(businessProfile?.licenseNumber) ? businessProfile!.licenseNumber : null,
                        ].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-black text-xs uppercase tracking-wider mb-1">
                    PURCHASE ORDER
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-900">
                    {po.po_number}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Tanggal: {po.date}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Status: <span className="font-bold uppercase">{po.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vendor & Shipping Address Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              {/* Vendor Info */}
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#0052FF]" />
                  <span>DITUJUKAN KEPADA (VENDOR / SUPPLIER):</span>
                </div>
                <div className="font-black text-sm text-slate-900">
                  {po.supplier_name}
                </div>
                {supplier && (
                  <div className="text-[10px] text-slate-600 mt-0.5 space-y-0.5">
                    <div>Kode Vendor: <span className="font-mono font-bold text-slate-800">{supplier.code || 'SUPP-OFFICIAL'}</span></div>
                    <div>Up / Kontak: {supplier.contactPerson || '-'}</div>
                    <div>Telepon: {supplier.phone || '-'}</div>
                    <div>Email: {supplier.email || '-'}</div>
                    <div className="text-slate-500">{supplier.address || '-'}</div>
                  </div>
                )}
                {!supplier && (
                  <div className="text-[10px] text-slate-500 mt-1">
                    Mitra Suplai Resmi Terdaftar di ERP JacS RetailOS.
                  </div>
                )}
              </div>

              {/* Delivery Destination & Payment Terms */}
              <div className="border-l border-slate-200 pl-4 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3 text-emerald-600" />
                  <span>ALAMAT PENGIRIMAN & TERMIN:</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800">Tujuan Gudang:</span>{' '}
                  <span className="text-slate-700">JacS Central Warehouse 01</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Jl. Pergudangan Modern Industri Blok B-8, Bekasi, Jawa Barat
                </div>
                <div className="pt-1 border-t border-slate-200 mt-1">
                  <span className="font-bold text-slate-800">Termin Pembayaran:</span>{' '}
                  <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    {po.payment_term || 'Tempo 30 Hari'}
                  </span>
                </div>
                {po.due_date && (
                  <div className="text-[10px]">
                    <span className="font-bold text-slate-700">Jatuh Tempo:</span>{' '}
                    <span className="font-mono text-slate-800">{po.due_date}</span>
                  </div>
                )}
                <div>
                  <span className="font-bold text-slate-700">Status Tagihan:</span>{' '}
                  <span className={`font-bold ${po.payment_status === 'Lunas' || po.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {po.payment_status === 'Lunas' || po.payment_status === 'PAID' ? 'PAID / Lunas' : (po.payment_status || 'Belum Bayar')}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6 overflow-hidden rounded-xl border border-slate-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Kode SKU / Deskripsi Produk</th>
                    <th className="py-2.5 px-3 text-center w-20">Kuantitas</th>
                    <th className="py-2.5 px-3 text-center w-16">Satuan</th>
                    <th className="py-2.5 px-3 text-right w-28">Harga Satuan (Rp)</th>
                    <th className="py-2.5 px-3 text-right w-32">Total Harga (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {po.item_details && po.item_details.length > 0 ? (
                    po.item_details.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">
                            {item.product_name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            SKU: {item.product_id}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          {item.unit || 'Unit'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {item.unit_cost.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {item.subtotal.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                        1
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{po.items}</div>
                        <div className="text-[10px] text-slate-500">
                          Paket pengadaan produk resmi
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                        1
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">Paket</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {subtotal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {subtotal.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations & Summary */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Syarat & Ketentuan Pembelian */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 uppercase tracking-wide">
                  Syarat & Ketentuan Pengadaan:
                </div>
                <ol className="list-decimal pl-3 space-y-0.5">
                  <li>Surat Jalan (DO) vendor wajib mencantumkan nomor PO: <strong>{po.po_number}</strong>.</li>
                  <li>Barang wajib dalam kondisi baru, tersegel, dan lolos uji Quality Control gudang penerima.</li>
                  <li>Kuantitas yang diterima dan ditagihkan mengacu pada Berita Acara Goods Receipt (GR).</li>
                  <li>Faktur Pajak & Invoice asli dikirimkan ke Departemen Finance JacS RetailOS.</li>
                </ol>
              </div>

              {/* Subtotal, PPN, Grand Total */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Subtotal Barang:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    Rp {subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">
                    PPN {ppnRate}% {po.include_ppn === false ? '(Non-PPN)' : ''}:
                  </span>
                  <span className="font-mono font-semibold text-slate-900">
                    Rp {ppnAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm font-black">
                  <span className="text-slate-900">TOTAL NILAI PO:</span>
                  <span className="font-mono text-[#0052FF]">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Signature Blocks */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-300 text-center text-[10px]">
              {/* Dibuat Oleh */}
              <div>
                <div className="text-slate-500 font-semibold mb-12">
                  Dibuat Oleh (Purchasing Staff):
                </div>
                <div className="font-bold text-slate-900 underline">
                  {po.received_by || 'Staff Pengadaan & Logistik'}
                </div>
                <div className="text-slate-500">JacS Purchasing Dept.</div>
              </div>

              {/* Disetujui Oleh */}
              <div>
                <div className="text-slate-500 font-semibold mb-12 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Disetujui (Pimpinan / Otoritas):</span>
                </div>
                <div className="font-bold text-slate-900 underline">
                  {po.approved_by || 'Budi Hartono, M.M.'}
                </div>
                <div className="text-slate-500">Kepala Divisi SCM & Logistik</div>
              </div>

              {/* Dikonfirmasi Vendor */}
              <div>
                <div className="text-slate-500 font-semibold mb-12">
                  Diterima & Disetujui (Vendor):
                </div>
                <div className="font-bold text-slate-900 underline">
                  {po.supplier_name}
                </div>
                <div className="text-slate-500">Tanda Tangan & Cap Vendor</div>
              </div>
            </div>

            {/* Footer Watermark */}
            <div className="text-center text-[9px] text-slate-400 mt-6 pt-2 border-t border-slate-100">
              Dokumen ini diterbitkan secara otomatis dan sah melalui Sistem Terintegrasi JacS RetailOS ERP Suite • Dicetak pada: {new Date().toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
