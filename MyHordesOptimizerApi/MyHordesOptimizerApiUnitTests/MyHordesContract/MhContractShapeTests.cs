using FluentAssertions;
using MyHordesOptimizerApi.Dtos.MyHordes;
using Newtonsoft.Json;

namespace MyHordesOptimizerApiUnitTests.MyHordesContract
{
    /// <summary>
    /// Charges écrites À LA MAIN d'après <c>JSONv1Controller.php</c>, encodant les formes que
    /// MyHordes émet réellement et que rien d'autre ne vérifie.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Ces cas sont le seul garde-fou contre les erreurs de FORME face au vrai contrat. Le test de
    /// cohérence compare des noms ; le test d'aller-retour construit sa charge depuis le DTO et ne
    /// peut donc pas contredire le DTO. Ici, la charge vient de la source PHP.
    /// </para>
    /// <para>
    /// Le piège récurrent : côté MyHordes ces branches sont des tableaux PHP associatifs remplis
    /// champ par champ. Quand aucun champ n'est renseigné, <c>json_encode</c> sérialise <c>[]</c> et
    /// non <c>{}</c>. Sans convertisseur, la désérialisation lève et emporte avec elle toute la
    /// synchronisation de la ville.
    /// </para>
    /// </remarks>
    public class MhContractShapeTests
    {
        private static T Deserialize<T>(string json) => JsonConvert.DeserializeObject<T>(json)!;

        [Fact]
        public void ZoneDetails_TableauVide_DonneNullSansLever()
        {
            // getDetailsData : z et dried réservés à la case de l'appelant, h exclu en chaos.
            // Pour la quasi-totalité des cases, aucun champ n'est renseigné.
            var zone = Deserialize<MyHordesZone>("{\"x\":5,\"y\":7,\"details\":[]}");

            zone.Details.Should().BeNull();
            zone.X.Should().Be(5);
        }

        [Fact]
        public void ZoneDetails_Objet_EstMaterialise()
        {
            var zone = Deserialize<MyHordesZone>("{\"details\":{\"z\":3,\"h\":12,\"dried\":true}}");

            zone.Details.Should().NotBeNull();
            zone.Details!.Z.Should().Be(3);
            zone.Details.H.Should().Be(12);
            zone.Details.Dried.Should().BeTrue();
        }

        [Fact]
        public void Estimations_TableauVide_DonneNullSansLever()
        {
            // getEstimationData sort par `return $data;` vide dans trois cas : pas d'estimation,
            // seuil de tour de guet non atteint, pas de nuit suivante.
            var city = Deserialize<MyHordesCity>("{\"estimations\":[],\"estimationsNext\":[]}");

            city.Estimations.Should().BeNull();
            city.EstimationsNext.Should().BeNull();
        }

        [Fact]
        public void News_TableauVide_DonneNullSansLever()
        {
            // getNewsData renvoie $data vide au jour 1, ou si la gazette ne se rend pas.
            var city = Deserialize<MyHordesCity>("{\"news\":[]}");

            city.News.Should().BeNull();
        }

        [Fact]
        public void News_EstUnObjetUnique_PasUneListe()
        {
            // Erreur commise puis corrigée pendant le chantier : getNewsData construit
            // $data[$field] = ..., donc UN objet. Une liste ne désérialiserait pas.
            var city = Deserialize<MyHordesCity>(
                "{\"news\":{\"z\":42,\"def\":150,\"water\":30,\"content\":{\"fr\":\"texte\"}}}");

            city.News.Should().NotBeNull();
            city.News!.Z.Should().Be(42);
            city.News.Def.Should().Be(150);
            city.News.Content!.Fr.Should().Be("texte");
        }

        [Fact]
        public void Upgrades_TableauVide_DonneNullSansLever()
        {
            // getUpgradesData ne remplit $data que s'il existe un bâtiment amélioré.
            var city = Deserialize<MyHordesCity>("{\"upgrades\":[]}");

            city.Upgrades.Should().BeNull();
        }

        [Fact]
        public void Rewards_TableauVide_DonneUnDictionnaireVideSansLever()
        {
            // Un citoyen sans aucun picto : MyHordes sérialise le tableau PHP vide en [].
            var citizen = Deserialize<MyHordesCitizenRankingDto>("{\"id\":1,\"rewards\":[]}");

            citizen.Rewards.Should().NotBeNull().And.BeEmpty();
        }

        [Fact]
        public void Rewards_DictionnaireIndexeParIdPicto_EstMaterialise()
        {
            var citizen = Deserialize<MyHordesCitizenRankingDto>(
                "{\"rewards\":{\"12\":{\"id\":12,\"rare\":true,\"number\":3,\"name\":{\"fr\":\"Picto\"}}}}");

            citizen.Rewards.Should().ContainKey("12");
            citizen.Rewards!["12"].Number.Should().Be(3);
            citizen.Rewards["12"].Rare.Should().BeTrue();
            citizen.Rewards["12"].Name!.Fr.Should().Be("Picto");
        }

        [Fact]
        public void RewardsDuJoueur_EstUneListe_PasUnDictionnaire()
        {
            // getRewardsData fait $data[] = ..., donc une LISTE — forme opposée à celle du champ
            // rewards d'une entrée de classement. Les deux ne doivent jamais converger.
            var user = Deserialize<MyHordesUserDetailsDto>(
                "{\"rewards\":[{\"id\":7,\"rare\":1,\"number\":2}]}");

            user.Rewards.Should().HaveCount(1);
            user.Rewards![0].Id.Should().Be(7);
            // `rare` est un ENTIER ici (intval côté MyHordes), un booléen sur l'autre branche.
            user.Rewards[0].Rare.Should().Be(1);
        }

        [Fact]
        public void ChampNonDemande_ResteNull_EtNeVautPasZero()
        {
            // Le cœur du chantier : sans nullabilité, mapId et baseDef vaudraient 0 et dead false,
            // indiscernables de vraies valeurs. C'est la projection de /json/map, qui ne demande
            // que id, name, avatar et homeMessage.
            var user = Deserialize<MyHordesUserDto>(
                "{\"id\":42,\"name\":\"Zerah\",\"avatar\":null,\"homeMessage\":\"chez moi\"}");

            user.Id.Should().Be(42);
            user.MapId.Should().BeNull();
            user.BaseDef.Should().BeNull();
            user.Dead.Should().BeNull();
            user.Ban.Should().BeNull();
            user.X.Should().BeNull();
        }

        [Fact]
        public void PlayedMaps_SansSurvivalNiDtype_LesLaisseNuls()
        {
            // playedMaps.fields(...) ne demande ni survival ni dtype, alors que le type est partagé
            // avec map.cadavers qui, lui, les demande.
            var played = Deserialize<MyHordesCitizenRankingDto>(
                "{\"mapId\":1234,\"mapName\":\"Ville\",\"season\":18,\"score\":900,\"day\":21}");

            played.MapId.Should().Be(1234);
            played.Day.Should().Be(21);
            played.Survival.Should().BeNull();
            played.Dtype.Should().BeNull();
        }

        [Fact]
        public void ScoreNul_EstAccepte()
        {
            // getCadaversInformation : $citizen->getTown()?->getScore() peut valoir null.
            var citizen = Deserialize<MyHordesCitizenRankingDto>("{\"id\":1,\"score\":null}");

            citizen.Score.Should().BeNull();
        }

        [Fact]
        public void AvatarFalse_EstLuCommeUneAbsence()
        {
            // `getCadaversInformation` renvoie `getSource(200) ?: false` : un booléen JSON quand le
            // joueur n'a pas d'avatar. Sans conversion, Newtonsoft en faisait la chaîne "false",
            // que les chemins d'écriture stockaient telle quelle puisqu'elle n'est pas vide — et
            // le site tentait ensuite de la charger comme une URL.
            //
            // Ce test attendait justement "false" pour figer le défaut jusqu'au chantier G. Il a
            // servi de sentinelle et échoué au bon moment ; il documente désormais la correction.
            var citizen = Deserialize<MyHordesCitizenRankingDto>("{\"id\":1,\"avatar\":false}");

            citizen.Avatar.Should().BeNull();
        }

        [Fact]
        public void DefenseBonus_EstUnFlottant_PasUnEntier()
        {
            // Bug introduit puis corrigé pendant le chantier, détecté par un appel réel :
            // getDefenseData renvoie `1 - $def->overall_scale`, donc une fraction négative.
            // Typé en int?, Newtonsoft levait « Input string '-0.1299999999999999' is not a valid
            // integer » et l'authentification entière retournait 500.
            var defense = Deserialize<MyHordesDefense>(
                "{\"total\":1200,\"itemsMul\":1.2,\"bonus\":-0.1299999999999999}");

            defense.Bonus.Should().BeApproximately(-0.13, 0.001);
            defense.Total.Should().Be(1200);
        }

        [Fact]
        public void ParentZero_SignifieAbsenceDeParent()
        {
            // getBuildingPrototypeData renvoie 0 et non null quand il n'y a pas de parent.
            var building = Deserialize<MyHordesBuildingDto>("{\"id\":5,\"parent\":0}");

            building.Parent.Should().Be(0);
        }

        [Fact]
        public void ExpeditionPoints_SontDeuxTableauxParalleles()
        {
            // getPointsExpedition renvoie {x: [...], y: [...]} et NON une liste de points.
            var expedition = Deserialize<MyHordesExpeditionDto>(
                "{\"name\":\"Sortie\",\"length\":3,\"points\":{\"x\":[10,11,12],\"y\":[20,21,22]}}");

            expedition.Points!.X.Should().Equal(10, 11, 12);
            expedition.Points.Y.Should().Equal(20, 21, 22);
        }

        [Fact]
        public void ExpeditionAuteur_PorteToujoursSesTroisChamps()
        {
            // getAuthorInformation ignore les sous-champs demandés et renvoie toujours id, name,
            // avatar — alors que MHO n'écrit que author.fields(id).
            var expedition = Deserialize<MyHordesExpeditionDto>(
                "{\"author\":{\"id\":9,\"name\":\"Auteur\",\"avatar\":false}}");

            expedition.Author!.Id.Should().Be(9);
            expedition.Author.Name.Should().Be("Auteur");
        }

        [Fact]
        public void BanqueEtSolPartagentLeTypeObjet()
        {
            // getBankData et zones.items passent par getArrayItem → getItemData : même entité que
            // le référentiel /json/items, avec count et broken en plus.
            var city = Deserialize<MyHordesCity>(
                "{\"bank\":[{\"id\":3,\"uid\":\"food_bag_#00\",\"count\":12,\"broken\":false}]}");

            city.Bank.Should().HaveCount(1);
            city.Bank![0].Count.Should().Be(12);
            city.Bank[0].Broken.Should().BeFalse();
            city.Bank[0].Uid.Should().Be("food_bag_#00");
        }
    }
}
