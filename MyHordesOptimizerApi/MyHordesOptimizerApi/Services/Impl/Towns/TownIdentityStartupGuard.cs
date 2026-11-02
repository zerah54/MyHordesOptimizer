using System;

namespace MyHordesOptimizerApi.Services.Impl.Towns
{
    /// <summary>
    /// Refuse un code et une base qui ne parlent pas la même numérotation des villes : le marqueur
    /// <c>TownKeysMigrated</c> (écrit en fin de migration) doit être présent si, et seulement si, le code attend des clés migrées.
    /// </summary>
    public static class TownIdentityStartupGuard
    {
        public const string MarkerName = "TownKeysMigrated";

        public static void Check(bool markerPresent, bool codeExpectsMigratedKeys)
        {
            if (markerPresent && !codeExpectsMigratedKeys)
            {
                throw new InvalidOperationException(
                    $"La base porte le marqueur {MarkerName} (clés des villes migrées) : cette version de l'API attend les anciennes clés et ne doit pas démarrer.");
            }
            if (!markerPresent && codeExpectsMigratedKeys)
            {
                throw new InvalidOperationException(
                    $"Le marqueur {MarkerName} est absent : la migration des clés des villes n'est pas terminée, cette version de l'API ne doit pas démarrer.");
            }
        }
    }
}
