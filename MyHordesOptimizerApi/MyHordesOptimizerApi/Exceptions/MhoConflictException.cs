using System;

namespace MyHordesOptimizerApi.Exceptions
{
    /// <summary>
    /// La ressource a été modifiée depuis sa lecture (numéro de version différent) : le client doit la relire
    /// avant de réessayer. Traduite en 409 par ApiExceptionFilter ; le hub la relaie au client par une
    /// HubException dont le message commence par <see cref="HubMessagePrefix"/>.
    /// </summary>
    public class MhoConflictException : Exception
    {
        public const string HubMessagePrefix = "Conflict:";

        public MhoConflictException(string? message) : base(message)
        {
        }
    }
}
