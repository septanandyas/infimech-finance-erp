import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1e293b' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
    logo: { height: 45 },
    companyInfo: { textAlign: 'right' },
    companyName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0ea5e9', marginBottom: 3 },
    companyDetail: { fontSize: 8, color: '#64748b', marginBottom: 2 },
    divider: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 20 },
    invoiceTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0ea5e9', marginBottom: 4 },
    invoiceNumber: { fontSize: 10, color: '#64748b' },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    metaBox: { flex: 1 },
    metaLabel: { fontSize: 8, color: '#94a3b8', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 3 },
    metaValue: { fontSize: 10, color: '#1e293b' },
    table: { marginBottom: 20 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: '6 8', borderRadius: 4, marginBottom: 4 },
    tableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#64748b', textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', padding: '5 8', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    tableCell: { fontSize: 9, color: '#334155' },
    colDesc: { flex: 4 },
    colQty: { flex: 1, textAlign: 'center' },
    colPrice: { flex: 2, textAlign: 'right' },
    colTotal: { flex: 2, textAlign: 'right' },
    totalsBox: { alignItems: 'flex-end', marginBottom: 20 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, marginBottom: 4 },
    totalLabel: { fontSize: 9, color: '#64748b' },
    totalValue: { fontSize: 9, color: '#334155' },
    totalDivider: { borderBottomWidth: 1, borderBottomColor: '#cbd5e1', width: 200, marginVertical: 4 },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200 },
    grandTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0ea5e9' },
    grandTotalValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0ea5e9' },
    notesBox: { backgroundColor: '#f8fafc', borderRadius: 4, padding: 10, marginBottom: 20 },
    notesLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
    notesText: { fontSize: 9, color: '#475569' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, textAlign: 'center' },
    footerText: { fontSize: 8, color: '#94a3b8' },
});

const formatRp = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
};

const formatTgl = (val) => {
    if (!val) return '-';
    return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function InvoicePDF({ invoice }) {
    const subtotal = Number(invoice.amount) || 0;
    const tax = Number(invoice.tax) || 0;
    // Total = Subtotal + Pajak (harga final yang harus dibayar client)
    const total = subtotal + tax;
    const hasTax = invoice.tax_rate > 0 && invoice.tax_label;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Image style={styles.logo} src="/logo-infimech.png" />
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>PT Infimech Harmoni Teknologi</Text>
                        <Text style={styles.companyDetail}>Sovereign Plaza, Jl. TB Simatupang No.36 12th Floor</Text>
                        <Text style={styles.companyDetail}>West Cilandak, Cilandak, South Jakarta City, Jakarta 12430</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Invoice Title & Number */}
                <View style={{ marginBottom: 16 }}>
                    <Text style={styles.invoiceTitle}>INVOICE</Text>
                    <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                </View>

                {/* Meta Info */}
                <View style={styles.metaRow}>
                    <View style={styles.metaBox}>
                        <Text style={styles.metaLabel}>Tagihan Kepada</Text>
                        <Text style={styles.metaValue}>{invoice.client_name}</Text>
                        {invoice.projectName && <Text style={{ fontSize: 9, color: '#64748b' }}>{invoice.projectName}</Text>}
                    </View>
                    <View style={[styles.metaBox, { alignItems: 'flex-end' }]}>
                        <Text style={styles.metaLabel}>Tanggal Invoice</Text>
                        <Text style={[styles.metaValue, { marginBottom: 8 }]}>{formatTgl(invoice.createdAt)}</Text>
                        <Text style={styles.metaLabel}>Jatuh Tempo</Text>
                        <Text style={styles.metaValue}>{formatTgl(invoice.due_date)}</Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, styles.colDesc]}>Deskripsi</Text>
                        <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
                        <Text style={[styles.tableHeaderText, styles.colPrice]}>Harga Satuan</Text>
                        <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
                    </View>
                    {(invoice.items || []).map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>{formatRp(item.unit_price)}</Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>{formatRp(item.total)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsBox}>
                    <View style={styles.totalDivider} />
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>TOTAL</Text>
                        <Text style={styles.grandTotalValue}>{formatRp(total)}</Text>
                    </View>
                    {hasTax && (
                        <Text style={{ fontSize: 8, color: '#94a3b8', marginTop: 5, fontStyle: 'italic' }}>
                            *Harga sudah termasuk {invoice.tax_label} {invoice.tax_rate}%
                        </Text>
                    )}
                </View>

                {/* Tanda Tangan */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 24 }}>
                    <View style={{ alignItems: 'center', width: 160 }}>
                        <Text style={{ fontSize: 8, color: '#64748b', marginBottom: 5 }}>Jakarta, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
                        <Image src="/ttd_pak_aji.png" style={{ width: 100, height: 50, marginBottom: 5 }} />
                        <View style={{ borderBottomWidth: 1, borderBottomColor: '#334155', width: 140, marginBottom: 4 }} />
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>AJI CANDRA LESTARI</Text>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>Direktur Utama</Text>
                        <Text style={{ fontSize: 8, color: '#64748b' }}>PT Infimech Harmoni Teknologi</Text>
                    </View>
                </View>

                {(invoice.notes || invoice.payment_terms) && (
                    <View style={styles.notesBox}>
                        {invoice.payment_terms && (
                            <>
                                <Text style={styles.notesLabel}>Keterangan Pembayaran</Text>
                                <Text style={[styles.notesText, { marginBottom: 6 }]}>{invoice.payment_terms}</Text>
                            </>
                        )}
                        {invoice.notes && (
                            <>
                                <Text style={styles.notesLabel}>Catatan</Text>
                                <Text style={styles.notesText}>{invoice.notes}</Text>
                            </>
                        )}
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>PT Infimech Harmoni Teknologi · Sovereign Plaza, Jl. TB Simatupang No.36, Jakarta · +6281333546332</Text>
                    <Text style={styles.footerText}>Dokumen ini dibuat secara otomatis oleh sistem Finance ERP Infimech</Text>
                </View>
            </Page>
        </Document>
    );
}