// =============================================================
//  Envoi de mails (code « PIN oublié ») via EmailJS.
//  Ces identifiants ne sont pas secrets : ils sont prévus pour
//  être utilisés directement dans un site web.
//  Tableau de bord : https://dashboard.emailjs.com
// =============================================================
export const EMAILJS = {
  serviceId: 'service_phlt5nn',
  templateId: 'template_370tnkd',
  publicKey: 'LvOEa7l2K3Q5HUtFv', // Account → General → Public Key
}

// Envoie un mail avec le modèle EmailJS. Variables du modèle : {{email}}, {{nom}}, {{code}}
export async function envoyerMail(params) {
  if (!EMAILJS.publicKey) {
    throw new Error("L'envoi de mails n'est pas encore configuré (clé EmailJS manquante).")
  }
  const reponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS.serviceId,
      template_id: EMAILJS.templateId,
      user_id: EMAILJS.publicKey,
      template_params: params,
    }),
  })
  if (!reponse.ok) {
    const detail = await reponse.text().catch(() => '')
    throw new Error(`Le mail n'a pas pu être envoyé${detail ? ` (${detail})` : ''}.`)
  }
}

// j***@gmail.com : on montre juste assez pour reconnaître l'adresse
export function masquerEmail(email = '') {
  const [nom, domaine] = email.split('@')
  if (!domaine) return email
  return `${nom.charAt(0)}${'•'.repeat(Math.max(2, Math.min(nom.length - 1, 6)))}@${domaine}`
}
