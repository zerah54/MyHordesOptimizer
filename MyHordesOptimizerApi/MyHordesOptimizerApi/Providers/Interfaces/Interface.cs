namespace MyHordesOptimizerApi.Providers.Interfaces
{
    public interface IMhoHeadersProvider
    {
        string MhoOrigin { get; set; }
        string MhoScriptVersion { get; set; }

        public const string Mho_Site_Origin = "website";
        public const string Mho_Script_Origin = "script"; // TODO retirer ça quand la maj sera propagée avec mho-addon
        public const string Mho_MhoAddon_Origin = "mho-addon";
        public const string Mho_ZenHordes_Origin = "zen-hordes";
        public const string Mho_Origin_Header_Name = "Mho-Origin";
        public const string Mho_Version_Header_Name = "Mho-Script-Version"; // TODO renommer ça pour refléter la prise en charge de MHO-Addon
    }
}
