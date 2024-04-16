using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.Configuration.Interfaces;
using MyHordesOptimizerApi.Dtos.Gitlab;
using MyHordesOptimizerApi.Extensions;
using MyHordesOptimizerApi.Models.Translation;
using MyHordesOptimizerApi.Repository.Abstract;
using MyHordesOptimizerApi.Repository.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using YamlDotNet.Serialization;

namespace MyHordesOptimizerApi.Repository.Impl
{
    public class GitlabWebApiTranslationRepository : AbstractWebApiRepositoryBase, ITranslastionRepository
    {
        public override string HttpClientName => nameof(GitlabWebApiTranslationRepository);
        protected IMyHordesTranslationsConfiguration TranslationsConfiguration { get; init; }

        public GitlabWebApiTranslationRepository(ILogger<AbstractWebApiRepositoryBase> logger,
            IHttpClientFactory httpClientFactory,
            IMyHordesTranslationsConfiguration translationsConfiguration) : base(logger, httpClientFactory)
        {
            TranslationsConfiguration = translationsConfiguration;
        }

        public async Task<Dictionary<string, List<YmlTranslationFileModel>>> GetTranslationAsync()
        {
            var ymlFilesByLocale = new Dictionary<string, List<YmlTranslationFileModel>>();
            var ymlDeserializer = new DeserializerBuilder().Build();
            new Dictionary<string, List<YmlTranslationFileModel>>();
            foreach (var path in TranslationsConfiguration.Paths)
            {
                var gitlabFiles = new List<GitlabTreeResult>();
                var totalPage = 1;
                var page = 1;
                while (page <= totalPage)
                {
                    var result = base.Get($"https://gitlab.com/api/v4/projects/{TranslationsConfiguration.GitLabProjectId}/repository/tree?path={path}&per_page=100&page={page}");
                    result.EnsureSuccessStatusCodeEnriched();
                    var content = await result.Content.ReadAsStringAsync();
                    if (result.Headers.TryGetValues("x-total-pages", out var headerValues))
                    {
                        int.TryParse(headerValues.FirstOrDefault(), out totalPage);
                    }
                    gitlabFiles.AddRange(content.FromJson<List<GitlabTreeResult>>());
                    page++;
                }
                foreach (var file in gitlabFiles)
                {
                    if (file.Name.EndsWith(".yml"))
                    {
                        var ymlDatas = base.Get(url: $"https://gitlab.com/api/v4/projects/17840758/repository/files/{HttpUtility.UrlEncode(file.Path)}/raw").Content.ReadAsStringAsync().Result;
                        var translationFile = ymlDeserializer.Deserialize<Dictionary<string, string>>(ymlDatas);
                        var fileLocale = file.Name.Split(".")[1];
                        if (ymlFilesByLocale.TryGetValue(fileLocale, out var files))
                        {
                            files.Add(new YmlTranslationFileModel()
                            {
                                Name = $"{path}/{file.Name}",
                                Translations = translationFile,
                                DestinationLocale = fileLocale
                            });
                        }
                        else
                        {
                            ymlFilesByLocale.Add(fileLocale, new List<YmlTranslationFileModel>() { new YmlTranslationFileModel()
                        {
                            Name = $"{path}/{file.Name}",
                            Translations = translationFile,
                            DestinationLocale = fileLocale
                        }});
                        }
                    }
                }
            }
            return ymlFilesByLocale;
        }
    }
}
