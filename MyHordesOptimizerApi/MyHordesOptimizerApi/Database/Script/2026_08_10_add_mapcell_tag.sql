-- ============================================================
-- Migration : mapcell-tag
-- Description : Référence du marqueur posé sur une case (ZoneTag::getRef()
--               côté MyHordes), demandée dans fields= depuis toujours mais
--               jamais persistée. ABSENT côté MyHordes quand la case n'a
--               pas de marqueur, ou que celui-ci vaut TagNone.
-- ============================================================

ALTER TABLE MapCell
    ADD COLUMN IF NOT EXISTS tag INT NULL;
