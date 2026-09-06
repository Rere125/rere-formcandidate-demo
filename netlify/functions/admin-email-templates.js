const { getConfiguredStore } = require("./utils/blobs");
const { checkAuth, json } = require("./utils/auth");
const { DEFAULT_TEMPLATES } = require("./utils/email-templates");

// Panel Admin > Template Email: baca/simpan template subjek+isi+label badge
// untuk email "Diproses", "Diterima", dan "Ditolak", disimpan sebagai satu
// object di store "config" pada key "email-templates" (pola sama seperti
// admin-questions.js untuk "form-config").
const TEMPLATE_KEYS = ["diproses", "diterima", "ditolak"];
const LABELS = { diproses: "Diproses", diterima: "Diterima", ditolak: "Ditolak" };

function clean(t) {
  return {
    badgeLabel: String((t && t.badgeLabel) || "").slice(0, 60).trim(),
    subject: String((t && t.subject) || "").slice(0, 200).trim(),
    body: String((t && t.body) || "").slice(0, 5000),
  };
}

exports.handler = async (event) => {
  if (!checkAuth(event)) {
    return json(401, { message: "Sesi tidak valid, silakan login lagi." });
  }

  try {
    const store = getConfiguredStore("config");

    if (event.httpMethod === "GET") {
      const saved = await store.get("email-templates", { type: "json" });
      const result = {};
      TEMPLATE_KEYS.forEach((key) => {
        result[key] = Object.assign({}, DEFAULT_TEMPLATES[key], saved && saved[key]);
      });
      return json(200, result);
    }

    if (event.httpMethod === "PUT") {
      let body;
      try {
        body = JSON.parse(event.body || "{}");
      } catch (e) {
        return json(400, { message: "Data template tidak valid." });
      }

      const result = {};
      for (const key of TEMPLATE_KEYS) {
        const tpl = clean(body[key]);
        if (!tpl.subject || !tpl.body) {
          return json(400, { message: `Subjek dan isi email untuk template ${LABELS[key]} wajib diisi.` });
        }
        result[key] = tpl;
      }

      await store.setJSON("email-templates", result);
      return json(200, { ok: true });
    }

    return json(405, { message: "Method not allowed" });
  } catch (err) {
    return json(500, { message: `Error server: ${err.message || String(err)}` });
  }
};
