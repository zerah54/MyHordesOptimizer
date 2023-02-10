ALTER TABLE MapCell ADD COLUMN note TEXT NULL;

ALTER VIEW MapCellComplet AS 
SELECT mc.idCell
	   ,t.idTown
       ,mc.idLastUpdateInfo
       ,mc.x
       ,mc.y
       ,mc.isVisitedToday
	   ,mc.isNeverVisited
       ,mc.dangerLevel
       ,mc.idRuin
       ,mc.isDryed
       ,mc.nbZombie
       ,mc.nbZombieKilled
       ,mc.nbHero
       ,mc.isRuinCamped
       ,mc.isRuinDryed
       ,mc.nbRuinDig
       ,mc.averagePotentialRemainingDig
       ,mc.maxPotentialRemainingDig
	   ,mc.isTown
       ,mc.note
       ,lui.dateUpdate AS LastUpdateDateUpdate
       ,u.idUser AS LastUpdateInfoUserId
       ,u.name AS LastUpdateInfoUserName
       ,t.x AS TownX
       ,t.y AS TownY
       ,t.height AS MapHeight
       ,t.width AS MapWidth
       ,t.isChaos
       ,t.isDevasted
       ,t.isDoorOpen
       ,t.waterWell
       ,t.day
       ,citizen.name AS CitizenName
       ,citizen.idUser AS CitizenId
       ,mci.idItem AS ItemId
       ,mci.count AS ItemCount
       ,mci.isBroken AS IsItemBroken
       ,mcd.totalSucces
       ,mc.nbKm
       ,mc.nbPa
       ,mc.zoneRegen
FROM Town t
LEFT JOIN MapCell mc ON t.idTown = mc.idTown
LEFT JOIN MapCellItem mci ON mci.idCell = mc.idCell
LEFT JOIN TownCitizen tc ON tc.idTown = t.idTown AND tc.positionX = mc.x AND tc.positionY = mc.y
LEFT JOIN Users citizen ON citizen.idUser = tc.idUser
LEFT JOIN LastUpdateInfo lui ON lui.idLastUpdateInfo = mc.idLastUpdateInfo
LEFT JOIN Users u ON u.idUser = lui.idUser
LEFT JOIN (SELECT idCell, SUM(nbSucces) AS totalSucces FROM MapCellDig GROUP BY idCell) mcd ON mcd.idCell = mc.idCell;