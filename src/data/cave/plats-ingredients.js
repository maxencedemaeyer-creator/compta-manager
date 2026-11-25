// =============================================================
//  Plats — ingrédients de base
//  Une ligne :  mots|alias ; i ; catégories ; profil ; options
//
//  profil (chiffres de 0 à 5, ce qui manque vaut 0) :
//    p poids du plat (léger → puissant)   g gras / richesse   a acidité
//    e épices, piquant                    s sucré             u umami / goût savoureux
//    f fumé, grillé, boisé                m amertume          l salé
//  options (facultatives) :
//    fav=…   ce qui s'accorde en classique : un style (mineral, vif, rond…), une couleur (@B blanc,
//            @R rouge, @P rosé, @E effervescent, @D doux, @F fortifié) ou le nom d'une appellation / région
//    reg=…   pays et région du plat (fr, it, bourgogne, toscane…) : bonus pour les vins du coin
//
//  Pour compléter : ajouter une ligne ; ou, dans l'app, onglet « Données » → copier les
//  plats non reconnus et les donner à Claude.
// =============================================================
export default `
# ---------- Poissons
sole|limande|plie|barbue;i;poisson;p2g2u1;fav=mineral,rond,@B
turbot|saint-pierre|saint pierre|bar|loup de mer|dorade|daurade|merlan|colin|lieu|cabillaud|morue fraiche|rouget|lotte|raie|poisson blanc;i;poisson;p2g1u1;fav=mineral,vif,@B
poisson|poissons;i;poisson;p2g1u1;fav=mineral,vif,@B
truite|omble|sandre|perche|brochet;i;poisson;p2g2u1;fav=vif,sec,@B
saumon;i;poisson;p3g3u2;fav=rond,aromatique,@P,@B
thon;i;poisson;p3g2u3;fav=@P,souple,gourmand
espadon;i;poisson;p3g2u2;fav=rond,@B,@P
maquereau|sardine|sardines|hareng|poisson gras;i;poisson;p3g3u3l1;fav=vif,mineral,salin
anchois|anchoix;i;poisson;p2g1u5l5;fav=salin,vif
anguille;i;poisson;p3g4u3;fav=vif,mineral
haddock|morue fumee;i;poisson;p3g2u3f3l3;fav=rond,aromatique
morue|bacalhau|morue salee|brandade;i;poisson;p3g2u3l3;fav=rond,salin
poisson cru|sashimi;i;poisson;p2g2u2;fav=mineral,vif,@E
caviar|oeufs de poisson;i;poisson,mer;p2g3u3l4;fav=@E,vif
# ---------- Fruits de mer
huitre|huitres;i;mer;p1a1u3l3;fav=muscadet,chablis,champagne,entre deux mers,mineral,vif
moule|moules;i;mer;p2g1u3l2;fav=muscadet,mineral,salin,vif
coquille saint-jacques|coquilles saint-jacques|saint-jacques|saint jacques|noix de saint-jacques;i;mer;p3g2s1u3;fav=rond,b-ample,champagne,@B
crevette|crevettes|gambas|crevettes roses|bouquet;i;mer;p2g1s1u3;fav=mineral,vif,salin,@B
langoustine|langoustines;i;mer;p3g2s1u3;fav=rond,mineral,@B
homard|langouste|crabe|tourteau|araignee de mer;i;mer;p4g2s1u3;fav=ample,rond,@E,@B
bulot|bulots|bigorneau|bigorneaux|coques|palourdes|praires|clams|coquillages;i;mer;p2a1u3l3;fav=muscadet,mineral,salin
oursin|oursins;i;mer;p2g2u4l3;fav=mineral,vif,champagne
calamar|calamars|encornet|encornets|seiche|poulpe|calmars;i;mer;p2g1u2;fav=salin,vif,mediterraneen
fruits de mer|fruit de mer|plateau de fruits de mer|crustaces;i;mer;p2g1a1u3l3;fav=muscadet,chablis,mineral,@E
# ---------- Viandes
boeuf|steak|entrecote|cote de boeuf|faux-filet|faux filet|rumsteck|onglet|bavette|filet de boeuf|rosbif|rost-beef|viande rouge|viande;i;vrouge;p4g3u4;fav=tannique,charpente,@R
tartare|tartare de boeuf;i;vrouge;p3g3a1u3;fav=souple,r-pinot,leger
carpaccio de boeuf|carpaccio;i;vrouge;p2g2a1u3;fav=souple,fruite,leger
veau|escalope|escalope de veau|rotis de veau|rôti de veau|filet de veau;i;vblanche;p2g2u2;fav=@B,rond,elegant
porc|filet mignon|cote de porc|roti de porc|echine|travers|travers de porc|carre de porc|jambonneau;i;vblanche;p3g3u3;fav=fruite,souple,rond,@R,@B
jambon|jambon blanc|jambon cuit|lard|lardons|bacon;i;vblanche,charcut;p2g2u3l3f1;fav=fruite,leger,@P
agneau|gigot|gigot d'agneau|gigot d agneau|epaule d'agneau|carre d'agneau|souris d'agneau|cotelettes d'agneau|mouton|navarin;i;agneau;p4g3u4;fav=bordeaux,charpente,tannique,@R
chevreau|cabri;i;agneau;p3g2u3;fav=elegant,@R
lapin|lapereau;i;vblanche;p2g1u2;fav=fruite,elegant,@R,@B
poulet|poule|chapon|volaille|poulet roti|dinde|pintade;i;volaille;p2g2u2;fav=rond,elegant,@B,@R
canard|magret|magret de canard|confit de canard|oie|canard laque;i;volaille;p4g4u4;fav=elegant,r-pinot,@R,gourmand
caille|cailles|pigeon|pigeonneau;i;volaille;p3g2u3;fav=elegant,r-pinot,@R
foie gras|foie gras de canard|foie gras d'oie|terrine de foie gras;i;charcut;p4g5u3l1;fav=@D,liquoreux,moelleux,sauternes,jurancon,@E
chevreuil|cerf|biche|sanglier|lievre|faisan|perdrix|becasse|venaison|gibier|civet|civet de lievre;i;gibier;p5g3u5f1;fav=puissant,tannique,@R,nebbiolo
boudin noir|boudin|andouillette|tripes|tripes a la mode|tete de veau|gras double;i;abats;p4g4u4l1;fav=fruite,souple,@R
foie de veau|foie|rognons|ris de veau|abats|cervelle;i;abats;p3g3u4;fav=souple,r-pinot,@R
saucisse|saucisses|merguez|chipolata|saucisse de toulouse|knack|francfort|diots;i;charcut;p3g3e1u3l3;fav=fruite,leger,@R
saucisson|saucisson sec|chorizo|charcuterie|charcuteries|salami|coppa|mortadelle|rosette|pate|terrine|rillettes|pate de campagne|jambon cru|jambon sec|prosciutto|bresaola|speck|jambon de parme|jambon iberique|assiette de charcuterie|nduja;i;charcut,apero;p3g3u3l4;fav=leger,fruite,@R,@P,beaujolais
# ---------- Fromages
fromage|fromages|plateau de fromages|plateau de fromage;i;fromage;p3g3u3l2;fav=souple,@R,@B
comte|beaufort|gruyere|emmental|abondance|parmesan|parmigiano|parmigiano reggiano|grana padano|pecorino|manchego|mimolette vieille|cantal vieux|salers|tomme|cheddar|fromage a pate dure|fromage affine|vieux gouda|appenzeller;i;fromage,dur;p4g3u4l2;fav=jaune,oxydatif,rond,@R,elegant
reblochon|saint-nectaire|saint nectaire|morbier|raclette|cantal|mimolette|edam|gouda|fromage a pate pressee|laguiole|ossau-iraty|brebis;i;fromage;p3g3u3l2;fav=rond,souple,@R,@B
brie|camembert|coulommiers|chaource|brillat-savarin|brillat savarin|neufchatel|saint-marcellin|saint marcellin|fromage a pate molle|fromage fleuri|saint-felicien;i;fromage,fleuri;p3g4u3l2;fav=souple,r-pinot,@E,fruite
munster|maroilles|epoisses|livarot|pont-l'eveque|pont l eveque|langres|vacherin|mont d'or|mont-d'or|fromage lave;i;fromage,lave;p4g4e1u4l3;fav=@B,gewurz,arom,doux,aromatique
roquefort|bleu d'auvergne|bleu des causses|fourme d'ambert|gorgonzola|stilton|bleu|fromage bleu|persille|bleu de gex;i;fromage,bleu;p4g4u5l5;fav=@D,liquoreux,moelleux,muscat,@F
chevre|chevres|crottin|crottin de chavignol|sainte-maure|picodon|valencay|fromage de chevre|chevre frais|chevre chaud|cabecou|rocamadour;i;fromage,chevre;p2g2a2u2l2;fav=vif,aromatique,sauvignon,sancerre,pouilly-fume,mineral
mozzarella|burrata|bocconcini|stracciatella;i;fromage;p1g2u1l1;fav=fruite,leger,vif,@B
ricotta|mascarpone|fromage blanc|fromage frais|faisselle|petit-suisse|cottage;i;fromage;p1g2a1;fav=fruite,leger
feta|halloumi|fromage grec|chevre grec;i;fromage;p2g2a1l4;fav=mineral,vif,salin
# ---------- Légumes et salades
salade|salade verte|laitue|mesclun|roquette|salade composee|crudites|cresson|mache|endive|endives|scarole|batavia;i;legume,salade;p1a1m1;fav=vif,leger,@B
tomate|tomates|tomates farcies|salade de tomates|tomates mozzarella;i;legume;p1a3u2;fav=vif,leger,fruite,@P
courgette|courgettes|aubergine|aubergines|poivron|poivrons|ratatouille|legumes grilles|legumes du soleil|piperade;i;legume;p2g1a1u2f1;fav=salin,gourmand,@P,@R
asperge|asperges|asperges blanches|asperges vertes;i;legume;p2a1m2;fav=sauvignon,b-sauv,aromatique,fruite,riesling
artichaut|artichauts|artichaut poivrade|fenouil;i;legume;p2m3a1;fav=vif,salin,mineral
epinard|epinards|haricots verts|petits pois|brocoli|chou|chou-fleur|chou fleur|choux de bruxelles|navet|celeri|celeri-rave|poireau|poireaux|fenouil rôti|legumes|legume|legumes verts|legumes vapeur;i;legume,veggie;p2g0m1;fav=fruite,leger,vif,@B
carotte|carottes|betterave|betteraves|panais|topinambour|legumes racines|legumes rotis|legumes d'hiver|salsifis|rutabaga;i;legume,veggie;p2s2u1;fav=fruite,rond,@B,@P
champignon|champignons|champignons de paris|cepes|cepe|girolles|girolle|pleurotes|morilles|morille|shiitake|trompettes de la mort|pied de mouton|champignons des bois;i;champi;p3g1u5;fav=r-pinot,elegant,nebbiolo,rond,@R
truffe|truffes|truffe noire|truffe blanche|tuber;i;champi;p4g2u5;fav=r-pinot,elegant,nebbiolo,rond,@R,barolo
pomme de terre|pommes de terre|purée|puree|frites|gratin dauphinois|pommes de terre sautees|pommes vapeur|pommes sautees|rosti|raclette pommes;i;feculent;p2g2u1;fav=souple,@R,@B
patate douce|courge|potimarron|butternut|citrouille|potiron|courges;i;legume,veggie;p2s2g1;fav=rond,aromatique,fruite,@B
oignon|oignons|ail|echalote|poireaux|ciboulette;i;legume;p1u2;fav=
avocat|guacamole;i;legume;p2g3a1;fav=vif,fruite,@B,@P
concombre|radis|radis noir|cornichon|cornichons;i;legume,salade;p1a1m1;fav=vif,leger
mais|haricots blancs|flageolets|haricots rouges|lentilles|lentilles vertes|pois chiches|feves|haricots|legumineuses;i;legume,veggie;p3u2;fav=fruite,gourmand,@R
tofu|soja|tempeh|seitan|proteines vegetales|steak vegetal|plat vegetarien|vegetarien|vegan;i;veggie;p2u3;fav=fruite,aromatique,@B
# ---------- Féculents
pates|pâtes|spaghetti|spaghettis|tagliatelle|tagliatelles|penne|linguine|fusilli|rigatoni|macaroni|macaronis|vermicelles|coquillettes|pates fraiches;i;feculent;p2g1;fav=sangiovese,fruite,souple,@R,@B
lasagne|lasagnes|cannelloni|raviolis|ravioli|tortellini|tortelloni|gnocchi|gnocchis;i;feculent;p3g3u2;fav=sangiovese,gourmand,@R
riz|riz blanc|riz basmati|riz sauvage|riz cantonais|riz pilaf|riz au lait;i;feculent;p2;fav=leger,fruite
risotto;i;feculent;p3g3u2;fav=rond,b-salin,@B,souple
polenta;i;feculent;p3g2u2;fav=@R,souple,gourmand
couscous|semoule|boulgour|quinoa|blé|ble|epeautre|taboule|taboulé;i;feculent;p2;fav=gourmand,@P,epice
pain|baguette|tartine|toast|toasts|bruschetta|bruschettas|croque monsieur|croque-monsieur|focaccia|sandwich|club sandwich;i;feculent;p2g1u1;fav=fruite,leger,@P
pizza|pizzas|pizza margherita|pizza napolitaine|pizza reine|pizza 4 fromages|calzone|flammekueche|tarte flambee;i;feculent;p3g3a1u3l2;fav=sangiovese,gourmand,fruite,@R,@P,lambrusco;reg=it
nouilles|ramen|udon|soba|nouilles chinoises|nouilles sautees|vermicelles de riz|pad thai;i;feculent;p2u3;fav=aromatique,@B,@P
# ---------- Oeufs
oeuf|oeufs|œuf|œufs|omelette|oeufs brouilles|oeufs cocotte|oeuf mollet|oeufs mimosa|oeufs au plat|frittata|tortilla;i;oeuf;p2g2u2;fav=vif,fruite,@B,@P
quiche|quiches|quiche lorraine|tourte|tarte salee|cake sale|flan;i;oeuf;p3g3u2l2;fav=aromatique,fruite,rond,@B
# ---------- Fruits, noix, goûts sucrés
pomme|pommes|poire|poires|compote|coing;i;fruit;p1s3a1;fav=@D,moelleux,vif
citron|citron vert|agrumes|orange|pamplemousse|clementine;i;fruit;p1a4s1;fav=@D,muscat,@E
fraise|fraises|framboise|framboises|cerise|cerises|fruits rouges|myrtilles|cassis|groseille|mure|mures;i;fruit;p1s3a2;fav=@E,@D,muscat,doux
abricot|abricots|peche|peches|nectarine|prune|prunes|mirabelle|mirabelles|figue|figues|melon|pasteque|raisin|raisins|ananas|mangue|banane|fruits exotiques|fruits|salade de fruits|fruit;i;fruit;p1s3a1;fav=@D,muscat,moelleux,@E
noix|noisette|noisettes|amande|amandes|pistache|pistaches|noix de cajou|cacahuete|cacahuetes|pecan;i;fruit;p2g3u2m1;fav=@F,jaune,oxydatif,rond
miel|sirop d'erable|confiture|gelee|caramel|speculoos;i;dessert;p2s4;fav=@D,@F
chocolat|chocolat noir|chocolat au lait|cacao|moka|cafe|praline|nutella|chocolat blanc;i;dessert;p3g3s3m2;fav=@F,vdn,@R,d-recioto,banyuls,maury
# ---------- Desserts
tarte aux pommes|tarte tatin|tarte aux poires|crumble|clafoutis|tarte aux fruits|tarte aux abricots|tarte aux prunes|tarte aux fraises|tarte aux cerises|tarte au citron|tarte meringuee|tarte;i;dessert;p2g2s3a1;fav=@D,moelleux,muscat,@E,liquoreux
creme brulee|creme caramel|panna cotta|flan patissier|ile flottante|oeufs au lait|riz au lait|tiramisu|mousse au chocolat|fondant au chocolat|moelleux au chocolat|gateau au chocolat|brownie|fondant|foret noire|profiteroles|opera|chocolat chaud|mousse;i;dessert;p3g4s4m1;fav=@D,@F,muscat,passito,liquoreux,moelleux
gateau|gateaux|cake|madeleine|financier|baba au rhum|paris-brest|religieuse|eclair|eclairs|millefeuille|mille-feuille|macaron|macarons|cheesecake|pavlova|savarin|gateau d'anniversaire|buche|buche de noel|galette des rois|brioche|croissant|pain au chocolat|panettone|pandoro|colomba|biscotti|cantucci|cannoli|cassata|sfogliatella;i;dessert;p3g3s4;fav=@D,@E,e-doux,muscat,passito
glace|glaces|sorbet|sorbets|gelato|granite|coupe glacee|banana split|dessert|desserts|dessert glace|vacherin glace|nougat glace;i;dessert;p1g2s4;fav=@D,@F,muscat,@E
crepe|crepes|crepe suzette|gaufre|gaufres|pancakes|beignet|beignets|churros|donuts;i;dessert;p2g2s3;fav=@E,e-doux,@D,muscat,moelleux
zabaglione|sabayon|panettone|mascarpone dessert;i;dessert;p3g3s3;fav=passito,@D,marsala
`
