using System;

namespace MyHordesOptimizerApi.Exceptions
{
    public class MhoTechnicalException : Exception
    {
        public MhoTechnicalException(string? message) : base(message)
        {
        }

        public MhoTechnicalException(string? message, Exception? innerException) : base(message, innerException)
        {
        }
    }
}
