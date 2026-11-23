using System;
namespace MyHordesOptimizerApi.Services.Impl.Bank
{
    /// <summary>Jour calendaire de Paris : un jour de jeu correspond à un jour de Paris (attaque à minuit).</summary>
    public static class ParisCalendar
    {
        private static readonly TimeZoneInfo Paris = TimeZoneInfo.FindSystemTimeZoneById("Europe/Paris");

        /// <summary>Date de Paris d'un instant UTC ; <see cref="DateTimeKind.Unspecified"/> est lu comme UTC.</summary>
        public static DateOnly DateOf(DateTime utc)
        {
            var instant = DateTime.SpecifyKind(utc, DateTimeKind.Utc);
            return DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(instant, Paris));
        }
    }
}
