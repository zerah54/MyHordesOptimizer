using System;

namespace MyHordesOptimizerApi.Exceptions
{
    /// <summary>
    /// La ressource est verrouillée par une autre connexion. Traduite en 423 par ApiExceptionFilter.
    /// </summary>
    public class MhoLockedException : Exception
    {
        public MhoLockedException(string? message) : base(message)
        {
        }
    }
}
