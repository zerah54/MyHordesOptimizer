-- ============================================================================
-- Chantier « Pandémonium » — coûts par palier de lecture de plan + disponibilité par mode
-- (2026-08-06)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Building
--
-- hasHardMode : vrai si ce chantier a un jeu de ressources Pandémonium distinct (71/166 mesuré
-- le 2026-08-05). tier0Ap/tier1Ap/tier2Ap : coût en PA aux paliers 0/1/2 plans lus — NULL quand
-- hasHardMode est faux. Les ressources des paliers vivent dans BuildingRessource (resourceTier),
-- pas ici : tier2 partage les ressources de tier1, seul le PA change à la 2e lecture.
-- ---------------------------------------------------------------------------
ALTER TABLE Building
    ADD COLUMN hasHardMode TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN tier0Ap     INT(11)    NULL DEFAULT NULL,
    ADD COLUMN tier1Ap     INT(11)    NULL DEFAULT NULL,
    ADD COLUMN tier2Ap     INT(11)    NULL DEFAULT NULL,
    ADD COLUMN hardBlueprintLevel INT(11) NULL DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- BuildingRessources
--
-- resourceTier : 0 = jeu Default (existant, alimenté par le live /json/buildings, INCHANGÉ),
-- 1 = jeu Hard (0 plan lu), 2 = jeu Easy (1 OU 2 plans lus — mêmes ressources, seul le PA
-- diffère entre ces deux paliers).
--
-- SCINDÉ EN DEUX INSTRUCTIONS : MySQL refuse de DROP et ADD une contrainte du même nom dans le
-- même ALTER TABLE (errno 121 « Duplicate key on write or update »), même quand le DROP précède
-- le ADD dans le texte. Les FK doivent donc être retirées, la clé primaire recomposée, PUIS les FK
-- recréées dans une instruction séparée.
-- ---------------------------------------------------------------------------
ALTER TABLE BuildingRessources
DROP
FOREIGN KEY BuildingRessources_ibfk_1,
    DROP
FOREIGN KEY BuildingRessources_ibfk_2,
    DROP
PRIMARY KEY,
    ADD COLUMN resourceTier TINYINT NOT NULL DEFAULT 0,
    ADD PRIMARY KEY (idBuilding, idItem, resourceTier);

ALTER TABLE BuildingRessources
    ADD CONSTRAINT BuildingRessources_ibfk_1 FOREIGN KEY (idBuilding) REFERENCES Building (idBuilding),
    ADD CONSTRAINT BuildingRessources_ibfk_2 FOREIGN KEY (idItem) REFERENCES Item (idItem);

-- ---------------------------------------------------------------------------
-- BuildingAvailability
--
-- Disponibilité d'un chantier selon le type de ville (townType réutilise l'enum TownType déjà
-- utilisé par Town.TownTypeId : 0=RNE, 1=PANDE, 2=RE, 3=CUSTOM — ordre de déclaration C#).
-- L'ABSENCE de ligne pour un couple (chantier, townType) signifie « disponible normalement » :
-- pas de statut par défaut à écrire pour les 166 x 4 combinaisons.
-- status : 0=Initial, 1=Unlocked, 2=Disabled (ordre de déclaration de l'enum C#).
-- ---------------------------------------------------------------------------
CREATE TABLE BuildingAvailability
(
    idBuilding INT(11) NOT NULL,
    townType   INT     NOT NULL,
    status     TINYINT NOT NULL,
    PRIMARY KEY (idBuilding, townType),
    CONSTRAINT BuildingAvailability_ibfk_1 FOREIGN KEY (idBuilding) REFERENCES Building (idBuilding)
);
