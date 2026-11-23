using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    /// <summary>Une version visible de la banque : jour de jeu, identifiant, heure UTC et auteur.</summary>
    public class BankVersionDto
    {
        private DateTime _updateTime;

        public int Day { get; set; }
        public int LastUpdateId { get; set; }

        // MySQL ne conserve pas le Kind : sans SpecifyKind, la valeur serait sérialisée sans 'Z'.
        public DateTime UpdateTime
        {
            get => _updateTime;
            set => _updateTime = DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }

        public string? UserName { get; set; }
    }
}
