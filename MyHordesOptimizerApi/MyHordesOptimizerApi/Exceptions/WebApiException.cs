using System;
using System.Net;

namespace MyHordesOptimizerApi.Exceptions
{
    public class WebApiException : MhoTechnicalException
    {
        public HttpStatusCode StatusCode { get; }
        public string Response { get; }
        public WebApiException(string message, string response, HttpStatusCode statusCode, Exception e) : base(message, e)
        {
            Response = response;
            StatusCode = statusCode;
        }

        public override string ToString()
        {
            return $"{Message}{Environment.NewLine}{StatusCode}{Environment.NewLine}{Response}{Environment.NewLine}{StackTrace}";
        }
    }
}
