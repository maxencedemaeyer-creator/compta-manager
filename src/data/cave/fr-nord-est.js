// Appellations françaises (AOC/AOP) — Alsace, Champagne, Bourgogne, Beaujolais, Jura, Savoie, Lorraine.
// Format d'une ligne : voir src/lib/cave/appellations.js
export default `
# ---------- Alsace
Alsace;Alsace;B=b-arom,14~Riesling+Pinot gris+Gewurztraminer+Pinot blanc+Sylvaner+Muscat;R=r-pinot,13~Pinot noir;P=p-leger,11~Pinot noir;D=d-moelleux,28~Riesling+Gewurztraminer+Pinot gris
Alsace Grand Cru;Alsace;B=b-arom,32,4-20~Riesling+Gewurztraminer+Pinot gris+Muscat;D=d-moelleux,45,5-30~Gewurztraminer+Pinot gris
Crémant d'Alsace;Alsace;E=e-fruite,12~Pinot blanc+Pinot noir+Riesling+Auxerrois
# ---------- Champagne
Champagne;Champagne;E=e-brut,40~Chardonnay+Pinot noir+Pinot Meunier
Coteaux Champenois;Champagne;B=b-rond,35~Chardonnay;R=r-pinot,35~Pinot noir
Rosé des Riceys;Champagne;P=p-gastro,35~Pinot noir
# ---------- Bourgogne : Yonne
Chablis;Bourgogne;B=b-mineral,22~Chardonnay
Petit Chablis;Bourgogne;B=b-mineral,15,0-4~Chardonnay
Chablis Premier Cru;Bourgogne;B=b-mineral,34,3-12~Chardonnay
Chablis Grand Cru;Bourgogne;B=b-ample,70,6-20~Chardonnay
Irancy;Bourgogne;R=r-pinot,22~Pinot noir+César
Saint-Bris;Bourgogne;B=b-sauv,15~Sauvignon blanc
Bourgogne Épineuil;Bourgogne;R=r-pinot,16~Pinot noir
Bourgogne Côtes d'Auxerre;Bourgogne;B=b-mineral,14~Chardonnay;R=r-pinot,16~Pinot noir
Bourgogne Tonnerre;Bourgogne;B=b-mineral,14~Chardonnay
Vézelay;Bourgogne;B=b-rond,14~Chardonnay
# ---------- Bourgogne : régionales
Bourgogne;Bourgogne;B=b-rond,18,1-5~Chardonnay;R=r-pinot,18,1-6~Pinot noir;P=p-leger,12~Pinot noir
Bourgogne Aligoté;Bourgogne;B=b-mineral,13,0-4~Aligoté
Bourgogne Passetoutgrain;Bourgogne;R=r-leger,12~Gamay+Pinot noir
Bourgogne Hautes-Côtes de Nuits;Bourgogne;B=b-rond,20~Chardonnay;R=r-pinot,22~Pinot noir
Bourgogne Hautes-Côtes de Beaune;Bourgogne;B=b-rond,20~Chardonnay;R=r-pinot,22~Pinot noir
Bourgogne Côte Chalonnaise;Bourgogne;B=b-rond,17~Chardonnay;R=r-pinot,17~Pinot noir
Coteaux Bourguignons;Bourgogne;R=r-leger,11~Gamay+Pinot noir;B=b-fruite,11~Chardonnay+Aligoté
Crémant de Bourgogne;Bourgogne;E=e-fruite,15~Pinot noir+Chardonnay+Aligoté
# ---------- Côte de Nuits
Marsannay;Bourgogne;R=r-pinot,28~Pinot noir;B=b-rond,26~Chardonnay;P=p-gastro,18~Pinot noir
Fixin;Bourgogne;R=r-pinot,40,4-12~Pinot noir;B=b-rond,38~Chardonnay
Gevrey-Chambertin;Bourgogne;R=r-pinot,60,5-18~Pinot noir
Morey-Saint-Denis;Bourgogne;R=r-pinot,60,5-18~Pinot noir;B=b-ample,55~Chardonnay
Chambolle-Musigny;Bourgogne;R=r-pinot,65,5-18~Pinot noir
Vougeot;Bourgogne;R=r-pinot,60,5-15~Pinot noir;B=b-ample,60~Chardonnay
Vosne-Romanée;Bourgogne;R=r-pinot,80,6-20~Pinot noir
Flagey-Echézeaux;Bourgogne;R=r-pinot,70~Pinot noir
Nuits-Saint-Georges;Bourgogne;R=r-pinot,60,5-18~Pinot noir;B=b-ample,55~Chardonnay
Côte de Nuits-Villages;Bourgogne;R=r-pinot,30~Pinot noir;B=b-rond,28~Chardonnay
Chambertin;Bourgogne;R=r-grand,250,10-35~Pinot noir
Chambertin-Clos de Bèze;Bourgogne;R=r-grand,260,10-35~Pinot noir
Charmes-Chambertin;Bourgogne;R=r-grand,150,8-30~Pinot noir
Mazis-Chambertin;Bourgogne;R=r-grand,170,8-30~Pinot noir
Griotte-Chambertin;Bourgogne;R=r-grand,180,8-30~Pinot noir
Latricières-Chambertin;Bourgogne;R=r-grand,150,8-30~Pinot noir
Ruchottes-Chambertin;Bourgogne;R=r-grand,170,8-30~Pinot noir
Mazoyères-Chambertin;Bourgogne;R=r-grand,150,8-30~Pinot noir
Clos de la Roche;Bourgogne;R=r-grand,180,8-30~Pinot noir
Clos Saint-Denis;Bourgogne;R=r-grand,180,8-30~Pinot noir
Clos des Lambrays;Bourgogne;R=r-grand,200,8-30~Pinot noir
Clos de Tart;Bourgogne;R=r-grand,300,10-35~Pinot noir
Bonnes-Mares;Bourgogne;R=r-grand,250,10-35~Pinot noir
Musigny;Bourgogne;R=r-grand,500,12-40~Pinot noir;B=b-ample,500~Chardonnay
Clos de Vougeot;Bourgogne;R=r-grand,150,8-30~Pinot noir
Échezeaux;Bourgogne;R=r-grand,180,8-30~Pinot noir
Grands Échezeaux;Bourgogne;R=r-grand,300,10-35~Pinot noir
Romanée-Saint-Vivant;Bourgogne;R=r-grand,350,10-40~Pinot noir
Richebourg;Bourgogne;R=r-grand,600,12-40~Pinot noir
La Romanée;Bourgogne;R=r-grand,900,12-40~Pinot noir
La Tâche;Bourgogne;R=r-grand,1500,12-40~Pinot noir
La Grande Rue;Bourgogne;R=r-grand,500,12-40~Pinot noir
Romanée-Conti;Bourgogne;R=r-grand,10000,12-40~Pinot noir
# ---------- Côte de Beaune
Ladoix;Bourgogne;R=r-pinot,40~Pinot noir;B=b-rond,40~Chardonnay
Aloxe-Corton;Bourgogne;R=r-pinot,50,5-15~Pinot noir;B=b-ample,55~Chardonnay
Pernand-Vergelesses;Bourgogne;R=r-pinot,38~Pinot noir;B=b-ample,42~Chardonnay
Savigny-lès-Beaune;Bourgogne;R=r-pinot,40,4-14~Pinot noir;B=b-rond,40~Chardonnay
Chorey-lès-Beaune;Bourgogne;R=r-pinot,32~Pinot noir;B=b-rond,32~Chardonnay
Beaune;Bourgogne;R=r-pinot,48,4-15~Pinot noir;B=b-ample,50~Chardonnay
Pommard;Bourgogne;R=r-pinot,60,6-20~Pinot noir
Volnay;Bourgogne;R=r-pinot,60,5-18~Pinot noir
Monthélie;Bourgogne;R=r-pinot,40~Pinot noir;B=b-rond,40~Chardonnay
Auxey-Duresses;Bourgogne;R=r-pinot,35~Pinot noir;B=b-rond,38~Chardonnay
Saint-Romain;Bourgogne;R=r-pinot,33~Pinot noir;B=b-rond,35~Chardonnay
Meursault;Bourgogne;B=b-ample,75,4-15~Chardonnay;R=r-pinot,45~Pinot noir
Blagny;Bourgogne;R=r-pinot,50~Pinot noir;B=b-ample,55~Chardonnay
Puligny-Montrachet;Bourgogne;B=b-ample,85,5-16~Chardonnay
Chassagne-Montrachet;Bourgogne;B=b-ample,80,5-15~Chardonnay;R=r-pinot,50~Pinot noir
Saint-Aubin;Bourgogne;B=b-rond,50~Chardonnay;R=r-pinot,40~Pinot noir
Santenay;Bourgogne;R=r-pinot,35~Pinot noir;B=b-rond,38~Chardonnay
Maranges;Bourgogne;R=r-pinot,30~Pinot noir;B=b-rond,30~Chardonnay
Côte de Beaune;Bourgogne;R=r-pinot,35~Pinot noir;B=b-rond,38~Chardonnay
Côte de Beaune-Villages;Bourgogne;R=r-pinot,30~Pinot noir
Corton;Bourgogne;R=r-grand,150,10-30~Pinot noir
Corton-Charlemagne;Bourgogne;B=b-ample,200,8-25~Chardonnay
Charlemagne;Bourgogne;B=b-ample,180,8-25~Chardonnay
Montrachet;Bourgogne;B=b-ample,1500,10-35~Chardonnay
Bâtard-Montrachet;Bourgogne;B=b-ample,450,8-30~Chardonnay
Bienvenues-Bâtard-Montrachet;Bourgogne;B=b-ample,350,8-30~Chardonnay
Chevalier-Montrachet;Bourgogne;B=b-ample,450,8-30~Chardonnay
Criots-Bâtard-Montrachet;Bourgogne;B=b-ample,400,8-30~Chardonnay
# ---------- Côte chalonnaise et Mâconnais
Bouzeron;Bourgogne;B=b-mineral,25~Aligoté
Rully;Bourgogne;B=b-rond,28~Chardonnay;R=r-pinot,26~Pinot noir
Mercurey;Bourgogne;R=r-pinot,28,3-12~Pinot noir;B=b-rond,28~Chardonnay
Givry;Bourgogne;R=r-pinot,28~Pinot noir;B=b-rond,28~Chardonnay
Montagny;Bourgogne;B=b-rond,24~Chardonnay
Mâcon;Bourgogne;B=b-rond,15~Chardonnay;R=r-leger,13~Gamay;P=p-leger,11~Gamay
Mâcon-Villages;Bourgogne;B=b-rond,17~Chardonnay
Pouilly-Fuissé;Bourgogne;B=b-rond,38,3-10~Chardonnay
Pouilly-Loché;Bourgogne;B=b-rond,26~Chardonnay
Pouilly-Vinzelles;Bourgogne;B=b-rond,28~Chardonnay
Saint-Véran;Bourgogne;B=b-rond,22~Chardonnay
Viré-Clessé;Bourgogne;B=b-rond,22~Chardonnay
# ---------- Beaujolais
Beaujolais;Beaujolais;R=r-leger,9,0-3~Gamay;P=p-leger,9~Gamay;B=b-rond,13~Chardonnay
Beaujolais-Villages;Beaujolais;R=r-leger,11,0-4~Gamay;B=b-rond,14~Chardonnay
Brouilly;Beaujolais;R=r-leger,14,1-5~Gamay
Côte de Brouilly;Beaujolais;R=r-souple,17,2-8~Gamay
Régnié;Beaujolais;R=r-leger,14,1-5~Gamay
Chiroubles;Beaujolais;R=r-leger,15,1-5~Gamay
Fleurie;Beaujolais;R=r-leger,16,1-6~Gamay
Morgon;Beaujolais;R=r-souple,16,2-9~Gamay
Chénas;Beaujolais;R=r-souple,16,2-9~Gamay
Moulin-à-Vent;Beaujolais;R=r-pinot,20,3-12~Gamay
Juliénas;Beaujolais;R=r-souple,16,2-8~Gamay
Saint-Amour;Beaujolais;R=r-leger,17,1-6~Gamay
# ---------- Jura
Arbois;Jura;B=b-rond,20~Chardonnay+Savagnin;R=r-leger,17~Poulsard+Trousseau+Pinot noir;P=p-gastro,16~Poulsard;F=f-jaune,38~Savagnin
Arbois-Pupillin;Jura;B=b-rond,24~Chardonnay+Savagnin;R=r-leger,20~Poulsard
Côtes du Jura;Jura;B=b-rond,16~Chardonnay+Savagnin;R=r-leger,15~Poulsard+Trousseau+Pinot noir;P=p-gastro,14~Poulsard;F=f-jaune,35~Savagnin
L'Étoile;Jura;B=b-rond,20~Chardonnay+Savagnin+Poulsard;F=f-jaune,40~Savagnin;D=d-passito,35~Chardonnay+Savagnin+Poulsard
Château-Chalon;Jura;F=f-jaune,65,15-100~Savagnin
Crémant du Jura;Jura;E=e-fruite,14~Chardonnay+Pinot noir+Poulsard+Trousseau+Savagnin
Macvin du Jura;Jura;F=f-vdn,18~Savagnin+Chardonnay+Poulsard
# ---------- Savoie et Bugey
Vin de Savoie;Savoie;B=b-leger,12~Jacquère+Roussanne+Chasselas;R=r-leger,13~Mondeuse+Gamay+Pinot noir;P=p-leger,11~Gamay+Pinot noir
Roussette de Savoie;Savoie;B=b-rhone,15~Altesse
Apremont;Savoie;B=b-leger,10~Jacquère
Abymes;Savoie;B=b-leger,10~Jacquère
Chignin;Savoie;B=b-leger,10~Jacquère;R=r-leger,12~Mondeuse
Chignin-Bergeron;Savoie;B=b-rhone,20~Roussanne
Arbin;Savoie;R=r-syrah,15~Mondeuse
Crépy;Savoie;B=b-leger,13~Chasselas
Ayze;Savoie;E=e-fruite,14~Gringet
Seyssel;Savoie;B=b-fruite,14~Altesse+Chasselas;E=e-fruite,15~Altesse+Molette
Bugey;Savoie;B=b-fruite,12~Chardonnay+Altesse+Aligoté;R=r-leger,12~Gamay+Pinot noir+Mondeuse;E=e-fruite,12~Chardonnay
Bugey-Cerdon;Savoie;E=e-doux,11~Gamay+Poulsard
Roussette du Bugey;Savoie;B=b-rhone,14~Altesse
Montagnieu;Savoie;E=e-fruite,13~Altesse+Chardonnay+Mondeuse
# ---------- Lorraine
Côtes de Toul;Lorraine;R=r-leger,9~Pinot noir+Gamay;P=p-leger,9~Gamay+Pinot noir;B=b-leger,9~Auxerrois
Moselle;Lorraine;B=b-leger,9~Auxerrois+Pinot blanc;R=r-leger,9~Pinot noir
`
