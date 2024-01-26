using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MyHordesOptimizerApi.DiscordBot.Enums;
using MyHordesOptimizerApi.DiscordBot.Utility;
using MyHordesOptimizerApi.Dtos.MyHordes.MyHordesOptimizer;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer;
using MyHordesOptimizerApi.Repository.Interfaces;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    public class RecipesModule : InteractionModuleBase<SocketInteractionContext>
    {
        private readonly ILogger<RecipesModule> _logger;
        private readonly IEnumerable<ItemRecipeDto> _recipes;

        public RecipesModule(ILogger<RecipesModule> logger, IServiceScopeFactory serviceScopeFactory)
        {
            _logger = logger;
            //_recipes = recipesService.GetRecipes();
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
            await DeferAsync(ephemeral: privateMsg);
            try
            {
                var filteredRecipes = GetRecipesFromResultItemName(searchValue, locale);

                var embedBuilders = new List<Embed>();
                foreach (var filteredRecipe in filteredRecipes)
                {
                    var embedBuilder = new EmbedBuilder()
                        .WithTitle($"{searchValue}")
                        .WithColor(DiscordBotConsts.MhoColorPink);

                    CreateFieldFromRecipe(filteredRecipe, locale, embedBuilder);
                    CreateFieldsForChildren(filteredRecipe, locale, embedBuilder);

                    embedBuilders.Add(embedBuilder.Build());
                }

                if (embedBuilders.Count == 0)
                {
                    var embedBuilder = new EmbedBuilder()
                        .WithTitle($"{searchValue}")
                        .WithDescription("Aucun résultat n'a été trouvé")
                        .WithColor(DiscordBotConsts.MhoColorPink);

                    embedBuilders.Add(embedBuilder.Build());
                }

                await ModifyOriginalResponseAsync(response => response.Embeds = embedBuilders.ToArray());
            }
            catch (Exception e)
            {
                _logger.LogError(e.ToString(), e);
                await ModifyOriginalResponseAsync(response =>
                {
                    response.Content =
                        $"Une erreur s'est produite lors de la récupération de l'objet\n```{e.Message}```";
                });
            }
        }

        private List<ItemRecipeDto> GetRecipesFromResultItemName(string searchValue, Locales locale)
        {
            var filteredRecipes = _recipes
                .Where(recipe => GetItemResultFromRecipe(searchValue, locale, recipe) != null)
                .ToList();

            return filteredRecipes;
        }

        private ItemResult GetItemResultFromRecipe(string searchValue, Locales locale, ItemRecipeDto recipe)
        {
            return recipe.Result
                .Find(result =>
                {
                    var itemMatchSearch = NormalizeStrings.NormalizeLower(result.Item.Label[locale.ToString().ToLower()])
                        .IndexOf(NormalizeStrings.NormalizeLower(searchValue)) > -1;
                    var recipeTypeIsManual = recipe.Type == "Recipe::ManualAnywhere";
                    return itemMatchSearch && recipeTypeIsManual;
                });
        }

        private void CreateFieldFromRecipe(ItemRecipeDto recipe, Locales locale, EmbedBuilder embedBuilder)
        {
            var componentsLabels = recipe.Components
                .Select(component => component.Label[locale.ToString().ToLower()]);
            var completeRecipeComponents = string.Join('\n', componentsLabels);
            var componentsField = new EmbedFieldBuilder()
                .WithName("Composants")
                .WithValue(completeRecipeComponents)
                .WithIsInline(true);

            var separatorField = new EmbedFieldBuilder()
                .WithName(":arrow_right:")
                .WithValue(":arrow_right:")
                .WithIsInline(true);

            var resultLabels = recipe.Result
                .Select(result =>
                {
                    var label = result.Item.Label[locale.ToString().ToLower()];
                    var probability = result.Probability < 1.0
                        ? $"({Math.Round(result.Probability * 10000) / 100}%)"
                        : "";
                    return $"{label} {probability}";
                });
            var completeRecipeResults = string.Join('\n', resultLabels);
            var resultField = new EmbedFieldBuilder()
                .WithName("Résultats")
                .WithValue(completeRecipeResults)
                .WithIsInline(true);

            embedBuilder.WithFields(componentsField);
            embedBuilder.WithFields(separatorField);
            embedBuilder.WithFields(resultField);
        }

        private void CreateFieldsForChildren(ItemRecipeDto recipe, Locales locale, EmbedBuilder embedBuilder)
        {
            recipe.Components.ForEach(component =>
            {
                var childrenRecipes =
                    GetRecipesFromResultItemName(component.Label[locale.ToString().ToLower()], locale);

                childrenRecipes.ForEach(child_recipe =>
                {
                    CreateFieldFromRecipe(child_recipe, locale, embedBuilder);
                    CreateFieldsForChildren(child_recipe, locale, embedBuilder);
                });
            });
        }
    }
}