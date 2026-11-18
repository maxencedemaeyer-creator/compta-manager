import { useState } from 'react'
import { FlaskConical, Info, X } from 'lucide-react'

// =============================================================
//  Pied de page de toutes les pages du labo :
//  « © 2026 · Créé par Maxence De Maeyer · Tous droits réservés »
//  + petite fenêtre d'informations (le projet, la vie privée, les sources).
// =============================================================
export default function PiedLabo({ className = '' }) {
  const [ouvert, setOuvert] = useState(false)
  return (
    <>
      <footer className={`mt-auto pt-6 text-center text-[11px] leading-relaxed text-[#6E779A] ${className}`}>
        © 2026 · Créé par Maxence De Maeyer · Tous droits réservés ·{' '}
        <button type="button" onClick={() => setOuvert(true)} className="inline-flex items-center gap-0.5 font-bold text-[#B9C1E3] underline decoration-dotted underline-offset-2">
          <Info size={11} /> Infos
        </button>
      </footer>

      {ouvert && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm sm:items-center" onClick={() => setOuvert(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Informations sur le labo"
            className="labo-apparait max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-[#7CFF6B]/40 bg-[#0E1428] p-5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-[#7CFF6B]/15 text-[#7CFF6B]">
                  <FlaskConical size={22} />
                </div>
                <div>
                  <p className="labo-mono text-[11px] tracking-[.1em] text-[#7CFF6B]">À PROPOS</p>
                  <p className="labo-titre text-lg font-bold text-white">Le labo de sciences</p>
                </div>
              </div>
              <button type="button" aria-label="Fermer" onClick={() => setOuvert(false)} className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-white/15 text-white">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#DDE2F7]">
              <p>
                Un laboratoire de sciences interactif pour l’école primaire, conçu et réalisé par <b className="text-white">Maxence De Maeyer</b>, enseignant. Les activités suivent le référentiel de sciences du tronc commun de la Fédération Wallonie-Bruxelles.
              </p>
              <div>
                <p className="labo-mono text-[11px] tracking-[.1em] text-[#6FEFFF]">VIE PRIVÉE</p>
                <p className="mt-1">
                  Pas de compte, pas de publicité. Les images de la caméra sont analysées directement sur l’appareil : elles ne sont jamais enregistrées ni envoyées. Seuls les tableaux des records (un surnom et un score) et la synthèse du rythme cardiaque de la classe (un surnom et trois nombres) sont conservés.
                </p>
              </div>
              <div>
                <p className="labo-mono text-[11px] tracking-[.1em] text-[#FFE45E]">SOURCES ET CRÉDITS</p>
                <ul className="mt-1 space-y-1 text-[13px] text-[#B9C1E3]">
                  <li>Modèles 3D du corps (os, muscles, cœur, vaisseaux sanguins) : BodyParts3D, © DBCLS, licence CC BY 4.0.</li>
                  <li>Rythmes cardiaques des animaux (au repos, ordres de grandeur) : manuels de physiologie animale ; baleine bleue : Goldbogen et al., PNAS, 2019 ; musaraigne étrusque : Jürgens et al., 1996.</li>
                  <li>Radiographies : jeu de données FracAtlas (Abedeen et al., Scientific Data, 2023), licence CC BY 4.0.</li>
                  <li>Détection du corps et des mains : MediaPipe (Google), licence Apache 2.0.</li>
                  <li>Textures des astres (expérience « L’espace ») : Terre, carte « Blue Marble » de la NASA ; lumières des villes et Lune : NASA ; Mercure, Vénus, Mars, Jupiter, Saturne, Uranus, Neptune et Soleil : cartes de Planet Pixel Emporium (J. Hastings-Trew) d’après des images NASA/JPL/USGS, usage non commercial. Données des planètes : NASA ; définitions : Union astronomique internationale.</li>
                  <li>Affichage 3D : three.js (licence MIT). Icônes : Lucide (licence ISC).</li>
                </ul>
              </div>
              <p className="border-t border-white/10 pt-3 text-[12px] text-[#8A93B8]">
                © 2026 Maxence De Maeyer. Tous droits réservés. Les contenus, activités et le code de ce site ne peuvent être reproduits sans autorisation, à l’exception des ressources libres citées ci-dessus, qui restent sous leur propre licence.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
