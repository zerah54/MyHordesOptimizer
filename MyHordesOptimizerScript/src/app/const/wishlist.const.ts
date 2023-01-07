
export const wishlist_priorities = [
  {
      value: -1000,
      label: {
          en: `Do not bring to town`,
          fr: `Ne pas ramener`,
          de: `Nicht mitbringen`,
          es: `No traer al pueblo`
      }
  },
  {
      value: 0,
      label: {
          en: `Not defined`,
          fr: `Non définie`,
          de: `Nicht definiert`,
          es: `Indefinida`
      }
  },
  {
      value: 1000,
      label: {
          en: `Low`,
          fr: `Basse`,
          de: `Niedrig`,
          es: `Baja`
      }
  },
  {
      value: 2000,
      label: {
          en: `Medium`,
          fr: `Moyenne`,
          de: `Mittel`,
          es: `Media`
      }
  },
  {
      value: 3000,
      label: {
          en: `High`,
          fr: `Haute`,
          de: `Hoch`,
          es: `Alta`
      }
  },
];

export const wishlist_depot = [
  {
      value: -1,
      label: {
          en: `Not defined`,
          fr: `Non défini`,
          de: `Nicht definiert`,
          es: `Indefinida`
      }
  },
  {
      value: 0,
      label: {
          en: `Bank`,
          fr: `Banque`,
          de: `Bank`,
          es: `Almacén`
      }
  },
  {
      value: 1,
      label: {
          en: `Teleport area`,
          fr: `Zone de rapatriement`,
          de: `TODO`,
          es: `Zona de volver`
      }
  }
];

export const wishlist_headers = [
  {
      label: {
          en: `Item`,
          fr: `Objet`,
          de: `Gegenstand`,
          es: `Objeto`
      },
      id: `label`
  },
  {
      label: {
          en: `Priority`,
          fr: `Priorité`,
          de: `Priorität`,
          es: `Prioridad`
      }, id: `priority`},
  {
      label: {
          en: `Depot`,
          fr: `Dépôt`,
          de: `TODO`,
          es: `TODO`
      },
      id: `depot`
  },
  {
      label: {
          en: `Stock in bank`,
          fr: `Stock en banque`,
          de: `Bestand in der Bank`,
          es: `Cantidad en el almacén`
      },
      id: `bank_count`
  },
  {
      label: {
          en: `Desired stock`,
          fr: `Stock souhaité`,
          de: `Gewünschter Bestand`,
          es: `Cantidad deseada`
      },
      id: `bank_needed`
  },
  {
      label: {
          en: `Missing quantity`,
          fr: `Quantité manquante`,
          de: `Fehlende Menge`,
          es: `Cantidad necesaria`
      },
      id: `diff`
  },
  {
      label: {en: ``, fr: ``, es: ``, de: ``},
      id: 'delete'
  },
];
