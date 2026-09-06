// Template default untuk email notifikasi status kandidat. Dipakai sebagai
// fallback kalau tim HC belum pernah menyimpan template kustom lewat Panel
// Admin > Template Email.
const DEFAULT_TEMPLATES = {
  diproses: {
    badgeLabel: "Diproses",
    subject: "Update Lamaran Anda \u2014 {{nama}}",
    body:
      "Halo {{nama}},\n\n" +
      "Terima kasih telah melamar posisi {{posisi}} di Perusahaan Demo. Kami ingin menginformasikan bahwa lamaran Anda saat ini sedang dalam proses review oleh tim kami.\n\n" +
      "Mohon ditunggu, kami akan menghubungi Anda kembali begitu ada perkembangan lebih lanjut.\n\n" +
      "Terima kasih,\nTim Human Capital\nPerusahaan Demo",
  },
  diterima: {
    badgeLabel: "Diterima",
    subject: "Kabar Baik dari Perusahaan Demo \u2014 {{nama}}",
    body:
      "Halo {{nama}},\n\n" +
      "Selamat! Setelah melalui proses seleksi, kami dengan senang hati menginformasikan bahwa Anda dinyatakan LOLOS untuk posisi {{posisi}} di Perusahaan Demo.\n\n" +
      "Tim Human Capital kami akan segera menghubungi Anda untuk informasi tahap selanjutnya.\n\n" +
      "Terima kasih,\nTim Human Capital\nPerusahaan Demo",
  },
  ditolak: {
    badgeLabel: "Tidak Lolos",
    subject: "Update Lamaran Anda \u2014 {{nama}}",
    body:
      "Halo {{nama}},\n\n" +
      "Terima kasih telah melamar posisi {{posisi}} di Perusahaan Demo dan telah meluangkan waktu mengikuti proses seleksi kami.\n\n" +
      "Setelah melalui pertimbangan, saat ini kami belum dapat melanjutkan proses lamaran Anda. Data Anda akan kami simpan untuk kesempatan yang sesuai di masa mendatang.\n\n" +
      "Terima kasih,\nTim Human Capital\nPerusahaan Demo",
  },
};

// Ganti placeholder {{nama}}, {{posisi}}, dst. Placeholder yang tidak
// dikenali dibiarkan apa adanya (tidak dihapus), supaya typo pada template
// gampang ketahuan alih-alih menghilang diam-diam.
function renderTemplate(str, vars) {
  return String(str || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match;
  });
}

module.exports = { DEFAULT_TEMPLATES, renderTemplate };
