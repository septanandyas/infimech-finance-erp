export function cn(...classes) {
    return classes.filter(Boolean).join(' ')
}

export function formatRupiah(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value)) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value)
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    })
}