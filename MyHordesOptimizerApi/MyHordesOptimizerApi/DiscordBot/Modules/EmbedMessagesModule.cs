using System.Linq;
using System.Threading.Tasks;
using Discord;
using Discord.Interactions;

namespace MyHordesOptimizerApi.DiscordBot.Modules
{
    public class EmbedMessagesModule : InteractionModuleBase<SocketInteractionContext>
    {
        
        [DefaultMemberPermissions(GuildPermission.Administrator)]
        [EnabledInDm(false)]
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
            await RespondWithModalAsync<InstructionModal>("section_modal");
        }

        [ComponentInteraction(customId: "add_title_btn")]
        public async Task OnAddTitleToMessageAsync()
        {
            var modal = new AddTitleModal
            {
                Title = "Ajouter un titre"
            };
            await Context.Interaction.RespondWithModalAsync("title_modal", modal: modal);
        }

        [ComponentInteraction(customId: "update_title_btn")]
        public async Task OnUpdateTitleToMessageAsync()
        {
            var modal = new AddTitleModal
            {
                // InstructionTitle = GetOriginalResponseEmbed()?.Title,
                Title = "Modifier le titre"
            };
            await Context.Interaction.RespondWithModalAsync("title_modal", modal: modal);
        }

        [ComponentInteraction(customId: "add_description_btn")]
        public async Task OnAddDescriptionToMessageAsync()
        {
            var modal = new AddDescriptionModal
            {
                Title = "Ajouter une description"
            };
            await Context.Interaction.RespondWithModalAsync("description_modal", modal: modal);
        }

        [ComponentInteraction(customId: "update_description_btn")]
        public async Task OnUpdateDescriptionToMessageAsync()
        {
            var modal = new AddDescriptionModal
            {
                // InstructionDescription = GetOriginalResponseEmbed()?.Description,
                Title = "Modifier la description"
            };
            await Context.Interaction.RespondWithModalAsync("description_modal", modal: modal);
        }

        [ComponentInteraction(customId: "publish")]
        public async Task OnPublishMessageAsync()
        {
            await DeferAsync();
            var embed = GetOriginalResponseEmbed();
            var originalResponse = Context.Interaction.GetOriginalResponseAsync();
            await originalResponse.Result.DeleteAsync();
            await Context.Channel.SendMessageAsync(embed: embed);
        }

        [ModalInteraction(customId: "title_modal")]
        public async Task OnTitleModalValidationAsync(AddTitleModal addTitleModal)
        {
            await DeferAsync(ephemeral: true);
            var embed = GetOriginalResponseEmbed()
                .ToEmbedBuilder()
                .WithTitle(addTitleModal.InstructionTitle)
                .Build();

            await ModifyOriginalResponseAsync(props =>
            {
                props.Embed = embed;
                props.Components = CreateComponents(embed);
            });
        }

        [ModalInteraction(customId: "description_modal")]
        public async Task OnDescriptionModalValidationAsync(AddDescriptionModal addDescriptionModal)
        {
            await DeferAsync(ephemeral: true);
            var embed = GetOriginalResponseEmbed()
                .ToEmbedBuilder()
                .WithDescription(addDescriptionModal.InstructionDescription)
                .Build();

            await ModifyOriginalResponseAsync(props =>
            {
                props.Embed = embed;
                props.Components = CreateComponents(embed);
            });
        }

        [ModalInteraction(customId: "section_modal")]
        public async Task OnSectionModalValidationAsync(InstructionModal instructionModal)
        {
            await DeferAsync(ephemeral: true);
            var field = new EmbedFieldBuilder()
                .WithName(instructionModal.SectionTitle)
                .WithValue(instructionModal.SectionContent);

            var embed = GetOriginalResponseEmbed()
                .ToEmbedBuilder();
            embed.AddField(field);

            await ModifyOriginalResponseAsync(props =>
            {
                props.Embed = embed.Build();
                props.Components = CreateComponents(embed.Build());
            });
        }

        private MessageComponent CreateComponents(Embed embed)
        {

            var addTitleBtn = new ButtonBuilder()
                .WithCustomId("add_title_btn")
                .WithLabel("Ajouter un titre")
                .WithStyle(ButtonStyle.Primary);

            var updateTitleBtn = new ButtonBuilder()
                .WithCustomId("update_title_btn")
                .WithLabel("Modifier le titre")
                .WithStyle(ButtonStyle.Secondary);

            var addDescriptionBtn = new ButtonBuilder()
                .WithCustomId("add_description_btn")
                .WithLabel("Ajouter une description")
                .WithStyle(ButtonStyle.Primary);

            var updateDescriptionBtn = new ButtonBuilder()
                .WithCustomId("update_description_btn")
                .WithLabel("Modifier la description")
                .WithStyle(ButtonStyle.Secondary);
            
            var addSectionBtn = new ButtonBuilder()
                .WithCustomId("add_section_btn")
                .WithLabel("Ajouter une section")
                .WithStyle(ButtonStyle.Primary);

            var publishBtn = new ButtonBuilder()
                .WithCustomId("publish")
                .WithLabel("Publier les consignes")
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

        private Embed GetOriginalResponseEmbed()
        {
            var originalResponse = Context.Interaction.GetOriginalResponseAsync();
            return originalResponse?.Result?.Embeds?.First();
        }
    }

    public class InstructionModal : IModal
    {
        public string Title => "Ajouter une section";

        [ModalTextInput(customId: "Titre de la section", style: TextInputStyle.Short, maxLength: 256)]
        public string SectionTitle { get; set; }

        [ModalTextInput(customId: "Contenu de la section", style: TextInputStyle.Paragraph, maxLength: 1024)]
        public string SectionContent { get; set; }
    }

    public class AddTitleModal : IModal
    {
        public string Title { get; set; }

        [ModalTextInput(customId: "title", style: TextInputStyle.Short, maxLength: 256)]
        public string InstructionTitle { get; set; }
    }

    public class AddDescriptionModal : IModal
    {
        public string Title { get; set; }

        [ModalTextInput(customId: "description", style: TextInputStyle.Paragraph, maxLength: 4000)]
        public string InstructionDescription { get; set; }
    }
}