using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.ExternalsTools.Map;
using MyHordesOptimizerApi.Models.ExternalTools;
using MyHordesOptimizerApi.Services.Interfaces.ExternalTools;

namespace MyHordesOptimizerApi.Services.Impl.ExternalTools
{
    /// <summary>
    /// Unités de travail qu'une requête de mise à jour déclenchera.
    /// </summary>
    public readonly record struct ExternalToolsUpdateUnitPlan(bool MhoMap,
        bool MhoBags,
        bool MhoCitizen,
        bool MhoDigs,
        bool GhMap,
        bool GhCitizen,
        bool Fata,
        bool Bbh)
    {
        /// <summary>ResolveTownId est consommé par les quatre unités MHO.</summary>
        public bool NeedsTownId => MhoMap || MhoBags || MhoCitizen || MhoDigs;

        /// <summary>
        /// Le LastUpdateInfo n'est lu que par la carte, le détail citoyen et les fouilles :
        /// UpdateBags crée le sien en interne.
        /// </summary>
        public bool NeedsLastUpdateInfo => MhoMap || MhoCitizen || MhoDigs;
    }

    /// <summary>
    /// Source unique des conditions de lancement : <see cref="Build"/> est lue aussi bien par la
    /// déclaration des unités que par leur lancement, pour que les deux ne puissent pas diverger.
    /// Ne lit que la requête, ne dépend d'aucun service.
    /// </summary>
    public static class ExternalToolsUpdatePlan
    {
        public static ExternalToolsUpdateUnitPlan Build(UpdateRequestDto dto)
        {
            var mho = dto.Map.ToolsToUpdate.IsMyHordesOptimizer;
            var gh = dto.Map.ToolsToUpdate.IsGestHordes;
            var fata = dto.Map.ToolsToUpdate.IsFataMorgana;
            var bbh = dto.Map.ToolsToUpdate.IsBigBrothHordes;

            var mhoCitizen = dto.Amelios?.ToolsToUpdate.IsMyHordesOptimizer == true
                             || dto.HeroicActions?.ToolsToUpdate.IsMyHordesOptimizer == true
                             || dto.Status?.ToolsToUpdate.IsMyHordesOptimizer == true
                             || dto.Chest?.ToolsToUpdate.IsMyHordesOptimizer == true;
            var ghCitizen = dto.Amelios?.ToolsToUpdate.IsGestHordes == true
                            || dto.HeroicActions?.ToolsToUpdate.IsGestHordes == true
                            || dto.Status?.ToolsToUpdate.IsGestHordes == true;

            return new ExternalToolsUpdateUnitPlan(
                MhoMap: UpdateRequestMapToolsToUpdateDetailsDto.IsApi(mho) || UpdateRequestMapToolsToUpdateDetailsDto.IsCell(mho),
                MhoBags: dto.Bags != null && dto.Bags.ToolsToUpdate.IsMyHordesOptimizer,
                MhoCitizen: mhoCitizen,
                MhoDigs: dto.SuccessedDig != null,
                GhMap: UpdateRequestMapToolsToUpdateDetailsDto.IsApi(gh) || UpdateRequestMapToolsToUpdateDetailsDto.IsCell(gh),
                GhCitizen: ghCitizen,
                Fata: UpdateRequestMapToolsToUpdateDetailsDto.IsApi(fata) || UpdateRequestMapToolsToUpdateDetailsDto.IsCell(fata),
                Bbh: UpdateRequestMapToolsToUpdateDetailsDto.IsApi(bbh));
        }

        public static void Declare(UpdateRequestDto dto, IExternalToolsProgressSink sink)
        {
            var plan = Build(dto);
            if (plan.MhoMap) sink.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Map);
            if (plan.MhoBags) sink.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Bags);
            if (plan.MhoCitizen) sink.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Citizen);
            if (plan.MhoDigs) sink.Declare(ExternalToolId.MyHordesOptimizer, ExternalToolUpdateUnits.Digs);
            if (plan.GhMap) sink.Declare(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Map);
            if (plan.GhCitizen) sink.Declare(ExternalToolId.GestHordes, ExternalToolUpdateUnits.Citizen);
            if (plan.Fata) sink.Declare(ExternalToolId.FataMorgana, ExternalToolUpdateUnits.Map);
            if (plan.Bbh) sink.Declare(ExternalToolId.BigBrothHordes, ExternalToolUpdateUnits.Map);
        }
    }
}
