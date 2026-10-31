// Netlify appelle cette fonction à chaque demande de devis reçue par Netlify Forms (événement « submission-created »).
// Elle envoie la demande par e-mail depuis la boîte OVH contact@revela-motion.fr.
// Réglages (Netlify > Site configuration > Environment variables), jamais écrits dans le code :
//   SMTP_USER  adresse complète de la boîte OVH (contact@revela-motion.fr)
//   SMTP_PASS  son mot de passe
//   MAIL_TO    où recevoir les demandes (par défaut : SMTP_USER)
//   SMTP_HOST  serveur d'envoi OVH (par défaut smtp.mail.ovh.net ; ssl0.ovh.net pour une ancienne offre MX Plan)
import nodemailer from "nodemailer";

const CHAMPS = [
  ["nom", "Nom"], ["entreprise", "Entreprise"], ["email", "E-mail"], ["telephone", "Téléphone"],
  ["offre", "Produit ou service"], ["formule", "Formule"], ["explications", "La vidéo doit expliquer"], ["message", "Message"],
];
const propre = (v) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 300);
const echappe = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const handler = async (event) => {
  const { SMTP_USER, SMTP_PASS, MAIL_TO, SMTP_HOST } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    console.error("SMTP_USER ou SMTP_PASS manquant : demande gardée dans Netlify Forms, aucun e-mail envoyé.");
    return { statusCode: 200, body: "" };
  }
  const { payload } = JSON.parse(event.body || "{}");
  if (!payload || payload.form_name !== "devis") return { statusCode: 200, body: "" };
  const d = payload.data || {};
  if (d["bot-field"]) return { statusCode: 200, body: "" };

  const lignes = CHAMPS.filter(([k]) => d[k]).map(([k, l]) => [l, String(d[k]).slice(0, 4000)]);
  const texte = lignes.map(([l, v]) => `${l} : ${v}`).join("\n");
  const html = `<h2 style="font-family:sans-serif">Nouvelle demande de devis</h2><table style="font-family:sans-serif;border-collapse:collapse">${
    lignes.map(([l, v]) => `<tr><td style="padding:6px 12px;color:#555;vertical-align:top">${echappe(l)}</td><td style="padding:6px 12px;white-space:pre-wrap">${echappe(v)}</td></tr>`).join("")
  }</table>`;
  const email = propre(d.email);
  const valide = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email);

  const transport = nodemailer.createTransport({
    host: SMTP_HOST || "smtp.mail.ovh.net", port: 465, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  try {
    await transport.sendMail({
      from: `"Site Révéla" <${SMTP_USER}>`,
      to: MAIL_TO || SMTP_USER,
      ...(valide ? { replyTo: email } : {}),
      subject: `Demande de devis · ${propre(d.entreprise) || propre(d.nom) || "nouveau prospect"}`,
      text: texte, html,
    });
  } catch (e) {
    console.error("Envoi de l'e-mail impossible :", e.message);   // la demande reste visible dans Netlify Forms
  }
  return { statusCode: 200, body: "" };
};
