import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// =============================================================
//  Numéro de version du site
//  À chaque déploiement Vercel, un numéro unique est créé.
//  - il est "gravé" dans le code du site (__APP_VERSION__)
//  - il est aussi publié dans le fichier /version.json
//  Le site compare les deux : s'ils diffèrent, une nouvelle
//  version est en ligne → il se recharge tout seul.
// =============================================================
const VERSION = String(Date.now())

function fichierVersion() {
  return {
    name: 'fichier-version',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: VERSION }),
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), fichierVersion()],
  define: {
    __APP_VERSION__: JSON.stringify(VERSION),
  },
  // Les « workers » (calculs en arrière-plan, ex. la voix Piper de Lis-moi)
  // chargent des morceaux à la demande : format ES obligatoire.
  worker: { format: 'es' },
})
