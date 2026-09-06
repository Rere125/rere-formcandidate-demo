// Konfigurasi default formulir: dipakai kalau admin belum pernah menyimpan
// perubahan lewat Panel Admin. Strukturnya sengaja meniru field-field yang
// ada di form Zoho lama supaya data yang dikumpulkan tetap sama lengkapnya.
//
// Tipe field yang didukung:
//   text, email, tel, number, date, month, textarea, select, radio,
//   checkbox, file, signature, repeater
// "repeater" punya `fields[]` sendiri (sub-field), dan kandidat bisa
// menambah/menghapus baris (mis. Riwayat Pekerjaan 1, 2, 3...).

const DEFAULT_SECTIONS = [
  { id: "pribadi", title: "Data Pribadi", description: "Identitas dasar dan informasi kontak." },
  { id: "keluarga", title: "Keluarga & Referensi", description: "Bisa tambah lebih dari satu referensi." },
  { id: "darurat", title: "Kontak Darurat", description: "Orang yang bisa dihubungi segera dalam keadaan darurat." },
  { id: "pendidikan", title: "Pendidikan", description: "Riwayat pendidikan formal dan dokumen pendukung." },
  { id: "pekerjaan", title: "Riwayat Pekerjaan", description: "Mulai dari pekerjaan terakhir." },
  { id: "tambahan", title: "Pertanyaan Tambahan", description: "Jawab dengan jujur." },
  { id: "penutup", title: "Harapan, Tes & Persetujuan", description: "Bagian terakhir sebelum kirim." },
];

const DEFAULT_QUESTIONS = [
  // ---------- Data Pribadi ----------
  { id: "nama", section: "pribadi", type: "text", label: "Nama Lengkap", required: true },
  { id: "posisi", section: "pribadi", type: "text", label: "Pekerjaan yang Dilamar", required: true },
  { id: "email", section: "pribadi", type: "email", label: "Alamat Email", required: true },
  { id: "hp", section: "pribadi", type: "tel", label: "Nomor Handphone", required: true },
  { id: "tempat_lahir", section: "pribadi", type: "text", label: "Tempat Lahir" },
  { id: "tanggal_lahir", section: "pribadi", type: "date", label: "Tanggal Lahir" },
  { id: "jenis_kelamin", section: "pribadi", type: "select", label: "Jenis Kelamin", options: ["Laki-laki", "Perempuan"] },
  { id: "tinggi_berat", section: "pribadi", type: "text", label: "Tinggi Badan & Berat Badan", description: "cth. 167 cm & 70 kg" },
  { id: "agama", section: "pribadi", type: "text", label: "Agama" },
  { id: "status_perkawinan", section: "pribadi", type: "select", label: "Status Perkawinan", options: ["Belum Kawin", "Kawin", "Cerai"] },
  { id: "no_ktp", section: "pribadi", type: "text", label: "Nomor KTP" },
  { id: "kepemilikan_rumah", section: "pribadi", type: "text", label: "Kepemilikan Rumah", description: "cth. Milik orangtua / Kontrak / Milik sendiri" },
  { id: "alamat_domisili", section: "pribadi", type: "textarea", label: "Alamat Domisili" },
  { id: "jumlah_tanggungan", section: "pribadi", type: "number", label: "Jumlah Tanggungan" },
  { id: "jumlah_orangtua", section: "pribadi", type: "number", label: "Jumlah Orangtua (masih hidup)" },

  // ---------- Keluarga & Referensi ----------
  {
    id: "referensi", section: "keluarga", type: "repeater", label: "Referensi",
    itemLabel: "Referensi", addLabel: "+ Tambah Referensi", minRows: 1,
    fields: [
      { id: "nama", label: "Nama", type: "text", required: true },
      { id: "hp", label: "Nomor Handphone", type: "tel", required: true },
      { id: "jabatan", label: "Jabatan", type: "text" },
      { id: "hubungan", label: "Hubungan", type: "text" },
    ],
  },

  // ---------- Kontak Darurat ----------
  {
    id: "kontak_darurat", section: "darurat", type: "repeater", label: "Orang yang Dapat Dihubungi Segera",
    itemLabel: "Kontak", addLabel: "+ Tambah Kontak Darurat", minRows: 1,
    fields: [
      { id: "nama", label: "Nama", type: "text", required: true },
      { id: "alamat", label: "Alamat", type: "text" },
      { id: "hp", label: "Nomor Handphone", type: "tel", required: true },
      { id: "hubungan", label: "Hubungan", type: "text" },
    ],
  },

  // ---------- Pendidikan ----------
  {
    id: "riwayat_pendidikan", section: "pendidikan", type: "repeater", label: "Riwayat Pendidikan Formal",
    itemLabel: "Pendidikan", addLabel: "+ Tambah Jenjang Pendidikan", minRows: 1,
    fields: [
      { id: "jenjang", label: "Jenjang", type: "select", options: ["SD", "SMP", "SMA / SMK", "D3", "S1", "S2"] },
      { id: "institusi", label: "Nama Institusi", type: "text" },
      { id: "kota", label: "Kota", type: "text" },
      { id: "jurusan", label: "Jurusan", type: "text" },
    ],
  },
  { id: "upload_ijazah", section: "pendidikan", type: "file", label: "Upload Ijazah Terakhir (PDF)" },
  { id: "upload_transkrip", section: "pendidikan", type: "file", label: "Upload Transkrip Nilai Terakhir (PDF)" },

  // ---------- Riwayat Pekerjaan ----------
  {
    id: "riwayat_kerja", section: "pekerjaan", type: "repeater", label: "Riwayat Pekerjaan (mulai dari yang terakhir)",
    itemLabel: "Pekerjaan", addLabel: "+ Tambah Riwayat Pekerjaan", minRows: 1,
    fields: [
      { id: "jabatan", label: "Jabatan Terakhir", type: "text" },
      { id: "perusahaan", label: "Nama Perusahaan", type: "text" },
      { id: "bulan_masuk", label: "Bulan & Tahun Masuk", type: "month" },
      { id: "bulan_keluar", label: "Bulan & Tahun Keluar", type: "month" },
      { id: "alamat_perusahaan", label: "Alamat & No. Telp Perusahaan", type: "text" },
      { id: "jenis_usaha", label: "Jenis Usaha", type: "text" },
      { id: "atasan", label: "Nama Atasan Langsung", type: "text" },
      { id: "gaji", label: "Gaji Terakhir", type: "number" },
      { id: "alasan_berhenti", label: "Alasan Berhenti", type: "text" },
      { id: "uraian_tugas", label: "Uraian Tugas & Tanggung Jawab", type: "textarea" },
      { id: "upload_slip_gaji", label: "Upload Slip Gaji Terakhir (PDF)", type: "file" },
      { id: "upload_referensi_kerja", label: "Upload Surat Referensi Kerja (PDF)", type: "file" },
      { id: "struktur_organisasi", label: "Upload Struktur Organisasi Terakhir (Posisi Anda) (PDF)", type: "file" },
    ],
  },

  // ---------- Pertanyaan Tambahan ----------
  { id: "melamar_lain", section: "tambahan", type: "radio", label: "Selain di sini, apakah Anda melamar pekerjaan di perusahaan lain? Dimana dan sebagai apa?", options: ["Ya", "Tidak"] },
  { id: "melamar_lain_penjelasan", section: "tambahan", type: "text", label: "Penjelasan" },
  { id: "kontrak_kerja", section: "tambahan", type: "radio", label: "Apakah Anda terikat kontrak kerja dengan perusahaan tempat kerja Anda saat ini?", options: ["Ya", "Tidak"] },
  { id: "kerja_sampingan", section: "tambahan", type: "radio", label: "Apakah Anda mempunyai pekerjaan sampingan/part time? Dimana dan sebagai apa?", options: ["Ya", "Tidak"] },
  { id: "kerja_sampingan_penjelasan", section: "tambahan", type: "text", label: "Penjelasan" },
  { id: "keberatan_referensi", section: "tambahan", type: "radio", label: "Apakah Anda berkeberatan bila kami minta referensi pada perusahaan tempat Anda pernah bekerja?", options: ["Ya", "Tidak"] },
  { id: "kenalan_internal", section: "tambahan", type: "radio", label: "Apakah Anda mempunyai teman/sanak saudara yang bekerja di grup/perusahaan ini? Jika ada, sebutkan.", options: ["Ya", "Tidak"] },
  { id: "kenalan_internal_penjelasan", section: "tambahan", type: "text", label: "Penjelasan" },
  { id: "riwayat_sakit", section: "tambahan", type: "radio", label: "Apakah Anda pernah menderita sakit keras/kronis/kecelakaan berat/operasi? Jika ada, jelaskan.", options: ["Ya", "Tidak"] },
  { id: "riwayat_sakit_penjelasan", section: "tambahan", type: "text", label: "Penjelasan" },
  { id: "merokok", section: "tambahan", type: "radio", label: "Apakah Anda merokok?", options: ["Ya", "Tidak"] },
  { id: "konsumsi_psikotropika", section: "tambahan", type: "radio", label: "Apakah Anda mengonsumsi obat-obatan jenis psikotropika?", options: ["Ya", "Tidak"] },
  { id: "urusan_polisi", section: "tambahan", type: "radio", label: "Apakah Anda pernah berurusan dengan polisi karena tindak kejahatan?", options: ["Ya", "Tidak"] },
  { id: "sedia_ditempatkan", section: "tambahan", type: "radio", label: "Bila diterima bekerja, bersediakah Anda ditempatkan sesuai kebutuhan Perusahaan?", options: ["Ya", "Tidak"] },
  { id: "sedia_luar_kota", section: "tambahan", type: "radio", label: "Bila diterima bekerja, bersediakah Anda bertugas ke luar kota?", options: ["Ya", "Tidak"] },
  { id: "sedia_luar_pulau", section: "tambahan", type: "radio", label: "Bila diterima bekerja, bersediakah Anda ditempatkan di luar kota/pulau?", options: ["Ya", "Tidak"] },

  // ---------- Harapan, Tes & Persetujuan ----------
  { id: "cita_cita", section: "penutup", type: "text", label: "Macam pekerjaan/jabatan apakah yang sesuai dengan cita-cita Anda?" },
  { id: "ekspektasi_gaji", section: "penutup", type: "text", label: "Bila diterima bekerja, berapa besar gaji & fasilitas yang Anda harapkan?" },
  { id: "mulai_kerja", section: "penutup", type: "text", label: "Bila diterima bekerja, kapan Anda dapat mulai bekerja?" },
  {
    id: "upload_mbti",
    section: "penutup",
    type: "file",
    label: "Upload Hasil Tes MBTI (PDF)",
    description: "Karyawan dapat mengakses link Psikotes melalui link eksternal yang ditentukan. Hasil berupa persentase dan juga 5 kode unik dapat dilampirkan pada bagian ini.",
    image: "images/panduan-mbti.jpg",
    imageCaption: "Bingung cara isi tes MBTI-nya? Klik gambar untuk lihat panduan langkah demi langkah.",
  },
  {
    id: "link_big_five",
    section: "penutup",
    type: "text",
    label: "Hasil Psikotest Big Five Personality",
    description: "Karyawan dapat mengakses link Psikotes melalui link eksternal yang ditentukan. Hasil berupa kode unik akan muncul saat selesai mengerjakan test. Contoh: 6a7abf62ava3251b0423411c",
    image: "images/panduan-bigfive.jpg",
    imageCaption: "Bingung cara isi tes Big Five-nya? Klik gambar untuk lihat panduan langkah demi langkah.",
  },
  { id: "pernyataan", section: "penutup", type: "checkbox", label: "Saya menyatakan seluruh data yang saya isi pada formulir ini adalah benar.", required: true },
  { id: "tanda_tangan", section: "penutup", type: "signature", label: "Tanda Tangan Pelamar", required: true },
];

module.exports = { DEFAULT_SECTIONS, DEFAULT_QUESTIONS };
