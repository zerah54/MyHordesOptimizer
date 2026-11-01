using System;

namespace MyHordesOptimizerApi.Exceptions
{
    /// <summary>Requête invalide (valeur refusée). Traduite en 400 avec le message en corps par ApiExceptionFilter.</summary>
    public class MhoBadRequestException : Exception
    {
        public MhoBadRequestException(string? message) : base(message)
        {
        }
    }
}
