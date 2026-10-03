using System;
using System.Linq;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;
using Discord.WebSocket;
using MyHordesOptimizerApi.DiscordBot.Localization;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    [IntegrationType(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)]
    [CommandContextType(InteractionContextType.Guild, InteractionContextType.BotDm, InteractionContextType.PrivateChannel)]
    public class EmbedMessagesModule : InteractionModuleBase<SocketInteractionContext>
    {
        // Limites Discord d'un embed (https://discord.com/developers/docs/resources/message#embed-object-embed-limits) :
        // 25 champs (les sections) et 6000 caractères au total (titre, description, sections et auteur). Les longueurs
        // propres à chaque zone sont portées par les formulaires ci-dessous.
        private const string TitleModalId = "title_modal";
        private const string DescriptionModalId = "description_modal";
        private const string SectionModalId = "section_modal";

        /// <summary>Textes dans la langue de l'auteur : le brouillon est éphémère, seul lui clique dessus.</summary>
        private BotTexts Texts => Context.Interaction.Texts();

        [DefaultMemberPermissions(GuildPermission.Administrator)]
        [CommandContextType([InteractionContextType.Guild, InteractionContextType.PrivateChannel])]
        [SlashCommand(name: "instructions", description: "Make your instructions clearly visible and longer")]
        public async Task CreateInstructionsAsync()
        {
            await DeferAsync(ephemeral: true);
            var embed = new EmbedBuilder()
                .WithAuthor(Context.User)
                .WithCurrentTimestamp()
                .WithColor(Color.Red);
            await ModifyOriginalResponseAsync(props =>
            {
                props.Embed = embed.Build();
                props.Components = CreateComponents(embed.Build());
            });
        }

        [ComponentInteraction(customId: "add_section_btn")]
        public async Task OnAddSectionToMessageAsync()
        {
            BotTexts texts = Texts;
            Embed? draft = GetDraftEmbed();
            if (draft is null)
            {
                await RespondAsync(texts.InstructionsDraftNotFound, ephemeral: true);
                return;
            }

            // Bouton cliqué depuis un brouillon affiché avant d'atteindre une limite (il est grisé ensuite).
            string? refusal = GetAddSectionRefusal(draft, texts);
            if (refusal is not null)
            {
                await RespondAsync(refusal, ephemeral: true);
                return;
            }

            // La place restante est partagée entre le titre et le contenu : chaque zone est bornée à ce qui reste
            // (moins un caractère pour l'autre), et le total est revérifié à la validation.
            int remaining = EmbedBuilder.MaxEmbedLength - draft.Length;
            Modal modal = new ModalBuilder()
                .WithTitle(texts.InstructionsAddSection)
                .WithCustomId(SectionModalId)
                .AddTextInput(texts.InstructionsSectionTitleLabel, InstructionModal.SectionTitleInputId, TextInputStyle.Short,
                    maxLength: Math.Min(EmbedFieldBuilder.MaxFieldNameLength, remaining - 1), required: true)
                .AddTextInput(texts.InstructionsSectionContentLabel, InstructionModal.SectionContentInputId, TextInputStyle.Paragraph,
                    maxLength: Math.Min(EmbedFieldBuilder.MaxFieldValueLength, remaining - 1), required: true)
                .Build();
            await RespondWithModalAsync(modal);
        }

        [ComponentInteraction(customId: "add_title_btn")]
        public async Task OnAddTitleToMessageAsync()
        {
            await RespondWithTitleModalAsync(Texts.InstructionsAddTitle);
        }

        [ComponentInteraction(customId: "update_title_btn")]
        public async Task OnUpdateTitleToMessageAsync()
        {
            await RespondWithTitleModalAsync(Texts.InstructionsUpdateTitle);
        }

        [ComponentInteraction(customId: "add_description_btn")]
        public async Task OnAddDescriptionToMessageAsync()
        {
            await RespondWithDescriptionModalAsync(Texts.InstructionsAddDescription);
        }

        [ComponentInteraction(customId: "update_description_btn")]
        public async Task OnUpdateDescriptionToMessageAsync()
        {
            await RespondWithDescriptionModalAsync(Texts.InstructionsUpdateDescription);
        }

        /// <summary>
        /// Ouvre le formulaire du titre, pré-rempli avec le titre actuel et borné à la place laissée par le reste
        /// du brouillon.
        /// </summary>
        private async Task RespondWithTitleModalAsync(string modalTitle)
        {
            BotTexts texts = Texts;
            Embed? draft = GetDraftEmbed();
            if (draft is null)
            {
                await RespondAsync(texts.InstructionsDraftNotFound, ephemeral: true);
                return;
            }

            int maxLength = GetAvailableLength(draft, draft.Title, AddTitleModal.InputMaxLength);
            if (maxLength < 1)
            {
                await RespondAsync(texts.InstructionsFull(texts.InstructionsElementTitle, EmbedBuilder.MaxEmbedLength), ephemeral: true);
                return;
            }

            Modal modal = new ModalBuilder()
                .WithTitle(modalTitle)
                .WithCustomId(TitleModalId)
                .AddTextInput(texts.InstructionsTitleLabel, AddTitleModal.InputId, TextInputStyle.Short,
                    maxLength: maxLength, required: true, value: draft.Title)
                .Build();
            await RespondWithModalAsync(modal);
        }

        /// <summary>
        /// Ouvre le formulaire de la description, pré-rempli et borné comme celui du titre.
        /// </summary>
        private async Task RespondWithDescriptionModalAsync(string modalTitle)
        {
            BotTexts texts = Texts;
            Embed? draft = GetDraftEmbed();
            if (draft is null)
            {
                await RespondAsync(texts.InstructionsDraftNotFound, ephemeral: true);
                return;
            }

            int maxLength = GetAvailableLength(draft, draft.Description, AddDescriptionModal.InputMaxLength);
            if (maxLength < 1)
            {
                await RespondAsync(texts.InstructionsFull(texts.InstructionsElementDescription, EmbedBuilder.MaxEmbedLength), ephemeral: true);
                return;
            }

            Modal modal = new ModalBuilder()
                .WithTitle(modalTitle)
                .WithCustomId(DescriptionModalId)
                .AddTextInput(texts.InstructionsDescriptionLabel, AddDescriptionModal.InputId, TextInputStyle.Paragraph,
                    maxLength: maxLength, required: true, value: draft.Description)
                .Build();
            await RespondWithModalAsync(modal);
        }

        [ComponentInteraction(customId: "publish")]
        public async Task OnPublishMessageAsync()
        {
            BotTexts texts = Texts;
            await DeferAsync();
            Embed? embed = GetDraftEmbed();
            if (embed is null)
            {
                await FollowupAsync(texts.InstructionsDraftNotFound, ephemeral: true);
                return;
            }

            try
            {
                await Context.Channel.SendMessageAsync(embed: embed);
            }
            catch (Exception e)
            {
                // Le brouillon est conservé : l'utilisateur peut réessayer (ex. une fois le bot autorisé dans le salon).
                await FollowupAsync(texts.InstructionsPublishError(e.Message), ephemeral: true);
                return;
            }

            // Le brouillon n'est supprimé qu'une fois la publication réussie.
            await DeleteOriginalResponseAsync();
        }

        [ModalInteraction(customId: TitleModalId)]
        public async Task OnTitleModalValidationAsync(AddTitleModal addTitleModal)
        {
            await UpdateDraftAsync(builder =>
            {
                if (string.IsNullOrWhiteSpace(addTitleModal.InstructionTitle))
                {
                    return Texts.InstructionsTitleEmpty;
                }
                builder.WithTitle(addTitleModal.InstructionTitle);
                return null;
            });
        }

        [ModalInteraction(customId: DescriptionModalId)]
        public async Task OnDescriptionModalValidationAsync(AddDescriptionModal addDescriptionModal)
        {
            await UpdateDraftAsync(builder =>
            {
                if (string.IsNullOrWhiteSpace(addDescriptionModal.InstructionDescription))
                {
                    return Texts.InstructionsDescriptionEmpty;
                }
                builder.WithDescription(addDescriptionModal.InstructionDescription);
                return null;
            });
        }

        [ModalInteraction(customId: SectionModalId)]
        public async Task OnSectionModalValidationAsync(InstructionModal instructionModal)
        {
            await UpdateDraftAsync(builder =>
            {
                if (builder.Fields.Count >= EmbedBuilder.MaxFieldCount)
                {
                    return Texts.InstructionsMaxSections;
                }
                // Discord refuse un champ dont le nom ou la valeur ne contient que des espaces.
                if (string.IsNullOrWhiteSpace(instructionModal.SectionTitle) || string.IsNullOrWhiteSpace(instructionModal.SectionContent))
                {
                    return Texts.InstructionsSectionEmpty;
                }
                builder.AddField(new EmbedFieldBuilder()
                    .WithName(instructionModal.SectionTitle)
                    .WithValue(instructionModal.SectionContent));
                return null;
            });
        }

        /// <summary>
        /// Applique une modification au brouillon puis met à jour le message qui le porte, en réponse directe au
        /// formulaire. Si la modification est refusée (message renvoyé par <paramref name="applyChange"/>, ou total
        /// au-delà des 6000 caractères), le brouillon reste intact et l'auteur est prévenu par un message éphémère.
        /// </summary>
        private async Task UpdateDraftAsync(Func<EmbedBuilder, string?> applyChange)
        {
            BotTexts texts = Texts;
            Embed? draft = GetDraftEmbed();
            if (draft is null)
            {
                await RespondAsync(texts.InstructionsDraftNotFound, ephemeral: true);
                return;
            }

            EmbedBuilder builder = draft.ToEmbedBuilder();
            string? refusal = applyChange(builder);
            if (refusal is null && builder.Length > EmbedBuilder.MaxEmbedLength)
            {
                refusal = texts.InstructionsTooLong(builder.Length, EmbedBuilder.MaxEmbedLength);
            }
            if (refusal is not null)
            {
                await RespondAsync(refusal, ephemeral: true);
                return;
            }

            Embed embed = builder.Build();
            await ((SocketModal)Context.Interaction).UpdateAsync(props =>
            {
                props.Embed = embed;
                props.Components = CreateComponents(embed);
            });
        }

        /// <summary>
        /// Raison pour laquelle aucune section ne peut plus être ajoutée, ou null si c'est possible : 25 sections au
        /// plus, et au moins deux caractères libres (un pour le titre, un pour le contenu).
        /// </summary>
        private static string? GetAddSectionRefusal(Embed embed, BotTexts texts)
        {
            if (embed.Fields.Length >= EmbedBuilder.MaxFieldCount)
            {
                return texts.InstructionsMaxSections;
            }
            if (EmbedBuilder.MaxEmbedLength - embed.Length < 2)
            {
                return texts.InstructionsFull(texts.InstructionsElementSection, EmbedBuilder.MaxEmbedLength);
            }
            return null;
        }

        /// <summary>
        /// Longueur maximale d'une zone qui remplace <paramref name="currentValue"/> : sa limite propre, réduite à la
        /// place que le reste du brouillon laisse dans les 6000 caractères.
        /// </summary>
        private static int GetAvailableLength(Embed draft, string? currentValue, int inputMaxLength)
        {
            int available = EmbedBuilder.MaxEmbedLength - draft.Length + (currentValue?.Length ?? 0);
            return Math.Min(inputMaxLength, available);
        }

        private MessageComponent CreateComponents(Embed embed)
        {
            BotTexts texts = Texts;

            var addTitleBtn = new ButtonBuilder()
                .WithCustomId("add_title_btn")
                .WithLabel(texts.InstructionsAddTitle)
                .WithStyle(ButtonStyle.Primary);

            var updateTitleBtn = new ButtonBuilder()
                .WithCustomId("update_title_btn")
                .WithLabel(texts.InstructionsUpdateTitle)
                .WithStyle(ButtonStyle.Secondary);

            var addDescriptionBtn = new ButtonBuilder()
                .WithCustomId("add_description_btn")
                .WithLabel(texts.InstructionsAddDescription)
                .WithStyle(ButtonStyle.Primary);

            var updateDescriptionBtn = new ButtonBuilder()
                .WithCustomId("update_description_btn")
                .WithLabel(texts.InstructionsUpdateDescription)
                .WithStyle(ButtonStyle.Secondary);

            // Grisé une fois une limite atteinte (25 sections ou 6000 caractères).
            bool canAddSection = GetAddSectionRefusal(embed, texts) is null;
            var addSectionBtn = new ButtonBuilder()
                .WithCustomId("add_section_btn")
                .WithLabel(canAddSection ? texts.InstructionsAddSection : texts.InstructionsAddSectionLimitReached)
                .WithDisabled(!canAddSection)
                .WithStyle(ButtonStyle.Primary);

            var publishBtn = new ButtonBuilder()
                .WithCustomId("publish")
                .WithLabel(texts.InstructionsPublish)
                .WithStyle(ButtonStyle.Success);

            var components = new ComponentBuilder()
                .WithButton(embed.Title != null ? updateTitleBtn : addTitleBtn)
                .WithButton(embed.Description != null ? updateDescriptionBtn : addDescriptionBtn);

            components.WithButton(addSectionBtn);

            if ((embed.Fields != null && embed.Fields.Length > 0) || embed.Description != null)
            {
                components.WithButton(publishBtn);
            }

            return components.Build();
        }

        /// <summary>
        /// Brouillon porté par le message d'où vient l'interaction (bouton, ou formulaire ouvert depuis un bouton).
        /// Discord transmet ce message avec l'interaction : ni appel à l'API, ni attente bloquante.
        /// </summary>
        private Embed? GetDraftEmbed()
        {
            SocketUserMessage? message = Context.Interaction switch
            {
                SocketMessageComponent component => component.Message,
                SocketModal modal => modal.Message,
                _ => null
            };
            return message?.Embeds.FirstOrDefault();
        }
    }

    // Les classes IModal ci-dessous lisent les formulaires soumis (par identifiant de champ). Les formulaires
    // affichés sont construits dans le module, dans la langue de l'auteur : libellés et titres ici ne servent pas.

    public class InstructionModal : IModal
    {
        public const string SectionTitleInputId = "Titre de la section";
        public const string SectionContentInputId = "Contenu de la section";

        public string Title => "Ajouter une section";

        [InputLabel("Titre de la section")]
        [ModalTextInput(customId: SectionTitleInputId, style: TextInputStyle.Short, maxLength: EmbedFieldBuilder.MaxFieldNameLength)]
        public string SectionTitle { get; set; }

        [InputLabel("Contenu de la section")]
        [ModalTextInput(customId: SectionContentInputId, style: TextInputStyle.Paragraph, maxLength: EmbedFieldBuilder.MaxFieldValueLength)]
        public string SectionContent { get; set; }
    }

    public class AddTitleModal : IModal
    {
        public const string InputId = "title";
        public const int InputMaxLength = EmbedBuilder.MaxTitleLength;

        public string Title { get; set; }

        /// <summary>Titre saisi ; à l'ouverture, valeur pré-remplie (null : champ vide).</summary>
        [InputLabel("Titre")]
        [ModalTextInput(customId: InputId, style: TextInputStyle.Short, maxLength: InputMaxLength)]
        public string? InstructionTitle { get; set; }
    }

    public class AddDescriptionModal : IModal
    {
        public const string InputId = "description";
        // Plafond d'un champ de formulaire Discord, sous les 4096 caractères d'une description d'embed.
        public const int InputMaxLength = TextInputBuilder.LargestMaxLength;

        public string Title { get; set; }

        /// <summary>Description saisie ; à l'ouverture, valeur pré-remplie (null : champ vide).</summary>
        [InputLabel("Description")]
        [ModalTextInput(customId: InputId, style: TextInputStyle.Paragraph, maxLength: InputMaxLength)]
        public string? InstructionDescription { get; set; }
    }
}
