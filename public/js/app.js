(function () {
  const loadingState = document.getElementById("loadingState");
  const formLayout = document.getElementById("formLayout");
  const sidenav = document.getElementById("sidenav");
  const sectionsContainer = document.getElementById("sectionsContainer");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const alertBox = document.getElementById("alertBox");
  const successState = document.getElementById("successState");
  const candidateFormEl = document.getElementById("candidateForm");
  const fileBudget = document.getElementById("fileBudget");
  const fileBudgetText = document.getElementById("fileBudgetText");
  const fileBudgetFill = document.getElementById("fileBudgetFill");

  // Cegah form ke-submit native (reload halaman) kalau kandidat pencet Enter
  // di keyboard saat mengisi field teks — semua pengiriman data harus lewat
  // tombol "Kirim Data" / submitForm() di JS, bukan submit bawaan browser.
  if (candidateFormEl) {
    candidateFormEl.addEventListener("submit", (e) => {
      e.preventDefault();
    });
  }

  let SECTIONS = [];
  let QUESTIONS = [];
  let current = 0;
  const signaturePads = {};
  const repeaterCounters = {};

  // Mode demo terkunci (lihat penjelasan lengkap di init() & submitForm()
  // di bawah): situs ini dipublikasikan sebagai contoh portofolio, jadi
  // form kandidat TIDAK PERNAH mengirim data ke backend/Netlify Functions
  // asli. Semua jawaban hanya disimpan sementara di localStorage browser
  // masing-masing pengunjung, supaya data master tidak pernah berubah.
  const DEMO_ONLY_MODE = true;

  // Netlify function punya batas KERAS 6MB per request (tidak bisa dinaikkan,
  // termasuk di paket berbayar), dan base64 encoding menambah ~33% ukuran file.
  // Form ini punya banyak field upload (ijazah, transkrip, slip gaji, dst) yang
  // semuanya digabung jadi SATU kiriman — jadi batasnya bukan per file, tapi
  // TOTAL gabungan semua file dalam satu submit. Angka di bawah dikasih margin
  // aman supaya total request (setelah base64 + data jawaban) tetap di bawah 6MB.
  const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB per file
  const MAX_TOTAL_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB gabungan semua file

  function formatBytes(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + "MB";
    return Math.round(bytes / 1024) + "KB";
  }

  // Semua bagian form dirender sekaligus ke DOM (cuma disembunyikan lewat
  // display:none saat pindah bagian, bukan dihapus), jadi query ini otomatis
  // mencakup file yang sudah dipilih di bagian manapun, termasuk yang sudah
  // dilewati kandidat — bukan cuma bagian yang lagi aktif.
  function recomputeFileBudget() {
    if (!fileBudget) return;
    const inputs = sectionsContainer.querySelectorAll('input[type="file"]');
    let total = 0;
    let count = 0;
    inputs.forEach((inp) => {
      if (inp.files && inp.files[0]) { total += inp.files[0].size; count++; }
    });
    if (count === 0) { fileBudget.style.display = "none"; return; }
    fileBudget.style.display = "block";
    const pct = Math.min(100, (total / MAX_TOTAL_UPLOAD_BYTES) * 100);
    fileBudgetFill.style.width = pct + "%";
    fileBudgetFill.className = "file-budget-fill" + (total > MAX_TOTAL_UPLOAD_BYTES ? " over" : (pct > 70 ? " warn" : ""));
    fileBudgetText.textContent = formatBytes(total) + " / " + formatBytes(MAX_TOTAL_UPLOAD_BYTES);
  }

  init();

  // Pertanyaan contoh (sample) dipakai sebagai fallback kalau backend/Netlify
  // Blobs belum terkonfigurasi, supaya form tetap bisa ditampilkan & dicoba
  // sebagai demo publik dalam satu link tanpa perlu setup database apapun.
  const FALLBACK_SECTIONS = [
    { id: "pribadi", title: "Data Pribadi", description: "Identitas dasar dan informasi kontak." },
    { id: "keluarga", title: "Keluarga & Referensi", description: "Bisa tambah lebih dari satu referensi." },
    { id: "darurat", title: "Kontak Darurat", description: "Orang yang bisa dihubungi segera dalam keadaan darurat." },
    { id: "pendidikan", title: "Pendidikan", description: "Riwayat pendidikan formal dan dokumen pendukung." },
    { id: "pekerjaan", title: "Riwayat Pekerjaan", description: "Mulai dari pekerjaan terakhir." },
    { id: "tambahan", title: "Pertanyaan Tambahan", description: "Jawab dengan jujur." },
    { id: "penutup", title: "Harapan, Tes & Persetujuan", description: "Bagian terakhir sebelum kirim." },
  ];
  const FALLBACK_QUESTIONS = [
    { id: "nama", section: "pribadi", type: "text", label: "Nama Lengkap", required: true },
    { id: "posisi", section: "pribadi", type: "text", label: "Pekerjaan yang Dilamar", required: true },
    { id: "email", section: "pribadi", type: "email", label: "Alamat Email", required: true },
    { id: "hp", section: "pribadi", type: "tel", label: "Nomor Handphone", required: true },
    { id: "tempat_lahir", section: "pribadi", type: "text", label: "Tempat Lahir" },
    { id: "tanggal_lahir", section: "pribadi", type: "date", label: "Tanggal Lahir" },
    { id: "jenis_kelamin", section: "pribadi", type: "select", label: "Jenis Kelamin", options: ["Laki-laki", "Perempuan"] },
    { id: "status_perkawinan", section: "pribadi", type: "select", label: "Status Perkawinan", options: ["Belum Kawin", "Kawin", "Cerai"] },
    { id: "alamat_domisili", section: "pribadi", type: "textarea", label: "Alamat Domisili" },
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
    {
      id: "riwayat_kerja", section: "pekerjaan", type: "repeater", label: "Riwayat Pekerjaan (mulai dari yang terakhir)",
      itemLabel: "Pekerjaan", addLabel: "+ Tambah Riwayat Pekerjaan", minRows: 1,
      fields: [
        { id: "jabatan", label: "Jabatan Terakhir", type: "text" },
        { id: "perusahaan", label: "Nama Perusahaan", type: "text" },
        { id: "bulan_masuk", label: "Bulan & Tahun Masuk", type: "month" },
        { id: "bulan_keluar", label: "Bulan & Tahun Keluar", type: "month" },
        { id: "gaji", label: "Gaji Terakhir", type: "number" },
        { id: "alasan_berhenti", label: "Alasan Berhenti", type: "text" },
        { id: "uraian_tugas", label: "Uraian Tugas & Tanggung Jawab", type: "textarea" },
      ],
    },
    { id: "melamar_lain", section: "tambahan", type: "radio", label: "Selain di sini, apakah Anda melamar pekerjaan di perusahaan lain?", options: ["Ya", "Tidak"] },
    { id: "kontrak_kerja", section: "tambahan", type: "radio", label: "Apakah Anda terikat kontrak kerja dengan perusahaan tempat kerja Anda saat ini?", options: ["Ya", "Tidak"] },
    { id: "sedia_ditempatkan", section: "tambahan", type: "radio", label: "Bila diterima bekerja, bersediakah Anda ditempatkan sesuai kebutuhan Perusahaan?", options: ["Ya", "Tidak"] },
    { id: "cita_cita", section: "penutup", type: "text", label: "Macam pekerjaan/jabatan apakah yang sesuai dengan cita-cita Anda?" },
    { id: "ekspektasi_gaji", section: "penutup", type: "text", label: "Bila diterima bekerja, berapa besar gaji & fasilitas yang Anda harapkan?" },
    { id: "mulai_kerja", section: "penutup", type: "text", label: "Bila diterima bekerja, kapan Anda dapat mulai bekerja?" },
    { id: "pernyataan", section: "penutup", type: "checkbox", label: "Saya menyatakan seluruh data yang saya isi pada formulir ini adalah benar.", required: true },
    { id: "tanda_tangan", section: "penutup", type: "signature", label: "Tanda Tangan Pelamar", required: true },
  ];

  async function init() {
    if (DEMO_ONLY_MODE) {
      // Mode demo terkunci: jangan pernah panggil backend asli sama sekali,
      // supaya data master (kalau backend project ini pernah dikonfigurasi
      // sungguhan) tidak pernah terbaca oleh pengunjung publik.
      SECTIONS = FALLBACK_SECTIONS;
      QUESTIONS = FALLBACK_QUESTIONS;
      render();
      return;
    }
    try {
      const res = await fetch("/.netlify/functions/get-questions");
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      SECTIONS = (data.sections && data.sections.length) ? data.sections : FALLBACK_SECTIONS;
      QUESTIONS = (data.questions && data.questions.length) ? data.questions : FALLBACK_QUESTIONS;
      render();
    } catch (e) {
      // Backend/Netlify Blobs belum terkonfigurasi (mis. dijalankan sebagai demo
      // statis) — tetap tampilkan form pakai pertanyaan contoh, jangan macet.
      console.warn("get-questions gagal, memakai pertanyaan contoh (fallback).", e);
      SECTIONS = FALLBACK_SECTIONS;
      QUESTIONS = FALLBACK_QUESTIONS;
      render();
    }
  }

  function render() {
    loadingState.style.display = "none";
    formLayout.style.display = "grid";

    sidenav.innerHTML = '<div class="progress-label">BAGIAN <span id="stepLabel">1</span> DARI ' + SECTIONS.length + '</div>';
    SECTIONS.forEach((sec, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.section = idx;
      btn.innerHTML = '<span class="num">' + (idx + 1) + '</span> ' + escapeHtml(sec.title);
      btn.addEventListener("click", () => goTo(idx));
      sidenav.appendChild(btn);
    });

    sectionsContainer.innerHTML = "";
    SECTIONS.forEach((sec, idx) => {
      const secEl = document.createElement("section");
      secEl.className = "sec";
      secEl.dataset.sec = idx;
      secEl.style.display = idx === 0 ? "block" : "none";

      const head = document.createElement("div");
      head.className = "panel-head";
      head.innerHTML =
        '<div class="section-eyebrow">Bagian ' + (idx + 1) + '</div>' +
        '<h2>' + escapeHtml(sec.title) + '</h2>' +
        (sec.description ? '<p>' + escapeHtml(sec.description) + '</p>' : "");
      secEl.appendChild(head);

      let gridWrap = document.createElement("div");
      gridWrap.className = "grid2";

      const flush = () => {
        if (gridWrap.childNodes.length) secEl.appendChild(gridWrap);
        gridWrap = document.createElement("div");
        gridWrap.className = "grid2";
      };

      QUESTIONS.filter((q) => (q.section || SECTIONS[0].id) === sec.id).forEach((q) => {
        if (q.type === "repeater") {
          flush();
          secEl.appendChild(buildRepeater(q));
        } else if (q.type === "textarea" || q.type === "signature") {
          flush();
          secEl.appendChild(buildField(q, {}));
        } else {
          gridWrap.appendChild(buildField(q, {}));
        }
      });
      flush();

      sectionsContainer.appendChild(secEl);
    });

    Object.keys(signaturePads).forEach((qid) => setupSignaturePad(qid));
    goTo(0);
  }

  // Lightbox sederhana untuk menampilkan poster panduan (MBTI / Big Five) dalam
  // ukuran penuh saat thumbnail-nya diklik. Dibuat sekali dan dipakai ulang.
  let guideLightbox = null;
  function ensureGuideLightbox() {
    if (guideLightbox) return guideLightbox;
    const overlay = document.createElement("div");
    overlay.className = "guide-lightbox";
    overlay.innerHTML =
      '<div class="guide-lightbox-inner">' +
      '<button type="button" class="guide-lightbox-close" aria-label="Tutup">&times;</button>' +
      '<img class="guide-lightbox-img" alt="Panduan pengisian" />' +
      "</div>";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.classList.contains("guide-lightbox-close")) {
        overlay.classList.remove("open");
      }
    });
    guideLightbox = overlay;
    return overlay;
  }

  function openGuideLightbox(src) {
    const overlay = ensureGuideLightbox();
    overlay.querySelector(".guide-lightbox-img").src = src;
    overlay.classList.add("open");
  }

  function buildGuideImage(src, caption) {
    const box = document.createElement("div");
    box.className = "field-guide-image";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "field-guide-thumb";
    const img = document.createElement("img");
    img.src = src;
    img.alt = caption || "Panduan pengisian";
    img.loading = "lazy";
    btn.appendChild(img);
    const zoomHint = document.createElement("span");
    zoomHint.className = "field-guide-zoom";
    zoomHint.textContent = "Perbesar";
    btn.appendChild(zoomHint);
    btn.addEventListener("click", () => openGuideLightbox(src));
    box.appendChild(btn);

    const cap = document.createElement("p");
    cap.className = "hint field-guide-caption";
    cap.textContent = caption || "Klik gambar untuk melihat panduan langkah demi langkah.";
    box.appendChild(cap);

    return box;
  }

  function buildField(q, opts) {
    opts = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "field";

    const label = document.createElement("label");
    label.textContent = q.label || q.id;
    if (q.required) {
      const req = document.createElement("span");
      req.className = "req";
      req.textContent = "*";
      label.appendChild(req);
    }
    wrap.appendChild(label);
    if (q.description) {
      const hint = document.createElement("p");
      hint.className = "hint";
      hint.style.margin = "0 0 6px";
      hint.textContent = q.description;
      wrap.appendChild(hint);
    }
    if (q.image) {
      wrap.appendChild(buildGuideImage(q.image, q.imageCaption));
    }

    function dataAttrs(el) {
      el.dataset.qid = opts.subFieldOf || q.id;
      if (opts.rowIndex !== undefined) el.dataset.row = opts.rowIndex;
      if (opts.subFieldOf) el.dataset.field = q.id;
      if (q.required) el.required = true;
    }

    let input;
    if (q.type === "textarea") {
      input = document.createElement("textarea");
      dataAttrs(input);
    } else if (q.type === "select") {
      input = document.createElement("select");
      dataAttrs(input);
      input.appendChild(new Option("Pilih salah satu", ""));
      (q.options || []).forEach((o) => input.appendChild(new Option(o, o)));
    } else if (q.type === "radio") {
      const ynWrap = document.createElement("div");
      ynWrap.className = "yn";
      const name = "radio_" + (opts.subFieldOf || q.id) + "_" + (opts.rowIndex !== undefined ? opts.rowIndex : "x") + "_" + Math.random().toString(36).slice(2, 7);
      (q.options && q.options.length ? q.options : ["Ya", "Tidak"]).forEach((o) => {
        const optLabel = document.createElement("label");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = name;
        radio.value = o;
        dataAttrs(radio);
        optLabel.appendChild(radio);
        optLabel.appendChild(document.createTextNode(" " + o));
        ynWrap.appendChild(optLabel);
      });
      wrap.appendChild(ynWrap);
      return wrap;
    } else if (q.type === "checkbox") {
      const ynWrap = document.createElement("div");
      ynWrap.className = "yn";
      const optLabel = document.createElement("label");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      dataAttrs(cb);
      optLabel.appendChild(cb);
      optLabel.appendChild(document.createTextNode(" Ya, saya setuju"));
      ynWrap.appendChild(optLabel);
      wrap.appendChild(ynWrap);
      return wrap;
    } else if (q.type === "file") {
      const drop = document.createElement("label");
      drop.className = "file-drop";
      const dropText = document.createElement("span");
      dropText.textContent = "Klik untuk pilih file PDF";
      drop.appendChild(dropText);
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".pdf,application/pdf";
      fileInput.style.display = "none";
      dataAttrs(fileInput);
      const sizeHint = document.createElement("p");
      sizeHint.className = "hint file-size-hint";
      sizeHint.style.cssText = "margin:5px 0 0; font-size:11.5px; color:var(--ink-soft, #5b6270);";
      sizeHint.textContent = "Format PDF, maksimal " + formatBytes(MAX_UPLOAD_BYTES) + " per file.";
      const fileWarn = document.createElement("p");
      fileWarn.className = "hint file-size-warn";
      fileWarn.style.cssText = "margin:6px 0 0; display:none; color:var(--err);";
      fileInput.addEventListener("change", () => {
        // PENTING: jangan set drop.textContent di sini — drop adalah parent
        // dari fileInput, dan menimpa textContent akan menghapus fileInput
        // dari DOM (menyebabkan file yang sudah dipilih gagal terkirim saat submit).
        const f = fileInput.files[0];
        const isPdf = f && (f.type === "application/pdf" || /\.pdf$/i.test(f.name));
        if (f && !isPdf) {
          fileWarn.textContent = "Hanya file PDF yang diterima untuk kolom ini. \u201c" + f.name + "\u201d bukan file PDF — silakan pindai/simpan dulu sebagai PDF, lalu unggah ulang.";
          fileWarn.style.display = "block";
          fileInput.value = "";
          dropText.textContent = "Klik untuk pilih file PDF";
          drop.classList.remove("has-file");
          recomputeFileBudget();
          return;
        }
        if (f && f.size > MAX_UPLOAD_BYTES) {
          fileWarn.textContent = "File terlalu besar (" + formatBytes(f.size) + "). Maksimal " + formatBytes(MAX_UPLOAD_BYTES) + " per file — coba kompres/perkecil dulu PDF-nya.";
          fileWarn.style.display = "block";
          fileInput.value = "";
          dropText.textContent = "Klik untuk pilih file PDF";
          drop.classList.remove("has-file");
          recomputeFileBudget();
          return;
        }
        fileWarn.style.display = "none";
        dropText.textContent = f ? ("\u2713 " + f.name + " (" + formatBytes(f.size) + ")") : "Klik untuk pilih file PDF";
        drop.classList.toggle("has-file", !!f);
        recomputeFileBudget();
      });
      drop.appendChild(fileInput);
      wrap.appendChild(drop);
      wrap.appendChild(sizeHint);
      wrap.appendChild(fileWarn);
      return wrap;
    } else if (q.type === "signature") {
      const qid = opts.subFieldOf || q.id;
      const padWrap = document.createElement("div");
      padWrap.innerHTML =
        '<canvas class="sig-canvas" data-sig="' + qid + '" width="600" height="150"></canvas>' +
        '<button type="button" class="btn-add" data-sig-clear="' + qid + '" style="margin-top:8px;">Bersihkan Tanda Tangan</button>';
      wrap.appendChild(padWrap);
      signaturePads[qid] = { canvas: null, ctx: null, hasDrawing: false };
      return wrap;
    } else {
      input = document.createElement("input");
      input.type = q.type === "month" ? "month" : (q.type || "text");
      dataAttrs(input);
    }

    if (input) wrap.appendChild(input);
    return wrap;
  }

  function buildRepeater(q) {
    const holder = document.createElement("div");
    holder.className = "field";

    const label = document.createElement("label");
    label.textContent = q.label || q.id;
    if (q.required) {
      const req = document.createElement("span");
      req.className = "req";
      req.textContent = "*";
      label.appendChild(req);
    }
    holder.appendChild(label);

    const rowsHolder = document.createElement("div");
    rowsHolder.dataset.repeaterHolder = q.id;
    holder.appendChild(rowsHolder);

    repeaterCounters[q.id] = 0;

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn-add";
    addBtn.textContent = q.addLabel || ("+ Tambah " + (q.itemLabel || "Baris"));
    addBtn.addEventListener("click", () => addRepeaterRow(q, rowsHolder));
    holder.appendChild(addBtn);

    const minRows = q.minRows || 1;
    for (let i = 0; i < minRows; i++) addRepeaterRow(q, rowsHolder);

    return holder;
  }

  function addRepeaterRow(q, rowsHolder) {
    const rowIndex = repeaterCounters[q.id]++;
    const item = document.createElement("div");
    item.className = "repeater-item";
    item.dataset.qid = q.id;
    item.dataset.row = rowIndex;

    const tag = document.createElement("span");
    tag.className = "rep-tag";
    tag.textContent = (q.itemLabel || "BARIS").toUpperCase() + " " + (rowsHolder.children.length + 1);
    item.appendChild(tag);

    const removeBtn = document.createElement("span");
    removeBtn.className = "rep-remove";
    removeBtn.textContent = "Hapus";
    removeBtn.addEventListener("click", () => {
      const count = rowsHolder.querySelectorAll(".repeater-item").length;
      if (count <= (q.minRows || 1)) {
        showAlert("err", "Minimal harus ada " + (q.minRows || 1) + " " + (q.itemLabel || "baris").toLowerCase() + ".");
        return;
      }
      item.remove();
      renumberRepeater(rowsHolder, q.itemLabel);
      recomputeFileBudget();
    });
    item.appendChild(removeBtn);

    let grid = document.createElement("div");
    grid.className = "grid2";
    (q.fields || []).forEach((sub) => {
      if (sub.type === "textarea") {
        if (grid.childNodes.length) { item.appendChild(grid); grid = document.createElement("div"); grid.className = "grid2"; }
        item.appendChild(buildField(sub, { subFieldOf: q.id, rowIndex: rowIndex }));
      } else {
        grid.appendChild(buildField(sub, { subFieldOf: q.id, rowIndex: rowIndex }));
      }
    });
    if (grid.childNodes.length) item.appendChild(grid);

    rowsHolder.appendChild(item);
  }

  function renumberRepeater(rowsHolder, itemLabel) {
    rowsHolder.querySelectorAll(".repeater-item").forEach((el, i) => {
      const tag = el.querySelector(".rep-tag");
      if (tag) tag.textContent = (itemLabel || "BARIS").toUpperCase() + " " + (i + 1);
    });
  }

  function setupSignaturePad(qid) {
    const canvas = sectionsContainer.querySelector('canvas[data-sig="' + qid + '"]');
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#0b1f3b";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    signaturePads[qid] = { canvas: canvas, ctx: ctx, hasDrawing: false };

    let drawing = false;
    function pos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    }
    function start(e) { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); }
    function move(e) {
      if (!drawing) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      signaturePads[qid].hasDrawing = true;
      e.preventDefault();
    }
    function end() { drawing = false; }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    const clearBtn = sectionsContainer.querySelector('[data-sig-clear="' + qid + '"]');
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        signaturePads[qid].hasDrawing = false;
      });
    }
  }

  function goTo(i) {
    current = Math.max(0, Math.min(SECTIONS.length - 1, i));
    document.querySelectorAll(".sec").forEach((s) => (s.style.display = "none"));
    const secEl = sectionsContainer.querySelector('.sec[data-sec="' + current + '"]');
    if (secEl) secEl.style.display = "block";
    sidenav.querySelectorAll("button").forEach((b, idx) => {
      b.classList.toggle("active", idx === current);
      b.classList.toggle("done", idx < current);
    });
    const stepLabelEl = document.getElementById("stepLabel");
    if (stepLabelEl) stepLabelEl.textContent = current + 1;
    prevBtn.style.visibility = current === 0 ? "hidden" : "visible";
    nextBtn.textContent = current === SECTIONS.length - 1 ? "Kirim Data \u2192" : "Selanjutnya \u2192";
    alertBox.innerHTML = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn.addEventListener("click", () => {
    if (!validateSection(current)) return;
    if (current === SECTIONS.length - 1) {
      submitForm();
    } else {
      goTo(current + 1);
    }
  });

  function validateSection(idx) {
    const secEl = sectionsContainer.querySelector('.sec[data-sec="' + idx + '"]');
    if (!secEl) return true;
    const requiredInputs = secEl.querySelectorAll("[required]");
    for (const el of requiredInputs) {
      if (el.type === "radio") {
        const name = el.name;
        const checked = secEl.querySelector('input[name="' + name + '"]:checked');
        if (!checked) {
          showAlert("err", "Mohon lengkapi semua pertanyaan wajib (bertanda *) sebelum lanjut.");
          el.closest(".field").scrollIntoView({ behavior: "smooth", block: "center" });
          return false;
        }
      } else if (el.type === "checkbox") {
        if (!el.checked) {
          showAlert("err", "Mohon centang pernyataan yang wajib disetujui.");
          el.closest(".field").scrollIntoView({ behavior: "smooth", block: "center" });
          return false;
        }
      } else if (el.type === "file") {
        if (!el.files || !el.files.length) {
          showAlert("err", "Mohon lengkapi semua unggahan file wajib.");
          el.closest(".field").scrollIntoView({ behavior: "smooth", block: "center" });
          return false;
        }
      } else if (!el.value || !el.value.trim()) {
        showAlert("err", "Mohon lengkapi semua kolom wajib (bertanda *) sebelum lanjut.");
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
    }
    const sigCanvases = secEl.querySelectorAll("canvas[data-sig]");
    for (const c of sigCanvases) {
      const q = QUESTIONS.find((qq) => qq.id === c.dataset.sig);
      if (q && q.required && (!signaturePads[q.id] || !signaturePads[q.id].hasDrawing)) {
        showAlert("err", "Mohon bubuhkan tanda tangan sebelum lanjut.");
        c.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
    }
    return true;
  }

  function showAlert(kind, msg) {
    alertBox.innerHTML = '<div class="msg msg-' + kind + '">' + escapeHtml(msg) + '</div>';
  }

  async function submitForm() {
    nextBtn.disabled = true;
    nextBtn.textContent = "Mengirim\u2026";

    const answers = {};
    const filesToUpload = [];

    QUESTIONS.forEach((q) => {
      if (q.type === "repeater") {
        const rows = sectionsContainer.querySelectorAll('.repeater-item[data-qid="' + q.id + '"]');
        const rowsData = [];
        rows.forEach((rowEl) => {
          const rowIndex = Number(rowEl.dataset.row);
          const rowObj = {};
          (q.fields || []).forEach((sub) => {
            const el = rowEl.querySelector('[data-field="' + sub.id + '"]');
            if (!el) return;
            if (sub.type === "file") {
              if (el.files && el.files[0]) {
                filesToUpload.push({ questionId: q.id, rowIndex: rowIndex, subFieldId: sub.id, file: el.files[0] });
                rowObj[sub.id] = el.files[0].name;
              }
            } else if (sub.type === "radio") {
              const checked = rowEl.querySelector('[data-field="' + sub.id + '"]:checked');
              rowObj[sub.id] = checked ? checked.value : "";
            } else {
              rowObj[sub.id] = el.value;
            }
          });
          rowsData.push(rowObj);
        });
        answers[q.id] = rowsData;
        return;
      }

      if (q.type === "signature") {
        const pad = signaturePads[q.id];
        answers[q.id] = pad && pad.hasDrawing ? pad.canvas.toDataURL("image/png") : "";
        return;
      }

      const el = sectionsContainer.querySelector('[data-qid="' + q.id + '"]:not([data-row])');
      if (!el) return;

      if (q.type === "file") {
        if (el.files && el.files[0]) {
          filesToUpload.push({ questionId: q.id, file: el.files[0] });
          answers[q.id] = el.files[0].name;
        }
      } else if (q.type === "radio") {
        const checked = sectionsContainer.querySelector('[data-qid="' + q.id + '"]:not([data-row]):checked');
        answers[q.id] = checked ? checked.value : "";
      } else if (q.type === "checkbox") {
        answers[q.id] = el.checked;
      } else {
        answers[q.id] = el.value;
      }
    });

    try {
      const totalBytes = filesToUpload.reduce((sum, f) => sum + f.file.size, 0);
      if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
        const biggest = filesToUpload.slice().sort((a, b) => b.file.size - a.file.size)[0];
        showAlert(
          "err",
          "Total ukuran semua file yang diunggah (" + formatBytes(totalBytes) + ") melebihi batas " +
          formatBytes(MAX_TOTAL_UPLOAD_BYTES) + " per pengiriman. File terbesar: \u201c" + biggest.file.name +
          "\u201d (" + formatBytes(biggest.file.size) + "). Coba kompres foto/PDF-nya dulu (misal pakai TinyPNG atau Smallpdf), lalu kirim ulang."
        );
        nextBtn.disabled = false;
        nextBtn.textContent = "Kirim Data \u2192";
        return;
      }

      const files = await Promise.all(
        filesToUpload.map(async (f) => {
          const base64 = await fileToBase64(f.file);
          return {
            questionId: f.questionId,
            rowIndex: f.rowIndex !== undefined ? f.rowIndex : null,
            subFieldId: f.subFieldId || null,
            filename: f.file.name,
            contentType: f.file.type,
            base64: base64,
          };
        })
      );

      if (DEMO_ONLY_MODE) {
        // Mode demo terkunci: jangan pernah kirim ke backend asli. Simpan
        // hanya di localStorage browser pengunjung supaya data master tidak
        // pernah tersentuh/tertimpa oleh siapapun yang mencoba form demo ini.
        saveSubmissionToLocalDemo(answers, files);
        formLayout.style.display = "none";
        document.querySelector(".letterhead").style.display = "none";
        successState.style.display = "block";
        return;
      }

      const res = await fetch("/.netlify/functions/submit-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answers, files: files }),
      }).catch(() => null);

      if (!res || !res.ok) {
        // Backend/Netlify Blobs belum terkonfigurasi (demo statis) — simpan
        // langsung ke localStorage supaya tetap muncul di tab "Data Kandidat"
        // pada Panel Admin (demo tetap terasa hidup dalam satu link).
        if (!res) {
          saveSubmissionToLocalDemo(answers, files);
          formLayout.style.display = "none";
          document.querySelector(".letterhead").style.display = "none";
          successState.style.display = "block";
          return;
        }
        const err = await res.json().catch(() => null);
        const msg = err && err.message
          ? err.message
          : (res.status === 413
              ? "Ukuran data yang dikirim terlalu besar. Coba kompres file yang diunggah, lalu kirim ulang."
              : "Gagal mengirim data. Silakan coba lagi.");
        showAlert("err", msg);
        nextBtn.disabled = false;
        nextBtn.textContent = "Kirim Data \u2192";
        return;
      }

      formLayout.style.display = "none";
      document.querySelector(".letterhead").style.display = "none";
      successState.style.display = "block";
    } catch (e) {
      showAlert("err", "Gagal terhubung ke server. Periksa koneksi internet kamu.");
      nextBtn.disabled = false;
      nextBtn.textContent = "Kirim Data \u2192";
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Fallback penyimpanan demo: dipakai kalau backend Netlify Functions/Blobs
  // tidak tersedia (mis. situs dijalankan sebagai demo statis tanpa deploy
  // penuh). Disimpan dengan key yang SAMA dengan yang dipakai admin.js
  // ("demo_candidate_submissions"), supaya kandidat yang baru saja mengisi
  // form ini langsung muncul di tab "Data Kandidat" pada Panel Admin.
  function saveSubmissionToLocalDemo(answers, files) {
    const LOCAL_STORAGE_DB_KEY = "demo_candidate_submissions";
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      submittedAt: new Date().toISOString(),
      status: "baru",
      answers: answers,
      files: (files || []).map((f) => ({
        questionId: f.questionId,
        rowIndex: f.rowIndex !== undefined ? f.rowIndex : null,
        subFieldId: f.subFieldId || null,
        filename: f.filename,
        key: `local-demo/${id}/${f.filename}`,
      })),
    };
    try {
      const existingRaw = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(record);
      localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn("Gagal menyimpan submission demo ke localStorage.", e);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }
})();
