namespace MyHordesOptimizerApi.Configuration.Interfaces
{
    public interface IMyHordesOptimizerFirebaseConfiguration
    {
            public string Type { get; }
            public string ProjectId { get; }
            public string PrivateKeyId { get; }
            public string PrivateKey { get; }
            public string ClientEmail { get; }
            public string ClientId { get; }
            public string AuthUri { get; }
            public string TokenUri { get; }
            public string AuthProviderX509CertUrl { get; }
            public string ClientX509CertUrl { get; }
            public string ApiKey { get; }
            public string Url { get; }
    }
}
