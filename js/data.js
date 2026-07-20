/* ============================================================
   TROUVAILLE — Contenu du jeu
   ------------------------------------------------------------
   Architecture "MONDES" : le jeu est prévu pour 3 mondes.
   Chaque monde = 1 image + 1 dictionnaire (liste maîtresse §10).

   -> Monde 1 « La Caverne des Curiosités » : PRÊT (ton image +
      ton dictionnaire officiel, transcrits ci-dessous).
   -> Mondes 2 & 3 : gabarits verrouillés, à remplir quand tu
      auras généré tes images (GPT Image) + rédigé leurs dicos.

   FORMAT D'UN OBJET (une "trouvaille") :
     { mots: ["libellé canonique", "synonyme1", "synonyme2", ...], f: 3 }
       - mots : le 1er est le libellé canonique affiché.
                Tous les autres sont des synonymes acceptés.
                Chaque mot est indexé sous SA propre lettre initiale
                (ex. "locomotive" compte pour L, "train" pour T).
       - f    : évidence de l'objet, 1 (rare / piège) … 5 (évident).
                Sert au bot : il repère surtout les objets évidents ;
                le joueur est récompensé (3 pts) s'il voit les rares.
                Optionnel — vaut 3 si absent.

   COMMENT AJOUTER TON MONDE :
     1. Mets ton image dans le dossier du jeu.
     2. Copie le gabarit plus bas, mets `pret: true`, le bon
        `image:` et transcris ton dictionnaire dans `objets`.
   ============================================================ */

/* ---- MONDE 1 : LA CAVERNE DES CURIOSITÉS -------------------
   Transcription du dictionnaire officiel v1.0.
   Règles appliquées : synonymes "/" regroupés, singulier/pluriel
   gérés par le moteur, mots anglais "non retenus" remplacés par
   leur équivalent FR, doublons fusionnés (ex. hibou = chouette),
   termes trop génériques exclus (chose, objet, décoration, jouet
   seul, instrument de musique…). */
const OBJETS_CAVERNE = [
  // [A]
  { mots: ["accordéon"], f: 1 },
  { mots: ["ampoule"] },
  { mots: ["ancre"] },
  { mots: ["appareil photo", "appareil"] },
  { mots: ["arbre"] },
  { mots: ["sphère armillaire", "armillaire"], f: 1 },
  { mots: ["arrosoir"] },
  { mots: ["assiette"], f: 2 },
  { mots: ["avion", "aéroplane", "avion jouet"] },

  // [B]
  { mots: ["ballon"] },
  { mots: ["ballon dirigeable", "dirigeable", "zeppelin"], f: 2 },
  { mots: ["banc"] },
  { mots: ["bandeau", "foulard", "bandana"], f: 2 },
  { mots: ["bijou"] },
  { mots: ["bocal"], f: 2 },
  { mots: ["bol"], f: 2 },
  { mots: ["bougie", "chandelle"], f: 4 },
  { mots: ["boussole", "compas"], f: 4 },
  { mots: ["bouteille"] },
  { mots: ["boîte"] },
  { mots: ["boîte à musique"] },
  { mots: ["buste"], f: 4 },

  // [C]
  { mots: ["cadenas"], f: 2 },
  { mots: ["cage à oiseaux", "cage", "cage à oiseau", "volière"], f: 4 },
  { mots: ["caisse"] },
  { mots: ["canard", "canard en plastique", "canard en plastique jaune"], f: 5 },
  { mots: ["candélabre", "chandelier"], f: 2 },
  { mots: ["carafe"], f: 2 },
  { mots: ["carrousel", "manège"], f: 5 },
  { mots: ["carte à jouer", "carte", "jeu de cartes"] },
  { mots: ["casque"], f: 2 },
  { mots: ["chapeau haut-de-forme", "chapeau", "haut-de-forme", "haut de forme", "chapeau melon"], f: 5 },
  { mots: ["chat"], f: 3 },
  { mots: ["chat bleu en peluche", "chat bleu"], f: 4 },
  { mots: ["chaussure"], f: 2 },
  { mots: ["cheval de carrousel", "cheval"] },
  { mots: ["ciseaux"], f: 3 },
  { mots: ["clavier", "clavier de machine à écrire"] },
  { mots: ["cloche", "clochette"] },
  { mots: ["clown", "bouffon", "arlequin"], f: 4 },
  { mots: ["clé", "clef"], f: 5 },
  { mots: ["coffre"] },
  { mots: ["collier", "perles", "perle", "sautoir"] },
  { mots: ["coquillage"], f: 2 },
  { mots: ["boule de cristal", "cristal", "boule de voyance"], f: 3 },
  { mots: ["crâne", "tête de mort"], f: 5 },
  { mots: ["cuillère", "cuiller"], f: 2 },

  // [D]
  { mots: ["domino", "dominos"], f: 1 },
  { mots: ["drapeau"] },
  { mots: ["dé", "dés"] },

  // [E]
  { mots: ["éventail"], f: 2 },

  // [F]
  { mots: ["fauteuil"], f: 4 },
  { mots: ["figurine"] },
  { mots: ["flacon"], f: 2 },
  { mots: ["fleur", "fleurs"], f: 4 },
  { mots: ["flûte"] },

  // [G]
  { mots: ["gant"], f: 1 },
  { mots: ["globe terrestre", "globe", "mappemonde"], f: 5 },
  { mots: ["gobelet"], f: 2 },
  { mots: ["gramophone", "phonographe"], f: 5 },
  { mots: ["grappe de raisin", "grappe", "raisin"], f: 3 },

  // [H]
  { mots: ["hibou", "chouette"], f: 5 },
  { mots: ["horloge", "pendule", "coucou", "comtoise"], f: 4 },
  { mots: ["hélice"], f: 1 },

  // [J]
  { mots: ["jarre"] },

  // [K]
  { mots: ["képi"], f: 1 },

  // [L]
  { mots: ["lampe"], f: 5 },
  { mots: ["lampe tiffany", "lampe en vitrail", "vitrail"], f: 3 },
  { mots: ["lapin en peluche", "lapin"], f: 4 },
  { mots: ["livre", "livres", "bouquin"], f: 4 },
  { mots: ["longue-vue", "longue vue"], f: 2 },
  { mots: ["loupe"], f: 4 },
  { mots: ["lunettes"], f: 4 },

  // [M]
  { mots: ["machine à écrire"], f: 4 },
  { mots: ["maneki-neko", "chat porte-bonheur", "maneki neko"], f: 5 },
  { mots: ["mannequin de couture", "mannequin"] },
  { mots: ["maquette de bateau", "maquette", "bateau", "bateau en bouteille"], f: 3 },
  { mots: ["marionnette", "pantin"], f: 3 },
  { mots: ["masque", "masque vénitien"], f: 4 },
  { mots: ["matriochka", "poupée russe", "poupée gigogne"], f: 5 },
  { mots: ["miroir", "glace"], f: 3 },
  { mots: ["montgolfière", "ballon à air chaud"], f: 4 },
  { mots: ["montre", "montre à gousset"], f: 3 },
  { mots: ["médaille", "médaillon"], f: 1 },

  // [N]
  { mots: ["nœud", "noeud"], f: 1 },

  // [O]
  { mots: ["oiseau"], f: 3 },
  { mots: ["ours en peluche", "ours", "nounours", "peluche", "ourson"], f: 5 },
  { mots: ["œuf", "oeuf", "œuf décoratif"], f: 1 },

  // [P]
  { mots: ["panier", "corbeille", "hotte"] },
  { mots: ["paquet", "colis"] },
  { mots: ["parapluie", "ombrelle"], f: 4 },
  { mots: ["perroquet", "ara"], f: 5 },
  { mots: ["papillon"], f: 3 },
  { mots: ["piano"], f: 3 },
  { mots: ["pigeon", "colombe"], f: 2 },
  { mots: ["pinceau", "pinceaux"], f: 2 },
  { mots: ["pistolet à eau", "pistolet"], f: 1 },
  { mots: ["plante"], f: 4 },
  { mots: ["plume"], f: 4 },
  { mots: ["pochette", "poche"], f: 2 },
  { mots: ["poire"], f: 2 },
  { mots: ["pomme", "pommes"], f: 4 },
  { mots: ["portrait", "tableau", "cadre"], f: 3 },
  { mots: ["pot"] },
  { mots: ["pot à crayons", "crayons", "porte-crayons"] },
  { mots: ["poupée"], f: 3 },

  // [Q]
  { mots: ["quille"], f: 1 },

  // [R]
  { mots: ["radio", "poste", "poste de radio"], f: 3 },
  { mots: ["renard"], f: 2 },
  { mots: ["robot"], f: 5 },
  { mots: ["rose"], f: 3 },
  { mots: ["roue"], f: 1 },
  { mots: ["ruban"], f: 1 },
  { mots: ["réveil", "réveille-matin"], f: 3 },

  // [S]
  { mots: ["sablier"], f: 3 },
  { mots: ["sac"], f: 2 },
  { mots: ["sculpture"] },
  { mots: ["serpent"], f: 2 },
  { mots: ["singe"], f: 2 },
  { mots: ["soucoupe"], f: 1 },
  { mots: ["sphère"] },
  { mots: ["squelette"], f: 2 },
  { mots: ["statue"], f: 3 },
  { mots: ["statuette"] },
  { mots: ["statuette de cerf", "cerf"], f: 2 },

  // [T]
  { mots: ["table"], f: 4 },
  { mots: ["tambour"], f: 3 },
  { mots: ["tasse"], f: 3 },
  { mots: ["théière"], f: 4 },
  { mots: ["tirelire"], f: 1 },
  { mots: ["toupie"], f: 2 },
  { mots: ["train jouet", "train", "locomotive"], f: 5 },
  { mots: ["trompette"], f: 3 },
  { mots: ["télescope"], f: 5 },
  { mots: ["téléviseur", "télé", "télévision"], f: 1 },

  // [U]
  { mots: ["urne"], f: 1 },

  // [V]
  { mots: ["vase"], f: 3 },
  { mots: ["violon"], f: 5 },
  { mots: ["voilier"], f: 3 },
  { mots: ["voiture jouet", "voiture", "auto"], f: 3 },

  // [W]
  { mots: ["wagon"], f: 1 },

  // [X]
  { mots: ["xylophone"], f: 1 },

  // [Y]
  { mots: ["yoyo", "yo-yo"], f: 1 },

  // [Z]
  { mots: ["zèbre"], f: 1 }
];

/* ---- MONDE 2 : LE BUREAU EN PAGAILLE ---------------------- */
const OBJETS_BUREAU = [
  { mots: ["agenda"] },
  { mots: ["agrafeuse"] },
  { mots: ["appareil photo", "appareil", "caméra"] },
  { mots: ["badge"] },
  { mots: ["boîte d'archives", "boîte", "archives"] },
  { mots: ["mallette", "serviette"] },
  { mots: ["bureau"] },
  { mots: ["calculatrice", "calculette"] },
  { mots: ["calendrier"] },
  { mots: ["carnet", "carnet de notes"] },
  { mots: ["carte de visite", "carte"] },
  { mots: ["chaise de bureau", "chaise", "fauteuil"] },
  { mots: ["chargeur"] },
  { mots: ["ciseaux"] },
  { mots: ["classeur"] },
  { mots: ["trombones", "trombone"] },
  { mots: ["panneau de liège", "liège", "tableau de liège"] },
  { mots: ["crayon", "crayons"] },
  { mots: ["câble de charge", "câble", "cable"] },
  { mots: ["enveloppe"] },
  { mots: ["punaises", "punaise", "épingles", "épingle"] },
  { mots: ["étiquettes", "étiquette", "étiquettes adhésives"] },
  { mots: ["ventilateur", "éventail"] },
  { mots: ["fichiers suspendus", "fichiers", "fichier", "dossiers suspendus"] },
  { mots: ["globe terrestre", "globe", "mappemonde"] },
  { mots: ["mug", "gobelet"] },
  { mots: ["gobelet à stylos", "pot à stylos", "pot à crayons"] },
  { mots: ["horloge murale", "horloge", "pendule"] },
  { mots: ["lampe de bureau", "lampe"] },
  { mots: ["livres", "livre"] },
  { mots: ["lunettes"] },
  { mots: ["lèvres"] },
  { mots: ["casque", "écouteurs"] },
  { mots: ["bouteille", "gourde"] },
  { mots: ["mouchoirs", "mouchoir", "papiers froissés"] },
  { mots: ["plaque nominative", "plaque"] },
  { mots: ["ordinateur portable", "ordinateur", "laptop", "pc"] },
  { mots: ["presse-papiers", "presse-papier"] },
  { mots: ["stylos", "stylo"] },
  { mots: ["téléphone", "téléphone de bureau"] },
  { mots: ["plante"] },
  { mots: ["post-it", "postit", "pense-bête"] },
  { mots: ["imprimante"] },
  { mots: ["clé usb", "usb", "prise usb"] },
  { mots: ["employé de bureau", "employé", "employée", "secrétaire"] },
  { mots: ["présentoir à documents", "présentoir"] },
  { mots: ["rapport", "papiers", "papier"] },
  { mots: ["règle"] },
  { mots: ["sablier"] },
  { mots: ["sac à main", "sac"] },
  { mots: ["gel hydroalcoolique", "gel"] },
  { mots: ["smartphone", "téléphone portable"] },
  { mots: ["souris"] },
  { mots: ["succulente", "plante grasse", "cactus"] },
  { mots: ["tablette"] },
  { mots: ["tapis de souris"] },
  { mots: ["tasse à café", "tasse"] },
  { mots: ["liste de tâches", "todo"] },
  { mots: ["trophée", "coupe"] },
  { mots: ["tableau blanc"] },

  // --- Ajouts (analyse de l'image, sans doublons) ---
  // personne / visage / vêtements
  { mots: ["homme", "personne", "monsieur"] },
  { mots: ["visage", "tête", "figure"] },
  { mots: ["cheveux", "coiffure"] },
  { mots: ["front"] },
  { mots: ["sourcil", "sourcils"] },
  { mots: ["œil", "oeil", "yeux"] },
  { mots: ["nez"] },
  { mots: ["joue", "joues"] },
  { mots: ["bouche"] },
  { mots: ["sourire"] },
  { mots: ["dent", "dents"] },
  { mots: ["oreille", "oreilles"] },
  { mots: ["menton"] },
  { mots: ["cou"] },
  { mots: ["main", "mains"] },
  { mots: ["doigt", "doigts"] },
  { mots: ["bras"] },
  { mots: ["montre", "montre-bracelet"] },
  { mots: ["cravate"] },
  { mots: ["chemise"] },
  { mots: ["bouton", "boutons"] },
  // meubles / pièce / fenêtre
  { mots: ["tiroir", "tiroirs"] },
  { mots: ["étagère", "bibliothèque", "meuble"] },
  { mots: ["corbeille", "poubelle"] },
  { mots: ["fenêtre", "vitre"] },
  { mots: ["store", "stores"] },
  { mots: ["immeuble", "bâtiment", "gratte-ciel"] },
  { mots: ["ville"] },
  { mots: ["ciel"] },
  { mots: ["arbre"] },
  { mots: ["pot"] },
  // informatique
  { mots: ["écran", "moniteur"] },
  { mots: ["clavier", "touches", "touche"] },
  // papeterie
  { mots: ["cahier"] },
  { mots: ["bloc-notes", "bloc"] },
  { mots: ["dossier", "chemise cartonnée"] },
  { mots: ["marqueur", "feutre", "surligneur"] },
  { mots: ["scotch", "ruban adhésif", "ruban", "dévidoir"] },
  { mots: ["graphique", "diagramme", "camembert", "histogramme"] },
  // divers / symboles
  { mots: ["ampoule"] },
  { mots: ["cadre", "photo", "photographie"] },
  { mots: ["carte postale"] },
  { mots: ["avion en papier", "avion"] },
  { mots: ["étoile", "étoiles"] },
  { mots: ["cœur", "coeur"] },
  { mots: ["smiley", "émoticône", "émoticone", "visage souriant"] },
  { mots: ["croix", "croix médicale"] },

  // --- Ajouts complémentaires (liste joueur : objets visibles) ---
  { mots: ["abat-jour"] },
  { mots: ["aiguille", "aiguilles"] },
  { mots: ["bac à courrier", "bac"] },
  { mots: ["bracelet", "bracelet de montre"] },
  { mots: ["case à cocher", "case"] },
  { mots: ["casier de rangement", "casier"] },
  { mots: ["coche"] },
  { mots: ["document", "documents"] },
  { mots: ["feuille", "feuilles"] },
  { mots: ["flèche", "flèches"] },
  { mots: ["goutte"] },
  { mots: ["intercalaire"] },
  { mots: ["manche"] },
  { mots: ["mer"] },
  { mots: ["mur"] },
  { mots: ["palmier"] },
  { mots: ["plage"] },
  { mots: ["poignet"] },
  { mots: ["porte-documents"] },
  { mots: ["spirale"] },
  { mots: ["table"] },

  // --- Chiffres visibles (horloge, calendrier, calculatrice, camembert) ---
  // Les chiffres n'ont pas de langue -> conservés.
  { mots: ["un"] },
  { mots: ["deux"] },
  { mots: ["trois"] },
  { mots: ["quatre"] },
  { mots: ["cinq"] },
  { mots: ["six"] },
  { mots: ["sept"] },
  { mots: ["huit"] },
  { mots: ["neuf"] },
  { mots: ["dix"] },
  { mots: ["onze"] },
  { mots: ["douze"] },
  { mots: ["deux mille vingt-quatre"] },
  { mots: ["vingt-quatre"] },
  { mots: ["quarante pour cent"] },
  { mots: ["vingt pour cent"] },
  { mots: ["vingt-cinq pour cent"] },
  { mots: ["cent vingt-trois millions quatre cent cinquante-six mille sept cent quatre-vingt-neuf"] }
];

/* ---- MONDE 3 : LA CLASSE DES MILLE TROUVAILLES ------------ */
const OBJETS_CLASSE = [
  { mots: ["abaque", "boulier"] },
  { mots: ["alphabet", "abécédaire"] },
  { mots: ["lampe", "lampe de bureau", "ampoule"] },
  { mots: ["annonce murale", "affiche", "annonce", "panneau"] },
  { mots: ["pomme"] },
  { mots: ["ballon"] },
  { mots: ["banane"] },
  { mots: ["blocs de construction", "blocs", "bloc", "legos"] },
  { mots: ["gilet", "blouse", "tablier"] },
  { mots: ["aquarium", "bocal"] },
  { mots: ["boîte de rangement", "boîte", "bac"] },
  { mots: ["pinceau", "brosse", "pinceaux"] },
  { mots: ["bureau", "pupitre"] },
  { mots: ["cahier"] },
  { mots: ["calculatrice", "calculette"] },
  { mots: ["carte du monde", "carte", "planisphère"] },
  { mots: ["chaise"] },
  { mots: ["cloche", "cloche d'école", "clochette"] },
  { mots: ["crayons", "crayon"] },
  { mots: ["crayons de couleur"] },
  { mots: ["cube", "cubes"] },
  { mots: ["dessin", "dessin arc-en-ciel", "arc-en-ciel"] },
  { mots: ["dinosaure", "dinosaure jouet"] },
  { mots: ["tambour"] },
  { mots: ["chevalet"] },
  { mots: ["enseignante", "maîtresse", "maitresse", "professeure"] },
  { mots: ["écolier", "garçon", "élève"] },
  { mots: ["écolière", "fille"] },
  { mots: ["étoiles", "étoile", "étoiles décoratives"] },
  { mots: ["globe terrestre", "globe", "mappemonde"] },
  { mots: ["gobelet à crayons", "pot à crayons", "gobelet"] },
  { mots: ["gomme", "effaceur"] },
  { mots: ["grenouille", "grenouille marionnette", "marionnette"] },
  { mots: ["horloge", "pendule"] },
  { mots: ["train jouet", "train", "jeu de train", "locomotive"] },
  { mots: ["livres", "livre"] },
  { mots: ["loupe"] },
  { mots: ["boîte à déjeuner", "lunchbox", "sac repas", "gamelle"] },
  { mots: ["lune", "lune décorative", "croissant"] },
  { mots: ["marqueurs", "marqueur", "feutres", "feutre"] },
  { mots: ["microscope"] },
  { mots: ["tasse", "mug"] },
  { mots: ["palette", "palette de peinture"] },
  { mots: ["avion en papier", "avion", "cocotte en papier"] },
  { mots: ["bateau en papier", "bateau"] },
  { mots: ["plante en pot", "plante", "pot", "plante verte"] },
  { mots: ["puzzle", "pièces de puzzle", "pièce de puzzle"] },
  { mots: ["robot", "robot jouet"] },
  { mots: ["règle"] },
  { mots: ["stylo", "stylos"] },
  { mots: ["sac à dos", "cartable"] },
  { mots: ["tableau noir", "ardoise", "tableau"] },
  { mots: ["tambourin"] },
  { mots: ["trousse"] },
  { mots: ["cerf-volant"] },
  { mots: ["ours en peluche", "ours", "nounours", "peluche"] },
  { mots: ["lapin en peluche", "lapin"] },
  { mots: ["ciseaux"] },
  { mots: ["colle", "bâton de colle", "tube de colle"] },
  { mots: ["corde à sauter", "corde"] },
  { mots: ["bouteille", "gourde"] },
  { mots: ["tapis"] },
  { mots: ["rideaux", "rideau"] },
  { mots: ["xylophone"] },
  { mots: ["yo-yo", "yoyo"] }
];

/* ---- MONDE 4 : LE PARC DES TROUVAILLES -------------------- */
const OBJETS_PARC = [
  { mots: ["appareil photo", "appareil", "caméra"] },
  { mots: ["pomme"] },
  { mots: ["arrosoir"] },
  { mots: ["ballon"] },
  { mots: ["banc"] },
  { mots: ["vélo", "bicyclette"] },
  { mots: ["nichoir", "cabane à oiseaux"] },
  { mots: ["bouteille à bulles", "bouteille", "flacon à bulles"] },
  { mots: ["bulles de savon", "bulles", "bulle"] },
  { mots: ["cerf-volant"] },
  { mots: ["chapeau", "casquette"] },
  { mots: ["chien"] },
  { mots: ["panier pique-nique", "panier", "coffre"] },
  { mots: ["couverture de pique-nique", "couverture", "nappe"] },
  { mots: ["drapeau", "drapeau de château de sable"] },
  { mots: ["tambour"] },
  { mots: ["écureuil"] },
  { mots: ["fleur", "fleurs"] },
  { mots: ["fontaine"] },
  { mots: ["frisbee"] },
  { mots: ["kiosque", "gazebo", "gloriette"] },
  { mots: ["glace", "cornet"] },
  { mots: ["gourde", "bouteille d'eau"] },
  { mots: ["corde à sauter", "corde"] },
  { mots: ["jus de pomme", "jus", "brique de jus"] },
  { mots: ["lanterne"] },
  { mots: ["lapin en peluche", "lapin"] },
  { mots: ["livre", "livres"] },
  { mots: ["loupe"] },
  { mots: ["carte", "plan"] },
  { mots: ["ours en peluche", "ours", "nounours", "peluche"] },
  { mots: ["panneau du parc", "panneau", "pancarte"] },
  { mots: ["patins à roulettes", "patins", "rollers"] },
  { mots: ["moulin à vent", "moulinet"] },
  { mots: ["pièce d'échecs", "pièce", "échecs"] },
  { mots: ["plante en pot", "plante", "pot"] },
  { mots: ["pont"] },
  { mots: ["bretzel", "pretzel"] },
  { mots: ["réverbère", "lampadaire"] },
  { mots: ["bac à sable", "bac"] },
  { mots: ["sandwich"] },
  { mots: ["seau", "pelle et seau"] },
  { mots: ["skateboard", "skate", "planche à roulettes"] },
  { mots: ["ballon de foot", "ballon de football"] },
  { mots: ["table d'échecs", "table", "échiquier"] },
  { mots: ["train jouet", "train", "locomotive"] },
  { mots: ["télescope"] },
  { mots: ["wagon", "wagon rouge", "chariot"] },
  { mots: ["papillon"] },
  { mots: ["oiseau", "moineau"] },
  { mots: ["sac à dos", "sac"] },
  { mots: ["toboggan"] },
  { mots: ["balançoire"] },
  { mots: ["bascule", "tape-cul"] },
  { mots: ["canard"] },
  { mots: ["assiette"] },
  { mots: ["château de sable", "château"] },
  { mots: ["pelle"] },
  { mots: ["voiture jouet", "voiture", "auto"] },
  { mots: ["arbre"] }
];

/* ---- MONDE 5 : LA PLAGE AUX TRÉSORS ----------------------- */
const OBJETS_PLAGE = [
  { mots: ["ancre"] },
  { mots: ["appareil photo", "appareil", "caméra"] },
  { mots: ["ballon de plage", "ballon"] },
  { mots: ["banane"] },
  { mots: ["bateau jouet", "bateau"] },
  { mots: ["voilier", "bateau à voile"] },
  { mots: ["chaise longue", "transat"] },
  { mots: ["parasol", "ombrelle"] },
  { mots: ["jumelles", "binocles"] },
  { mots: ["bouteille à message", "bouteille", "message"] },
  { mots: ["bouée"] },
  { mots: ["seau"] },
  { mots: ["cabane de plage", "cabane"] },
  { mots: ["camion jouet", "camion"] },
  { mots: ["carte au trésor", "carte", "plan"] },
  { mots: ["chapeau", "chapeau de paille"] },
  { mots: ["château de sable", "château"] },
  { mots: ["noix de coco", "coco"] },
  { mots: ["coffre au trésor", "coffre", "trésor"] },
  { mots: ["glacière"] },
  { mots: ["coquillage"] },
  { mots: ["crabe"] },
  { mots: ["crème solaire", "crème"] },
  { mots: ["dauphin"] },
  { mots: ["épuisette", "filet"] },
  { mots: ["étoile de mer", "étoile"] },
  { mots: ["frisbee"] },
  { mots: ["glace", "cornet de glace", "cornet"] },
  { mots: ["gourde"] },
  { mots: ["radio", "haut-parleur", "enceinte"] },
  { mots: ["cerf-volant"] },
  { mots: ["lettre", "message roulé"] },
  { mots: ["phare"] },
  { mots: ["lunettes de soleil", "lunettes"] },
  { mots: ["masque de plongée", "masque", "tuba"] },
  { mots: ["raquettes de plage", "raquettes", "raquette"] },
  { mots: ["palmes", "palme"] },
  { mots: ["panier de plage", "panier"] },
  { mots: ["panneau directionnel", "panneau"] },
  { mots: ["pelle"] },
  { mots: ["couverture", "pique-nique", "nappe"] },
  { mots: ["planche de surf", "surf", "planche"] },
  { mots: ["râteau", "râteau de sable"] },
  { mots: ["sandwich"] },
  { mots: ["serviette", "serviette de plage", "drap de bain"] },
  { mots: ["tongs", "claquettes"] },
  { mots: ["bijoux", "bijou", "joyaux"] },
  { mots: ["pastèque", "melon d'eau"] },
  { mots: ["mouette", "oiseau", "goéland"] },
  { mots: ["rame", "pagaie", "aviron"] },
  { mots: ["palmier"] },
  { mots: ["drapeau"] },
  { mots: ["tortue"] },
  { mots: ["guirlande", "fanions"] }
];

/* ---- LES MONDES -------------------------------------------
   L'ordre définit l'ordre d'affichage. `pret:false` = verrouillé. */
const MONDES = [
  {
    id: "caverne",
    titre: "La Caverne des Curiosités",
    sousTitre: "Boutique de curiosités · brocante enchantée",
    image: "ChatGPT Image 20 juil. 2026, 18_00_56.png",
    pret: false, // désactivé pour le lancement (Bureau seul) — remettre true plus tard
    objets: OBJETS_CAVERNE
  },
  {
    id: "bureau",
    titre: "Le Bureau en Pagaille",
    sousTitre: "Fournitures, paperasse et gadgets",
    image: "bureau en pagaille.png",
    pret: true,
    objets: OBJETS_BUREAU
  },
  {
    id: "classe",
    titre: "La Classe des Mille Trouvailles",
    sousTitre: "Salle de classe foisonnante",
    image: "classe des mill trouvailles.png",
    pret: false, // désactivé pour le lancement (Bureau seul)
    objets: OBJETS_CLASSE
  },
  {
    id: "parc",
    titre: "Le Parc des Trouvailles",
    sousTitre: "Pique-nique, jeux et plein air",
    image: "parc des trouvailles.png",
    pret: false, // désactivé pour le lancement (Bureau seul)
    objets: OBJETS_PARC
  },
  {
    id: "plage",
    titre: "La Plage aux Trésors",
    sousTitre: "Sable, mer et chasse au trésor",
    image: "plage aux tresors.png",
    pret: false, // désactivé pour le lancement (Bureau seul)
    objets: OBJETS_PLAGE
  }
];

/* ---- LEURRES DU BOT (§9 « Call Image ») --------------------
   Mots plausibles dans une boutique de curiosités mais ABSENTS
   de l'image/dictionnaire. Le bot bluffe parfois avec l'un d'eux :
   à toi de le repérer et de le contester. (Vérifiés : aucun ne
   figure dans la liste maîtresse ci-dessus.) */
const LEURRES = {
  a: ["armoire", "aquarium", "abat-jour"],
  b: ["bougeoir", "brosse", "bouilloire"],
  c: ["casserole", "cendrier", "chandelier"],
  d: ["dentelle", "damier", "dague"],
  e: ["encrier", "épingle", "échiquier"],
  f: ["fourchette", "fer à cheval", "fronde"],
  g: ["girouette", "grelot", "gaufrier"],
  h: ["harpe", "hublot", "hameçon"],
  l: ["lanterne", "lorgnon", "luge"],
  m: ["moulin", "mandoline", "muselière"],
  o: ["ocarina", "orgue", "ombrelle"],
  p: ["pipe", "pichet", "plumeau"],
  r: ["rasoir", "râteau", "rouet"],
  s: ["sifflet", "seau", "stylo"],
  t: ["tabouret", "tabatière", "timbale"],
  v: ["vielle", "vielle à roue", "veilleuse"]
};

/* ---- MÉTA-JEU : thèmes, boutique, bonus (habillage ViraLetter) ---- */

/* Habillage de chaque monde sur la carte « Conquête ». */
const THEMES = {
  caverne: { emoji: "🏺", couleur: "#b07cff", chapitre: "La Caverne" },
  bureau:  { emoji: "🖇️", couleur: "#4aa3ff", chapitre: "Le Bureau" },
  classe:  { emoji: "🎒", couleur: "#ff8f5e", chapitre: "La Classe" },
  parc:    { emoji: "🌳", couleur: "#37c98b", chapitre: "Le Parc" },
  plage:   { emoji: "🏖️", couleur: "#ffc230", chapitre: "La Plage" }
};

/* Bonus utilisables en partie (adaptés au gameplay Trouvaille). */
const BONUS = {
  joker:  { emoji: "🃏", nom: "Joker",  desc: "Dévoile un mot à trouver" },
  lettre: { emoji: "🔤", nom: "Lettre", desc: "Affiche les lettres d'un mot dans le désordre" },
  plus15: { emoji: "⏳", nom: "+15 s",  desc: "Rallonge le temps de 15 secondes" }
};

/* Boutique : achat de bonus avec les pièces. */
const SHOP = [
  { id: "joker",  prix: 30 },
  { id: "lettre", prix: 25 },
  { id: "plus15", prix: 20 }
];

/* Avatars proposés à l'onboarding. */
const AVATARS = ["😀", "😎", "🤠", "🦊", "🐼", "🐸", "🦁", "🐙", "🦄", "🌸", "🌵", "⭐"];
