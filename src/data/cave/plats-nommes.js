// =============================================================
//  Plats — recettes connues (profil complet + accords classiques + région d'origine)
//  Même format que plats-ingredients.js : mots|alias ; p ; catégories ; profil ; options
//  Un plat reconnu ici remplace la décomposition ingrédient par ingrédient.
// =============================================================
export default `
# ---------- France : classiques
pot-au-feu|pot au feu|potee|boeuf bouilli;p;vrouge,legume;p3g2u3l1;fav=@R,souple,leger,beaujolais,chinon;reg=fr
blanquette de veau|blanquette|veau marengo;p;vblanche;p3g3u2;fav=@B,rond,b-ample,mâcon,chardonnay;reg=fr
boeuf bourguignon|bourguignon|boeuf mode|daube de boeuf|daube provencale|daube|carbonade flamande;p;vrouge;p4g3u5;fav=@R,pinot,gourmand,charpente,bourgogne;reg=fr,bourgogne
coq au vin|coq au riesling|poulet au vin jaune|poularde aux morilles;p;volaille;p4g3u4;fav=@R,pinot,bourgogne,jura;reg=fr,bourgogne
cassoulet|cassoulet de castelnaudary|cassoulet toulousain;p;charcut,legume;p5g5u4l2;fav=tannique,rustique,@R,cahors,madiran,minervois,corbieres;reg=fr,sud ouest,languedoc
choucroute|choucroute garnie|choucroute alsacienne;p;charcut,legume;p4g4a2u3l3;fav=@B,arom,riesling,pinot gris,alsace,@E;reg=fr,alsace
baeckeoffe|baeckeoffe alsacien|palette de porc|jambon a l'os;p;vblanche;p4g4u3;fav=@B,arom,pinot gris,alsace;reg=fr,alsace
tartiflette;p;fromage,charcut;p4g5u4l3;fav=@B,savoie,jacquere,rond,vif,mineral;reg=fr,savoie
raclette;p;fromage,charcut;p4g5u3l3;fav=@B,savoie,vif,mineral,roussette,@R,leger;reg=fr,savoie
fondue savoyarde|fondue au fromage|fondue fromage;p;fromage;p4g5u3l2;fav=@B,savoie,vif,mineral,apremont,chignin;reg=fr,savoie
fondue bourguignonne|fondue chinoise|fondue de boeuf;p;vrouge;p4g3u3;fav=@R,souple,fruite,beaujolais;reg=fr
quiche lorraine;p;oeuf,charcut;p3g4u3l3;fav=@B,arom,pinot gris,riesling,alsace;reg=fr,lorraine
gratin dauphinois;p;feculent;p2g4u2l1;fav=rond,@B,souple
hachis parmentier;p;vrouge,feculent;p3g3u3;fav=souple,fruite,@R,gourmand;reg=fr
steak frites|steak-frites|entrecote frites|entrecote-frites|bavette frites|boeuf frites;p;vrouge,feculent;p4g3u4f1l1;fav=@R,bordeaux,souple,gourmand;reg=fr
magret de canard|magret grille|magret sauce|canard aux olives;p;volaille;p4g4u4;fav=@R,pinot,gourmand,sud ouest,madiran,r-sud;reg=fr,sud ouest
confit de canard|cuisse de canard confite|duck confit;p;volaille;p4g5u4l2;fav=@R,tannique,gourmand,cahors,madiran,sud ouest;reg=fr,sud ouest
canard a l'orange;p;volaille;p4g4s2u3;fav=@R,pinot,fruite,gewurz,alsace;reg=fr
lapin a la moutarde|lapin moutarde|lapin chasseur|lapin aux pruneaux;p;vblanche;p3g2a1u3;fav=@R,fruite,r-pinot,@B,rond,loire;reg=fr
poulet roti|poulet au four|poulet roti pommes de terre|poulet basquaise|poulet fermier;p;volaille;p2g2u3f1;fav=rond,@R,r-pinot,@B,elegant;reg=fr
poule au pot|poularde|poulet a la creme|poulet au citron|poulet aux champignons|poulet marengo;p;volaille;p2g3u2;fav=rond,@B,b-ample,elegant;reg=fr
gigot d'agneau|gigot agneau|gigot de sept heures|carre d'agneau roti|agneau roti|agneau de sept heures;p;agneau;p4g3u4f1;fav=@R,bordeaux,pauillac,r-syrah,charpente,medoc;reg=fr
navarin d'agneau|navarin|epaule d'agneau confite|souris d'agneau confite|ragout d'agneau;p;agneau;p4g3u4;fav=@R,gourmand,r-syrah,souple;reg=fr
bouillabaisse|bourride|soupe de poissons|soupe de poisson|cotriade|cacciucco;p;poisson,mer,soupe;p3g2a1u4e1l2;fav=@P,bandol,provence,cassis,salin,gastronomique;reg=fr,provence
brandade de morue|brandade|morue a la lyonnaise|aioli provencal|le grand aioli;p;poisson;p3g3u3l3;fav=@B,rond,salin,rhone,rolle;reg=fr,provence
sole meuniere|sole normande|poisson meuniere|truite meuniere|truite aux amandes|raie au beurre noir;p;poisson;p3g3u2;fav=@B,b-ample,rond,meursault,chablis,bourgogne;reg=fr
moules marinieres|moules frites|moules au vin blanc|moules a la creme|moules au curry|moules;p;mer;p2g2u3l2;fav=muscadet,vif,mineral,salin,@B;reg=fr,loire
huitres|huitres chaudes|plateau d'huitres;p;mer;p1a1u3l3;fav=muscadet,chablis,champagne,vif,mineral;reg=fr,loire,bourgogne
homard a l'americaine|homard thermidor|homard grille|homard breton|langouste grillee|langouste a la nage;p;mer;p4g3u3;fav=b-ample,champagne,@B,meursault,chassagne,@E;reg=fr
coquilles saint-jacques a la creme|saint-jacques poelees|saint jacques poelees|noix de saint-jacques poelees|saint-jacques risotto|saint jacques;p;mer;p3g3s1u3;fav=b-ample,rond,meursault,@B,champagne;reg=fr
salade nicoise|nicoise|pan bagnat|salade nicoise thon|socca;p;salade,poisson;p2a2u2l3;fav=@P,provence,bandol,cassis,salin,vif;reg=fr,provence
pissaladiere|tarte a l'oignon|tarte aux oignons|tapenade toast;p;feculent;p2g2u3l3;fav=@P,provence,salin,@B;reg=fr,provence
ratatouille|tian de legumes|tian|legumes provencaux;p;legume;p2g1a1u2;fav=@P,provence,gourmand,@R,souple;reg=fr,provence
soupe a l'oignon|gratinee a l'oignon|soupe a l'oignon gratinee;p;soupe;p3g3u4l2;fav=@B,arom,jaune,oxydatif,rond;reg=fr
escargots|escargots de bourgogne|escargots au beurre persille|cuisses de grenouille|grenouilles;p;mer;p2g4u3;fav=@B,aligote,b-rond,vif,bourgogne;reg=fr,bourgogne
oeufs en meurette|jambon persille|pate en croute|pate croute|terrine de campagne|rillettes de porc;p;charcut;p3g3u3l3;fav=@R,leger,beaujolais,pinot,fruite;reg=fr
foie gras poele|foie gras mi-cuit|foie gras sur toast|escalope de foie gras|foie gras confiture;p;charcut;p4g5s1u3l1;fav=@D,liquoreux,sauternes,jurancon,monbazillac,moelleux,gewurz,@E;reg=fr
saumon fume|saumon fume blinis|blinis saumon|blinis|toast saumon fume|gravlax|saumon gravlax;p;poisson,apero;p3g3u3f2l3;fav=@E,champagne,vif,mineral,arom,b-sauv;reg=fr
tarte flambee|flammekueche|flammenkuche|tarte au maroilles|tarte aux poireaux;p;feculent;p3g3u3l3;fav=@B,pinot gris,riesling,alsace,@E,fruite;reg=fr,alsace
croque-monsieur|croque madame|croque monsieur|jambon beurre|sandwich jambon;p;feculent,charcut;p2g3u3l3;fav=fruite,leger,@B,@P
galette complete|galette bretonne|galette de sarrasin|crepe complete|crepes salees|crepes bretonnes;p;feculent;p2g2u2l2;fav=cidre,vif,fruite,@E,@B,muscadet;reg=fr,bretagne
quenelles de brochet|quenelles|quenelle sauce nantua|gratin de quenelles;p;poisson;p3g3u2;fav=@B,b-ample,rond,@E;reg=fr
gougeres|mini quiches|feuilletes|petits fours sales|toasts|canapes|amuse-bouche|amuse bouche|apero|aperitif|aperitif dinatoire|tapas|cocktail dinatoire;p;apero;p2g2u2l3;fav=@E,vif,mineral,@B;reg=fr
chips|cacahuetes|olives|cacahuetes grillees|biscuits aperitifs|biscuits apero|pistaches aperitif;p;apero;p2g3l4;fav=@E,vif,brut
steak tartare|tartare de boeuf frites;p;vrouge;p3g3a1u3;fav=souple,r-pinot,leger,beaujolais,@R;reg=fr
andouillette grillee|andouillette sauce moutarde|andouillette beaujolaise;p;abats;p4g4u4;fav=@R,beaujolais,fruite,@B,aligote;reg=fr
couscous royal|couscous merguez|couscous poulet|couscous agneau|couscous legumes|couscous;p;feculent,agneau;p3g2e2u3;fav=gourmand,solaire,@P,@R,r-gourmand,fruite;reg=
tajine d'agneau|tajine d'agneau aux pruneaux|tajine de poulet|tajine poulet citron olives|tajine de legumes|tajine de boeuf|tagine;p;agneau;p3g2s1e1u3;fav=gourmand,solaire,@R,@P,doux;reg=
pastilla|pastilla au poulet|pastilla aux fruits de mer|briouates|briouat;p;volaille;p3g3s1e1u3;fav=fruite,aromatique,@B,@R,doux
# ---------- Italie
spaghetti carbonara|carbonara|pasta carbonara|rigatoni carbonara|gricia|spaghetti alla gricia;p;feculent,charcut;p3g4u4l3;fav=@B,frascati,orvieto,vif,mineral,@R;reg=it,latium
spaghetti amatriciana|amatriciana|bucatini all'amatriciana|bucatini amatriciana;p;feculent,charcut;p3g3a2u4l3;fav=sangiovese,@R,montepulciano,cesanese,fruite;reg=it,latium
cacio e pepe|spaghetti cacio e pepe;p;feculent,fromage;p3g3u3l3e1;fav=@B,frascati,vif,mineral;reg=it,latium
spaghetti bolognaise|spaghetti bolognese|tagliatelle bolognaise|tagliatelle al ragu|ragu alla bolognese|pasta bolognaise|pates bolognaise|lasagnes bolognaise|lasagnes|lasagne al forno;p;feculent,vrouge;p3g3a1u4;fav=sangiovese,@R,gourmand,lambrusco,chianti,montepulciano;reg=it,emilie
pizza margherita|pizza marguerite;p;feculent,pizza;p2g2a2u2l1;fav=sangiovese,fruite,@R,@P,vif,lambrusco;reg=it,campanie
pizza quatre fromages|pizza 4 fromages|pizza quattro formaggi|pizza aux quatre fromages;p;feculent,pizza,fromage;p3g4u4l3;fav=fruite,@R,@B,gourmand,@E;reg=it
pizza reine|pizza regina|pizza jambon champignons|pizza napolitaine|pizza au jambon|pizza chorizo|pizza diavola|pizza pepperoni|pizza royale;p;feculent,pizza;p3g3a1u3l3;fav=sangiovese,gourmand,fruite,@R,lambrusco,montepulciano;reg=it
risotto aux champignons|risotto ai funghi|risotto aux cepes|risotto aux girolles|risotto aux morilles|risotto a la truffe|risotto truffe;p;feculent,champi;p3g3u5;fav=r-pinot,nebbiolo,elegant,@R,rond,@B;reg=it,piemont
risotto milanese|risotto au safran|risotto alla milanese|osso buco milanaise;p;feculent;p3g3u3;fav=rond,@B,b-salin,arom,franciacorta;reg=it,lombardie
risotto aux fruits de mer|risotto alla pescatora|risotto aux crevettes|risotto aux asperges|risotto aux legumes|risotto de legumes|risotto primavera|risotto au citron|risotto;p;feculent,mer;p3g2a1u3;fav=b-salin,vif,mineral,@B,soave,vermentino;reg=it
osso buco|ossobuco|osso bucco|jarret de veau;p;vblanche;p4g3u4;fav=@R,sangiovese,nebbiolo,gourmand,souple;reg=it,lombardie
saltimbocca|saltimbocca alla romana|escalope milanaise|cotoletta alla milanese|veau milanaise|piccata|escalope de veau au citron;p;vblanche;p2g2a1u3l2;fav=@B,vif,@R,fruite,sangiovese;reg=it
vitello tonnato|vitel tone;p;vblanche,poisson;p3g3a1u3;fav=@B,vif,rond,gavi,arneis,fruite,leger;reg=it,piemont
bistecca alla fiorentina|bistecca fiorentina|tagliata|tagliata de boeuf|tagliata di manzo|fiorentina;p;vrouge;p5g3u4f2;fav=@R,sangiovese,brunello,chianti classico,bolgheri,charpente;reg=it,toscane
ribollita|pappa al pomodoro|panzanella|zuppa toscana|acquacotta|pasta e fagioli|minestrone|minestrone de legumes|soupe de legumes|soupe;p;soupe,legume;p2g1u2;fav=sangiovese,@R,fruite,souple,@B;reg=it,toscane
parmigiana d'aubergines|parmigiana|parmigiana di melanzane|aubergines parmigiana|melanzane alla parmigiana|aubergines a la parmesane;p;legume,fromage;p3g3a2u3l2;fav=sangiovese,@R,fruite,gourmand;reg=it,campanie
caprese|salade caprese|mozzarella tomate|tomate mozzarella basilic;p;salade,fromage;p1g2a2;fav=@B,vif,fruite,leger,vermentino,@P;reg=it
bruschetta|bruschetta tomate|crostini|crostini toscani|antipasti|antipasto|assiette d'antipasti|antipasti italiens;p;apero;p2g2a1u2l2;fav=@B,vif,@P,fruite,leger,@E;reg=it
gnocchi gorgonzola|gnocchi au gorgonzola|gnocchi quatre fromages|gnocchi sauce gorgonzola;p;feculent,fromage;p3g4u4l3;fav=@D,fruite,rond,@B,arom,soave,@R;reg=it
trofie al pesto|pates au pesto|spaghetti al pesto|linguine al pesto|pesto genovese|pasta al pesto|pates pesto;p;feculent;p3g3a1u3;fav=b-salin,vermentino,pigato,vif,@B,@P;reg=it,ligurie
spaghetti alle vongole|spaghetti aux palourdes|linguine alle vongole|spaghetti aux fruits de mer|spaghetti vongole|pates aux fruits de mer|pates aux palourdes|linguine aux crevettes|spaghetti aux crevettes;p;feculent,mer;p2g2a1u3l2;fav=vermentino,b-salin,vif,mineral,@B,fiano,greco;reg=it
penne arrabbiata|penne all'arrabbiata|arrabbiata|spaghetti al pomodoro|pasta al pomodoro|pates a la sauce tomate|pates tomate basilic|spaghetti napolitaine|spaghetti napoli|pates a la tomate;p;feculent;p2g1a2e2u2;fav=sangiovese,@R,fruite,gourmand,@P,vif;reg=it
pates aux legumes|pasta primavera|orecchiette cime di rapa|orecchiette aux brocolis|pates aux courgettes|pasta alla norma|pasta norma|pates aux aubergines;p;feculent,legume;p2g2a1m1u2;fav=@B,vif,@P,vermentino,fruite,salin;reg=it
pates aux champignons|tagliatelles aux cepes|tagliatelles aux champignons|tagliatelle ai funghi|pates a la truffe|tagliatelles a la truffe|tajarin|tajarin al tartufo|tagliolini truffe;p;feculent,champi;p3g3u4;fav=r-pinot,nebbiolo,elegant,@R,rond,barbera;reg=it,piemont
pates a la creme|pates au saumon|pates saumon|tagliatelles au saumon|penne a la vodka|fettuccine alfredo|pates au jambon|pates carbonara|spaghetti a la creme;p;feculent;p3g4u2;fav=b-rond,@B,rond,fruite,@P;reg=it
pates au thon|pates thon tomate|spaghetti au thon;p;feculent,poisson;p3g2a1u3;fav=@P,fruite,vif,@B,sangiovese
arancini|supplì|suppli|panelle|fritto misto|friture de poissons|friture;p;apero,feculent;p3g3u3l2;fav=@E,vif,mineral,salin,@B,lambrusco;reg=it
polpette|polpette al sugo|boulettes de viande|boulettes sauce tomate|meatballs|polpettone;p;vrouge,feculent;p3g3a1u4;fav=sangiovese,gourmand,@R,souple;reg=it
focaccia|focaccia garnie|panini|panino|piadina|piadina romagnola|calzone farci;p;feculent;p2g2u2l2;fav=@R,fruite,leger,sangiovese,@P;reg=it
polenta et gorgonzola|polenta aux champignons|polenta et saucisses|polenta et ragu|polenta;p;feculent;p3g3u3;fav=@R,gourmand,souple,barbera,@B,arom;reg=it,lombardie
tiramisu;p;dessert;p3g4s4m1;fav=@F,@D,passito,marsala,vin santo,moscato,e-doux;reg=it
panna cotta|panna cotta fruits rouges|zabaione|semifreddo;p;dessert;p2g4s4;fav=@D,muscat,e-doux,moscato,passito,@E;reg=it
cannoli siciliens|cassata|cannoli|cassata siciliana|granita|granita siciliana;p;dessert;p2g3s5;fav=@D,muscat,passito,marsala,pantelleria,@F;reg=it,sicile
cantucci et vin santo|cantucci|amaretti|biscuits secs|biscuits;p;dessert;p2g2s3;fav=passito,vin santo,@D,@F;reg=it,toscane
# ---------- Asie
sushi|sushis|maki|makis|sashimi|chirashi|california roll|nigiri|poke bowl|poke|plateau de sushi|sushi saumon|sushi thon;p;poisson;p2g2a1u3l2;fav=mineral,vif,@E,champagne,arom,riesling,chablis,@B;reg=
ramen|ramens|udon|udon sauce|tonkotsu|soupe miso|miso soup|pho|soupe pho|soupe de nouilles|soupe asiatique|soupe thai;p;soupe,feculent;p3g2u5l3;fav=arom,fruite,@B,doux,@P
tempura|tempura de crevettes|tempura de legumes|tonkatsu|katsu|katsudon|gyoza|gyozas|raviolis japonais|raviolis chinois|raviolis vapeur|dim sum|dim-sum|baozi|bao|banh bao;p;apero;p2g3u3l2;fav=@E,vif,arom,mineral,@B,riesling;reg=
yakitori|brochettes japonaises|teriyaki poulet|poulet teriyaki|saumon teriyaki|boeuf teriyaki|okonomiyaki|takoyaki|donburi|oyakodon|gyudon|bento;p;volaille;p3g2s2u4f2;fav=fruite,@P,@R,r-pinot,arom;reg=
pad thai|pad thaï|poulet satay|satay|curry vert thai|curry rouge thai|curry thai|poulet thai|tom yum|tom kha|tom kha kai|salade thai|som tam|larb|massaman curry|boeuf thai|riz sauté thai;p;feculent;p3g3e3a2s1u3;fav=arom,doux,fruite,@E,gewurz,riesling,@P;reg=
curry de poulet|poulet tikka masala|poulet tikka|poulet au curry|poulet korma|butter chicken|curry d'agneau|rogan josh|curry de legumes|dahl|biryani|poulet tandoori|agneau tandoori|saag paneer|paneer|palak paneer|vindaloo|samosa|samosas|bhaji|naan;p;volaille;p3g3e3u3;fav=arom,doux,fruite,@P,gewurz,riesling,pinot gris,@B;reg=
canard laque|porc au caramel|boeuf aux oignons|boeuf sauce huitre|poulet aigre-doux|porc aigre-doux|riz cantonais|bo bun|bo bun boeuf|nems|nem|rouleaux de printemps|rouleaux de printemps crevettes|poulet general tao|poulet kung pao|mapo tofu|wok de legumes|wok de boeuf|wok de poulet|wok de crevettes|chow mein|nouilles sautees|nouilles sautees au poulet|nouilles sautees aux legumes|porc sauce soja|boeuf sauce soja|poulet sauce soja;p;feculent;p3g2s2e1u4l3;fav=arom,fruite,doux,@P,@E,pinot,gewurz,riesling;reg=
bibimbap|bulgogi|boeuf bulgogi|kimchi jjigae|jjigae|tteokbokki|poulet frit coreen|korean fried chicken|japchae|galbi;p;vrouge,feculent;p3g2s2e2u4;fav=fruite,@P,@R,arom,souple;reg=
# ---------- Monde
paella|paella valenciana|paella de fruits de mer|paella royale|paella au poulet|fideua|zarzuela|arroz negro|riz au safran;p;feculent,mer;p3g2u3;fav=@P,salin,gourmand,@B,r-gourmand,fruite;reg=
tortilla|tortilla espagnole|gaspacho|gazpacho|salmorejo|pimientos de padron|patatas bravas|croquetas|jambon iberique|jamon iberico|jamon serrano|pata negra|pa amb tomaquet|pan con tomate|tapas espagnoles|pulpo a la gallega|poulpe galicien;p;apero;p2g2a1u3l3;fav=@P,salin,@E,vif,fruite,@R,leger;reg=
chili con carne|chili|tacos|tacos al pastor|burritos|burrito|fajitas|enchiladas|quesadillas|nachos|carnitas|ceviche|ceviche peruvien|tostadas|mole poblano|mole|pozole|empanadas|empanada|arepas;p;vrouge,feculent;p3g3e3a1u3;fav=fruite,gourmand,@P,@R,@E,r-gourmand,zinfandel,primitivo;reg=
hamburger|burger|cheeseburger|bacon burger|burger maison|hot dog|hot-dog|club sandwich americain|ribs|travers sauce barbecue|travers de porc barbecue|pulled pork|poulet barbecue|chicken wings|ailes de poulet|nuggets de poulet|mac and cheese|macaroni au fromage|bbq ribs|brisket|steak grille americain|steakhouse|barbecue americain;p;vrouge,feculent;p4g4s1u3f3l2;fav=gourmand,solaire,r-sud,@R,primitivo,fruite,puissant;reg=
fish and chips|fish & chips|poisson pane|poisson frit|beignets de poisson|calamars frits|beignets de calamars|friture de calamars|fritures;p;poisson;p3g3a1u2l2;fav=vif,mineral,@E,@B,muscadet,chablis,brut
moussaka|moussakas|souvlaki|gyros|kebab|kebabs|doner|durum|shawarma|brochettes d'agneau|keftedes|kefta|kofta|brochettes kefta|falafel|falafels|houmous|hummus|taboule libanais|baba ganoush|mezze libanais|mezze grec|salade grecque|tzatziki|dolmades|feuilles de vigne farcies|spanakopita|boureks|borek|labneh|mezze oriental;p;apero,vrouge;p3g3a1u3l2;fav=salin,vif,@B,@P,gourmand,@R,mediterraneen;reg=
`
