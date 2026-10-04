import { useMemo, useState } from 'react'
import {
  useRemboursementsEntries,
  useRemboursementsPersonnes,
  SENS_DOIS_PAYER,
  SENS_DOIT_ME_PAYER,
} from '../hooks/useRemboursements.js'
import Modal from '../components/ui/Modal.jsx'
import RemboursementForm from '../components/remboursements/RemboursementForm.jsx'
import RemboursementsSection from '../components/remboursements/RemboursementsSection.jsx'
import { formatEuros } from '../utils/format.js'

export default function RemboursementsView() {
  const { personnes, ajouterPersonne } = useRemboursementsPersonnes()
  const { entries, addRemboursement, payerUn, payerPlusieurs, removeRemboursement } =
    useRemboursementsEntries()
  // sensModal = null (fermé) ou le sens du remboursement en cours d'ajout
  const [sensModal, setSensModal] = useState(null)

  const jeDois = useMemo(() => entries.filter((e) => e.sens === SENS_DOIS_PAYER), [entries])
  const onMeDoit = useMemo(() => entries.filter((e) => e.sens === SENS_DOIT_ME_PAYER), [entries])

  // Totaux : uniquement les lignes pas encore payées
  const totalOnMeDoit = useMemo(
    () => onMeDoit.filter((e) => !e.paye).reduce((sum, e) => sum + e.montant, 0),
    [onMeDoit]
  )
  const totalJeDois = useMemo(
    () => jeDois.filter((e) => !e.paye).reduce((sum, e) => sum + e.montant, 0),
    [jeDois]
  )

  async function handleAdd(values) {
    await addRemboursement({ ...values, sens: sensModal })
    setSensModal(null)
  }

  function handleDelete(id) {
    if (confirm('Supprimer cette ligne ?')) removeRemboursement(id)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Perso</h1>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide mb-1">
            On me doit
          </p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">
            {formatEuros(totalOnMeDoit)}
          </p>
        </div>
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
          <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">
            Je dois rembourser
          </p>
          <p className="text-2xl font-bold text-red-700 tabular-nums">
            {formatEuros(totalJeDois)}
          </p>
        </div>
      </div>

      <RemboursementsSection
        titre="Je dois rembourser"
        couleur="red"
        libellePayer="J'ai payé"
        messageVide="Tu ne dois rien à personne pour le moment."
        entries={jeDois}
        onAjouter={() => setSensModal(SENS_DOIS_PAYER)}
        onPayerUn={payerUn}
        onPayerPlusieurs={payerPlusieurs}
        onDelete={handleDelete}
      />

      <RemboursementsSection
        titre="On me doit"
        couleur="emerald"
        libellePayer="A payé"
        messageVide="Personne ne te doit rien pour le moment."
        entries={onMeDoit}
        onAjouter={() => setSensModal(SENS_DOIT_ME_PAYER)}
        onPayerUn={payerUn}
        onPayerPlusieurs={payerPlusieurs}
        onDelete={handleDelete}
      />

      <Modal
        open={sensModal !== null}
        onClose={() => setSensModal(null)}
        title={sensModal === SENS_DOIT_ME_PAYER ? 'Quelqu’un me doit…' : 'Je dois rembourser…'}
      >
        <RemboursementForm
          personnes={personnes}
          onSubmit={handleAdd}
          onAjouterPersonne={ajouterPersonne}
          onCancel={() => setSensModal(null)}
        />
      </Modal>
    </div>
  )
}
