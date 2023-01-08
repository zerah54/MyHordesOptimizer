
export const camping_results = [
  {
      probability: 0.1,
      strict: false,
      label: {
          en: `You reckon your chances of surviving here are hee haw... Might as well take some cyanide now.`,
          fr: `Vous estimez que vos chances de survie ici sont quasi nulles… Autant gober du cyanure tout de suite.`,
          de: `Du schätzt, dass deine Überlebenschancen hier quasi Null sind... Besser gleich 'ne Zyanidkapsel schlucken.`,
          es: `Crees que tus posibilidades de sobrevivir aquí son casi nulas... ¿Cianuro?`,
      }
  },
  {
      probability: 0.3,
      strict: false,
      label: {
          en: `You reckon your chances of surviving here are really poor. Maybe you should play heads or tails?`,
          fr: `Vous estimez que vos chances de survie ici sont très faibles. Peut-être que vous aimez jouer à pile ou face ?`,
          de: `Du schätzt, dass deine Überlebenschancen hier sehr gering sind. Vielleicht hast du ja Bock 'ne Runde Kopf oder Zahl zu spielen?`,
          es: `Crees que tus posibilidades de sobrevivir aquí son muy pocas. ¿Apostamos?`,
      }
  },
  {
      probability: 0.5,
      strict: false,
      label: {
          en: `You reckon your chances of surviving here are poor. Difficult to say.`,
          fr: `Vous estimez que vos chances de survie ici sont faibles. Difficile à dire.`,
          de: `Du schätzt, dass deine Überlebenschancen hier gering sind. Hmmm... schwer zu sagen, wie das hier ausgeht.`,
          es: `Crees que tus posibilidades de sobrevivir aquí son pocas. Quién sabe...`,
      }
  },
  {
      probability: 0.65,
      strict: false,
      label: {
          en: `You reckon your chances of surviving here are limited, but tempting. However, accidents happen...`,
          fr: `Vous estimez que vos chances de survie ici sont limitées, bien que ça puisse se tenter. Mais un accident est vite arrivé...`,
          de: `Du schätzt, dass deine Überlebenschancen hier mittelmäßig sind. Ist allerdings einen Versuch wert.. obwohl, Unfälle passieren schnell...`,
          es: `Crees que tus posibilidades de sobrevivir aquí son reducidas, aunque se puede intentar. Tú sabes, podrías sufrir un accidente...`,
      }
  },
  {
      probability: 0.8,
      strict: false,
      label: {
          en: `You reckon your chances of surviving here are largely satisfactory, as long as nothing unforeseen happens.`,
          fr: `Vous estimez que vos chances de survie ici sont à peu près satisfaisantes, pour peu qu'aucun imprévu ne vous tombe dessus.`,
          de: `Du schätzt, dass deine Überlebenschancen hier zufriedenstellend sind - vorausgesetzt du erlebst keine böse Überraschung.`,
          es: `Crees que tus posibilidades de sobrevivir aquí son aceptables, esperando que no suceda ningún imprevisto.`,
      }
  },
  {
      probability: 0.9,
      strict: false,
      label: {
          en: `You reckon your chances of surviving here are decent: you just have to hope for the best!`,
          fr: `Vous estimez que vos chances de survie ici sont correctes : il ne vous reste plus qu'à croiser les doigts !`,
          de: `Du schätzt, dass deine Überlebenschancen hier korrekt sind. Jetzt heißt's nur noch Daumen drücken!`,
          es: `Crees que tus posibilidades de sobrevivir aquí son buenas. ¡Cruza los dedos!`,
      }
  },
  {
      probability: 1,
      strict: true,
      label: {
          en: `You reckon your chances of surviving here are good, you should be able to spend the night here.`,
          fr: `Vous estimez que vos chances de survie ici sont élevées : vous devriez pouvoir passer la nuit ici.`,
          de: `Du schätzt, dass deine Überlebenschancen hier gut sind. Du müsstest hier problemlos die Nacht verbringen können.`,
          es: `Crees que tus posibilidades de sobrevivir aquí son altas. Podías pasar la noche aquí.`,
      }
  },
  {
      probability: 1,
      strict: false,
      label: {
          en: `You reckon your chances of surviving here are optimal. Nobody would see you, even if they were looking straight at you.`,
          fr: `Vous estimez que vos chances de survie ici sont optimales : personne ne vous verrait même en vous pointant du doigt.`,
          de: `Du schätzt, dass deine Überlebenschancen hier optimal sind. Niemand wird dich sehen - selbst wenn man mit dem Finger auf dich zeigt.`,
          es: `Crees que tus posibilidades de sobrevivir aquí son óptimas. Nadie te verá, ni señalándote con el dedo`,
      }
  },
];

export const jobs = [
  {
      id: 'citizen',
      img: 'basic',
      label: {
          de : `Einwohner`,
          en : `Citizen`,
          es : `Resident`,
          fr : `Habitant`
      },
      camping_factor: 0.9
  },
  {
      id: 'scavenger',
      img: 'dig',
      label: {
          de : `Buddler`,
          en : `Scavenger`,
          es : `Excavador`,
          fr : `Fouineur`
      },
      camping_factor: 0.9
  },
  {
      id: 'scout',
      img: 'vest',
      label: {
          de : `Aufklärer`,
          en : `Scout`,
          es : `Explorador`,
          fr : `Éclaireur`
      },
      camping_factor: 0.9
  },
  {
      id: 'guardian',
      img: 'shield',
      label: {
          de : `Wächter`,
          en : `Guardian`,
          es : `Guardián`,
          fr : `Gardien`
      },
      camping_factor: 0.9
  },
  {
      id: 'survivalist',
      img: 'book',
      label: {
          de : `Einsiedler`,
          en : `Survivalist`,
          es : `Ermitaño`,
          fr : `Ermite`
      },
      camping_factor: 1
  },
  {
      id: 'tamer',
      img: 'tamer',
      label: {
          de : `Dompteur`,
          en : `Tamer`,
          es : `Domador`,
          fr : `Apprivoiseur`
      },
      camping_factor: 0.9
  },
  {
      id: 'technician',
      img: 'tech',
      label: {
          de : `Techniker`,
          en : `Technician`,
          es : `Técnico`,
          fr : `Technicien`
      },
      camping_factor: 0.9
  },
];
