using Microsoft.EntityFrameworkCore;
using MyHordesOptimizerApi.Dtos.MyHordesOptimizer.PreTowns;
using MyHordesOptimizerApi.Exceptions;
using MyHordesOptimizerApi.Models;
using MyHordesOptimizerApi.Providers.Interfaces;
using MyHordesOptimizerApi.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyHordesOptimizerApi.Services.Impl.PreTowns
{
    /// <summary>Lecture réservée aux membres ; membres, organisateurs et nom réservés aux organisateurs.</summary>
    public class PreTownService : IPreTownService
    {
        private const int MaxAliasLength = 64;
        private const int MinSimulatedCitizens = 1;
        /** Population maximale d'une ville privée dans le jeu. */
        private const int MaxSimulatedCitizens = 80;

        protected MhoContext DbContext { get; init; }
        protected IUserInfoProvider UserInfoProvider { get; init; }

        protected TimeProvider TimeProvider { get; init; }

        /// <summary>Triés par rang : groupes de souhaits avant objets.</summary>
        protected IReadOnlyList<IPreTownMerger> Mergers { get; init; }

        public PreTownService(MhoContext dbContext, IUserInfoProvider userInfoProvider, TimeProvider timeProvider, IEnumerable<IPreTownMerger> mergers)
        {
            Mergers = PreTownMergers.Sorted(mergers);
            TimeProvider = timeProvider;
            DbContext = dbContext;
            UserInfoProvider = userInfoProvider;
        }

        public async Task<PreTownDto> CreateAsync(string alias)
        {
            alias = ValidateAlias(alias);
            await using var tx = await DbContext.Database.BeginTransactionAsync();
            var preTownId = await CreateCoreAsync(alias);
            await tx.CommitAsync();
            return await GetAsync(preTownId);
        }

        /// <summary>Copie le contenu de la source (sans membres ni journal, non liée) dans une nouvelle pré-ville, en une seule transaction.</summary>
        public async Task<PreTownDto> DuplicateAsync(int preTownId, string alias)
        {
            alias = ValidateAlias(alias);
            await EnsureOrganizerAsync(preTownId);
            await using var tx = await DbContext.Database.BeginTransactionAsync();
            var newId = await CreateCoreAsync(alias);
            var simulatedCitizens = await DbContext.PreTowns.Where(p => p.IdPreTown == preTownId).Select(p => p.SimulatedCitizens).SingleAsync();
            await DbContext.PreTowns.Where(p => p.IdPreTown == newId).ExecuteUpdateAsync(s => s.SetProperty(p => p.SimulatedCitizens, simulatedCitizens));
            var wishListChanged = false;
            foreach (var merger in Mergers)
            {
                var report = await merger.MergeAsync(DbContext, PreTownIds.ToIdTown(preTownId), PreTownIds.ToIdTown(newId));
                wishListChanged |= report.AddedRowKeys.Count > 0 && PreTownMergers.IsWishList(merger);
            }
            if (wishListChanged)
            {
                await PreTownMergers.TouchWishListAsync(DbContext, PreTownIds.ToIdTown(newId), UserInfoProvider.UserId);
            }
            await tx.CommitAsync();
            return await GetAsync(newId);
        }

        /// <summary>Crée pré-ville, ville fantôme et organisateur dans la transaction ouverte de l'appelant.</summary>
        private async Task<int> CreateCoreAsync(string alias)
        {
            var userId = UserInfoProvider.UserId;
            var now = DateTime.UtcNow;
            var preTown = new PreTown { Alias = alias, IdCreator = userId, CreatedAt = now };
            DbContext.PreTowns.Add(preTown);
            await DbContext.SaveChangesAsync();
            DbContext.Towns.Add(new Town { IdTown = PreTownIds.ToIdTown(preTown.IdPreTown), MapId = PreTownIds.ToMapId(preTown.IdPreTown), Name = alias });
            DbContext.PreTownMembers.Add(new PreTownMember { IdPreTown = preTown.IdPreTown, IdUser = userId, IsOrganizer = true, AddedAt = now, Seen = true });
            await DbContext.SaveChangesAsync();
            return preTown.IdPreTown;
        }

        public async Task<List<PreTownSummaryDto>> ListMineAsync()
        {
            var userId = UserInfoProvider.UserId;
            return await (from m in DbContext.PreTownMembers.AsNoTracking()
                          where m.IdUser == userId
                          join p in DbContext.PreTowns.AsNoTracking() on m.IdPreTown equals p.IdPreTown
                          orderby p.IdPreTown descending
                          select new PreTownSummaryDto
                          {
                              PreTownId = p.IdPreTown,
                              MapId = PreTownIds.Offset + p.IdPreTown,
                              Alias = p.Alias,
                              IsOrganizer = m.IsOrganizer,
                              Seen = m.Seen,
                              IsLinked = p.LinkedIdTown != null,
                              MemberCount = DbContext.PreTownMembers.Count(x => x.IdPreTown == p.IdPreTown)
                          }).ToListAsync();
        }

        public async Task<PreTownDto> GetAsync(int preTownId)
        {
            var me = await EnsureMemberAsync(preTownId);
            var preTown = await DbContext.PreTowns.AsNoTracking().SingleOrDefaultAsync(p => p.IdPreTown == preTownId)
                ?? throw new MhoNotFoundException("Pré-ville introuvable.");
            var members = await (from m in DbContext.PreTownMembers.AsNoTracking()
                                 where m.IdPreTown == preTownId
                                 join u in DbContext.Users.AsNoTracking() on m.IdUser equals u.IdUser into users
                                 from u in users.DefaultIfEmpty()
                                 orderby m.AddedAt, m.IdUser
                                 select new PreTownMemberDto { IdUser = m.IdUser, Name = u == null ? string.Empty : u.Name, IsOrganizer = m.IsOrganizer }).ToListAsync();
            return new PreTownDto
            {
                PreTownId = preTown.IdPreTown,
                MapId = PreTownIds.ToMapId(preTown.IdPreTown),
                Alias = preTown.Alias,
                Members = members,
                IsOrganizer = me.IsOrganizer,
                IsLinked = preTown.LinkedIdTown != null,
                LinkedMapId = preTown.LinkedMapId,
                LinkedAt = preTown.LinkedAt,
                CanUnlink = me.IsOrganizer && await PreTownLinkService.GetUnlinkRefusalAsync(DbContext, preTown, TimeProvider.GetUtcNow().UtcDateTime) is null,
                SimulatedCitizens = preTown.SimulatedCitizens
            };
        }

        public async Task AddMemberAsync(int preTownId, int idUser)
        {
            await EnsureOrganizerAsync(preTownId);
            if (await DbContext.PreTownMembers.AnyAsync(m => m.IdPreTown == preTownId && m.IdUser == idUser))
            {
                return;
            }
            DbContext.PreTownMembers.Add(new PreTownMember { IdPreTown = preTownId, IdUser = idUser, AddedAt = DateTime.UtcNow });
            await DbContext.SaveChangesAsync();
        }

        public async Task RemoveMemberAsync(int preTownId, int idUser)
        {
            var me = await EnsureMemberAsync(preTownId);
            if (idUser != me.IdUser && !me.IsOrganizer)
            {
                throw new MhoForbiddenException("Réservé aux organisateurs de la pré-ville.");
            }
            var target = await DbContext.PreTownMembers.SingleOrDefaultAsync(m => m.IdPreTown == preTownId && m.IdUser == idUser);
            if (target is null)
            {
                return;
            }
            if (target.IsOrganizer)
            {
                await EnsureAnotherOrganizerAsync(preTownId, idUser);
            }
            DbContext.PreTownMembers.Remove(target);
            await DbContext.SaveChangesAsync();
        }

        public async Task SetOrganizerAsync(int preTownId, int idUser, bool isOrganizer)
        {
            await EnsureOrganizerAsync(preTownId);
            var target = await DbContext.PreTownMembers.SingleOrDefaultAsync(m => m.IdPreTown == preTownId && m.IdUser == idUser)
                ?? throw new MhoNotFoundException("Membre introuvable.");
            if (target.IsOrganizer == isOrganizer)
            {
                return;
            }
            if (!isOrganizer)
            {
                await EnsureAnotherOrganizerAsync(preTownId, idUser);
            }
            target.IsOrganizer = isOrganizer;
            await DbContext.SaveChangesAsync();
        }

        public async Task RenameAsync(int preTownId, string alias)
        {
            alias = ValidateAlias(alias);
            await EnsureOrganizerAsync(preTownId);
            await using var tx = await DbContext.Database.BeginTransactionAsync();
            var preTown = await DbContext.PreTowns.SingleAsync(p => p.IdPreTown == preTownId);
            preTown.Alias = alias;
            var phantom = await DbContext.Towns.SingleOrDefaultAsync(t => t.IdTown == PreTownIds.ToIdTown(preTownId));
            if (phantom is not null)
            {
                phantom.Name = alias;
            }
            await DbContext.SaveChangesAsync();
            await tx.CommitAsync();
        }

        public async Task SetSimulatedCitizensAsync(int preTownId, int simulatedCitizens)
        {
            if (simulatedCitizens < MinSimulatedCitizens || simulatedCitizens > MaxSimulatedCitizens)
            {
                throw new MhoBadRequestException($"Le nombre de citoyens simulés doit être compris entre {MinSimulatedCitizens} et {MaxSimulatedCitizens}.");
            }
            await EnsureOrganizerAsync(preTownId);
            var preTown = await DbContext.PreTowns.SingleAsync(p => p.IdPreTown == preTownId);
            if (preTown.LinkedIdTown != null)
            {
                throw new MhoBadRequestException("Une pré-ville liée ne se modifie plus.");
            }
            preTown.SimulatedCitizens = simulatedCitizens;
            await DbContext.SaveChangesAsync();
        }

        public async Task MarkSeenAsync(int preTownId)
        {
            var me = await EnsureMemberAsync(preTownId);
            if (me.Seen)
            {
                return;
            }
            me.Seen = true;
            await DbContext.SaveChangesAsync();
        }

        private static string ValidateAlias(string? alias)
        {
            var trimmed = alias?.Trim();
            if (string.IsNullOrEmpty(trimmed) || trimmed.Length > MaxAliasLength)
            {
                throw new MhoBadRequestException($"L'alias doit contenir de 1 à {MaxAliasLength} caractères.");
            }
            return trimmed;
        }

        private async Task<PreTownMember> EnsureMemberAsync(int preTownId)
        {
            var userId = UserInfoProvider.UserId;
            return await DbContext.PreTownMembers.SingleOrDefaultAsync(m => m.IdPreTown == preTownId && m.IdUser == userId)
                ?? throw new MhoForbiddenException("Vous n'êtes pas membre de cette pré-ville.");
        }

        private async Task EnsureOrganizerAsync(int preTownId)
        {
            var me = await EnsureMemberAsync(preTownId);
            if (!me.IsOrganizer)
            {
                throw new MhoForbiddenException("Réservé aux organisateurs de la pré-ville.");
            }
        }

        private async Task EnsureAnotherOrganizerAsync(int preTownId, int excludedUserId)
        {
            if (!await DbContext.PreTownMembers.AnyAsync(m => m.IdPreTown == preTownId && m.IsOrganizer && m.IdUser != excludedUserId))
            {
                throw new MhoBadRequestException("Une pré-ville doit garder au moins un organisateur.");
            }
        }
    }
}
