namespace MyHordesOptimizerApi.Providers.Interfaces
{
    public interface IMhoHeadersProvider
    {
        string MhoOrigin { get; set; }
        string MhoScriptVersion { get; set; }

        public const string Mho_Site_Origin = "website";
        public const string Mho_Script_Origin = "script";
        public const string Mho_Origin_Header_Name = "Mho-Origin";
        public const string Mho_Version_Header_Name = "Mho-Script-Version";
    }
}
