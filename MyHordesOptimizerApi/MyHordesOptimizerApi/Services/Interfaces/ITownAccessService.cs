using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Interfaces
{
    /// <summary>Droits d'écriture de l'utilisateur courant sur les données d'une ville.</summary>
    public interface ITownAccessService
    {
        /// <summary>
        /// Lève <see cref="Exceptions.MhoForbiddenException"/> si l'utilisateur courant n'est pas citoyen de
        /// la ville, vivant ou mort, actuel ou passé.
        /// </summary>
        /// <param name="resolvedIdTown">IdTown résolu (cf. <see cref="MhoContext.ResolveTownId"/>) : positif, ou -mapId pour une ville provisoire.</param>
        /// <param name="mapId">MapId de la ville s'il est connu ; déduit de <paramref name="resolvedIdTown"/> pour une ville provisoire.</param>
        void EnsureCanWriteTown(int resolvedIdTown, int? mapId);

        /// <inheritdoc cref="EnsureCanWriteTown"/>
        Task EnsureCanWriteTownAsync(int resolvedIdTown, int? mapId);

        /// <summary>Même règle qu'<see cref="EnsureCanWriteTown"/>, sans lever : pour adapter une réponse plutôt que la refuser.</summary>
        Task<bool> CanWriteTownAsync(int resolvedIdTown, int? mapId);

        /// <summary>Même règle qu'<see cref="EnsureCanWriteTown"/>, à partir du mapId envoyé par les clients (résolu ici).</summary>
        Task EnsureCanWriteMapAsync(int mapId);
    }
}
