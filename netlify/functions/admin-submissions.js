const { getConfiguredStore } = require("./utils/blobs");
const { checkAuth, json } = require("./utils/auth");
const { sendEmail } = require("./utils/email");
const { DEFAULT_TEMPLATES, renderTemplate } = require("./utils/email-templates");

const ALLOWED_STATUS = ["baru", "diproses", "diterima", "ditolak"];
// Status yang memicu pengiriman email notifikasi otomatis ke kandidat.
const EMAIL_STATUS = ["diproses", "diterima", "ditolak"];

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

exports.handler = async (event) => {
  if (!checkAuth(event)) {
    return json(401, { message: "Sesi tidak valid, silakan login lagi." });
  }

  const store = getConfiguredStore("submissions");

  if (event.httpMethod === "PATCH") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return json(400, { message: "Request tidak valid." });
    }
    const { id, status } = body;
    if (!id) return json(400, { message: "id wajib diisi." });
    if (!ALLOWED_STATUS.includes(status)) {
      return json(400, { message: "Status tidak valid." });
    }

    const record = await store.get(id, { type: "json" });
    if (!record) return json(404, { message: "Data kandidat tidak ditemukan." });

    record.status = status;
    record.statusUpdatedAt = new Date().toISOString();
    await store.setJSON(id, record);

    // Kirim email notifikasi hanya untuk status Diterima/Ditolak, dan hanya
    // kalau ada alamat email kandidat (dikirim dari admin.js, karena field
    // email formulir bisa berbeda id-nya tergantung konfigurasi formulir).
    let emailResult = { ok: false, skipped: true };
    if (EMAIL_STATUS.includes(status)) {
      const candidateEmail = String(body.candidateEmail || "").trim();
      if (!candidateEmail) {
        emailResult = { ok: false, skipped: true, error: "Kandidat ini tidak punya alamat email." };
      } else {
        const configStore = getConfiguredStore("config");
        const saved = await configStore.get("email-templates", { type: "json" });
        const tpl = (saved && saved[status]) || DEFAULT_TEMPLATES[status];
        const vars = {
          nama: body.candidateName || "Kandidat",
          posisi: body.candidatePosisi || "-",
        };
        const subject = renderTemplate(tpl.subject, vars);
        const htmlBody = escapeHtml(renderTemplate(tpl.body, vars)).replace(/\n/g, "<br>");
        emailResult = await sendEmail({ to: candidateEmail, subject, html: htmlBody });
      }
    }

    return json(200, {
      ok: true,
      status,
      emailSent: !!emailResult.ok,
      emailSkipped: !!emailResult.skipped,
      emailError: emailResult.ok ? null : (emailResult.error || null),
    });
  }

  if (event.httpMethod === "GET") {
    const { blobs } = await store.list();
    const records = await Promise.all(
      blobs.map((b) => store.get(b.key, { type: "json" }))
    );
    records.sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
    );
    return json(200, records.filter(Boolean));
  }

  if (event.httpMethod === "DELETE") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (e) {
      return json(400, { message: "Request tidak valid." });
    }
    if (!body.id) return json(400, { message: "id wajib diisi." });

    const record = await store.get(body.id, { type: "json" });
    await store.delete(body.id);

    if (record && Array.isArray(record.files) && record.files.length) {
      const filesStore = getConfiguredStore("files");
      await Promise.all(record.files.map((f) => filesStore.delete(f.key)));
    }
    return json(200, { ok: true });
  }

  return json(405, { message: "Method not allowed" });
};
