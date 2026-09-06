(function () {
  const loginScreen = document.getElementById("loginScreen");
  const adminScreen = document.getElementById("adminScreen");
  const userInput = document.getElementById("userInput");
  const pwInput = document.getElementById("pwInput");
  const loginBtn = document.getElementById("loginBtn");
  const loginAlert = document.getElementById("loginAlert");
  const logoutBtn = document.getElementById("logoutBtn");
  const whoAmI = document.getElementById("whoAmI");

  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabSubmissions = document.getElementById("tab-submissions");
  const tabQuestions = document.getElementById("tab-questions");
  const tabTemplates = document.getElementById("tab-templates");
  const tabUsers = document.getElementById("tab-users");
  const usersTabBtn = document.getElementById("usersTabBtn");

  // ---- Template Email: elemen ----
  const tplAlert = document.getElementById("tplAlert");
  const tplDiprosesBadge = document.getElementById("tplDiprosesBadge");
  const tplDiprosesSubject = document.getElementById("tplDiprosesSubject");
  const tplDiprosesBody = document.getElementById("tplDiprosesBody");
  const tplDiterimaBadge = document.getElementById("tplDiterimaBadge");
  const tplDiterimaSubject = document.getElementById("tplDiterimaSubject");
  const tplDiterimaBody = document.getElementById("tplDiterimaBody");
  const tplDitolakBadge = document.getElementById("tplDitolakBadge");
  const tplDitolakSubject = document.getElementById("tplDitolakSubject");
  const tplDitolakBody = document.getElementById("tplDitolakBody");
  const saveTemplatesBtn = document.getElementById("saveTemplatesBtn");
  let emailTemplatesLoaded = false;

  // ---- Kelola User: elemen ----
  const usersAlert = document.getElementById("usersAlert");
  const ownNewPw = document.getElementById("ownNewPw");
  const changeOwnPwBtn = document.getElementById("changeOwnPwBtn");
  const newUsername = document.getElementById("newUsername");
  const newUserPw = document.getElementById("newUserPw");
  const newUserRole = document.getElementById("newUserRole");
  const addUserBtn = document.getElementById("addUserBtn");
  const usersListContainer = document.getElementById("usersListContainer");
  const loginLogContainer = document.getElementById("loginLogContainer");

  const submissionsContainer = document.getElementById("submissionsContainer");
  const subAlert = document.getElementById("subAlert");
  const subToolbar = document.getElementById("subToolbar");
  const subSearchInput = document.getElementById("subSearchInput");
  const subSearchClear = document.getElementById("subSearchClear");
  const subResultCount = document.getElementById("subResultCount");
  const subStatusFilter = document.getElementById("subStatusFilter");
  const downloadAllBtn = document.getElementById("downloadAllBtn");
  const downloadAllOverlay = document.getElementById("downloadAllOverlay");
  const downloadAllDesc = document.getElementById("downloadAllDesc");
  const downloadChoiceView = document.getElementById("downloadChoiceView");
  const downloadProgressView = document.getElementById("downloadProgressView");
  const downloadAllCancelBtn = document.getElementById("downloadAllCancelBtn");
  const downloadAllConfirmBtn = document.getElementById("downloadAllConfirmBtn");
  const downloadProgressTitle = document.getElementById("downloadProgressTitle");
  const downloadProgressDesc = document.getElementById("downloadProgressDesc");
  const downloadProgressFill = document.getElementById("downloadProgressFill");
  const downloadProgressLabel = document.getElementById("downloadProgressLabel");
  const downloadProgressCloseBtn = document.getElementById("downloadProgressCloseBtn");

  const sectionsList = document.getElementById("sectionsList");
  const addSectionBtn = document.getElementById("addSectionBtn");
  const questionsList = document.getElementById("questionsList");
  const addQuestionBtn = document.getElementById("addQuestionBtn");
  const saveQuestionsBtn = document.getElementById("saveQuestionsBtn");
  const qAlert = document.getElementById("qAlert");

  const detailOverlay = document.getElementById("detailOverlay");
  const detailTitle = document.getElementById("detailTitle");
  const detailBody = document.getElementById("detailBody");
  const detailCloseBtn = document.getElementById("detailCloseBtn");
  const detailPdfBtn = document.getElementById("detailPdfBtn");

  const SESSION_KEY = "admin_session"; // { token, username, role }
  let sections = [];
  let questions = [];
  let lastSubmissions = [];
  let filteredSubmissions = [];
  let currentDetailRecord = null;

  const TYPE_LABELS = {
    text: "Teks Singkat",
    textarea: "Teks Panjang",
    email: "Email",
    tel: "No. Telepon",
    number: "Angka",
    date: "Tanggal",
    month: "Bulan & Tahun",
    select: "Pilihan (Dropdown)",
    radio: "Ya/Tidak atau Pilihan (Radio)",
    checkbox: "Centang (Pernyataan Setuju)",
    file: "Upload File",
    signature: "Tanda Tangan",
    repeater: "Grup Berulang (bisa tambah baris)",
  };
  const STATUS_LABELS = {
    baru: "Baru Masuk",
    diproses: "Diproses",
    diterima: "Diterima",
    ditolak: "Tidak Lolos",
  };
  const STATUS_CLASSES = {
    baru: "status-baru",
    diproses: "status-diproses",
    diterima: "status-diterima",
    ditolak: "status-ditolak",
  };

  const SUB_TYPE_LABELS = {
    text: "Teks Singkat",
    textarea: "Teks Panjang",
    email: "Email",
    tel: "No. Telepon",
    number: "Angka",
    date: "Tanggal",
    month: "Bulan & Tahun",
    select: "Pilihan (Dropdown)",
    radio: "Ya/Tidak atau Pilihan (Radio)",
    file: "Upload File",
  };

  // Kredensial demo untuk portofolio publik. Sengaja disimpan sebagai konstanta
  // di frontend (bukan rahasia sungguhan) karena seluruh sistem ini memang
  // demo/sample, tanpa data asli.
  const DEMO_USERNAME = "demo";
  const DEMO_PASSWORD = "demo123";

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch (e) {
      return null;
    }
  }
  function getToken() {
    const s = getSession();
    return s && s.token;
  }
  function isSuperadmin() {
    const s = getSession();
    return !!s && s.role === "superadmin";
  }

  async function authedFetch(url, opts) {
    opts = opts || {};
    const headers = Object.assign({}, opts.headers, { "x-admin-token": getToken() || "" });
    try {
      const res = await fetch(url, Object.assign({}, opts, { headers: headers }));
      if (res.status === 401) {
        // Fallback to local mockup data if Netlify backend fails or has no database/blobs set up yet
        console.warn("Backend 401. Falling back to frontend simulated storage for demo.");
        return createMockResponse(url, opts);
      }
      return res;
    } catch (e) {
      console.warn("Backend failed. Falling back to frontend simulated storage for demo.");
      return createMockResponse(url, opts);
    }
  }

  // --- MOCK STORAGE LANDING FOR PORTFOLIO DEMO ---
  const LOCAL_STORAGE_DB_KEY = "demo_candidate_submissions";
  const LOCAL_STORAGE_CONFIG_KEY = "demo_candidate_config";
  const LOCAL_STORAGE_TEMPLATES_KEY = "demo_candidate_templates";

  function getDemoSubmissions() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      if (stored) return JSON.parse(stored);
    } catch(e){}
    return getPreseededDemoData();
  }

  function saveDemoSubmissions(arr) {
    try {
      localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(arr));
    } catch(e){}
  }

  function getPreseededDemoData() {
    return [
      {
        id: "demo-1",
        submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: "baru",
        answers: {
          nama: "Budi Santoso",
          posisi: "Fullstack Web Developer",
          email: "budi.santoso@example.com",
          hp: "081234567890",
          tempat_lahir: "Jakarta",
          tanggal_lahir: "1995-08-15",
          jenis_kelamin: "Laki-laki",
          tinggi_berat: "172 cm & 68 kg",
          agama: "Islam",
          status_perkawinan: "Belum Kawin",
          no_ktp: "3171012345670001",
          kepemilikan_rumah: "Milik sendiri",
          alamat_domisili: "Jl. Sudirman No. 12, Jakarta Selatan",
          jumlah_tanggungan: "0",
          jumlah_orangtua: "2",
          referensi: [
            { nama: "Hendra Wijaya", hp: "0811223344", jabatan: "Lead Engineer", hubungan: "Mantan Atasan" }
          ],
          kontak_darurat: [
            { nama: "Siti Aminah", alamat: "Jl. Mangga No. 5, Bogor", hp: "0855667788", hubungan: "Ibu Kandung" }
          ],
          riwayat_pendidikan: [
            { jenjang: "S1", institusi: "Universitas Indonesia", kota: "Depok", jurusan: "Teknik Informatika" }
          ],
          upload_ijazah: "Ijazah_Budi_Santoso.pdf",
          upload_transkrip: "Transkrip_Nilai_Budi.pdf",
          riwayat_kerja: [
            {
              jabatan: "Backend Developer",
              perusahaan: "PT Solusi Teknologi",
              bulan_masuk: "2021-02",
              bulan_keluar: "2024-05",
              alamat_perusahaan: "Gedung Cyber, Jakarta",
              jenis_usaha: "IT Consultant",
              atasan: "Anton Sukarna",
              gaji: "12000000",
              alasan_berhenti: "Ingin mencari tantangan baru",
              uraian_tugas: "Mendevelop RESTful API menggunakan Node.js dan Express, mengelola database PostgreSQL, dan mengoptimalkan performa server.",
              upload_slip_gaji: "Slip_Gaji_Mei2024.pdf"
            }
          ],
          melamar_lain: "Tidak",
          kontrak_kerja: "Tidak",
          kerja_sampingan: "Tidak",
          keberatan_referensi: "Tidak",
          kenalan_internal: "Tidak",
          riwayat_sakit: "Tidak",
          merokok: "Tidak",
          konsumsi_psikotropika: "Tidak",
          urusan_polisi: "Tidak",
          sedia_ditempatkan: "Ya",
          sedia_luar_kota: "Ya",
          sedia_luar_pulau: "Ya",
          cita_cita: "Menjadi Solution Architect",
          ekspektasi_gaji: "Rp 15.000.000",
          mulai_kerja: "1 Bulan Notice",
          upload_mbti: "mbti_results.pdf",
          link_big_five: "6a7abf62ava3251b0423411c",
          pernyataan: true,
          tanda_tangan: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8MoDAAAANklEQVR4AWP4v6ThPwMeMBIvFmKwZGBhYECXgIsitgRcFlFsia8EXBaxJRCTMCEWYhKeuM8w/A8ArJEQW/mOByMAAAAASUVORK5CYII="
        },
        files: [
          { questionId: "upload_ijazah", filename: "Ijazah_Budi_Santoso.pdf", key: "demo/upload_ijazah/ijazah.pdf" },
          { questionId: "upload_transkrip", filename: "Transkrip_Nilai_Budi.pdf", key: "demo/upload_transkrip/transkrip.pdf" }
        ]
      },
      {
        id: "demo-2",
        submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: "diproses",
        answers: {
          nama: "Rina Kartika",
          posisi: "HR Admin Specialist",
          email: "rina.kartika@example.com",
          hp: "089876543210",
          tempat_lahir: "Bandung",
          tanggal_lahir: "1997-03-22",
          jenis_kelamin: "Perempuan",
          tinggi_berat: "160 cm & 53 kg",
          agama: "Kristen",
          status_perkawinan: "Belum Kawin",
          no_ktp: "3273012345678888",
          kepemilikan_rumah: "Kost",
          alamat_domisili: "Kuningan, Jakarta Selatan",
          jumlah_tanggungan: "0",
          jumlah_orangtua: "2",
          referensi: [
            { nama: "Yanti Ruslan", hp: "0856998811", jabatan: "HR Manager", hubungan: "Atasan Langsung" }
          ],
          kontak_darurat: [
            { nama: "Dedi Kartika", alamat: "Jl. Dago No. 104, Bandung", hp: "0812998877", hubungan: "Ayah Kandung" }
          ],
          riwayat_pendidikan: [
            { jenjang: "S1", institusi: "Universitas Padjadjaran", kota: "Bandung", jurusan: "Psikologi" }
          ],
          upload_ijazah: "Rina_Ijazah_S1.pdf",
          upload_transkrip: "Rina_Transkrip.pdf",
          riwayat_kerja: [
            {
              jabatan: "HR Generalist",
              perusahaan: "PT Media Kreasi Jaya",
              bulan_masuk: "2019-08",
              bulan_keluar: "2023-11",
              alamat_perusahaan: "Bandung",
              jenis_usaha: "Digital Agency",
              atasan: "Yanti Ruslan",
              gaji: "7500000",
              alasan_berhenti: "Relokasi domisili ke Jakarta",
              uraian_tugas: "Menangani administrasi kepegawaian, proses rekrutmen staff, BPJS Kesehatan & Ketenagakerjaan, serta asisten pengupahan karyawan.",
              upload_slip_gaji: "Rina_Slip_Gaji.pdf"
            }
          ],
          melamar_lain: "Ya",
          melamar_lain_penjelasan: "Melamar HR Admin di perusahaan Fintech lain",
          kontrak_kerja: "Tidak",
          kerja_sampingan: "Tidak",
          keberatan_referensi: "Tidak",
          kenalan_internal: "Tidak",
          riwayat_sakit: "Tidak",
          merokok: "Tidak",
          konsumsi_psikotropika: "Tidak",
          urusan_polisi: "Tidak",
          sedia_ditempatkan: "Ya",
          sedia_luar_kota: "Ya",
          sedia_luar_pulau: "Tidak",
          cita_cita: "Menjadi HR Business Partner",
          ekspektasi_gaji: "Rp 9.500.000",
          mulai_kerja: "Segera",
          upload_mbti: "rina_mbti.pdf",
          link_big_five: "8b9abf12fgg3251b0423400a",
          pernyataan: true,
          tanda_tangan: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8MoDAAAANklEQVR4AWP4v6ThPwMeMBIvFmKwZGBhYECXgIsitgRcFlFsia8EXBaxJRCTMCEWYhKeuM8w/A8ArJEQW/mOByMAAAAASUVORK5CYII="
        },
        files: [
          { questionId: "upload_ijazah", filename: "Rina_Ijazah_S1.pdf", key: "demo/rina_ijazah.pdf" }
        ]
      }
    ];
  }

  function getDemoConfig() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
      if (stored) return JSON.parse(stored);
    } catch(e){}
    // Use configuration derived from netlify/functions/default-config.js values, rendered raw for frontend ease of access
    return {
      sections: [
        { id: "pribadi", title: "Data Pribadi", description: "Identitas dasar dan informasi kontak." },
        { id: "keluarga", title: "Keluarga & Referensi", description: "Bisa tambah lebih dari satu referensi." },
        { id: "darurat", title: "Kontak Darurat", description: "Orang yang bisa dihubungi segera dalam keadaan darurat." },
        { id: "pendidikan", title: "Pendidikan", description: "Riwayat pendidikan formal dan dokumen pendukung." },
        { id: "pekerjaan", title: "Riwayat Pekerjaan", description: "Mulai dari pekerjaan terakhir." },
        { id: "tambahan", title: "Pertanyaan Tambahan", description: "Jawab dengan jujur." },
        { id: "penutup", title: "Harapan, Tes & Persetujuan", description: "Bagian terakhir sebelum kirim." },
      ],
      questions: [
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
      ]
    };
  }

  function getDemoTemplates() {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
      if (stored) return JSON.parse(stored);
    } catch(e){}
    return {
      diproses: { badgeLabel: "Diproses", subject: "Update Lamaran Anda — {{nama}}", body: "Halo {{nama}},\n\nLamaran Anda sebagai {{posisi}} sedang diproses." },
      diterima: { badgeLabel: "Diterima", subject: "Kabar Baik dari Kami — {{nama}}", body: "Halo {{nama}},\n\nSelamat! Anda diterima sebagai {{posisi}}." },
      ditolak: { badgeLabel: "Tidak Lolos", subject: "Update Lamaran Anda — {{nama}}", body: "Halo {{nama}},\n\nMohon maaf, Anda belum cocok sebagai {{posisi}}." }
    };
  }

  function createMockResponse(url, opts) {
    const method = (opts.method || "GET").toUpperCase();
    let bodyData = {};
    if (opts.body && typeof opts.body === "string") {
      try { bodyData = JSON.parse(opts.body); } catch(e){}
    }

    if (url.includes("/admin-questions")) {
      if (method === "GET") {
        return { status: 200, ok: true, json: async () => getDemoConfig() };
      }
      if (method === "PUT") {
        try {
          localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(bodyData));
        } catch(e){}
        return { status: 200, ok: true, json: async () => ({ ok: true }) };
      }
    }

    if (url.includes("/admin-email-templates")) {
      if (method === "GET") {
        return { status: 200, ok: true, json: async () => getDemoTemplates() };
      }
      if (method === "PUT") {
        try {
          localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(bodyData));
        } catch(e){}
        return { status: 200, ok: true, json: async () => ({ ok: true }) };
      }
    }

    if (url.includes("/admin-submissions")) {
      let subs = getDemoSubmissions();
      if (method === "GET") {
        return { status: 200, ok: true, json: async () => subs };
      }
      if (method === "PATCH") {
        const { id, status } = bodyData;
        subs = subs.map(v => v.id === id ? Object.assign({}, v, { status: status, statusUpdatedAt: new Date().toISOString() }) : v);
        saveDemoSubmissions(subs);
        return { status: 200, ok: true, json: async () => ({ ok: true, emailSent: true, emailSkipped: false }) };
      }
      if (method === "DELETE") {
        const { id } = bodyData;
        subs = subs.filter(v => v.id !== id);
        saveDemoSubmissions(subs);
        return { status: 200, ok: true, json: async () => ({ ok: true }) };
      }
    }

    if (url.includes("/admin-file")) {
      const u = new URL(url, window.location.origin);
      const key = u.searchParams.get("key") || "";
      // Returns a mock small PDF blob representing uploaded document
      const base64Pdf = "JVBERi0xLjQKJYoOKy8KMSAwIG9iagogIDw8L1R5cGUgL0NhdGFsb2cKICAgICAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iagogIDw8L1R5cGUgL1BhZ2VzCiAgICAgL0tpZHMgWzMgMCBSXQogICAgIC9Db3VudCAxPj4KZW5kb2JqCjMgMCBvYmoKICA8PC9UeXBlIC9QYWdlCiAgICAgL1BhcmVudCAyIDAgUgogICAgIC9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCiAgICAgL1Jlc291cmNlcyA8PC9Gb250IDw8L0YxIDQgMCBSPj4+PgogICAgIC9Db250ZW50cyA1IDAgUj4+CmVuZG9iago0IDAgb2JqCiAgPDwvVHlwZSAvRm9udAogICAgIC9TdWJ0eXBlIC9UeXBlMQogICAgIC9CYXNlRm9udCAvSGVsdmV0aWNhPj4KZW5kb2JqCjUgMCBvYmoKICA8PC9MZW5ndGggNDQ+PgpzdHJlYW0KQlQKICAvRjEgMTIgVGYKICA3MiA3MTIgVGQKICAoRGVtb25zdHJhc2kgRG9rdW1lbiBQREYgU2FtcGxlKSBUagogRVMKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA3MCAwMDAwMCBuIAowMDAwMDAwMTIwIDAwMDAwIGYgCjAwMDAwMDAyMzAgMDAwMDAgbiAKMDAwMDAwMjg4MCAwMDAwMCBuIAp0cmFpbGVyCiAgPDwvU2l6ZSA2CiAgICAgL1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKNDAwCiUlRU9GCg==";
      const bin = atob(base64Pdf);
      const buf = new Uint8Array(bin.length);
      for(let i=0; i<bin.length; i++) buf[i] = bin.charCodeAt(i);
      const blob = new Blob([buf], { type: "application/pdf" });
      return { status: 200, ok: true, blob: async () => blob };
    }

    return { status: 404, ok: false, json: async () => ({ message: "Not found" }) };
  }

  function showLogin(message) {
    loginScreen.style.display = "block";
    adminScreen.style.display = "none";
    if (message) loginAlert.innerHTML = '<div class="msg msg-err">' + message + '</div>';
  }

  async function showAdmin() {
    loginScreen.style.display = "none";
    adminScreen.style.display = "block";
    const s = getSession();
    if (s) whoAmI.textContent = s.username + (s.role === "superadmin" ? " · Super Admin" : " · Admin");
    usersTabBtn.style.display = isSuperadmin() ? "" : "none";
    await loadConfig();
    loadSubmissions();
  }

  loginBtn.addEventListener("click", async () => {
    const username = (userInput.value || "").trim().toLowerCase();
    const pw = pwInput.value.trim();
    if (!username || !pw) {
      loginAlert.innerHTML = '<div class="msg msg-err">Username dan password wajib diisi.</div>';
      return;
    }
    if (username === DEMO_USERNAME && pw === DEMO_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: "demo-token", username: "demo", role: "superadmin" }));
      loginAlert.innerHTML = "";
      pwInput.value = "";
      showAdmin();
    } else {
      loginAlert.innerHTML = '<div class="msg msg-err">Username atau password salah. Gunakan demo / demo123.</div>';
    }
  });

  pwInput.addEventListener("keydown", (e) => { if (e.key === "Enter") loginBtn.click(); });
  userInput.addEventListener("keydown", (e) => { if (e.key === "Enter") pwInput.focus(); });
  logoutBtn.addEventListener("click", () => { sessionStorage.removeItem(SESSION_KEY); showLogin(); });

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      tabSubmissions.style.display = tab === "submissions" ? "block" : "none";
      tabQuestions.style.display = tab === "questions" ? "block" : "none";
      tabTemplates.style.display = tab === "templates" ? "block" : "none";
      tabUsers.style.display = tab === "users" ? "block" : "none";
      if (tab === "users" && isSuperadmin()) { loadUsers(); loadLoginLog(); }
      if (tab === "templates" && !emailTemplatesLoaded) { loadEmailTemplates(); }
    });
  });

  // ---------- Direct Demo Generates Button Logic ----------
  const demoGenerateBtn = document.getElementById("demoGenerateBtn");
  if (demoGenerateBtn) {
    demoGenerateBtn.addEventListener("click", () => {
      const names = ["Andi Wijaya", "Dewi Lestari", "Rian Hidayat", "Siti Rahma", "Eko Prasetyo", "Amalia Putri", "Taufik Ismail"];
      const positions = ["Frontend Developer", "Data Analyst", "UI/UX Designer", "Product Manager", "HR Generalist", "QA Engineer", "Digital Marketer"];
      const emails = ["andi.w@example.com", "dewi.l@example.com", "rian.h@example.com", "siti.r@example.com", "eko.p@example.com", "amalia.p@example.com", "taufik.i@example.com"];
      const phonePrefixes = ["0812", "0813", "0819", "0852", "0856", "0857", "0896"];

      const randIdx = Math.floor(Math.random() * names.length);
      const name = names[randIdx];
      const pos = positions[Math.floor(Math.random() * positions.length)];
      const email = emails[randIdx];
      const hp = phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)] + Math.floor(10000000 + Math.random() * 90000000);

      const id = "demo-" + Date.now();
      const newSub = {
        id: id,
        submittedAt: new Date().toISOString(),
        status: "baru",
        answers: {
          nama: name,
          posisi: pos,
          email: email,
          hp: hp,
          tempat_lahir: "Jakarta",
          tanggal_lahir: "199" + Math.floor(Math.random() * 9) + "-01-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
          jenis_kelamin: Math.random() > 0.5 ? "Laki-laki" : "Perempuan",
          tinggi_berat: "170 cm & 60 kg",
          agama: "Islam",
          status_perkawinan: "Belum Kawin",
          no_ktp: "3171" + Math.floor(100000000000 + Math.random() * 900000000000),
          kepemilikan_rumah: "Kost",
          alamat_domisili: "Jl. Margonda Raya No. " + Math.floor(Math.random() * 200) + ", Depok",
          jumlah_tanggungan: "0",
          jumlah_orangtua: "2",
          referensi: [
            { nama: "Herman Wijaya", hp: "0811001122", jabatan: "Lead Dev", hubungan: "Rekan Kerja" }
          ],
          kontak_darurat: [
            { nama: "Supardi", alamat: "Jl. Slamet Riyadi, Solo", hp: "0899009988", hubungan: "Paman" }
          ],
          riwayat_pendidikan: [
            { jenjang: "S1", institusi: "Universitas demo", kota: "Jakarta", jurusan: "Ilmu Komputer" }
          ],
          upload_ijazah: "Ijazah_" + name.replace(/\s+/g,"_") + ".pdf",
          upload_transkrip: "Transkrip_" + name.replace(/\s+/g,"_") + ".pdf",
          riwayat_kerja: [
            {
              jabatan: pos,
              perusahaan: "PT Solusi Sukses Kreatif",
              bulan_masuk: "2020-03",
              bulan_keluar: "2024-01",
              alamat_perusahaan: "Kebayoran Baru, Jakarta",
              jenis_usaha: "Startup Kuliner",
              atasan: "Feri Sandi",
              gaji: "9500000",
              alasan_berhenti: "Ingin bekerja di bidang enterprise",
              uraian_tugas: "Melakukan tugas operasional harian terkait " + pos + " di kantor pusat.",
            }
          ],
          melamar_lain: "Tidak",
          kontrak_kerja: "Tidak",
          kerja_sampingan: "Tidak",
          keberatan_referensi: "Tidak",
          kenalan_internal: "Tidak",
          riwayat_sakit: "Tidak",
          merokok: "Tidak",
          konsumsi_psikotropika: "Tidak",
          urusan_polisi: "Tidak",
          sedia_ditempatkan: "Ya",
          sedia_luar_kota: "Ya",
          sedia_luar_pulau: "Ya",
          cita_cita: "Menjadi Expert di bidang " + pos,
          ekspektasi_gaji: "Rp 12.000.000",
          mulai_kerja: "Segera",
          upload_mbti: "mbti_report_" + name.replace(/\s+/g,"_") + ".pdf",
          link_big_five: "5a7abf62aba3251b0423400b",
          pernyataan: true,
          tanda_tangan: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8MoDAAAANklEQVR4AWP4v6ThPwMeMBIvFmKwZGBhYECXgIsitgRcFlFsia8EXBaxJRCTMCEWYhKeuM8w/A8ArJEQW/mOByMAAAAASUVORK5CYII="
        },
        files: [
          { questionId: "upload_ijazah", filename: "Ijazah_" + name.replace(/\s+/g,"_") + ".pdf", key: "demo/ijazah.pdf" },
          { questionId: "upload_transkrip", filename: "Transkrip_" + name.replace(/\s+/g,"_") + ".pdf", key: "demo/transkrip.pdf" }
        ]
      };

      const subs = getDemoSubmissions();
      subs.unshift(newSub);
      saveDemoSubmissions(subs);
      subAlert.innerHTML = '<div class="msg msg-ok">Sample data untuk <strong>' + name + '</strong> berhasil digenerate!</div>';
      renderSubmissions(subs);
    });
  }

  // ================= KELOLA USER =================
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  changeOwnPwBtn.addEventListener("click", async () => {
    const s = getSession();
    const newPw = (ownNewPw.value || "").trim();
    if (!s) return;
    if (newPw.length < 6) {
      usersAlert.innerHTML = '<div class="msg msg-err">Password baru minimal 6 karakter.</div>';
      return;
    }
    changeOwnPwBtn.disabled = true;
    try {
      const res = await authedFetch("/.netlify/functions/admin-users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: s.username, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        usersAlert.innerHTML = '<div class="msg msg-ok">Password berhasil diganti.</div>';
        ownNewPw.value = "";
      } else {
        usersAlert.innerHTML = '<div class="msg msg-err">' + (data.message || "Gagal mengganti password.") + '</div>';
      }
    } catch (e) {
      if (e.message !== "Unauthorized") usersAlert.innerHTML = '<div class="msg msg-err">Gagal terhubung ke server.</div>';
    }
    changeOwnPwBtn.disabled = false;
  });

  addUserBtn.addEventListener("click", async () => {
    const username = (newUsername.value || "").trim().toLowerCase();
    const password = (newUserPw.value || "").trim();
    const role = newUserRole.value;
    if (!username || password.length < 6) {
      usersAlert.innerHTML = '<div class="msg msg-err">Username wajib diisi & password minimal 6 karakter.</div>';
      return;
    }
    addUserBtn.disabled = true;
    try {
      const res = await authedFetch("/.netlify/functions/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        usersAlert.innerHTML = '<div class="msg msg-ok">User berhasil ditambahkan.</div>';
        newUsername.value = "";
        newUserPw.value = "";
        newUserRole.value = "admin";
        loadUsers();
      } else {
        usersAlert.innerHTML = '<div class="msg msg-err">' + (data.message || "Gagal menambah user.") + '</div>';
      }
    } catch (e) {
      if (e.message !== "Unauthorized") usersAlert.innerHTML = '<div class="msg msg-err">Gagal terhubung ke server.</div>';
    }
    addUserBtn.disabled = false;
  });

  async function loadUsers() {
    usersListContainer.innerHTML = '<p class="hint">Memuat\u2026</p>';
    try {
      const res = await authedFetch("/.netlify/functions/admin-users");
      const users = await res.json();
      renderUsers(users);
    } catch (e) {
      if (e.message !== "Unauthorized") usersListContainer.innerHTML = '<p class="hint">Gagal memuat daftar user.</p>';
    }
  }

  function renderUsers(users) {
    if (!users || !users.length) {
      usersListContainer.innerHTML = '<div class="empty-state">Belum ada user.</div>';
      return;
    }
    const s = getSession();
    const table = document.createElement("table");
    table.className = "sub-table";
    table.innerHTML = '<thead><tr><th>Username</th><th>Role</th><th>Dibuat</th><th></th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector("tbody");
    users.forEach((u) => {
      const tr = document.createElement("tr");
      const created = u.createdAt ? new Date(u.createdAt).toLocaleString("id-ID") : "-";
      tr.innerHTML =
        "<td>" + escapeHtml(u.username) + (u.username === s.username ? " (kamu)" : "") + "</td>" +
        "<td>" + (u.role === "superadmin" ? "Super Admin" : "Admin") + "</td>" +
        "<td>" + created + "</td>" +
        "<td></td>";
      const tdActions = tr.querySelector("td:last-child");

      const resetBtn = document.createElement("button");
      resetBtn.className = "btn btn-ghost";
      resetBtn.style.marginRight = "6px";
      resetBtn.textContent = "Reset Password";
      resetBtn.addEventListener("click", async () => {
        const newPw = window.prompt("Password baru untuk " + u.username + " (minimal 6 karakter):");
        if (newPw === null) return;
        if (newPw.trim().length < 6) {
          usersAlert.innerHTML = '<div class="msg msg-err">Password baru minimal 6 karakter.</div>';
          return;
        }
        try {
          const res = await authedFetch("/.netlify/functions/admin-users", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: u.username, newPassword: newPw.trim() }),
          });
          const data = await res.json();
          if (res.ok && data.ok) {
            usersAlert.innerHTML = '<div class="msg msg-ok">Password ' + escapeHtml(u.username) + ' berhasil direset.</div>';
          } else {
            usersAlert.innerHTML = '<div class="msg msg-err">' + (data.message || "Gagal reset password.") + '</div>';
          }
        } catch (e) {
          if (e.message !== "Unauthorized") usersAlert.innerHTML = '<div class="msg msg-err">Gagal terhubung ke server.</div>';
        }
      });
      tdActions.appendChild(resetBtn);

      if (u.username !== s.username) {
        const delBtn = document.createElement("button");
        delBtn.className = "btn btn-danger";
        delBtn.textContent = "Hapus";
        delBtn.addEventListener("click", async () => {
          if (!window.confirm("Hapus user " + u.username + "? Tindakan ini tidak bisa dibatalkan.")) return;
          try {
            const res = await authedFetch("/.netlify/functions/admin-users", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: u.username }),
            });
            const data = await res.json();
            if (res.ok && data.ok) {
              usersAlert.innerHTML = '<div class="msg msg-ok">User ' + escapeHtml(u.username) + ' dihapus.</div>';
              loadUsers();
            } else {
              usersAlert.innerHTML = '<div class="msg msg-err">' + (data.message || "Gagal menghapus user.") + '</div>';
            }
          } catch (e) {
            if (e.message !== "Unauthorized") usersAlert.innerHTML = '<div class="msg msg-err">Gagal terhubung ke server.</div>';
          }
        });
        tdActions.appendChild(delBtn);
      }

      // ---- Ubah role ----
      const roleSelect = document.createElement("select");
      roleSelect.style.marginLeft = "6px";
      roleSelect.style.padding = "6px 8px";
      roleSelect.style.fontSize = "13px";
      roleSelect.style.border = "1px solid #cfd3dc";
      roleSelect.style.borderRadius = "6px";
      roleSelect.innerHTML = '<option value="admin">Admin</option><option value="superadmin">Super Admin</option>';
      roleSelect.value = u.role === "superadmin" ? "superadmin" : "admin";
      const roleBtn = document.createElement("button");
      roleBtn.className = "btn btn-ghost";
      roleBtn.style.marginLeft = "6px";
      roleBtn.textContent = "Ubah Role";
      roleBtn.addEventListener("click", async () => {
        const newRole = roleSelect.value;
        if (newRole === u.role) return;
        const roleLabel = newRole === "superadmin" ? "Super Admin" : "Admin";
        if (!window.confirm("Ubah role " + u.username + " jadi " + roleLabel + "?")) return;
        try {
          const res = await authedFetch("/.netlify/functions/admin-users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: u.username, role: newRole }),
          });
          const data = await res.json();
          if (res.ok && data.ok) {
            usersAlert.innerHTML = '<div class="msg msg-ok">Role ' + escapeHtml(u.username) + ' diubah jadi ' + roleLabel + '.</div>';
            loadUsers();
          } else {
            usersAlert.innerHTML = '<div class="msg msg-err">' + (data.message || "Gagal mengubah role.") + '</div>';
          }
        } catch (e) {
          if (e.message !== "Unauthorized") usersAlert.innerHTML = '<div class="msg msg-err">Gagal terhubung ke server.</div>';
        }
      });
      tdActions.appendChild(roleSelect);
      tdActions.appendChild(roleBtn);

      tbody.appendChild(tr);
    });
    usersListContainer.innerHTML = "";
    usersListContainer.appendChild(table);
  }

  // ================= LOG LOGIN =================
  async function loadLoginLog() {
    loginLogContainer.innerHTML = '<p class="hint">Memuat\u2026</p>';
    try {
      const res = await authedFetch("/.netlify/functions/admin-login-log");
      const logs = await res.json();
      renderLoginLog(logs);
    } catch (e) {
      if (e.message !== "Unauthorized") loginLogContainer.innerHTML = '<p class="hint">Gagal memuat log login.</p>';
    }
  }

  function renderLoginLog(logs) {
    if (!logs || !logs.length) {
      loginLogContainer.innerHTML = '<div class="empty-state">Belum ada riwayat login.</div>';
      return;
    }
    const table = document.createElement("table");
    table.className = "sub-table";
    table.innerHTML = '<thead><tr><th>Waktu</th><th>Username</th><th>Role</th><th>IP</th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector("tbody");
    logs.forEach((entry) => {
      const tr = document.createElement("tr");
      const waktu = entry.at ? new Date(entry.at).toLocaleString("id-ID") : "-";
      tr.innerHTML =
        "<td>" + waktu + "</td>" +
        "<td>" + escapeHtml(entry.username) + "</td>" +
        "<td>" + (entry.role === "superadmin" ? "Super Admin" : "Admin") + "</td>" +
        "<td>" + escapeHtml(entry.ip || "-") + "</td>";
      tbody.appendChild(tr);
    });
    loginLogContainer.innerHTML = "";
    loginLogContainer.appendChild(table);
  }

  // ================= SUBMISSIONS =================
  async function loadSubmissions() {
    submissionsContainer.innerHTML = '<p class="hint">Memuat data\u2026</p>';
    try {
      const res = await authedFetch("/.netlify/functions/admin-submissions");
      const records = await res.json();
      renderSubmissions(records);
    } catch (e) {
      if (e.message !== "Unauthorized") submissionsContainer.innerHTML = '<p class="hint">Gagal memuat data.</p>';
    }
  }

  subSearchInput.addEventListener("input", applySubmissionFilter);
  subStatusFilter.addEventListener("change", () => { applySubmissionFilter(); });

  subSearchClear.addEventListener("click", () => {
    subSearchInput.value = "";
    applySubmissionFilter();
    subSearchInput.focus();
  });

  function csvEscape(val) {
    const s = val == null ? "" : String(val);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function todayStamp() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // ---------- Download Semua Data (CSV ringkasan / ZIP berisi PDF per kandidat) ----------
  downloadAllBtn.addEventListener("click", () => {
    const n = filteredSubmissions.length;
    downloadAllDesc.textContent = "Pilih format unduhan untuk " + n + " kandidat yang sedang tampil di daftar" + (subSearchInput.value.trim() ? " (sesuai hasil pencarian)" : "") + ".";
    downloadChoiceView.style.display = "block";
    downloadProgressView.style.display = "none";
    downloadAllOverlay.style.display = "flex";
  });
  downloadAllCancelBtn.addEventListener("click", () => (downloadAllOverlay.style.display = "none"));
  downloadProgressCloseBtn.addEventListener("click", () => (downloadAllOverlay.style.display = "none"));
  downloadAllOverlay.addEventListener("click", (e) => {
    if (e.target === downloadAllOverlay) downloadAllOverlay.style.display = "none";
  });

  downloadAllConfirmBtn.addEventListener("click", async () => {
    const mode = document.querySelector('input[name="dlAllMode"]:checked').value;
    const records = filteredSubmissions.slice();
    downloadChoiceView.style.display = "none";
    downloadProgressView.style.display = "block";
    downloadProgressFill.style.width = "0%";

    if (mode === "csv") {
      downloadProgressTitle.textContent = "Menyiapkan file\u2026";
      downloadProgressDesc.textContent = "Merangkum data " + records.length + " kandidat jadi satu file CSV.";
      downloadProgressLabel.textContent = "";
      try {
        const ids = keyFieldIds();
        const header = ["Waktu Masuk", "Nama", "Posisi Dilamar", "Email", "No Handphone", "Jumlah File", "Status"];
        const rows = records.map((r) => {
          const a = r.answers || {};
          return [
            new Date(r.submittedAt).toLocaleString("id-ID"),
            (ids.namaId && a[ids.namaId]) || "",
            (ids.posisiId && a[ids.posisiId]) || "",
            (ids.emailId && a[ids.emailId]) || "",
            (ids.hpId && a[ids.hpId]) || "",
            (r.files && r.files.length) || 0,
            STATUS_LABELS[r.status || "baru"] || "Baru Masuk",
          ];
        });
        const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        downloadProgressFill.style.width = "100%";
        downloadProgressLabel.textContent = "Selesai";
        downloadBlob(blob, "Data-Kandidat-" + todayStamp() + ".csv");
      } catch (err) {
        downloadProgressDesc.textContent = "Gagal membuat file CSV.";
      }
      return;
    }

    // mode === "zip": gabungkan laporan PDF + file lampiran asli tiap kandidat
    // jadi satu file ZIP (satu folder per kandidat).
    downloadProgressTitle.textContent = "Menyiapkan file\u2026";
    downloadProgressDesc.textContent = "Menggabungkan laporan & file lampiran tiap kandidat jadi satu file ZIP.";
    try {
      const zip = new JSZip();
      const usedFolderNames = new Set();
      let failedFiles = 0;
      const totalUnits = records.reduce((sum, r) => sum + 1 + (r.files ? r.files.length : 0), 0); // 1 unit = laporan, +1 per lampiran
      let doneUnits = 0;

      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const { doc, cleanName } = buildCandidatePdfDoc(r);

        let folderName = cleanName || ("kandidat-" + (i + 1));
        let n = 2;
        while (usedFolderNames.has(folderName)) { folderName = cleanName + "-" + n; n++; }
        usedFolderNames.add(folderName);
        const folder = zip.folder(folderName);

        folder.file("Laporan-Kandidat-" + cleanName + ".pdf", doc.output("blob"));
        doneUnits++;
        downloadProgressLabel.textContent = "Kandidat " + (i + 1) + "/" + records.length + " \u2014 laporan dibuat";
        downloadProgressFill.style.width = Math.round((doneUnits / totalUnits) * 100) + "%";

        const usedFileNames = new Set(["Laporan-Kandidat-" + cleanName + ".pdf"]);
        for (const f of (r.files || [])) {
          downloadProgressLabel.textContent = "Kandidat " + (i + 1) + "/" + records.length + " \u2014 mengunduh " + f.filename;
          try {
            const res = await authedFetch("/.netlify/functions/admin-file?key=" + encodeURIComponent(f.key));
            const blob = await res.blob();
            let fname = f.filename || "lampiran.pdf";
            let n2 = 2;
            while (usedFileNames.has(fname)) {
              const dot = f.filename.lastIndexOf(".");
              fname = dot > -1 ? f.filename.slice(0, dot) + "-" + n2 + f.filename.slice(dot) : f.filename + "-" + n2;
              n2++;
            }
            usedFileNames.add(fname);
            folder.file(fname, blob);
          } catch (fileErr) {
            failedFiles++;
          }
          doneUnits++;
          downloadProgressFill.style.width = Math.round((doneUnits / totalUnits) * 100) + "%";
        }
      }

      downloadProgressLabel.textContent = "Membungkus ZIP\u2026";
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadProgressLabel.textContent = "Selesai \u2014 " + records.length + " kandidat digabung"
        + (failedFiles ? " (" + failedFiles + " lampiran gagal diunduh, dilewati)" : "");
      downloadBlob(zipBlob, "Data-Kandidat-" + todayStamp() + ".zip");
    } catch (err) {
      downloadProgressDesc.textContent = "Gagal membuat file ZIP. Coba lagi, atau unduh laporan satu-satu lewat tombol \u201cLihat Detail\u201d.";
    }
  });

  function labelForQuestionId(id) {
    const q = questions.find((qq) => qq.id === id);
    return q ? q.label : id;
  }

  // ---------- Pencarian jawaban "penting" (nama/posisi/email/hp) yang tahan
  // terhadap perubahan ID pertanyaan lewat Kelola Formulir. ----------
  // Prioritas: (1) ID persis seperti default config, (2) cari pertanyaan
  // top-level (bukan dalam repeater) yang label-nya mengandung salah satu
  // kata kunci. Hasilnya di-cache per render supaya gak nyari ulang tiap baris.
  const KEY_FIELD_KEYWORDS = {
    nama: ["nama lengkap", "nama"],
    posisi: ["pekerjaan yang dilamar", "posisi", "jabatan yang dilamar", "melamar sebagai"],
    email: ["email", "e-mail"],
    hp: ["handphone", "no. telepon", "nomor telepon", "whatsapp", "no hp", "no. hp"],
  };

  function guessKeyFieldId(defaultId) {
    const exact = questions.find((q) => q.id === defaultId && q.type !== "repeater");
    if (exact) return exact.id;
    const keywords = KEY_FIELD_KEYWORDS[defaultId] || [];
    for (const kw of keywords) {
      const found = questions.find((q) => q.type !== "repeater" && (q.label || "").toLowerCase().includes(kw));
      if (found) return found.id;
    }
    return null;
  }

  function keyFieldIds() {
    return {
      namaId: guessKeyFieldId("nama"),
      posisiId: guessKeyFieldId("posisi"),
      emailId: guessKeyFieldId("email"),
      hpId: guessKeyFieldId("hp"),
    };
  }

  function candidateName(record, ids) {
    ids = ids || keyFieldIds();
    const a = record.answers || {};
    return (ids.namaId && a[ids.namaId]) || record.id;
  }

  function renderSubmissions(records) {
    lastSubmissions = records || [];
    subToolbar.style.display = lastSubmissions.length ? "flex" : "none";
    applySubmissionFilter();
  }

  // Dipanggil ulang tiap kali kotak pencarian berubah, atau setelah data
  // dimuat/dihapus, supaya tabel & tombol Download Semua Data selalu
  // mengikuti hasil pencarian yang sedang aktif.
  function applySubmissionFilter() {
    const q = (subSearchInput.value || "").trim().toLowerCase();
    const statusFilter = subStatusFilter.value || "";
    const ids = keyFieldIds();
    filteredSubmissions = lastSubmissions.filter((r) => {
      if (statusFilter && (r.status || "baru") !== statusFilter) return false;
      if (!q) return true;
      const name = String(candidateName(r, ids) || "");
      return name.toLowerCase().includes(q);
    });

    subSearchClear.classList.toggle("show", !!q);
    if (lastSubmissions.length) {
      subResultCount.style.display = "block";
      subResultCount.textContent = filteredSubmissions.length + " kandidat" + (q ? ' ditemukan untuk "' + subSearchInput.value.trim() + '"' : "");
    } else {
      subResultCount.style.display = "none";
    }
    downloadAllBtn.disabled = filteredSubmissions.length === 0;

    renderSubmissionsTable(filteredSubmissions, ids, q);
  }

  function highlightMatch(text, q) {
    const str = escapeHtml(String(text));
    if (!q) return str;
    const idx = str.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return str;
    return str.slice(0, idx) + "<mark>" + str.slice(idx, idx + q.length) + "</mark>" + str.slice(idx + q.length);
  }

  function renderSubmissionsTable(records, ids, searchQuery) {
    if (!records.length) {
      submissionsContainer.innerHTML = lastSubmissions.length
        ? '<div class="empty-state">Nggak ada kandidat yang cocok dengan pencarian ini.</div>'
        : '<div class="empty-state">Belum ada data kandidat yang masuk.</div>';
      return;
    }
    const table = document.createElement("table");
    table.className = "sub-table";
    table.innerHTML = '<thead><tr><th>Waktu Masuk</th><th>Nama</th><th>Posisi Dilamar</th><th>Kontak</th><th>File</th><th>Status</th><th></th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector("tbody");

    records.forEach((r) => {
      const tr = document.createElement("tr");
      const a = r.answers || {};

      const tdTime = document.createElement("td");
      tdTime.dataset.label = "Waktu Masuk";
      const date = new Date(r.submittedAt);
      tdTime.innerHTML = '<span class="badge">' + date.toLocaleString("id-ID") + '</span>';
      tr.appendChild(tdTime);

      const tdName = document.createElement("td");
      tdName.dataset.label = "Nama";
      tdName.innerHTML = highlightMatch((ids.namaId && a[ids.namaId]) || "\u2014", searchQuery);
      tr.appendChild(tdName);

      const tdPos = document.createElement("td");
      tdPos.dataset.label = "Posisi";
      tdPos.textContent = (ids.posisiId && a[ids.posisiId]) || "\u2014";
      tr.appendChild(tdPos);

      const tdContact = document.createElement("td");
      tdContact.dataset.label = "Kontak";
      tdContact.innerHTML = [ids.emailId && a[ids.emailId], ids.hpId && a[ids.hpId]].filter(Boolean).map(escapeHtml).join("<br>") || "\u2014";
      tr.appendChild(tdContact);

      const tdFiles = document.createElement("td");
      tdFiles.dataset.label = "File";
      tdFiles.textContent = (r.files && r.files.length) ? (r.files.length + " file") : "\u2014";
      tr.appendChild(tdFiles);

      const tdStatus = document.createElement("td");
      tdStatus.dataset.label = "Status";
      const statusSelect = document.createElement("select");
      statusSelect.className = "status-select " + (STATUS_CLASSES[r.status || "baru"] || "status-baru");
      Object.keys(STATUS_LABELS).forEach((key) => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = STATUS_LABELS[key];
        if ((r.status || "baru") === key) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      statusSelect.addEventListener("change", () => {
        const newStatus = statusSelect.value;
        const prevStatus = r.status || "baru";
        updateStatus(r, newStatus, ids).then((success) => {
          if (!success) statusSelect.value = prevStatus;
          else {
            statusSelect.className = "status-select " + (STATUS_CLASSES[newStatus] || "status-baru");
          }
        });
      });
      tdStatus.appendChild(statusSelect);
      tr.appendChild(tdStatus);

      const tdActions = document.createElement("td");
      tdActions.dataset.label = "";
      const viewBtn = document.createElement("button");
      viewBtn.className = "btn btn-ghost";
      viewBtn.textContent = "Lihat Detail";
      viewBtn.style.marginRight = "6px";
      viewBtn.addEventListener("click", () => openDetail(r));
      tdActions.appendChild(viewBtn);

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-danger";
      delBtn.textContent = "Hapus";
      delBtn.addEventListener("click", () => deleteSubmission(r.id));
      tdActions.appendChild(delBtn);

      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });

    submissionsContainer.innerHTML = "";
    submissionsContainer.appendChild(table);
  }

  async function downloadFile(key, filename) {
    try {
      const res = await authedFetch("/.netlify/functions/admin-file?key=" + encodeURIComponent(key));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      subAlert.innerHTML = '<div class="msg msg-err">Gagal mengunduh file.</div>';
    }
  }

  async function deleteSubmission(id) {
    if (!confirm("Hapus data kandidat ini beserta file yang diupload? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await authedFetch("/.netlify/functions/admin-submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id }),
      });
      loadSubmissions();
    } catch (e) {
      subAlert.innerHTML = '<div class="msg msg-err">Gagal menghapus data.</div>';
    }
  }

  // Ubah status kandidat (dipicu dari dropdown Status di tabel). Untuk status
  // Diterima/Ditolak, backend otomatis mengirim email notifikasi ke kandidat
  // berdasarkan Template Email yang tersimpan. Mengembalikan true kalau
  // status berhasil diubah (terlepas dari email terkirim atau belum).
  async function updateStatus(record, newStatus, ids) {
    ids = ids || keyFieldIds();
    const a = record.answers || {};
    const email = (ids.emailId && a[ids.emailId]) || "";
    const willEmail = newStatus === "diproses" || newStatus === "diterima" || newStatus === "ditolak";

    if (willEmail && !email) {
      if (!confirm('Kandidat ini tidak punya alamat email di data formulir, jadi email notifikasi tidak akan terkirim.\n\nLanjutkan ubah status ke "' + STATUS_LABELS[newStatus] + '"?')) {
        return false;
      }
    }

    try {
      const res = await authedFetch("/.netlify/functions/admin-submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          status: newStatus,
          candidateEmail: email,
          candidateName: candidateName(record, ids),
          candidatePosisi: (ids.posisiId && a[ids.posisiId]) || "",
        }),
      });
      let data = {};
      try { data = await res.json(); } catch (e) {}
      if (!res.ok) {
        subAlert.innerHTML = '<div class="msg msg-err">' + (data.message || "Gagal mengubah status.") + '</div>';
        return false;
      }

      record.status = newStatus;

      if (willEmail) {
        if (email && data.emailSent) {
          subAlert.innerHTML = '<div class="msg msg-ok">Status diubah ke "' + STATUS_LABELS[newStatus] + '" dan email notifikasi terkirim ke ' + escapeHtml(email) + '.</div>';
        } else if (email) {
          subAlert.innerHTML = '<div class="msg msg-err">Status diubah ke "' + STATUS_LABELS[newStatus] + '", tapi email belum terkirim' + (data.emailError ? ": " + escapeHtml(data.emailError) : ".") + '</div>';
        } else {
          subAlert.innerHTML = '<div class="msg msg-ok">Status diubah ke "' + STATUS_LABELS[newStatus] + '" (tanpa email, kandidat tidak punya alamat email).</div>';
        }
      } else {
        subAlert.innerHTML = "";
      }
      return true;
    } catch (e) {
      if (e.message !== "Unauthorized") subAlert.innerHTML = '<div class="msg msg-err">Gagal mengubah status (kemungkinan masalah jaringan).</div>';
      return false;
    }
  }

  // ---------- Detail overlay (laporan gaya Zoho) ----------
  function findFile(record, questionId, rowIndex, subFieldId) {
    return (record.files || []).find((f) =>
      f.questionId === questionId &&
      (f.rowIndex === undefined || f.rowIndex === null ? (rowIndex === undefined || rowIndex === null) : f.rowIndex === rowIndex) &&
      (f.subFieldId || null) === (subFieldId || null)
    );
  }

  function openDetail(record) {
    currentDetailRecord = record;
    const a = record.answers || {};
    detailTitle.textContent = "Detail Kandidat \u2014 " + candidateName(record);

    let html = '<div class="report-meta">Dikirim: ' + new Date(record.submittedAt).toLocaleString("id-ID") + '</div>';
    html += '<div class="report-meta">Status: <span class="status-select ' + (STATUS_CLASSES[record.status || "baru"] || "status-baru") + '" style="cursor:default; display:inline-block;">' + escapeHtml(STATUS_LABELS[record.status || "baru"]) + '</span></div>';

    sections.forEach((sec) => {
      const secQuestions = questions.filter((q) => (q.section || sections[0].id) === sec.id);
      if (!secQuestions.length) return;
      html += '<div class="report-section"><h3>' + escapeHtml(sec.title) + '</h3><table class="report-table">';

      secQuestions.forEach((q) => {
        if (q.type === "repeater") {
          const rows = Array.isArray(a[q.id]) ? a[q.id] : [];
          html += '<tr><td class="rlabel">' + escapeHtml(q.label) + '</td><td>';
          if (!rows.length) {
            html += '\u2014';
          } else {
            rows.forEach((row, idx) => {
              html += '<div class="report-repeater-row"><div class="report-repeater-tag">' + escapeHtml((q.itemLabel || "Baris") + " " + (idx + 1)) + '</div>';
              (q.fields || []).forEach((sub) => {
                let val = row[sub.id];
                if (sub.type === "file") {
                  const f = findFile(record, q.id, idx, sub.id);
                  html += '<div><strong>' + escapeHtml(sub.label) + ':</strong> ';
                  if (f) html += '<a href="#" class="file-link" data-key="' + escapeHtml(f.key) + '" data-filename="' + escapeHtml(f.filename) + '">' + escapeHtml(f.filename) + '</a>';
                  else html += '\u2014';
                  html += '</div>';
                } else {
                  html += '<div><strong>' + escapeHtml(sub.label) + ':</strong> ' + escapeHtml(val || "\u2014") + '</div>';
                }
              });
              html += '</div>';
            });
          }
          html += '</td></tr>';
        } else if (q.type === "file") {
          const f = findFile(record, q.id, null, null);
          html += '<tr><td class="rlabel">' + escapeHtml(q.label) + '</td><td>';
          html += f ? '<a href="#" class="file-link" data-key="' + escapeHtml(f.key) + '" data-filename="' + escapeHtml(f.filename) + '">' + escapeHtml(f.filename) + '</a>' : '\u2014';
          html += '</td></tr>';
        } else if (q.type === "signature") {
          const val = a[q.id];
          html += '<tr><td class="rlabel">' + escapeHtml(q.label) + '</td><td>';
          html += val ? '<img src="' + val + '" alt="Tanda tangan" style="max-width:220px; border:1px solid var(--paper-line); border-radius:6px;">' : '\u2014';
          html += '</td></tr>';
        } else if (q.type === "checkbox") {
          html += '<tr><td class="rlabel">' + escapeHtml(q.label) + '</td><td>' + (a[q.id] ? "Ya (Setuju)" : "Tidak") + '</td></tr>';
        } else {
          html += '<tr><td class="rlabel">' + escapeHtml(q.label) + '</td><td>' + escapeHtml(a[q.id] || "\u2014") + '</td></tr>';
        }
      });

      html += '</table></div>';
    });

    detailBody.innerHTML = html;
    detailBody.querySelectorAll(".file-link").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        downloadFile(el.dataset.key, el.dataset.filename);
      });
    });
    detailOverlay.style.display = "flex";
  }

  detailCloseBtn.addEventListener("click", () => { detailOverlay.style.display = "none"; });
  detailOverlay.addEventListener("click", (e) => { if (e.target === detailOverlay) detailOverlay.style.display = "none"; });

  detailPdfBtn.addEventListener("click", () => {
    if (currentDetailRecord) downloadCandidatePDF(currentDetailRecord);
  });

  // ---------- Export PDF (tabel label/jawaban rapi, gaya sama seperti laporan di Panel Admin) ----------
  // buildCandidatePdfDoc mengembalikan objek jsPDF (belum di-save), supaya bisa
  // dipakai ulang baik untuk download satu laporan maupun untuk digabung jadi ZIP
  // di fitur "Download Semua Data".
  function buildCandidatePdfDoc(record) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 40;
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const usableWidth = pageWidth - marginX * 2;
      const labelW = usableWidth * 0.36;
      const gapW = 10;
      const lineH = 12.5;
      let y = 50;
      const a = record.answers || {};

      const NAVY = [11, 31, 59];
      const INK = [28, 31, 38];
      const SOFT = [91, 98, 112];
      const LINE = [224, 224, 224];
      const BOX_BG = [247, 245, 238];
      const BOX_BORDER = [222, 216, 201];

      function ensureSpace(next) {
        if (y + next > pageHeight - 40) { doc.addPage(); y = 50; }
      }

      function ensureBlock(estimatedHeight) {
  const maxPerPage = pageHeight - 50 - 40;
  const capped = Math.min(estimatedHeight, maxPerPage);
  ensureSpace(capped);
}

      // Font standar jsPDF (Helvetica) cuma support karakter Latin dasar (WinAnsi).
      // Kalau ada 1 karakter aneh (bullet dari paste Word, simbol PUA, emoji, dst)
      // nyempil di satu baris teks, jsPDF bisa salah hitung lebar & render tiap
      // huruf jadi renggang serta meluber keluar kolom/halaman ("offside").
      // Fungsi ini membersihkan teks sebelum dikirim ke jsPDF, tanpa mengubah makna isinya.
      function sanitizePdfText(input) {
        if (input == null) return input;
        let s = String(input);

        // Normalisasi karakter "smart" dari Word ke padanan ASCII yang aman
        s = s
          .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
          .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
          .replace(/[\u2010\u2011\u2012\u2013\u2015]/g, "-")
          .replace(/\u2014/g, "--")
          .replace(/\u2026/g, "...")
          .replace(/\u00A0/g, " ")
          // Berbagai varian bullet (termasuk simbol private-use area dari font Wingdings/Symbol)
          .replace(/[\u2022\u2023\u25CF\u25AA\u25E6\u25A0\u25CB\u2043\u204C\u204D\u2219\uF0B7\uF0A7\uF06C\uF0D8]/g, "-");

        // Buang karakter kontrol, surrogate pair (emoji, dsb), dan Private Use Area
        s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
        s = s.replace(/[\uD800-\uDFFF]/g, "");
        s = s.replace(/[\uE000-\uF8FF]/g, "");

        // Jaring pengaman terakhir: hanya loloskan karakter yang pasti didukung
        // font standar Helvetica (ASCII cetak + Latin-1 supplement), sisanya dibuang.
        s = s.replace(/[^\t\n\r\x20-\x7E\u00A1-\u00FF]/g, "");

        // Rapikan spasi ganda yang mungkin muncul akibat karakter yang dibuang
        s = s.replace(/[ \t]{2,}/g, " ").trim();

        // Pecah kata yang sangat panjang tanpa spasi (URL/nomor panjang) supaya
        // tetap bisa di-wrap dan tidak meluber keluar kolom
        s = s.replace(/\S{40,}/g, (word) => word.replace(/(.{40})/g, "$1\u200B "));

        return s;
      }

      function wrap(text, width, size, bold) {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        const clean = sanitizePdfText(text);
        return doc.splitTextToSize(String(clean == null || clean === "" ? "\u2014" : clean), width);
      }

      // Satu baris tabel: label (kiri, bold, navy) + jawaban (kanan), dengan garis pemisah tipis.
      function kvRow(label, value, opts) {
        opts = opts || {};
        const indent = opts.indent || 0;
        const lw = labelW - indent;
        const vw = usableWidth - labelW - gapW - indent;
        const labelLines = wrap(label, lw, 9.5, true);
        const valueLines = wrap(value, vw, 9.5, false);
        const rows = Math.max(labelLines.length, valueLines.length);
        const padY = 7;
        const rowH = rows * lineH + padY * 2;
        ensureSpace(rowH);
        const top = y + padY + 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        labelLines.forEach((ln, i) => doc.text(ln, marginX + indent, top + i * lineH));

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        valueLines.forEach((ln, i) => doc.text(ln, marginX + indent + labelW, top + i * lineH));

        y += rowH;
        doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
        doc.setLineWidth(0.6);
        doc.line(marginX + indent, y, marginX + usableWidth, y);
      }

      function sigRow(label, dataUrl) {
        const padY = 8;
        const boxH = 46;
        ensureSpace(boxH + padY * 2);
        const top = y + padY;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.text(sanitizePdfText(label), marginX, top + 10);
        if (dataUrl) {
          try { doc.addImage(dataUrl, "PNG", marginX + labelW, top - 4, 140, 40); } catch (e) {}
        } else {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(SOFT[0], SOFT[1], SOFT[2]);
          doc.text("\u2014", marginX + labelW, top + 10);
        }
        y += boxH + padY;
        doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
        doc.setLineWidth(0.6);
        doc.line(marginX, y, marginX + usableWidth, y);
      }

     // Hitung tinggi kotak abu untuk satu baris repeater (dipakai buat pra-ukur & saat gambar).
      function measureBoxHeight(q, row, idx) {
        const indent = 12;
        const innerLabelW = labelW - indent - 14;
        const innerValueW = usableWidth - labelW - gapW - indent * 2 - 14;
        const fieldLines = (q.fields || []).map((sub) => {
          const val = sub.type === "file"
            ? (function () { const f = findFile(record, q.id, idx, sub.id); return f ? f.filename + " (unduh manual di Panel Admin)" : "\u2014"; })()
            : (row[sub.id] || "\u2014");
          const ll = wrap(sub.label, innerLabelW, 9, true);
          const vl = wrap(val, innerValueW, 9, false);
          return { sub: sub, val: val, rows: Math.max(ll.length, vl.length) };
        });
        const tagH = 18;
        const rowPad = 5;
        const contentH = fieldLines.reduce((sum, f) => sum + f.rows * 11.5 + rowPad * 2, 0);
        return { fieldLines: fieldLines, boxH: tagH + contentH + 10 };
      }

      // Kelompok berulang (Referensi, Riwayat Kerja, dst): dibungkus kotak abu, tiap baris jadi mini-tabel di dalamnya.
      function repeaterGroup(q, rows) {
        const firstBoxH = rows.length ? measureBoxHeight(q, rows[0], 0).boxH : 0;
        ensureBlock(20 + firstBoxH + 8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.text(sanitizePdfText(q.label), marginX, y + 14);
        y += 20;

        if (!rows.length) {
          kvRow("\u2014", "", { indent: 12 });
          return;
        }

        rows.forEach((row, idx) => {
          const indent = 12;
          const innerLabelW = labelW - indent - 14;
          const innerValueW = usableWidth - labelW - gapW - indent * 2 - 14;

          const measured = measureBoxHeight(q, row, idx);
          const fieldLines = measured.fieldLines;
          const boxH = measured.boxH;

          ensureBlock(boxH + 8);
          const boxTop = y;
          doc.setFillColor(BOX_BG[0], BOX_BG[1], BOX_BG[2]);
          doc.setDrawColor(BOX_BORDER[0], BOX_BORDER[1], BOX_BORDER[2]);
          doc.setLineWidth(0.7);
          doc.roundedRect(marginX, boxTop, usableWidth, boxH, 4, 4, "FD");

          let iy = boxTop + 18;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(201, 162, 39);
          doc.text(sanitizePdfText(String(q.itemLabel || "Baris").toUpperCase() + " " + (idx + 1)), marginX + 12, boxTop + 12);

          fieldLines.forEach((f) => {
            const rh = f.rows * 11.5 + 5 * 2;
            const ll = wrap(f.sub.label, innerLabelW, 9, true);
            const vl = wrap(f.val, innerValueW, 9, false);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
            ll.forEach((ln, i) => doc.text(ln, marginX + indent, iy + 5 + 8 + i * 11.5));
            doc.setFont("helvetica", "normal");
            doc.setTextColor(INK[0], INK[1], INK[2]);
            vl.forEach((ln, i) => doc.text(ln, marginX + indent + innerLabelW + 14, iy + 5 + 8 + i * 11.5));
            iy += rh;
          });

          y = boxTop + boxH + 8;
        });
      }
    // ---- Header laporan ----
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.text("Laporan Data Kandidat - HRD Demo", marginX, y);
      y += 8;
      doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.setLineWidth(1.4);
      doc.line(marginX, y, marginX + usableWidth, y);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(SOFT[0], SOFT[1], SOFT[2]);
      doc.text("Dikirim: " + new Date(record.submittedAt).toLocaleString("id-ID"), marginX, y);
      y += 20;

      sections.forEach((sec) => {
        const secQuestions = questions.filter((q) => (q.section || sections[0].id) === sec.id);
        if (!secQuestions.length) return;

        ensureSpace(30 + 40);
        y += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11.5);
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.text(sanitizePdfText(sec.title.toUpperCase()), marginX, y);
        y += 7;
        doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
        doc.setLineWidth(0.8);
        doc.line(marginX, y, marginX + usableWidth, y);
        y += 14;

        secQuestions.forEach((q) => {
          if (q.type === "repeater") {
            repeaterGroup(q, Array.isArray(a[q.id]) ? a[q.id] : []);
          } else if (q.type === "file") {
            const f = findFile(record, q.id, null, null);
            kvRow(q.label, f ? f.filename + " (unduh manual di Panel Admin)" : "\u2014");
          } else if (q.type === "signature") {
            sigRow(q.label, a[q.id]);
          } else if (q.type === "checkbox") {
            kvRow(q.label, a[q.id] ? "Ya (Setuju)" : "Tidak");
          } else {
            kvRow(q.label, a[q.id]);
          }
        });
        y += 10;
      });

      if (record.files && record.files.length) {
       ensureBlock(30 + 14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.text("LAMPIRAN FILE (unduh satu per satu dari Panel Admin, lalu satukan manual)", marginX, y);
        y += 8;
        doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
        doc.line(marginX, y, marginX + usableWidth, y);
        y += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(INK[0], INK[1], INK[2]);
        record.files.forEach((f) => {
          ensureSpace(14);
          doc.text("\u2022 " + sanitizePdfText(f.filename), marginX + 4, y);
          y += 14;
        });
      }

      const cleanName = String(candidateName(record)).replace(/[^a-z0-9]+/gi, "-").slice(0, 40);
      return { doc, cleanName };
  }

  async function downloadCandidatePDF(record) {
    try {
      const { doc, cleanName } = buildCandidatePdfDoc(record);
      doc.save("Laporan-Kandidat-" + cleanName + ".pdf");
    } catch (err) {
      subAlert.innerHTML = '<div class="msg msg-err">Gagal membuat PDF laporan.</div>';
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  // ================= CONFIG: SECTIONS + QUESTIONS =================
  async function loadConfig() {
    try {
      const res = await authedFetch("/.netlify/functions/admin-questions");
      const data = await res.json();
      sections = (data && data.sections && data.sections.length) ? data.sections : [{ id: "umum", title: "Umum" }];
      questions = (data && data.questions) || [];
      renderSections();
      renderQuestions();
    } catch (e) {
      if (e.message !== "Unauthorized") questionsList.innerHTML = '<p class="hint">Gagal memuat konfigurasi formulir.</p>';
    }
  }

  function slugify(text, existingIds) {
    let base = (text || "bagian").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "bagian";
    let id = base;
    let n = 1;
    while (existingIds.includes(id)) { id = base + "-" + (++n); }
    return id;
  }

  function renderSections() {
    sectionsList.innerHTML = "";
    sections.forEach((sec, idx) => {
      const row = document.createElement("div");
      row.className = "sec-row";

      const order = document.createElement("div");
      order.className = "q-order";
      const upBtn = document.createElement("button");
      upBtn.type = "button"; upBtn.textContent = "\u25B2"; upBtn.disabled = idx === 0;
      upBtn.addEventListener("click", () => { moveSection(idx, -1); });
      const downBtn = document.createElement("button");
      downBtn.type = "button"; downBtn.textContent = "\u25BC"; downBtn.disabled = idx === sections.length - 1;
      downBtn.addEventListener("click", () => { moveSection(idx, 1); });
      order.appendChild(upBtn); order.appendChild(downBtn);
      row.appendChild(order);

      const main = document.createElement("div");
      main.className = "q-main";
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.placeholder = "Judul bagian";
      titleInput.value = sec.title || "";
      titleInput.addEventListener("input", () => { sec.title = titleInput.value; renderQuestions(); });
      main.appendChild(titleInput);

      const descInput = document.createElement("input");
      descInput.type = "text";
      descInput.placeholder = "Deskripsi singkat bagian ini (opsional)";
      descInput.value = sec.description || "";
      descInput.style.cssText = "margin-top:6px; padding:8px 10px; font-size:13px; border:1px solid #cfd3dc; border-radius:6px; width:100%; font-family:var(--font-body);";
      descInput.addEventListener("input", () => { sec.description = descInput.value; });
      main.appendChild(descInput);

      row.appendChild(main);

      const actions = document.createElement("div");
      actions.className = "q-actions";
      const delBtn = document.createElement("button");
      delBtn.type = "button"; delBtn.className = "btn btn-danger"; delBtn.textContent = "Hapus";
      delBtn.addEventListener("click", () => removeSection(idx));
      actions.appendChild(delBtn);
      row.appendChild(actions);

      sectionsList.appendChild(row);
    });
  }

  function moveSection(idx, dir) {
    const t = idx + dir;
    if (t < 0 || t >= sections.length) return;
    const tmp = sections[idx]; sections[idx] = sections[t]; sections[t] = tmp;
    renderSections(); renderQuestions();
  }

  function removeSection(idx) {
    if (sections.length <= 1) { qAlert.innerHTML = '<div class="msg msg-err">Minimal harus ada 1 bagian.</div>'; return; }
    const sec = sections[idx];
    const usedBy = questions.filter((q) => q.section === sec.id).length;
    if (usedBy > 0 && !confirm('Bagian "' + sec.title + '" masih dipakai oleh ' + usedBy + ' pertanyaan. Pertanyaan itu akan dipindah ke bagian pertama. Lanjutkan?')) return;
    questions.forEach((q) => { if (q.section === sec.id) q.section = sections[0].id === sec.id ? (sections[1] && sections[1].id) : sections[0].id; });
    sections.splice(idx, 1);
    renderSections(); renderQuestions();
  }

  addSectionBtn.addEventListener("click", () => {
    const id = slugify("bagian-baru-" + Date.now().toString(36), sections.map((s) => s.id));
    sections.push({ id: id, title: "Bagian Baru", description: "" });
    renderSections(); renderQuestions();
  });

  function renderQuestions() {
    questionsList.innerHTML = "";
    questions.forEach((q, idx) => {
      questionsList.appendChild(buildQuestionRow(q, idx));
    });
  }

  function buildQuestionRow(q, idx) {
    const row = document.createElement("div");
    row.className = "q-row";

    const order = document.createElement("div");
    order.className = "q-order";
    const upBtn = document.createElement("button");
    upBtn.type = "button"; upBtn.textContent = "\u25B2"; upBtn.disabled = idx === 0;
    upBtn.addEventListener("click", () => moveQuestion(idx, -1));
    const downBtn = document.createElement("button");
    downBtn.type = "button"; downBtn.textContent = "\u25BC"; downBtn.disabled = idx === questions.length - 1;
    downBtn.addEventListener("click", () => moveQuestion(idx, 1));
    order.appendChild(upBtn); order.appendChild(downBtn);
    row.appendChild(order);

    const main = document.createElement("div");
    main.className = "q-main";

    const topRow = document.createElement("div");
    topRow.style.cssText = "display:flex; gap:8px; flex-wrap:wrap;";

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.placeholder = "Teks pertanyaan";
    labelInput.value = q.label || "";
    labelInput.style.flex = "2";
    labelInput.style.minWidth = "220px";
    labelInput.addEventListener("input", () => (q.label = labelInput.value));
    topRow.appendChild(labelInput);

    const sectionSelect = document.createElement("select");
    sectionSelect.style.flex = "1";
    sectionSelect.style.minWidth = "150px";
    sections.forEach((sec) => {
      const o = document.createElement("option");
      o.value = sec.id; o.textContent = sec.title;
      if ((q.section || sections[0].id) === sec.id) o.selected = true;
      sectionSelect.appendChild(o);
    });
    sectionSelect.addEventListener("change", () => (q.section = sectionSelect.value));
    topRow.appendChild(sectionSelect);

    main.appendChild(topRow);

    const descInput = document.createElement("textarea");
    descInput.placeholder = "Deskripsi/keterangan (opsional)";
    descInput.value = q.description || "";
    descInput.rows = 1;
    descInput.style.cssText = "margin-top:6px; padding:8px 10px; font-size:13px; border:1px solid #cfd3dc; border-radius:6px; width:100%; font-family:var(--font-body); resize:vertical;";
    descInput.addEventListener("input", () => (q.description = descInput.value));
    main.appendChild(descInput);

    const imageRow = document.createElement("div");
    imageRow.style.cssText = "margin-top:6px; display:flex; gap:8px; align-items:center;";
    const imageInput = document.createElement("input");
    imageInput.type = "text";
    imageInput.placeholder = "URL gambar panduan (opsional), mis. images/panduan-mbti.jpg";
    imageInput.value = q.image || "";
    imageInput.style.cssText = "flex:1; padding:8px 10px; font-size:13px; border:1px solid #cfd3dc; border-radius:6px; font-family:var(--font-body);";
    const imagePreview = document.createElement("img");
    imagePreview.style.cssText = "width:34px; height:34px; object-fit:cover; border-radius:6px; border:1px solid #cfd3dc; display:" + (q.image ? "block" : "none") + ";";
    if (q.image) imagePreview.src = q.image;
    imageInput.addEventListener("input", () => {
      q.image = imageInput.value.trim();
      if (q.image) {
        imagePreview.src = q.image;
        imagePreview.style.display = "block";
      } else {
        imagePreview.style.display = "none";
      }
    });
    imageRow.appendChild(imageInput);
    imageRow.appendChild(imagePreview);
    main.appendChild(imageRow);

    const optionsInput = document.createElement("input");
    optionsInput.type = "text";
    optionsInput.placeholder = "Pilihan, pisahkan dengan koma (khusus Dropdown/Radio)";
    optionsInput.value = (q.options || []).join(", ");
    optionsInput.style.cssText = "margin-top:6px; padding:8px 10px; font-size:13px; border:1px solid #cfd3dc; border-radius:6px; width:100%; font-family:var(--font-body); display:" + ((q.type === "select" || q.type === "radio") ? "block" : "none") + ";";
    optionsInput.addEventListener("input", () => {
      q.options = optionsInput.value.split(",").map((s) => s.trim()).filter(Boolean);
    });
    main.appendChild(optionsInput);

    const subFieldsWrap = document.createElement("div");
    subFieldsWrap.className = "subfields-wrap";
    subFieldsWrap.style.display = q.type === "repeater" ? "block" : "none";
    if (!Array.isArray(q.fields)) q.fields = [];
    renderSubFields(subFieldsWrap, q);
    main.appendChild(subFieldsWrap);

    const meta = document.createElement("div");
    meta.className = "q-meta";

    const typeSelect = document.createElement("select");
    Object.entries(TYPE_LABELS).forEach(([val, label]) => {
      const o = document.createElement("option");
      o.value = val; o.textContent = label;
      if (q.type === val) o.selected = true;
      typeSelect.appendChild(o);
    });
    typeSelect.addEventListener("change", () => {
      q.type = typeSelect.value;
      optionsInput.style.display = (q.type === "select" || q.type === "radio") ? "block" : "none";
      subFieldsWrap.style.display = q.type === "repeater" ? "block" : "none";
      if (q.type === "repeater" && !Array.isArray(q.fields)) { q.fields = []; renderSubFields(subFieldsWrap, q); }
    });
    meta.appendChild(typeSelect);

    const reqLabel = document.createElement("label");
    const reqCheck = document.createElement("input");
    reqCheck.type = "checkbox";
    reqCheck.checked = !!q.required;
    reqCheck.addEventListener("change", () => (q.required = reqCheck.checked));
    reqLabel.appendChild(reqCheck);
    reqLabel.appendChild(document.createTextNode("Wajib diisi"));
    meta.appendChild(reqLabel);

    main.appendChild(meta);
    row.appendChild(main);

    const actions = document.createElement("div");
    actions.className = "q-actions";
    const delBtn = document.createElement("button");
    delBtn.type = "button"; delBtn.className = "btn btn-danger"; delBtn.textContent = "Hapus";
    delBtn.addEventListener("click", () => removeQuestion(idx));
    actions.appendChild(delBtn);
    row.appendChild(actions);

    return row;
  }

  function renderSubFields(wrap, q) {
    wrap.innerHTML = '<div class="hint" style="margin:8px 0 6px;">Kolom di dalam setiap baris grup ini:</div>';
    q.fields.forEach((sub, sIdx) => {
      const subRow = document.createElement("div");
      subRow.className = "subfield-row";

      const subOrder = document.createElement("div");
      subOrder.style.cssText = "display:flex; flex-direction:column; gap:1px;";
      const subUpBtn = document.createElement("button");
      subUpBtn.type = "button";
      subUpBtn.textContent = "\u25B2";
      subUpBtn.disabled = sIdx === 0;
      subUpBtn.style.cssText = "padding:2px 7px; font-size:10px; line-height:1; border:1px solid #cfd3dc; border-radius:4px; background:#fff; cursor:pointer;";
      subUpBtn.addEventListener("click", () => moveSubField(wrap, q, sIdx, -1));
      const subDownBtn = document.createElement("button");
      subDownBtn.type = "button";
      subDownBtn.textContent = "\u25BC";
      subDownBtn.disabled = sIdx === q.fields.length - 1;
      subDownBtn.style.cssText = "padding:2px 7px; font-size:10px; line-height:1; border:1px solid #cfd3dc; border-radius:4px; background:#fff; cursor:pointer;";
      subDownBtn.addEventListener("click", () => moveSubField(wrap, q, sIdx, 1));
      subOrder.appendChild(subUpBtn);
      subOrder.appendChild(subDownBtn);
      subRow.appendChild(subOrder);

      const subLabel = document.createElement("input");
      subLabel.type = "text";
      subLabel.placeholder = "Label kolom";
      subLabel.value = sub.label || "";
      subLabel.addEventListener("input", () => (sub.label = subLabel.value));
      subRow.appendChild(subLabel);

      const subType = document.createElement("select");
      Object.entries(SUB_TYPE_LABELS).forEach(([val, label]) => {
        const o = document.createElement("option");
        o.value = val; o.textContent = label;
        if (sub.type === val) o.selected = true;
        subType.appendChild(o);
      });
      subType.addEventListener("change", () => {
        sub.type = subType.value;
        subOptions.style.display = (sub.type === "select" || sub.type === "radio") ? "inline-block" : "none";
      });
      subRow.appendChild(subType);

      const subOptions = document.createElement("input");
      subOptions.type = "text";
      subOptions.placeholder = "Pilihan (koma)";
      subOptions.value = (sub.options || []).join(", ");
      subOptions.style.display = (sub.type === "select" || sub.type === "radio") ? "inline-block" : "none";
      subOptions.addEventListener("input", () => {
        sub.options = subOptions.value.split(",").map((s) => s.trim()).filter(Boolean);
      });
      subRow.appendChild(subOptions);

      const subReqLabel = document.createElement("label");
      subReqLabel.style.cssText = "display:flex; align-items:center; gap:4px; font-size:12.5px; white-space:nowrap;";
      const subReq = document.createElement("input");
      subReq.type = "checkbox";
      subReq.checked = !!sub.required;
      subReq.addEventListener("change", () => (sub.required = subReq.checked));
      subReqLabel.appendChild(subReq);
      subReqLabel.appendChild(document.createTextNode("Wajib"));
      subRow.appendChild(subReqLabel);

      const subDel = document.createElement("button");
      subDel.type = "button";
      subDel.className = "btn btn-danger";
      subDel.textContent = "\u2715";
      subDel.style.cssText = "padding:6px 9px;";
      subDel.addEventListener("click", () => {
        q.fields.splice(sIdx, 1);
        renderSubFields(wrap, q);
      });
      subRow.appendChild(subDel);

      wrap.appendChild(subRow);
    });

    const addSubBtn = document.createElement("button");
    addSubBtn.type = "button";
    addSubBtn.className = "btn-add";
    addSubBtn.style.cssText = "margin-top:6px; padding:6px 12px; font-size:12.5px;";
    addSubBtn.textContent = "+ Tambah Kolom";
    addSubBtn.addEventListener("click", () => {
      q.fields.push({ id: "kolom_" + Date.now().toString(36), label: "Kolom Baru", type: "text" });
      renderSubFields(wrap, q);
    });
    wrap.appendChild(addSubBtn);
  }

  function moveQuestion(idx, dir) {
    const t = idx + dir;
    if (t < 0 || t >= questions.length) return;
    const tmp = questions[idx]; questions[idx] = questions[t]; questions[t] = tmp;
    renderQuestions();
  }

  function moveSubField(wrap, q, sIdx, dir) {
    const t = sIdx + dir;
    if (t < 0 || t >= q.fields.length) return;
    const tmp = q.fields[sIdx]; q.fields[sIdx] = q.fields[t]; q.fields[t] = tmp;
    renderSubFields(wrap, q);
  }

  function removeQuestion(idx) {
    if (questions.length <= 1) { qAlert.innerHTML = '<div class="msg msg-err">Minimal harus ada 1 pertanyaan.</div>'; return; }
    if (!confirm("Hapus pertanyaan ini dari formulir?")) return;
    questions.splice(idx, 1);
    renderQuestions();
  }

  addQuestionBtn.addEventListener("click", () => {
    const id = "q_" + Date.now().toString(36);
    questions.push({ id: id, label: "Pertanyaan Baru", type: "text", required: false, section: sections[0].id });
    renderQuestions();
  });

  saveQuestionsBtn.addEventListener("click", async () => {
    const emptySec = sections.find((s) => !s.title || !s.title.trim());
    if (emptySec) { qAlert.innerHTML = '<div class="msg msg-err">Semua bagian harus punya judul.</div>'; return; }
    const emptyLabel = questions.find((q) => !q.label || !q.label.trim());
    if (emptyLabel) { qAlert.innerHTML = '<div class="msg msg-err">Semua pertanyaan harus punya teks pertanyaan.</div>'; return; }

    // pastikan setiap section punya id (untuk section baru yang idnya belum di-slug)
    const usedIds = [];
    sections.forEach((s) => {
      if (!s.id) s.id = slugify(s.title, usedIds);
      usedIds.push(s.id);
    });

    saveQuestionsBtn.disabled = true;
    saveQuestionsBtn.textContent = "Menyimpan\u2026";
    try {
      const res = await authedFetch("/.netlify/functions/admin-questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: sections, questions: questions }),
      });
      if (!res.ok) {
        let msg = "Gagal menyimpan (status " + res.status + ").";
        try { const errData = await res.json(); if (errData && errData.message) msg = errData.message; } catch (e) {}
        qAlert.innerHTML = '<div class="msg msg-err">' + msg + '</div>';
      } else {
        qAlert.innerHTML = '<div class="msg msg-ok">Perubahan tersimpan. Formulir kandidat langsung ter-update.</div>';
      }
    } catch (e) {
      if (e.message !== "Unauthorized") qAlert.innerHTML = '<div class="msg msg-err">Gagal menyimpan perubahan (kemungkinan masalah jaringan).</div>';
    }
    saveQuestionsBtn.disabled = false;
    saveQuestionsBtn.textContent = "Simpan Perubahan";
  });

  // ================= TEMPLATE EMAIL (Diterima / Ditolak) =================
  async function loadEmailTemplates() {
    tplAlert.innerHTML = "";
    try {
      const res = await authedFetch("/.netlify/functions/admin-email-templates");
      const data = await res.json();
      const p = data.diproses || {};
      const d = data.diterima || {};
      const t = data.ditolak || {};
      tplDiprosesBadge.value = p.badgeLabel || "";
      tplDiprosesSubject.value = p.subject || "";
      tplDiprosesBody.value = p.body || "";
      tplDiterimaBadge.value = d.badgeLabel || "";
      tplDiterimaSubject.value = d.subject || "";
      tplDiterimaBody.value = d.body || "";
      tplDitolakBadge.value = t.badgeLabel || "";
      tplDitolakSubject.value = t.subject || "";
      tplDitolakBody.value = t.body || "";
      emailTemplatesLoaded = true;
    } catch (e) {
      if (e.message !== "Unauthorized") tplAlert.innerHTML = '<div class="msg msg-err">Gagal memuat template email.</div>';
    }
  }

  saveTemplatesBtn.addEventListener("click", async () => {
    const diproses = {
      badgeLabel: tplDiprosesBadge.value.trim(),
      subject: tplDiprosesSubject.value.trim(),
      body: tplDiprosesBody.value,
    };
    const diterima = {
      badgeLabel: tplDiterimaBadge.value.trim(),
      subject: tplDiterimaSubject.value.trim(),
      body: tplDiterimaBody.value,
    };
    const ditolak = {
      badgeLabel: tplDitolakBadge.value.trim(),
      subject: tplDitolakSubject.value.trim(),
      body: tplDitolakBody.value,
    };
    if (!diproses.subject || !diproses.body.trim() || !diterima.subject || !diterima.body.trim() || !ditolak.subject || !ditolak.body.trim()) {
      tplAlert.innerHTML = '<div class="msg msg-err">Subjek dan isi email wajib diisi untuk ketiga template.</div>';
      return;
    }
    saveTemplatesBtn.disabled = true;
    saveTemplatesBtn.textContent = "Menyimpan\u2026";
    try {
      const res = await authedFetch("/.netlify/functions/admin-email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diproses: diproses, diterima: diterima, ditolak: ditolak }),
      });
      if (!res.ok) {
        let msg = "Gagal menyimpan (status " + res.status + ").";
        try { const errData = await res.json(); if (errData && errData.message) msg = errData.message; } catch (e) {}
        tplAlert.innerHTML = '<div class="msg msg-err">' + msg + '</div>';
      } else {
        tplAlert.innerHTML = '<div class="msg msg-ok">Template email tersimpan.</div>';
      }
    } catch (e) {
      if (e.message !== "Unauthorized") tplAlert.innerHTML = '<div class="msg msg-err">Gagal menyimpan template (kemungkinan masalah jaringan).</div>';
    }
    saveTemplatesBtn.disabled = false;
    saveTemplatesBtn.textContent = "Simpan Template";
  });

  // ---------- Init ----------
  if (getToken()) { showAdmin(); } else { showLogin(); }
})();
