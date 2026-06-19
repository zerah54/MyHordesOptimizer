namespace MyHordesOptimizerApi.Providers.Interfaces
{
    public interface IMhoHeadersProvider
    {
        string MhoOrigin { get; set; }
        string MhoAddonVersion { get; set; }

        public const string Mho_Site_Origin = "website";
        public const string Mho_Addon_Origin = "mho-addon";
        public const string Mho_ZenHordes_Origin = "zen-hordes";
        public const string Mho_Origin_Header_Name = "Mho-Origin";
        public const string Mho_Addon_Version_Header_Name = "Mho-Addon-Version";
    }
}
