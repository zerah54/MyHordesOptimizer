using System;

namespace MyHordesOptimizerApi.Exceptions
{
    /// <summary>Ressource introuvable ou appartenant à un autre utilisateur. Traduite en 404 avec le message en corps par ApiExceptionFilter.</summary>
    public class MhoNotFoundException : Exception
    {
        public MhoNotFoundException(string? message) : base(message)
        {
        }
    }
}
