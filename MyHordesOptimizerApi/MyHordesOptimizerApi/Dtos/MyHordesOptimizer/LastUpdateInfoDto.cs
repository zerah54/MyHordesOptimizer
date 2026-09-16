using System;

namespace MyHordesOptimizerApi.Dtos.MyHordesOptimizer
{
    public class LastUpdateInfoDto
    {
        private DateTime _updateTime;

        public int UserId { get; set; }
        public string UserName { get; set; }

        // MySQL ne conserve pas le Kind : une valeur UTC relue via EF revient en Unspecified,
        // que System.Text.Json sérialiserait sans 'Z' (le front l'interpréterait alors comme
        // une heure locale, avec un décalage de 2h en été pour un client en France).
        public DateTime UpdateTime
        {
            get => _updateTime;
            set => _updateTime = DateTime.SpecifyKind(value, DateTimeKind.Utc);
        }
    }
}