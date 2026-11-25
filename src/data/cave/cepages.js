// =============================================================
//  Cépages (raisins) — base de référence
//  Une ligne : Nom ; couleur (N noir · B blanc · G gris/rose) ; caractère ; où on le trouve
//  Sert à proposer les cépages dans la fiche d'une bouteille et à les décrire.
//  Pour en ajouter : une ligne ici (ou voir l'onglet « Données » de la cave).
// =============================================================
const TEXTE = `
# ---------- Noirs : France
Pinot noir;N;fruits rouges, finesse, soyeux;Bourgogne, Champagne, Alsace, Sancerre
Gamay;N;fruité, framboise, léger;Beaujolais, Loire
Cabernet-Sauvignon;N;cassis, tanins fermes, longue garde;Médoc, Bordeaux
Cabernet franc;N;framboise, poivron, frais;Chinon, Saint-Émilion, Bourgueil
Merlot;N;prune, rond, souple;Pomerol, Saint-Émilion, Bordeaux
Petit Verdot;N;épicé, très tannique, violette;Médoc
Malbec (Côt);N;mûre, tannique, sombre;Cahors, Touraine
Syrah;N;poivre, olive, mûre;Côte-Rôtie, Hermitage, Languedoc
Grenache noir;N;chaleureux, fruits rouges mûrs, épices;Rhône sud, Roussillon, Cannonau
Mourvèdre;N;tannique, gibier, sous-bois;Bandol, Rhône sud
Cinsault;N;léger, floral, fruité;Provence, Languedoc, Rhône
Carignan;N;rustique, épicé, vieilles vignes;Languedoc, Roussillon, Sardaigne
Tannat;N;extrêmement tannique, sombre;Madiran, Irouléguy, Béarn
Négrette;N;violette, fruité, souple;Fronton
Pineau d'Aunis;N;poivré, léger;Coteaux du Loir
Poulsard;N;pâle, léger, fruits rouges;Arbois
Trousseau;N;épicé, rouge pâle;Arbois
Mondeuse;N;poivré, acide, sombre;Savoie
Niellucciu;N;fruité, épicé (= Sangiovese corse);Patrimonio
Sciaccarellu;N;poivré, léger;Ajaccio
Fer Servadou;N;rustique, framboise;Marcillac
Duras;N;poivré, fruité;Gaillac
Braucol;N;fruité, rustique;Gaillac
Abouriou;N;fruité, rustique;Marmandais
César;N;rustique, tannique;Irancy
Pinot meunier;N;fruité, souple;Champagne
# ---------- Noirs : Italie
Sangiovese;N;cerise acide, tanins moyens, herbes;Toscane, Romagne, Ombrie
Nebbiolo;N;rose, goudron, tanins et acidité élevés;Barolo, Barbaresco, Valtellina
Barbera;N;cerise, acidité forte, peu de tanins;Piémont
Dolcetto;N;amande amère, fruité, souple;Piémont
Montepulciano;N;mûre, rond, tanins doux;Abruzzes, Marches
Aglianico;N;sombre, tannique, acide, longue garde;Campanie, Basilicate
Primitivo;N;confiture, chaleureux, alcool généreux;Pouilles
Negroamaro;N;sombre, épicé, amer élégant;Pouilles (Salento)
Nero d'Avola;N;prune, épices, chaleureux;Sicile
Nerello Mascalese;N;élégant, minéral, proche du Pinot/Nebbiolo;Etna
Nerello Cappuccio;N;léger, floral;Etna
Frappato;N;fraise, léger, floral;Sicile
Corvina;N;cerise, amande, léger;Valpolicella
Corvinone;N;structuré, cerise noire;Valpolicella
Rondinella;N;léger, fruité;Valpolicella
Molinara;N;léger, acide;Valpolicella
Lagrein;N;sombre, fruité, souple;Haut-Adige
Schiava;N;léger, amande, fraise;Haut-Adige
Teroldego;N;sombre, mûre, épicé;Trentin
Refosco;N;sombre, tannique, rustique;Frioul
Pignolo;N;tannique, sombre, rare;Frioul
Croatina;N;sombre, tannique;Oltrepò, Piémont
Vespolina;N;poivré, léger;Piémont
Ruchè;N;aromatique, rose, épices;Piémont
Freisa;N;framboise, tannique, acide;Piémont
Grignolino;N;pâle, tannique, floral;Piémont
Brachetto;N;rose, fraise, doux;Piémont
Lambrusco;N;frais, fruité, effervescent;Émilie-Romagne
Sagrantino;N;extrêmement tannique, mûre;Ombrie
Cesanese;N;épicé, fruité;Latium
Gaglioppo;N;tannique, fruité, épicé;Calabre
Magliocco;N;sombre, tannique;Calabre
Cannonau;N;(= Grenache) chaleureux, fruité;Sardaigne
Carignano;N;(= Carignan) rustique, épicé;Sardaigne
Monica;N;fruité, souple;Sardaigne
Bovale;N;sombre, tannique;Sardaigne
Cagnulari;N;poivré, fruité;Sardaigne
Rossese;N;floral, épicé, léger;Ligurie
Ciliegiolo;N;cerise, léger;Toscane, Ligurie
Canaiolo;N;souple, fruité;Toscane
Piedirosso;N;léger, fruité, épicé;Campanie
Nero di Troia;N;sombre, tannique, épicé;Pouilles
Petit Rouge;N;fruité, léger;Val d'Aoste
Fumin;N;sombre, tannique;Val d'Aoste
Lacrima;N;floral, aromatique;Marches
Aleatico;N;aromatique, muscaté, doux;Latium, Toscane
Tintilia;N;sombre, épicé;Molise
# ---------- Blancs : France
Chardonnay;B;du minéral (Chablis) au beurré (Meursault);Bourgogne, Champagne, Jura
Sauvignon blanc;B;vif, agrume, buis, herbe coupée;Loire, Bordeaux
Chenin;B;pomme, miel, acidité vive, polyvalent;Loire
Riesling;B;citron, pétrole, acidité vive, minéral;Alsace
Gewurztraminer;B;litchi, rose, épices, ample;Alsace
Pinot gris;B;fumé, ample, gras;Alsace
Pinot blanc;B;frais, discret, pomme;Alsace
Sylvaner;B;léger, vif;Alsace
Muscat à petits grains;B;raisin frais, floral, aromatique;Alsace, Beaumes-de-Venise, Rivesaltes
Aligoté;B;très vif, citron;Bourgogne
Melon de Bourgogne;B;salin, tendu, iodé;Muscadet
Sémillon;B;cire, miel, gras, botrytis;Sauternes, Bordeaux
Muscadelle;B;floral, discret;Bordeaux
Viognier;B;abricot, fleurs, ample, peu d'acidité;Condrieu
Marsanne;B;amande, gras, rond;Rhône nord
Roussanne;B;fleurs, épices, fin;Rhône nord
Clairette;B;léger, floral;Rhône, Languedoc
Bourboulenc;B;vif, floral;Rhône sud, Languedoc
Grenache blanc;B;gras, herbacé, alcool généreux;Rhône sud, Roussillon
Ugni blanc;B;neutre, acide;Provence, Cognac
Rolle;B;(= Vermentino) salin, frais;Provence
Vermentinu;B;(= Vermentino) salin, fleurs blanches;Corse
Savagnin;B;noix, oxydatif, tendu;Jura
Altesse;B;floral, amande, frais;Savoie
Jacquère;B;léger, vif;Savoie
Mauzac;B;pomme, léger;Limoux, Gaillac
Gros Manseng;B;exotique, vif, aromatique;Jurançon, Pacherenc
Petit Manseng;B;fruits confits, acidité, liquoreux;Jurançon
Petit Courbu;B;floral, fin;Pays basque, Béarn
Piquepoul blanc;B;citron, salin, tendu;Picpoul de Pinet
Romorantin;B;vif, minéral;Cour-Cheverny
Len de l'el;B;aromatique, vif;Gaillac
Baroque;B;rond, floral;Tursan
# ---------- Blancs : Italie
Glera;B;poire, fleurs blanches, léger, mousseux;Prosecco
Garganega;B;amande, fleurs blanches, salin;Soave
Trebbiano;B;neutre, vif, léger;Toscane, Abruzzes, partout
Pinot grigio;B;(= Pinot gris) léger et neutre, ou ample en Alsace;Frioul, Vénétie, Haut-Adige
Cortese;B;citron, minéral, léger;Gavi
Arneis;B;poire, amande, floral;Roero
Erbaluce;B;vif, minéral;Piémont
Timorasso;B;minéral, ample, garde;Colli Tortonesi
Moscato bianco;B;(= Muscat) raisin frais, floral, doux;Asti
Vermentino;B;salin, citron, fleurs blanches;Sardaigne, Ligurie, Toscane
Pigato;B;(= Vermentino) herbes, salin;Ligurie
Fiano;B;noisette, miel, minéral, garde;Campanie
Greco;B;pêche, amande amère, structure;Campanie
Falanghina;B;fleurs, agrumes, floral et frais;Campanie
Coda di Volpe;B;fruité, simple;Campanie
Asprinio;B;très vif, mousseux;Campanie
Verdicchio;B;amande, citron, salin, garde;Marches
Pecorino;B;herbes, acide, ample;Marches, Abruzzes
Passerina;B;léger, floral;Marches, Abruzzes
Grechetto;B;amande, fruits blancs, structure;Ombrie
Verdeca;B;frais, léger;Pouilles
Bombino bianco;B;neutre, vif;Pouilles
Friulano;B;amande, fleurs, structure;Frioul
Ribolla gialla;B;vif, citron, minéral;Frioul
Malvasia;B;aromatique, ample, floral;Frioul, Latium, Toscane
Vitovska;B;minéral, salin;Carso
Picolit;B;doux, miel;Frioul
Verduzzo;B;tannique, doux, ambre;Frioul
Tai;B;(= Friulano) amande, fleurs;Vénétie
Turbiana;B;fleurs blanches, salin;Lugana
Vespaiola;B;vif, passito;Breganze
Durella;B;très acide, mousseux;Lessini Durello
Müller-Thurgau;B;floral, aromatique, vif;Haut-Adige, Trentin
Kerner;B;aromatique, vif;Haut-Adige
Veltliner;B;poivré, vif;Haut-Adige
Prié blanc;B;vif, alpin;Val d'Aoste
Petite Arvine;B;salin, pamplemousse, structure;Val d'Aoste
Nosiola;B;léger, noisette;Trentin
Bosco;B;salin, floral;Cinque Terre
Albarola;B;léger, salin;Ligurie
Albana;B;ample, abricot, structure;Romagne
Pignoletto;B;vif, léger;Émilie-Romagne
Ortrugo;B;léger, vif;Émilie-Romagne
Vernaccia;B;amande, minéral, vif;San Gimignano
Biancolella;B;salin, floral;Ischia, Amalfi
Carricante;B;très vif, salin, minéral, garde;Etna
Catarratto;B;neutre à floral, vif;Sicile
Grillo;B;agrumes, salin, ample;Sicile
Inzolia;B;amande, floral;Sicile
Grecanico;B;vif, floral;Sicile
Zibibbo;B;(= Muscat d'Alexandrie) très aromatique, doux ou sec;Pantelleria
Malvasia di Lipari;B;passito, abricot;Lipari
Torbato;B;minéral, salin;Alghero
Nuragus;B;neutre, frais;Sardaigne
Nasco;B;floral, doux;Sardaigne
Semidano;B;floral, ample;Sardaigne
Greco bianco;B;doux ou sec, abricot;Calabre
# ---------- Gris et rosés
Gringet;B;pomme, vif, mousseux;Ayze (Savoie)
Girò;N;doux, aromatique;Sardaigne
`

export const CEPAGES = TEXTE.split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const [nom, c, caractere, pays] = l.split(';')
    return { nom: nom.trim(), couleur: c.trim(), caractere: (caractere || '').trim(), ou: (pays || '').trim() }
  })
