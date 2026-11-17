using System;

namespace MyHordesOptimizerApi.Exceptions
{
    /// <summary>
    /// La ressource est verrouillée par une autre connexion. Traduite en 423 par ApiExceptionFilter ; le hub des
    /// expéditions la relaie par une HubException dont le message est <see cref="HubMessagePrefix"/> suivi de l'id du détenteur.
    /// </summary>
    public class MhoLockedException : Exception
    {
        public const string HubMessagePrefix = "Locked:";

        /// <summary>Utilisateur détenteur du verrou, quand il est connu.</summary>
        public int? HolderUserId { get; }

        public MhoLockedException(string? message) : base(message)
        {
        }

        public MhoLockedException(int holderUserId) : base(HubMessagePrefix + holderUserId)
        {
            HolderUserId = holderUserId;
        }
    }
}
