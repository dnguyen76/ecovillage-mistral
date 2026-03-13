export interface Option {
  id: string
  text: string
  emoji?: string
  detail?: string
  pros?: string[]
  cons?: string[]
}

export interface Question {
  id: number
  text: string
  options: Option[]
  groupe: 'agriculteurs' | 'industriels' | 'habitants' | 'elus'
}

export interface UserAnswer {
  questionId: number
  selectedIds: string[]
  questionText: string
  options: Option[]
  groupe: string
}

export type Groupe = 'agriculteurs' | 'industriels' | 'habitants' | 'elus'

export const GROUPES: Record<Groupe, { label: string; emoji: string }> = {
  agriculteurs: { label: 'Les Agriculteurs', emoji: '🌾' },
  industriels:  { label: 'Les Industriels',  emoji: '🏭' },
  habitants:    { label: 'Les Habitants',     emoji: '🏘️' },
  elus:         { label: 'Les Élus',          emoji: '🏛️' },
}

export const PREAMBULES: Record<Groupe, {
  intro: { title: string; text: string }
  objectifs: { title: string; text: string }
  callToAction: string
}> = {
  agriculteurs: {
    intro: {
      title: "📌 Ce qui se passe aujourd'hui :",
      text: "Les champs et les prairies en ont ras-le-bol des pesticides : ils sont fatigués, épuisés… à deux sillons de la dépression.\nRésultat ? Les récoltes boudent, les revenus des agriculteurs font grise mine sur un tracteur qui tousse.\nLes agriculteurs galèrent, les revenus suivent pas, et beaucoup se retrouvent seuls face aux difficultés.\nBref, c'est pas la grande forme dans les campagnes.",
    },
    objectifs: {
      title: "🎯 Objectifs des agriculteurs :",
      text: "Changer les choses ! Produire de façon plus naturelle, mieux gagner leur vie et recréer du lien : avec les autres agriculteurs, mais aussi avec les habitants autour.\nL'idée, c'est de bosser autrement, ensemble, et dans le respect de la nature.",
    },
    callToAction: "👉 Selon vous, que peuvent faire les agriculteurs pour moins polluer et protéger la nature ? Donnez vos idées. Ensuite, je vous proposerai 5 actions possibles. 🌱🚜",
  },
  industriels: {
    intro: {
      title: "📌 Ce qui se passe aujourd'hui :",
      text: "Les usines utilisent beaucoup d'énergie et produisent pas mal de déchets. Résultat : pollution, nuisances, et parfois des tensions avec les habitants ou les communes, surtout quand il s'agit de protéger l'environnement ou la qualité de vie autour.",
    },
    objectifs: {
      title: "🎯 Objectifs des industriels :",
      text: "Les entreprises veulent changer leurs façons de faire : produire de manière plus propre, consommer moins d'énergie et mieux respecter leur environnement.\nElles cherchent aussi à travailler main dans la main avec les habitants, les villes et les autres acteurs locaux, pour construire un avenir plus durable, ensemble.",
    },
    callToAction: "👉 Selon vous, que peuvent faire les industriels pour moins polluer et mieux respecter l'environnement ? Donnez vos idées. Ensuite, je vous proposerai 5 actions possibles. 🏭♻️",
  },
  habitants: {
    intro: {
      title: "📌 Ce qui se passe aujourd'hui :",
      text: "Certains habitants vivent comme dans un épisode triste de Titeuf : tout seuls, un peu paumés, sans trop de copains pour jouer ou papoter.\nLes maisons auraient bien besoin d'un coup de neuf, et sans voiture se déplacer devient galère.\nLes jeunes quittent le village le matin pour travailler et reviennent le soir fatigués.",
    },
    objectifs: {
      title: "🎯 Objectifs des habitants :",
      text: "Faire du village un endroit chaleureux, où tout le monde se sent bien 🌟.\nUn lieu où anciens et jeunes échangent, bricolent et rigolent ensemble.\nUn village plus joyeux, plus solidaire et plus écologique.",
    },
    callToAction: "👉 Selon vous, que peuvent faire les habitants pour rendre le village plus écologique et solidaire ? Donnez vos idées. Ensuite, je vous proposerai 5 actions possibles. 🏘️🌿",
  },
  elus: {
    intro: {
      title: "📌 Ce qui se passe aujourd'hui :",
      text: "La commune, c'est un peu comme une tirelire vide 🪙…\nBeaucoup de demandes des habitants, mais pas beaucoup de moyens financiers.\nLes élus doivent trouver des idées simples, futées et peu coûteuses pour améliorer la vie dans le village.",
    },
    objectifs: {
      title: "🎯 Objectifs des élus :",
      text: "Faire du village un lieu accueillant, écologique et solidaire 🌿.\nUn endroit où les habitants travaillent ensemble pour réaliser des projets durables, sans magie mais avec beaucoup d'ingéniosité collective.",
    },
    callToAction: "👉 Selon vous, que peuvent faire les élus locaux pour engager le village dans une transition durable ? Donnez vos idées. Ensuite, je vous proposerai 5 actions possibles. 🏛️🌱",
  },
}

export const QUESTIONS: Question[] = [
  {
    id: 1, groupe: 'agriculteurs',
    text: "Comment améliorer la situation des agriculteurs ?",
    options: [
      { id: "a", emoji: "🌿", text: "Arrêter les pesticides", detail: "Réduire la pollution et protéger la santé de tous", pros: ["Protège la santé", "Respect de la nature"], cons: ["Demande du temps pour s'adapter", "Coûts importants"] },
      { id: "b", emoji: "🍀", text: "Planter des haies autour des champs", detail: "Préserver les sols et favoriser la biodiversité", pros: ["Facile à faire", "Améliore la nature rapidement"], cons: ["Les revenus des agriculteurs n'augmentent pas"] },
      { id: "c", emoji: "💬", text: "Vente directe aux habitants", detail: "Améliorer les revenus en vendant sans intermédiaire", pros: ["Crée du lien", "Bon pour les revenus", "Valorise les jeunes"], cons: ["Demande une bonne organisation", "Respect des normes d'hygiène"] },
      { id: "d", emoji: "⚡", text: "Installer des panneaux solaires sur le toit des granges", detail: "Produire sa propre énergie", pros: ["Énergie gratuite à long terme", "Écologique", "Image moderne"], cons: ["Investissement de départ", "Rentabilité incertaine"] },
      { id: "e", emoji: "🧑‍🌾", text: "Créer des coopérations entre agriculteurs", detail: "Partager les outils et les savoir-faire", pros: ["Renforce la solidarité", "Permet d'économiser"], cons: ["Nécessite de bien s'entendre", "Prend du temps pour s'organiser"] },
    ],
  },
  {
    id: 2, groupe: 'industriels',
    text: "Comment les industriels peuvent-ils améliorer leur impact ?",
    options: [
      { id: "a", emoji: "☀️", text: "Installer des panneaux photovoltaïques sur toitures et parkings", detail: "Réduire la consommation d'énergie", pros: ["Réduit les factures d'énergie", "Valorise l'usine"], cons: ["Installation technique", "Subventions et autorisations nécessaires"] },
      { id: "b", emoji: "♻️", text: "Trier et réutiliser les déchets de production", detail: "Limiter les déchets industriels", pros: ["Création d'emplois", "Bon pour l'environnement", "Améliore l'image"], cons: ["Demande une organisation sérieuse", "Formation et locaux spécifiques"] },
      { id: "c", emoji: "🚛", text: "Produire localement", detail: "Réduire les transports et soutenir l'économie locale", pros: ["Moins de pollution", "Soutient l'économie du coin", "Délais plus courts"], cons: ["Peut coûter plus cher", "Dépend des ressources disponibles localement"] },
      { id: "d", emoji: "📉", text: "Réduire le matériel informatique et les mails", detail: "Diminuer l'empreinte carbone numérique", pros: ["Économie", "Facile à lancer", "Implique tout le monde"], cons: ["Demande une vraie volonté collective", "Formation nécessaire"] },
      { id: "e", emoji: "🔋", text: "Gérer les déplacements professionnels et personnels", detail: "Réduire l'empreinte carbone et les frais de transport", pros: ["Entreprise plus responsable", "Partage ou véhicules électriques"], cons: ["Changement progressif", "Implication de tous les salariés"] },
    ],
  },
  {
    id: 3, groupe: 'habitants',
    text: "Comment améliorer la vie dans le village ?",
    options: [
      { id: "a", emoji: "🌱", text: "Créer un jardin partagé", detail: "Produire ensemble des fruits et légumes", pros: ["Crée du lien", "Bon pour l'alimentation", "Facile à démarrer"], cons: ["Dépend de la motivation collective", "Besoin d'un terrain communal"] },
      { id: "b", emoji: "🏠", text: "Rénover les logements anciens", detail: "Isoler les habitations, améliorer le confort", pros: ["Économies d'énergie", "Réduit les factures", "Valorise le quartier"], cons: ["Travaux coûteux", "Nécessite des aides ou subventions"] },
      { id: "c", emoji: "🔄", text: "Créer une ressourcerie", detail: "Réutiliser les vêtements et les objets", pros: ["Réduit les déchets", "Économique pour tous", "Utile à la communauté"], cons: ["Demande une organisation sérieuse du tri et du nettoyage"] },
      { id: "d", emoji: "🚗", text: "Développer le covoiturage", detail: "Faciliter les déplacements", pros: ["Évite l'isolement", "Réduit les frais et la pollution"], cons: ["Nécessite une bonne coordination et des points de ramassage"] },
      { id: "e", emoji: "🤝", text: "Organiser des rencontres entre générations", detail: "Créer du lien et échanger des savoirs", pros: ["Rompt l'isolement", "Valorise les anciens", "Ambiance conviviale"], cons: ["Nécessite du temps et des personnes pour animer régulièrement"] },
    ],
  },
  {
    id: 4, groupe: 'elus',
    text: "Quelles actions prioritaires pour les élus du village ?",
    options: [
      { id: "a", emoji: "🚶", text: "Créer une voie verte", detail: "Faciliter les déplacements doux (vélo, marche)", pros: ["Encourage les déplacements écolos", "Bon pour la santé", "Attire des visiteurs"], cons: ["Travaux d'aménagement nécessaires", "Besoin d'un budget"] },
      { id: "b", emoji: "🧺", text: "Créer un marché de producteurs", detail: "Soutenir les circuits courts", pros: ["Dynamise le centre-ville", "Bon pour l'économie locale", "Apprécié des habitants"], cons: ["Peut concurrencer les petits commerces", "Certains habitants ont déjà des potagers"] },
      { id: "c", emoji: "🌞", text: "Favoriser les énergies renouvelables sur les bâtiments communaux", detail: "Réduire la facture énergétique de la commune", pros: ["Sensibilise les habitants", "Réduit les factures", "Montre l'exemple"], cons: ["Rentabilité incertaine", "Dépend de la météo"] },
      { id: "d", emoji: "🧹", text: "Organiser une grande journée \"village propre\"", detail: "Impliquer les habitants dans l'entretien collectif", pros: ["Mobilise les citoyens", "Résultat visible rapidement", "Améliore l'image du village"], cons: ["Dépend de la participation des habitants"] },
      { id: "e", emoji: "💡", text: "Lancer un appel à projets citoyens", detail: "Faire émerger des idées locales", pros: ["Encourage les initiatives", "Donne la parole aux jeunes", "Implique les habitants"], cons: ["Nécessite de suivre et d'accompagner les projets dans le temps"] },
    ],
  },
]
