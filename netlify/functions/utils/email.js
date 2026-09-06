// Kirim email lewat Resend (https://resend.com/docs/api-reference/emails/send-email).
// Pakai fetch bawaan Node 18+ di Netlify Functions, jadi tidak perlu SDK
// tambahan.
//
// Env var yang dibutuhkan:
//   RESEND_API_KEY   -> API key dari dashboard Resend
//   RESEND_FROM_EMAIL -> alamat pengirim, HARUS dari domain yang sudah
//                        diverifikasi (DNS) di Resend, mis.
//                        "HC Tatalogam Group <hc@tatalogam.co.id>"
//
// Selama DNS/domain belum diverifikasi tim IT, kedua env var ini boleh
// belum di-set / domainnya belum aktif. Fungsi ini TIDAK melempar error ke
// pemanggil kalau pengiriman gagal — dia mengembalikan { ok:false, error }
// supaya perubahan status kandidat tetap tersimpan meskipun emailnya belum
// bisa terkirim.
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return {
      ok: false,
      skipped: true,
      error: "RESEND_API_KEY / RESEND_FROM_EMAIL belum di-set (menunggu DNS domain diverifikasi).",
    };
  }
  if (!to) {
    return { ok: false, skipped: true, error: "Alamat email kandidat kosong." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      // Resend biasanya selalu balas JSON; kalau gagal parse, biarkan {}.
    }

    if (!res.ok) {
      return {
        ok: false,
        error: (data && (data.message || data.error)) || `Resend API error (status ${res.status}).`,
      };
    }
    return { ok: true, id: data && data.id };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

module.exports = { sendEmail };
