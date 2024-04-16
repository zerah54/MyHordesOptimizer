using System;
using System.Net;

namespace MyHordesOptimizerApi.Exceptions
{
    public class MyHordesApiException : MhoTechnicalException
    {
        public HttpStatusCode StatusCode { get; }
        public MyHordesApiException(string message, HttpStatusCode statusCode) : base(message)
        {
            StatusCode = statusCode;
        }
    }
}
