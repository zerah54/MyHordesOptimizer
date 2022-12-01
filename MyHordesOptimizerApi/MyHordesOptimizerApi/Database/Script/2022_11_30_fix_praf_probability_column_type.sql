ALTER TABLE `Item` 
CHANGE COLUMN `dropRate_praf` `dropRate_praf` FLOAT NULL DEFAULT NULL ,
CHANGE COLUMN `dropRate_notPraf` `dropRate_notPraf` FLOAT NULL DEFAULT NULL ;

ALTER VIEW ItemComplet 
AS SELECT item.idItem AS idItem
      ,item.idCategory AS idCategory
      ,item.uid AS itemUid
      ,item.deco AS itemDeco
      ,item.label_fr AS itemLabel_fr
      ,item.label_en AS itemLabel_en
      ,item.label_es AS itemLabel_es
      ,item.label_de AS itemLabel_de
      ,item.description_fr AS itemDescription_fr
      ,item.description_en AS itemDescription_en
      ,item.description_es AS itemDescription_es
      ,item.description_de AS itemDescription_de
      ,item.guard AS itemGuard
      ,item.img AS itemImg
      ,item.isHeaver AS itemIsHeaver
	  ,item.dropRate_praf AS itemDropRate_praf
	  ,item.dropRate_notPraf AS itemDropRate_notPraf
	  ,cat.name AS catName
	  ,cat.ordering AS catOrdering
	  ,cat.label_fr AS catLabel_fr
	  ,cat.label_en AS catLabel_en
	  ,cat.label_es AS catLabel_es
	  ,cat.label_de AS catLabel_de
	  ,a.name AS actionName
	  ,p.name AS propertyName
      ,item.dropRate_praf
      ,item.dropRate_notPraf
  FROM Item item
  LEFT JOIN ItemAction ie ON ie.idItem = item.idItem
  LEFT JOIN Category cat ON cat.idCategory = item.idCategory
  LEFT JOIN Action a ON a.name = ie.actionName
  LEFT JOIN ItemProperty ip ON ip.idItem = item.idItem
  LEFT JOIN Property p ON ip.propertyName = p.name;