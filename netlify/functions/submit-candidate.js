const { getConfiguredStore } = require("./utils/blobs");
const { json } = require("./utils/auth");

// Netlify functions punya batas KERAS 6MB per request (tidak bisa dinaikkan),
// dan base64 encoding menambah ~33% ukuran data. Form ini mengirim SEMUA file
// dalam satu request sekaligus, jadi batas yang berlaku adalah TOTAL gabungan
// semua file, bukan per file saja. Nilai di bawah sudah dikasih margin aman
// (client-side app.js juga sudah membatasi sebelum sampai ke sini).
const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3MB per file
const MAX_TOTAL_BYTES = 4.5 * 1024 * 1024; // 4.5MB gabungan semua file per submission

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { message: "Method not allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { message: "Data yang dikirim tidak valid." });
  }

  const answers = payload.answers || {};
  const files = Array.isArray(payload.files) ? payload.files : [];

  if (Object.keys(answers).length === 0) {
    return json(400, { message: "Form kosong, tidak ada data untuk dikirim." });
  }

  // Cek total ukuran gabungan lebih dulu (sebelum proses satu-satu), supaya
  // kalau memang kelewat, kita tolak dengan pesan yang jelas — bukan gagal
  // diam-diam di tengah proses simpan file.
  let totalBytes = 0;
  for (const f of files) {
    if (f && f.base64) totalBytes += Math.ceil((f.base64.length * 3) / 4);
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    return json(413, {
      message: `Total ukuran semua file (\u2248${(totalBytes / (1024 * 1024)).toFixed(1)}MB) melebihi batas ${(MAX_TOTAL_BYTES / (1024 * 1024)).toFixed(1)}MB per pengiriman. Kompres file yang diunggah lalu kirim ulang.`,
    });
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filesStore = getConfiguredStore("files");
  const savedFiles = [];

  for (const f of files) {
    if (!f || !f.base64 || !f.filename) continue;

    const isPdf = (f.contentType === "application/pdf") || /\.pdf$/i.test(f.filename);
    if (!isPdf) {
      return json(400, {
        message: `File "${f.filename}" ditolak: kolom ini hanya menerima PDF. Simpan ulang sebagai PDF lalu unggah kembali.`,
      });
    }

    let buffer;
    try {
      buffer = Buffer.from(f.base64, "base64");
    } catch (e) {
      continue;
    }
    if (buffer.length > MAX_FILE_BYTES) {
      return json(413, {
        message: `File "${f.filename}" terlalu besar (${(buffer.length / (1024 * 1024)).toFixed(1)}MB). Maksimal ${(MAX_FILE_BYTES / (1024 * 1024)).toFixed(1)}MB per file.`,
      });
    }
    // Key file: <submissionId>/<questionId>[_row<N>][_<subFieldId>]/<filename>
    // rowIndex & subFieldId hanya ada kalau file itu berasal dari field di dalam repeater
    // (mis. "Upload Slip Gaji" pada Riwayat Pekerjaan baris ke-2).
    const parts = [f.questionId];
    if (f.rowIndex !== undefined && f.rowIndex !== null) parts.push(`row${f.rowIndex}`);
    if (f.subFieldId) parts.push(f.subFieldId);
    const key = `${id}/${parts.join("_")}/${f.filename}`;

    await filesStore.set(key, buffer, {
      metadata: {
        contentType: f.contentType || "application/octet-stream",
        filename: f.filename,
      },
    });
    savedFiles.push({
      questionId: f.questionId,
      rowIndex: f.rowIndex !== undefined ? f.rowIndex : null,
      subFieldId: f.subFieldId || null,
      filename: f.filename,
      key,
    });
  }

  const record = {
    id,
    submittedAt: new Date().toISOString(),
    answers,
    files: savedFiles,
  };

  const submissionsStore = getConfiguredStore("submissions");
  await submissionsStore.setJSON(id, record);

  return json(200, { ok: true, id });
};
