-- ----------------------------------------------------------------------------
-- 2026_11_02 — Identité des villes : rapport de divergences (point de contrôle G1)
--
-- Lecture seule : que des SELECT. À lancer après la capture, sur mho comme sur MHO_BETA.
-- Correspondance Town.phase : 0 = alpha, 1 = beta, 2 = import, 3 = native (enum TownPhase, MapTownPhase).
-- Comparaison : Town.idTown = TownRankingSnapshot.rankingId, lignes isAbsent = 0, en <=> (NULL ne masque rien),
-- nom et langue comparés en binaire sans padding (espaces finales incluses) (l'instantané est en utf8mb3, Town en utf8mb4).
-- Les témoins (suspectClass = 'T') sont isolés dans la section 7.
-- ----------------------------------------------------------------------------


-- 1. Volumes de l'instantané par classe et isAbsent. Attendu : isAbsent = 0 partout.
SELECT 'volumes_par_classe' AS controle, suspectClass, isAbsent, COUNT(*) AS nb
FROM TownRankingSnapshot
GROUP BY suspectClass, isAbsent
ORDER BY suspectClass, isAbsent;

-- 1b. Villes demandées et non renvoyées par MyHordes (aperçu de 20). Attendu : aucune ligne.
SELECT 'villes_absentes_apercu' AS controle,
       s.rankingId,
       s.suspectClass,
       s.capturedAt,
       t.phase                  AS base_phase,
       t.season                 AS base_season,
       t.mapId                  AS base_mapId,
       t.name                   AS base_name
FROM TownRankingSnapshot s
         LEFT JOIN Town t ON t.idTown = s.rankingId
WHERE s.isAbsent = 1
ORDER BY s.suspectClass, s.rankingId LIMIT 20;

-- 1c. Lignes de l'instantané sans ligne Town du même id, par classe. Attendu : 0 hors ALPHA (la vraie ville alpha peut ne pas exister).
SELECT 'instantane_sans_ville_en_base' AS controle, s.suspectClass, COUNT(*) AS nb
FROM TownRankingSnapshot s
         LEFT JOIN Town t ON t.idTown = s.rankingId
WHERE s.isAbsent = 0
  AND t.idTown IS NULL
GROUP BY s.suspectClass
ORDER BY s.suspectClass;


-- 2. Cohérence interne de Town. Attendu : nb = 0 sur les cinq lignes.
SELECT 'coherence_town' AS controle, 'phase_null' AS verification, COUNT(*) AS nb
FROM Town
WHERE phase IS NULL
UNION ALL
SELECT 'coherence_town', 'mapId_null_ou_non_positif', COUNT(*)
FROM Town
WHERE mapId IS NULL
   OR mapId <= 0
UNION ALL
SELECT 'coherence_town', 'provisoire_mapId_different_de_moins_idTown', COUNT(*)
FROM Town
WHERE idTown < 0
  AND NOT (mapId <=> -idTown)
UNION ALL
-- plage alpha : mapId 1 à 933 (borne de la classe A'), voir le rapport
SELECT 'coherence_town', 'alpha_hors_saison_0_ou_plage_alpha', COUNT(*)
FROM Town
WHERE phase = 0
  AND (NOT (season <=> 0) OR mapId IS NULL OR mapId NOT BETWEEN 1 AND 933)
UNION ALL
SELECT 'coherence_town', 'beta_hors_saison_15', COUNT(*)
FROM Town
WHERE phase = 1
  AND NOT (season <=> 15);


-- 3. Divergences d'identité Town / instantané par classe, hors témoins. Attendu : 0 hors ALPHA et C (écrasées, divergence voulue).
SELECT 'divergences_identite_par_classe' AS controle,
       d.suspectClass,
       COUNT(*)                          AS comparees,
       SUM(d.dPhase)                     AS phase,
       SUM(d.dSeason)                    AS season,
       SUM(d.dLanguage) AS language,
       SUM(d.dName) AS name, SUM(d.dMapId) AS mapId,
       SUM(d.dPhase OR d.dSeason OR d.dLanguage OR d.dName OR d.dMapId) AS au_moins_une
FROM (
    SELECT s.suspectClass, NOT (LOWER (s.phaseLabel) <=> CASE t.phase WHEN 0 THEN 'alpha' WHEN 1 THEN 'beta' WHEN 2 THEN 'import' WHEN 3 THEN 'native' END) AS dPhase, NOT (s.season <=> t.season) AS dSeason, NOT (CONVERT (s.language USING utf8mb4) COLLATE utf8mb4_nopad_bin <=> CONVERT (t.language USING utf8mb4) COLLATE utf8mb4_nopad_bin) AS dLanguage, NOT (CONVERT (s.name USING utf8mb4) COLLATE utf8mb4_nopad_bin <=> CONVERT (t.name USING utf8mb4) COLLATE utf8mb4_nopad_bin) AS dName, NOT (s.mapId <=> t.mapId) AS dMapId
    FROM TownRankingSnapshot s
    JOIN Town t ON t.idTown = s.rankingId
    WHERE s.isAbsent = 0 AND s.suspectClass <> 'T'
    ) d
GROUP BY d.suspectClass
ORDER BY d.suspectClass;


-- 4. Jour plus élevé dans le jeu que chez nous, par classe, hors témoins. Pas une divergence d'identité (import d'âme, TwinoidHandler.php:130).
SELECT 'ecart_day_par_classe'               AS controle,
       s.suspectClass,
       COUNT(*)                             AS comparees,
       SUM(s.day > t.day)                   AS day_plus_eleve_dans_le_jeu,
       SUM(s.day < t.day)                   AS day_plus_eleve_chez_nous,
       SUM(s.day IS NULL XOR t.day IS NULL) AS day_null_d_un_cote
FROM TownRankingSnapshot s
         JOIN Town t ON t.idTown = s.rankingId
WHERE s.isAbsent = 0
  AND s.suspectClass <> 'T'
GROUP BY s.suspectClass
ORDER BY s.suspectClass;


-- 5. Joueurs de TownCitizen absents de l'instantané de leur ville, par classe, hors témoins, avec preuve sur une autre ville.
-- Autre ville candidate = même mapId (ligne Town ou ligne d'instantané) : c'est le sens d'« homonyme », la numérotation Twinoid étant par langue.
-- Preuve = instantané des classes D, B, N19, ALPHA, E seulement, ou citoyen ou cadavre en base.
-- sur_une_autre : déplacé ; aucune_preuve et sur_plusieurs : quarantaine.
WITH tgt AS (SELECT s.rankingId, s.suspectClass, s.mapId
             FROM TownRankingSnapshot s
             WHERE s.isAbsent = 0
               AND s.suspectClass <> 'T'),
     miss AS (SELECT g.rankingId, g.suspectClass, g.mapId, c.idUser
              FROM tgt g
                       JOIN TownCitizen c ON c.idTown = g.rankingId
                       LEFT JOIN TownRankingSnapshotCitizen sc ON sc.rankingId = g.rankingId AND sc.idUser = c.idUser
              WHERE sc.idUser IS NULL),
     proof AS (SELECT m.rankingId, m.idUser, y.idTown AS idY
               FROM miss m
                        JOIN Town y ON y.mapId = m.mapId AND y.idTown <> m.rankingId
               WHERE EXISTS (SELECT 1
                             FROM TownRankingSnapshotCitizen p
                                      JOIN TownRankingSnapshot ps ON ps.rankingId = p.rankingId AND
                                                                     ps.suspectClass IN ('D', 'B', 'N19', 'ALPHA', 'E')
                             WHERE p.rankingId = y.idTown
                               AND p.idUser = m.idUser)
                  OR EXISTS (SELECT 1 FROM TownCitizen p WHERE p.idTown = y.idTown AND p.idUser = m.idUser)
                  OR EXISTS (SELECT 1 FROM TownCadaver p WHERE p.idTown = y.idTown AND p.idUser = m.idUser)
               UNION
               SELECT m.rankingId, m.idUser, y.rankingId
               FROM miss m
                        JOIN TownRankingSnapshot y
                             ON y.mapId = m.mapId AND y.isAbsent = 0 AND y.rankingId <> m.rankingId
                                 AND y.suspectClass IN ('D', 'B', 'N19', 'ALPHA', 'E')
               WHERE EXISTS (SELECT 1
                             FROM TownRankingSnapshotCitizen p
                             WHERE p.rankingId = y.rankingId AND p.idUser = m.idUser)
                  OR EXISTS (SELECT 1 FROM TownCitizen p WHERE p.idTown = y.rankingId AND p.idUser = m.idUser)
                  OR EXISTS (SELECT 1 FROM TownCadaver p WHERE p.idTown = y.rankingId AND p.idUser = m.idUser)),
     pc AS (SELECT rankingId, idUser, COUNT(*) AS nb FROM proof GROUP BY rankingId, idUser)
SELECT 'citoyens_absents_par_classe' AS controle,
       m.suspectClass,
       COUNT(*)                      AS absents_de_l_instantane,
       SUM(pc.nb IS NULL)            AS aucune_preuve_ailleurs,
       SUM(pc.nb = 1)                AS prouves_sur_une_autre_ville,
       SUM(pc.nb > 1)                AS prouves_sur_plusieurs
FROM miss m
         LEFT JOIN pc ON pc.rankingId = m.rankingId AND pc.idUser = m.idUser
GROUP BY m.suspectClass
ORDER BY m.suspectClass;


-- 5b. Idem pour TownCadaver. Mêmes colonnes et même lecture que 5.
WITH tgt AS (SELECT s.rankingId, s.suspectClass, s.mapId
             FROM TownRankingSnapshot s
             WHERE s.isAbsent = 0
               AND s.suspectClass <> 'T'),
     miss AS (SELECT g.rankingId, g.suspectClass, g.mapId, c.idUser
              FROM tgt g
                       JOIN TownCadaver c ON c.idTown = g.rankingId
                       LEFT JOIN TownRankingSnapshotCitizen sc ON sc.rankingId = g.rankingId AND sc.idUser = c.idUser
              WHERE sc.idUser IS NULL),
     proof AS (SELECT m.rankingId, m.idUser, y.idTown AS idY
               FROM miss m
                        JOIN Town y ON y.mapId = m.mapId AND y.idTown <> m.rankingId
               WHERE EXISTS (SELECT 1
                             FROM TownRankingSnapshotCitizen p
                                      JOIN TownRankingSnapshot ps ON ps.rankingId = p.rankingId AND
                                                                     ps.suspectClass IN ('D', 'B', 'N19', 'ALPHA', 'E')
                             WHERE p.rankingId = y.idTown
                               AND p.idUser = m.idUser)
                  OR EXISTS (SELECT 1 FROM TownCitizen p WHERE p.idTown = y.idTown AND p.idUser = m.idUser)
                  OR EXISTS (SELECT 1 FROM TownCadaver p WHERE p.idTown = y.idTown AND p.idUser = m.idUser)
               UNION
               SELECT m.rankingId, m.idUser, y.rankingId
               FROM miss m
                        JOIN TownRankingSnapshot y
                             ON y.mapId = m.mapId AND y.isAbsent = 0 AND y.rankingId <> m.rankingId
                                 AND y.suspectClass IN ('D', 'B', 'N19', 'ALPHA', 'E')
               WHERE EXISTS (SELECT 1
                             FROM TownRankingSnapshotCitizen p
                             WHERE p.rankingId = y.rankingId AND p.idUser = m.idUser)
                  OR EXISTS (SELECT 1 FROM TownCitizen p WHERE p.idTown = y.rankingId AND p.idUser = m.idUser)
                  OR EXISTS (SELECT 1 FROM TownCadaver p WHERE p.idTown = y.rankingId AND p.idUser = m.idUser)),
     pc AS (SELECT rankingId, idUser, COUNT(*) AS nb FROM proof GROUP BY rankingId, idUser)
SELECT 'cadavres_absents_par_classe' AS controle,
       m.suspectClass,
       COUNT(*)                      AS absents_de_l_instantane,
       SUM(pc.nb IS NULL)            AS aucune_preuve_ailleurs,
       SUM(pc.nb = 1)                AS prouves_sur_une_autre_ville,
       SUM(pc.nb > 1)                AS prouves_sur_plusieurs
FROM miss m
         LEFT JOIN pc ON pc.rankingId = m.rankingId AND pc.idUser = m.idUser
GROUP BY m.suspectClass
ORDER BY m.suspectClass;


-- 6. Lignes IMPORT (phase 2) portant des données de ville vivante, par table (colonne « ville vivante » de la tâche 12). Attendu : 0 ; connus : 4 banques.
SELECT 'import_avec_donnees_vivantes' AS controle,
       'MapCell'                      AS tbl,
       COUNT(*)                       AS villes_import,
       MIN(t.idTown)                  AS exemple_idTown
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM MapCell x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'MapCellDigUpdate', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM MapCellDigUpdate x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'MapRoute', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM MapRoute x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'MapRouteGame', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM MapRouteGame x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'Expedition', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM Expedition x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'TownBankItem', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM TownBankItem x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'TownEstimation', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM TownEstimation x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'TownWishListItem', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM TownWishListItem x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'TownCitizenDailyAction', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM TownCitizenDailyAction x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'TownBuilding', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM TownBuilding x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'TownBuildingPlan', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM TownBuildingPlan x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'TownBuildingPlanSettings', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM TownBuildingPlanSettings x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'TownDefense', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM TownDefense x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'TownAttackSetting', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM TownAttackSetting x WHERE x.idTown = t.idTown)
UNION ALL
SELECT 'import_avec_donnees_vivantes', 'TownAttackRefinement', COUNT(*), MIN(t.idTown)
FROM Town t
WHERE t.phase = 2
  AND EXISTS (SELECT 1 FROM TownAttackRefinement x WHERE x.idTown = t.idTown);


-- 7. TÉMOINS (suspectClass = 'T'). Divergences d'identité, volume : toute valeur > 0 arrête le chantier.
SELECT 'temoins_divergences_identite' AS controle,
       COUNT(*)                       AS comparees,
       COALESCE(SUM(d.dPhase), 0)     AS phase,
       COALESCE(SUM(d.dSeason), 0)    AS season,
       COALESCE(SUM(d.dLanguage), 0) AS language, COALESCE(SUM(d.dName), 0) AS name,
       COALESCE(SUM(d.dMapId), 0) AS mapId,
       COALESCE(SUM(d.dPhase OR d.dSeason OR d.dLanguage OR d.dName OR d.dMapId), 0) AS au_moins_une
FROM (
    SELECT NOT (LOWER (s.phaseLabel) <=> CASE t.phase WHEN 0 THEN 'alpha' WHEN 1 THEN 'beta' WHEN 2 THEN 'import' WHEN 3 THEN 'native' END) AS dPhase, NOT (s.season <=> t.season) AS dSeason, NOT (CONVERT (s.language USING utf8mb4) COLLATE utf8mb4_nopad_bin <=> CONVERT (t.language USING utf8mb4) COLLATE utf8mb4_nopad_bin) AS dLanguage, NOT (CONVERT (s.name USING utf8mb4) COLLATE utf8mb4_nopad_bin <=> CONVERT (t.name USING utf8mb4) COLLATE utf8mb4_nopad_bin) AS dName, NOT (s.mapId <=> t.mapId) AS dMapId
    FROM TownRankingSnapshot s
    JOIN Town t ON t.idTown = s.rankingId
    WHERE s.isAbsent = 0 AND s.suspectClass = 'T'
    ) d;

-- 7b. Témoins : aperçu de 20 divergences d'identité, valeurs des deux côtés. Attendu : aucune ligne.
SELECT 'temoins_divergences_identite_apercu' AS controle,
       s.rankingId,
       s.phaseLabel                          AS jeu_phase,
       t.phase                               AS base_phase,
       s.season                              AS jeu_season,
       t.season                              AS base_season,
       s.language                            AS jeu_language,
       t.language                            AS base_language,
       s.name                                AS jeu_name,
       t.name                                AS base_name,
       s.mapId                               AS jeu_mapId,
       t.mapId                               AS base_mapId
FROM TownRankingSnapshot s
         JOIN Town t ON t.idTown = s.rankingId
WHERE s.isAbsent = 0
  AND s.suspectClass = 'T'
  AND (
    NOT (LOWER(s.phaseLabel) <=> CASE t.phase WHEN 0 THEN 'alpha' WHEN 1 THEN 'beta' WHEN 2 THEN 'import' WHEN 3 THEN 'native' END)
        OR NOT (s.season <=> t.season)
        OR
    NOT (CONVERT(s.language USING utf8mb4) COLLATE utf8mb4_nopad_bin <=> CONVERT(t.language USING utf8mb4) COLLATE utf8mb4_nopad_bin)
        OR
    NOT (CONVERT(s.name USING utf8mb4) COLLATE utf8mb4_nopad_bin <=> CONVERT(t.name USING utf8mb4) COLLATE utf8mb4_nopad_bin)
        OR NOT (s.mapId <=> t.mapId))
ORDER BY s.rankingId LIMIT 20;

-- 7c. Témoins : autres écarts, présentés sans arrêt automatique (jour, score, joueurs absents de l'instantané, villes sans ligne Town).
SELECT 'temoins_autres_ecarts'                                                              AS controle,
       (SELECT COUNT(*) FROM TownRankingSnapshot WHERE suspectClass = 'T' AND isAbsent = 0) AS temoins_captures,
       (SELECT COUNT(*) FROM TownRankingSnapshot WHERE suspectClass = 'T' AND isAbsent = 1) AS temoins_absents,
       (SELECT COUNT(*)
        FROM TownRankingSnapshot s
                 LEFT JOIN Town t ON t.idTown = s.rankingId
        WHERE s.suspectClass = 'T'
          AND s.isAbsent = 0
          AND t.idTown IS NULL)                                                             AS sans_ligne_town,
       (SELECT COUNT(*)
        FROM TownRankingSnapshot s
                 JOIN Town t ON t.idTown = s.rankingId
        WHERE s.suspectClass = 'T'
          AND s.isAbsent = 0
          AND s.day > t.day)                                                                AS day_plus_eleve_dans_le_jeu,
       (SELECT COUNT(*)
        FROM TownRankingSnapshot s
                 JOIN Town t ON t.idTown = s.rankingId
        WHERE s.suspectClass = 'T'
          AND s.isAbsent = 0
          AND s.day < t.day)                                                                AS day_plus_eleve_chez_nous,
       (SELECT COUNT(*)
        FROM TownRankingSnapshot s
                 JOIN Town t ON t.idTown = s.rankingId
        WHERE s.suspectClass = 'T'
          AND s.isAbsent = 0
          AND NOT (s.score <=> t.score))                                                    AS score_different,
       (SELECT COUNT(*)
        FROM TownRankingSnapshot s
                 JOIN TownCitizen c ON c.idTown = s.rankingId
                 LEFT JOIN TownRankingSnapshotCitizen sc ON sc.rankingId = s.rankingId AND sc.idUser = c.idUser
        WHERE s.suspectClass = 'T'
          AND s.isAbsent = 0
          AND sc.idUser IS NULL)                                                            AS citoyens_absents_de_l_instantane,
       (SELECT COUNT(*)
        FROM TownRankingSnapshot s
                 JOIN TownCadaver c ON c.idTown = s.rankingId
                 LEFT JOIN TownRankingSnapshotCitizen sc ON sc.rankingId = s.rankingId AND sc.idUser = c.idUser
        WHERE s.suspectClass = 'T'
          AND s.isAbsent = 0
          AND sc.idUser IS NULL)                                                            AS cadavres_absents_de_l_instantane;


-- 8. Classe E (doublons natifs côté stable, même sélection que TownSnapshotService) par saison et phase de la ligne -mapId. Mesuré à 26 le 2026-11-02, dont 2 en IMPORT.
SELECT 'classe_E_par_saison_et_phase_provisoire'                                                         AS controle,
       t.season                                                                                          AS saison_stable,
       CASE p.phase
           WHEN 0 THEN 'alpha'
           WHEN 1 THEN 'beta'
           WHEN 2 THEN 'import'
           WHEN 3
               THEN 'native' END                                                                         AS phase_provisoire,
       COUNT(*)                                                                                          AS nb
FROM Town t
         JOIN Town p ON p.idTown = -t.mapId
WHERE t.phase = 3
  AND t.idTown > 0
GROUP BY t.season, p.phase
ORDER BY t.season, p.phase;
