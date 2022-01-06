using MyHordesOptimizerApi.Providers.Interfaces;

namespace MyHordesOptimizerApi.Providers.Impl
{
    public class GestHordeCookieProvider : IGestHordeCookieProvider
    {
        private string _cookies;
        public string Cookies { get => _cookies; set => _cookies = value; }
    }
}
