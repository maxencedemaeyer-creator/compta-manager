// =============================================================
//  Plats — cuissons, sauces, assaisonnements, cuisines du monde
//  Une ligne :  mots|alias ; m (modificateur) ou c (cuisine) ; catégories ; ajustements ; options
//  Les ajustements s'ADDITIONNENT au plat (g+1 = un cran de gras en plus, a-1 = un cran d'acidité en moins).
//  Lettres : p poids · g gras · a acidité · e épices · s sucré · u umami · f fumé · m amertume · l sel
//  Même format d'options que plats-ingredients.js (fav=, reg=).
// =============================================================
export default `
# ---------- Cuissons
grille|grillee|grillade|grillades|barbecue|bbq|braise|a la plancha|plancha|brochette|brochettes;m;;f+3p+1;fav=boise,epice,charpente
roti|rotie|roti au four|au four|four|a la broche|poele|poelee|saute|sautee|snack|saisi|saisie;m;;f+1p+1
frit|frite|friture|fritto|tempura|beignets|panure|pane|panee|croustillant|croustillante|nuggets|fish and chips;m;;g+2l+1p+1;fav=@E,vif,mineral
mijote|mijotee|ragout|braise a l'etouffee|braisee|daube|cocotte|en cocotte|bourguignon|carbonade|estouffade|fricassee|pot-au-feu|potee|au vin;m;;p+2u+1g+1;fav=@R,gourmand
poche|pochee|vapeur|a la vapeur|court-bouillon|bouilli|bouillie|blanquette|en papillote|papillote;m;;p-1g-1;fav=mineral,vif
cru|crue|tartare de|ceviche|marine cru|carpaccio de|sashimi de;m;;a+1p-1;fav=vif,mineral
fume|fumee|fumes|saumon fume|fumaison|boucane;m;;f+3u+1l+1;fav=@E,arom,rond
confit|confite|confits|confite d'oignons;m;;g+2s+1u+1
gratine|gratinee|gratin|au gratin|croute de fromage|gratinade;m;;g+2p+1;fav=rond
en croute|croute|feuillete|feuilletee|wellington|vol-au-vent|bouchee|bouchees a la reine|croustade|friand;m;;g+1p+1
farci|farcie|farcis|farcies|roule|roulade|cannelle;m;;p+1u+1
marine|marinade|marinee|marines|escabeche|mariné;m;;a+1u+1
sec|seche|sechee|sechage|affine|affinee;m;;p+1u+1l+1
# ---------- Sauces et accompagnements
creme|a la creme|cremeux|cremeuse|sauce cremee|creme fraiche|beurre|beurre blanc|sauce au beurre|beurre noisette|meuniere|hollandaise|bearnaise|sauce blanche|bechamel|velute|sauce normande|lait|fondue de poireaux;m;;g+2a-1p+1;fav=rond,b-ample,mineral,@B
sauce tomate|tomate|a la tomate|napolitaine|marinara|arrabbiata|amatriciana|pizzaiola|bolognaise|ragu|puttanesca|provencale|a la provencale|basquaise|piperade;m;;a+2u+1;fav=sangiovese,acide,fruite,@R
vin rouge|sauce au vin rouge|au vin rouge|bourguignonne|sauce bordelaise|bordelaise|marchand de vin|a la bordelaise|sauce au poivre|sauce poivre|poivre|au poivre|sauce au porto|sauce madere|jus|jus de viande|sauce brune|demi-glace|reduction|sauce forestiere;m;;u+2p+1g+1;fav=@R,charpente
vin blanc|au vin blanc|sauce vin blanc|a la marinière|marinière|marinieres|a la nage|nage|fumet|bisque|sauce americaine|armoricaine|thermidor;m;;a+1u+1g+1;fav=@B,rond
citron|au citron|citronnee|citronnée|citron confit|sauce citron|sauce vierge|vinaigrette|au vinaigre|vinaigre|balsamique|aigre|cornichons|capres|caprons|sauce gribiche|chimichurri|salsa verde|salsa|escabèche;m;;a+2;fav=vif,mineral,sauvignon
moutarde|a la moutarde|moutarde a l'ancienne|sauce moutarde|raifort|dijonnaise|wasabi;m;;a+1e+1u+1;fav=vif,arom,@B,fruite
curry|au curry|curry vert|curry rouge|massaman|korma|tikka masala|tikka|garam masala|colombo|vindaloo|madras|epices|epice|epicee|epicé|aux epices|cumin|curcuma|paprika|coriandre|cardamome|ras el hanout|quatre epices|cannelle sale|zaatar|harissa;m;;e+2u+1;fav=arom,fruite,@P,doux,gewurz
piment|piquant|pimente|pimentee|tres epice|fort en bouche|sauce piquante|tabasco|sriracha|jalapeno|piment d'espelette|espelette|cayenne|chili|chilli|diable|a la diable;m;;e+3;fav=arom,doux,fruite,@E,@P
ail|a l'ail|ail des ours|persillade|aioli|aïoli|rouille|sauce aioli|ail et persil;m;;u+1e+1;fav=salin,mediterraneen,vif
herbes|herbes fraiches|aux herbes|persil|basilic|thym|romarin|estragon|menthe|sauge|laurier|aneth|cerfeuil|origan|fines herbes|herbes de provence|sarriette|citronnelle;m;;a+0;fav=vif,aromatique
pesto|pistou|sauce pesto|trofie al pesto|genovese|a la genoise;m;;g+2u+1a+1;fav=salin,vif,vermentino,@B;reg=ligurie,it
olive|olives|tapenade|a l'huile d'olive|huile d'olive|anchoiade|noir d'olive|mediterraneen;m;;l+2u+1;fav=salin,mediterraneen
miel|au miel|caramel|caramelise|caramelisee|aigre-doux|aigre doux|sucre sale|confiture d'oignons|chutney|sauce barbecue|bbq sauce|teriyaki|sauce teriyaki|glace|glacee|laque|laquee|mangue|ananas;m;;s+2;fav=doux,fruite,aromatique,@P
soja|sauce soja|au soja|tamari|miso|bouillon dashi|dashi|sauce huitre|nuoc mam|nuoc-mam|sauce de poisson|nam pla|sauce hoisin|hoisin|gochujang|kimchi;m;;u+2l+2;fav=@E,arom,doux,mineral
gingembre|au gingembre|citronnelle thai|lait de coco|a la coco|coco|noix de coco|sauce satay|satay|cacahuetes|sauce cacahuete|tamarin;m;;g+1s+1e+1;fav=arom,doux,fruite
truffe|a la truffe|huile de truffe|truffee|truffes;m;;u+2g+1;fav=r-pinot,elegant,rond,nebbiolo
aux champignons|forestiere|sauce aux champignons|a la forestiere|aux cepes|aux morilles|aux girolles;m;;u+2g+1;fav=r-pinot,elegant,nebbiolo
roquefort|sauce roquefort|au roquefort|au bleu|sauce au bleu|gorgonzola sauce|aux 4 fromages|quatre fromages|aux quatre fromages;m;;g+2u+2l+2;fav=@D,@F,muscat
parmesan|au parmesan|copeaux de parmesan|parmigiana|a la parmigiana|pecorino romano|fromage rape;m;;u+2l+1g+1;fav=sangiovese,fruite
fromage rape|fromage fondu|fondu|fondue|raclette fromage|cheese;m;;g+2l+1p+1;fav=@B,vif,mineral
orange|a l'orange|sauce orange|sauce aux fruits|aux fruits rouges|aux airelles|sauce cranberry|cranberry|sauce cerise|aux cerises|aux pruneaux|pruneaux|abricots secs|fruits secs|sauce framboise|aux figues|aux poires;m;;s+1a+1;fav=fruite,elegant,r-pinot,doux
oignons caramelises|soupe a l'oignon|oignons|oignon confit;m;;s+1u+1g+1
avocat|a l'avocat;m;;g+1
chocolat|au chocolat|sauce chocolat|coulis de chocolat;m;;s+1g+1m+1
fruits|aux fruits|coulis|coulis de fruits|chantilly|creme anglaise|creme patissiere|meringue|meringuee;m;;s+1g+1
sucre|sucree|sucre sale|dessert|desert;m;;s+1
salee|sale|salaison|sel|sauce salee|poutargue|bottarga|jambon sec|tres sale;m;;l+2
leger|legere|legers|legeres|leger en bouche|diététique|dietetique|minceur|light|fraicheur;m;;p-1g-1
copieux|copieuse|riche|consistant|consistante|gourmand|gourmande|generations|roboratif;m;;p+1g+1
# ---------- Cuisines du monde
italien|italienne|italie|a l'italienne|a la romaine|romaine|alla romana|alla milanese|milanaise|alla toscana|toscane;c;;;reg=it
francais|francaise|france|bistrot|brasserie|bourgeoise|bourgeois|cuisine francaise|terroir;c;;;reg=fr
japonais|japonaise|japon|nippon|izakaya|sushi bar;c;;a+1u+1;fav=mineral,@E,vif,arom
chinois|chinoise|chine|cantonais|cantonaise|sichuan|asiatique|asie|wok|au wok|sauté au wok|sauce aigre-douce;c;;u+1s+1;fav=arom,fruite,doux,@E
thai|thailande|thailandais|thailandaise;c;;e+2a+1s+1;fav=arom,doux,fruite,@E
vietnamien|vietnamienne|vietnam|pho|bo bun|bun cha|nems|rouleaux de printemps|banh mi;c;;a+1u+1;fav=vif,arom,mineral
coreen|coreenne|coree|bibimbap|bulgogi|kimchi;c;;e+2u+1;fav=arom,fruite,@P
indien|indienne|inde|tandoori|naan|biryani|dahl|dal|masala|tikka|kebab de poulet;c;;e+2u+1;fav=arom,doux,fruite,@P,gewurz,riesling
marocain|marocaine|maroc|tajine|tagine|oriental|orientale|libanais|libanaise|liban|turc|turque|turquie|maghrebin|maghrebine|algerien|tunisien|egyptien|syrien|moyen-orient|mezze|mezzés|mezze;c;;e+1s+1u+1;fav=gourmand,solaire,fruite,@R,@P
grec|grecque|grece|a la grecque|souvlaki|gyros|moussaka|tzatziki|feta;c;;a+1;fav=salin,vif,@B;reg=
espagnol|espagnole|espagne|tapas|paella|a l'espagnole;c;;u+1;fav=gourmand,salin,@R,@P
mexicain|mexicaine|mexique|tex-mex|tex mex|tacos|burrito|burritos|fajitas|enchiladas|quesadilla|nachos|chili con carne|guacamole|salsa mexicaine;c;;e+2u+1;fav=fruite,gourmand,@P,@R,@E
americain|americaine|burger|hamburger|cheeseburger|hot dog|hot-dog|bbq americain|ribs|pulled pork|mac and cheese|wings|ailes de poulet|poulet frit;c;;g+1u+1f+1;fav=gourmand,sud,@R,fruite
mediterraneen|mediterraneenne|mediterranee|mediterranéen|a la mediterraneenne|mer mediterranee;c;;;fav=salin,mediterraneen
scandinave|nordique|suedois|suedoise|norvegien|danois;c;;a+1;fav=vif,mineral,@E
anglais|britannique|angleterre|roast beef anglais|fish and chips anglais;c;;g+1
`
