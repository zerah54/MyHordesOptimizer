using System;
using System.Collections.Generic;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer.Nightwatch
{
    /// <summary>État réel de la ville lu en BDD pour le plan de veille ; vide pour un non-citoyen. Les clés des dictionnaires sont des <c>Item.IdItem</c>.</summary>
    public class NightwatchStateDto
    {
        /// <summary>Citoyens vivants.</summary>
        public List<NightwatchCitizenStateDto> Citizens { get; set; } = new();
        /// <summary>Quantité totale par objet (cassés compris).</summary>
        public Dictionary<int, int> Bank { get; set; } = new();
        /// <summary>Part cassée de <see cref="Bank"/>.</summary>
        public Dictionary<int, int> BankBroken { get; set; } = new();
        /// <summary>Objets au sol des cellules hors ville (cassés compris).</summary>
        public Dictionary<int, int> Desert { get; set; } = new();
        /// <summary>Part cassée de <see cref="Desert"/>.</summary>
        public Dictionary<int, int> DesertBroken { get; set; } = new();
        /// <summary>Niveau du Chemin de ronde ; 0 s'il n'est pas construit.</summary>
        public int RoundPathLevel { get; set; }
        public bool HasGuardRoom { get; set; }
        public bool HasSprinkler { get; set; }
        /// <summary>Uids de tous les chantiers construits de la ville.</summary>
        public List<string> BuiltBuildingUids { get; set; } = new();
        /// <summary>Ville Pandémonium (type <c>panda</c>) ; distinct du <c>hard</c> du solveur d'attaque.</summary>
        public bool TownIsPanda { get; set; }
        /// <summary>userId → nombre de plans effectifs de jours antérieurs où le citoyen figure comme veilleur.</summary>
        public Dictionary<int, int> PastWatches { get; set; } = new();
    }

    public class NightwatchCitizenStateDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = "";
        public string? JobUid { get; set; }
        public bool IsShunned { get; set; }
        public bool IsGhoul { get; set; }
        public bool IsDrugged { get; set; }
        public bool IsDrunk { get; set; }
        public bool IsThirsty { get; set; }
        public bool IsImmune { get; set; }
        /// <summary>Quantité totale par objet (cassés compris).</summary>
        public Dictionary<int, int> Bag { get; set; } = new();
        /// <summary>Part cassée de <see cref="Bag"/>.</summary>
        public Dictionary<int, int> BagBroken { get; set; } = new();
        public Dictionary<int, int> Chest { get; set; } = new();
        /// <summary>Part cassée de <see cref="Chest"/>.</summary>
        public Dictionary<int, int> ChestBroken { get; set; } = new();
        private DateTime? _chestUpdatedAt;
        private DateTime? _bagUpdatedAt;

        // MySQL rend des DateTime Unspecified ; les valeurs sont en UTC : sans 'Z' le site les lirait en heure locale.
        /// <summary>Null si le coffre n'a jamais été mis à jour.</summary>
        public DateTime? ChestUpdatedAt
        {
            get => _chestUpdatedAt;
            set => _chestUpdatedAt = value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null;
        }

        /// <summary>Null si le sac n'a jamais été mis à jour.</summary>
        public DateTime? BagUpdatedAt
        {
            get => _bagUpdatedAt;
            set => _bagUpdatedAt = value.HasValue ? DateTime.SpecifyKind(value.Value, DateTimeKind.Utc) : null;
        }
    }
}
