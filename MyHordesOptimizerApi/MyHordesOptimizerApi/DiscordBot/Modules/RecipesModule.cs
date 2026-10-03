using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Enums;
using MyHordesOptimizerApi.DiscordBot.Localization;
using MyHordesOptimizerApi.DiscordBot.Utility;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Services.Interfaces;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    [IntegrationType(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)]
    [CommandContextType(InteractionContextType.Guild, InteractionContextType.BotDm, InteractionContextType.PrivateChannel)]
    public class RecipesModule : InteractionModuleBase<SocketInteractionContext>
    {
        // Limites Discord d'un message : https://discord.com/developers/docs/resources/message#embed-object-embed-limits
        private const int MaxEmbedsPerMessage = 10;
        private const int MaxFieldsPerEmbed = 25;
        private const int MaxCharactersPerMessage = 6000;
        private const int MaxTitleLength = 256;
        private const int MaxFieldValueLength = 1024;
        // Place réservée, dans les 6000 caractères, au pied de page signalant la troncature.
        private const int TruncationFooterReserve = 100;

        private readonly ILogger<RecipesModule> _logger;
        private readonly IEnumerable<ItemRecipeDto> _recipes;

        public RecipesModule(ILogger<RecipesModule> logger, IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            using var scope = serviceScopeFactory.CreateScope();
            var recipesService = scope.ServiceProvider.GetRequiredService<IMyHordesFetcherService>();
            try
            {
                _recipes = recipesService.GetRecipes();
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
            }
        }

        [SlashCommand(name: "recipe", description: "Find the recipe for an item and the recipes that lead to it")]
        public async Task RecipeAsync(
            [Summary(name: "text", description: "Searched text")]
            string searchValue,
            [Summary(name: "language", description: "The language of the searched text")]
            Locales locale,
            [Summary(name: "private-msg", description: "True if the message should not be seen by all")]
            bool privateMsg = false
        )
        {
            // Texte et langue sont des options obligatoires : Discord ne transmet jamais de valeur absente.
            BotTexts texts = Context.Interaction.Texts();
            await DeferAsync(ephemeral: privateMsg);
            try
            {
                List<ItemRecipeDto> filteredRecipes = GetRecipesFromResultItemName(searchValue, locale);
                List<Embed> embeds = BuildRecipeEmbeds(searchValue, locale, filteredRecipes, texts);

                await ModifyOriginalResponseAsync(response => response.Embeds = embeds.ToArray());
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
                await ModifyOriginalResponseAsync(response => { response.Content = texts.RecipeError(e.Message); });
            }
        }

        private List<ItemRecipeDto> GetRecipesFromResultItemName(string searchValue, Locales locale)
        {
            var filteredRecipes = _recipes
                .Where((recipe) =>
                {
                    _logger.LogDebug($"RECIPE{recipe}");
                    return GetItemResultFromRecipe(searchValue, locale, recipe) != null;
                })
                .ToList();

            return filteredRecipes;
        }

        private ItemResultDto GetItemResultFromRecipe(string searchValue, Locales locale, ItemRecipeDto recipe)
        {
            return recipe.Result
                .Find(result =>
                {
                    var itemMatchSearch = NormalizeStrings
                        .NormalizeLower(result.Item.Label[locale.ToString().ToLower()])
                        .IndexOf(NormalizeStrings.NormalizeLower(searchValue)) > -1;
                    var recipeTypeIsManual = recipe.Type == "Recipe::ManualAnywhere";
                    return itemMatchSearch && recipeTypeIsManual;
                });
        }

        /// <summary>
        /// Un embed par recette trouvée, contenant la recette puis celles qui produisent ses composants.
        /// Ce qui dépasse les limites Discord n'est pas affiché, et le pied de page du dernier embed le signale.
        /// </summary>
        private List<Embed> BuildRecipeEmbeds(string searchValue, Locales locale, List<ItemRecipeDto> filteredRecipes, BotTexts texts)
        {
            string title = Truncate(searchValue, MaxTitleLength);
            List<EmbedBuilder> embedBuilders = new List<EmbedBuilder>();
            Dictionary<string, List<ItemRecipeDto>> recipesByResultLabel = new Dictionary<string, List<ItemRecipeDto>>();
            int remainingCharacters = MaxCharactersPerMessage - TruncationFooterReserve;
            int hiddenRecipesCount = 0;

            foreach (ItemRecipeDto filteredRecipe in filteredRecipes)
            {
                List<ItemRecipeDto> recipeTree = new List<ItemRecipeDto>();
                CollectRecipeTree(filteredRecipe, locale, recipeTree,
                    new HashSet<ItemRecipeDto>(ReferenceEqualityComparer.Instance), recipesByResultLabel);

                EmbedBuilder embedBuilder = new EmbedBuilder()
                    .WithTitle(title)
                    .WithColor(DiscordBotConsts.MhoColorPink);
                int embedCharacters = title.Length;
                int displayedRecipesCount = 0;

                if (embedBuilders.Count < MaxEmbedsPerMessage)
                {
                    foreach (ItemRecipeDto recipe in recipeTree)
                    {
                        List<EmbedFieldBuilder> fields = CreateFieldsFromRecipe(recipe, locale, texts);
                        int fieldsCharacters = fields.Sum(field => field.Name.Length + (field.Value?.ToString()?.Length ?? 0));
                        bool fitsInEmbed = embedBuilder.Fields.Count + fields.Count <= MaxFieldsPerEmbed;
                        bool fitsInMessage = embedCharacters + fieldsCharacters <= remainingCharacters;
                        if (!fitsInEmbed || !fitsInMessage)
                        {
                            // Parcours en profondeur : on s'arrête à la première recette qui ne tient pas, pour ne
                            // pas afficher une sous-recette sans la recette qui y mène.
                            break;
                        }

                        embedBuilder.WithFields(fields);
                        embedCharacters += fieldsCharacters;
                        displayedRecipesCount++;
                    }
                }

                hiddenRecipesCount += recipeTree.Count - displayedRecipesCount;
                if (displayedRecipesCount > 0)
                {
                    embedBuilders.Add(embedBuilder);
                    remainingCharacters -= embedCharacters;
                }
            }

            if (embedBuilders.Count == 0)
            {
                embedBuilders.Add(new EmbedBuilder()
                    .WithTitle(title)
                    .WithDescription(texts.RecipeNoResult)
                    .WithColor(DiscordBotConsts.MhoColorPink));
            }

            if (hiddenRecipesCount > 0)
            {
                embedBuilders[embedBuilders.Count - 1].WithFooter(texts.RecipeTruncated(hiddenRecipesCount));
            }

            return embedBuilders.Select(builder => builder.Build()).ToList();
        }

        /// <summary>
        /// Parcours en profondeur : la recette, puis les recettes qui produisent chacun de ses composants.
        /// Une recette déjà visitée n'est ni reparcourue ni réaffichée : un cycle ne peut pas boucler.
        /// </summary>
        private void CollectRecipeTree(ItemRecipeDto recipe, Locales locale, List<ItemRecipeDto> recipeTree,
            HashSet<ItemRecipeDto> visitedRecipes, Dictionary<string, List<ItemRecipeDto>> recipesByResultLabel)
        {
            if (!visitedRecipes.Add(recipe))
            {
                return;
            }

            recipeTree.Add(recipe);
            foreach (ItemComponentRecipeDto component in recipe.Components)
            {
                string componentLabel = component.Item.Label[locale.ToString().ToLower()];
                // Cache limité à la commande : un même composant revient dans de nombreuses recettes.
                if (!recipesByResultLabel.TryGetValue(componentLabel, out List<ItemRecipeDto>? childrenRecipes))
                {
                    childrenRecipes = GetRecipesFromResultItemName(componentLabel, locale);
                    recipesByResultLabel.Add(componentLabel, childrenRecipes);
                }

                foreach (ItemRecipeDto childRecipe in childrenRecipes)
                {
                    CollectRecipeTree(childRecipe, locale, recipeTree, visitedRecipes, recipesByResultLabel);
                }
            }
        }

        private List<EmbedFieldBuilder> CreateFieldsFromRecipe(ItemRecipeDto recipe, Locales locale, BotTexts texts)
        {
            IEnumerable<string> componentsLabels = recipe.Components
                .Select(component => component.Item.Label[locale.ToString().ToLower()]);
            string completeRecipeComponents = string.Join('\n', componentsLabels);
            EmbedFieldBuilder componentsField = new EmbedFieldBuilder()
                .WithName(texts.RecipeComponents)
                .WithValue(FormatFieldValue(completeRecipeComponents))
                .WithIsInline(true);

            EmbedFieldBuilder separatorField = new EmbedFieldBuilder()
                .WithName(":arrow_right:")
                .WithValue(":arrow_right:")
                .WithIsInline(true);

            IEnumerable<string> resultLabels = recipe.Result
                .Select(result =>
                {
                    string label = result.Item.Label[locale.ToString().ToLower()];
                    string probability = result.Probability < 1.0
                        ? $"({Math.Round(result.Probability * 10000) / 100}%)"
                        : "";
                    return $"{label} {probability}";
                });
            string completeRecipeResults = string.Join('\n', resultLabels);
            EmbedFieldBuilder resultField = new EmbedFieldBuilder()
                .WithName(texts.RecipeResults)
                .WithValue(FormatFieldValue(completeRecipeResults))
                .WithIsInline(true);

            return new List<EmbedFieldBuilder> { componentsField, separatorField, resultField };
        }

        // Discord refuse une valeur de champ vide ou de plus de 1024 caractères.
        private static string FormatFieldValue(string value)
        {
            return string.IsNullOrEmpty(value) ? "-" : Truncate(value, MaxFieldValueLength);
        }

        private static string Truncate(string value, int maxLength)
        {
            return value.Length <= maxLength ? value : value.Substring(0, maxLength - 1) + "…";
        }
    }
}