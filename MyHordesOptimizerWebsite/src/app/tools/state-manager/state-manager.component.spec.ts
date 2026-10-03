import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import type { MockedObject } from 'vitest';

import { ApiService } from '../../_abstract_model/services/api.service';
import { CitizenDayStateService } from '../../_abstract_model/services/citizen-day-state.service';
import { CitizenState } from '../../_abstract_model/types/citizen-state.class';
import { CitizenStateStepResult, CitizenStateTrace } from '../../_abstract_model/types/citizen-state-trace.class';
import { Item } from '../../_abstract_model/types/item.class';
import { RankedOrder } from '../../_abstract_model/types/ranked-order.class';
import { StateManagerComponent } from './state-manager.component';

function buildItem(id: number, uid: string): Item {
    const item: Item = new Item();
    item.id = id;
    item.uid = uid;
    item.img = 'item/item_test.gif';
    item.label = { fr: 'Objet ' + id, en: 'Item ' + id };
    return item;
}

describe('StateManagerComponent', (): void => {
    let fixture: ComponentFixture<StateManagerComponent>;
    let component: StateManagerComponent;
    let state_service: MockedObject<CitizenDayStateService>;

    beforeEach((): void => {
        state_service = {
            simulate: vi.fn().mockName('CitizenDayStateService.simulate'),
            getItemsWithStateImpact: vi.fn().mockName('CitizenDayStateService.getItemsWithStateImpact'),
            rankOrders: vi.fn().mockName('CitizenDayStateService.rankOrders')
        } as unknown as MockedObject<CitizenDayStateService>;
        state_service.simulate.mockReturnValue(of(new CitizenStateTrace({
            startingState: { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [] },
            steps: []
        })));
        state_service.getItemsWithStateImpact.mockReturnValue(of<string[]>([]));
        state_service.rankOrders.mockReturnValue(of<RankedOrder[]>([]));

        TestBed.configureTestingModule({
            imports: [StateManagerComponent],
            providers: [
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                { provide: CitizenDayStateService, useValue: state_service }
            ]
        });

        vi.spyOn(TestBed.inject(ApiService), 'getItems').mockReturnValue(of<Item[]>([]));

        fixture = TestBed.createComponent(StateManagerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        // ngOnInit appelle compute() (calcul du PDC de départ) : on repart d'un compteur à zéro pour chaque test.
        state_service.simulate.mockClear();
        state_service.rankOrders.mockClear();
    });

    it('addMoveStep ajoute une étape et déclenche aussitôt le calcul (pas de bouton "Simuler")', (): void => {
        component['addMoveStep'](true);

        expect(component['steps'].length).toBe(1);
        expect(component['steps'][0].step.type).toBe('move');
        expect(component['steps'][0].step.is_near_zone).toBe(true);
        expect(state_service.simulate).toHaveBeenCalledTimes(1);
    });

    it('removeStep retire l\'étape à l\'index donné et déclenche aussitôt le calcul', (): void => {
        component['addMoveStep'](true);
        component['addMoveStep'](false);
        state_service.simulate.mockClear();

        component['removeStep'](0);

        expect(component['steps'].length).toBe(1);
        expect(component['steps'][0].step.is_near_zone).toBe(false);
        expect(state_service.simulate).toHaveBeenCalledTimes(1);
    });

    it('compute construit les lignes de résultat en réappariant par index avec la séquence locale', (): void => {
        const result: CitizenStateStepResult = new CitizenStateStepResult({
            description: 'Déplacement (zone proche)',
            stateAfter: { ap: 5, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 1, isDead: false, statuses: [] }
        });
        state_service.simulate.mockReturnValue(of(new CitizenStateTrace({
            startingState: { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [] },
            steps: [result.modelToDto()]
        })));

        component['addMoveStep'](true);

        expect(component['rows']().length).toBe(1);
        expect(component['rows']()[0].state.ap).toBe(5);
    });

    it('compute appelle simulate même sans étape, pour calculer le PDC de départ, et vide la trace', (): void => {
        component['rows'].set(<never>[{ label: 'x', state: {} }]);

        component['compute']();

        expect(component['rows']().length).toBe(0);
        expect(state_service.simulate).toHaveBeenCalledTimes(1);
        expect(vi.mocked(state_service.simulate).mock.lastCall![1]).toEqual([]);
    });

    it('compute calcule un pdc de départ non nul (serveur), reflété par currentState avant toute étape', (): void => {
        state_service.simulate.mockReturnValue(of(new CitizenStateTrace({
            startingState: { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [], pdc: 4 },
            steps: []
        })));

        component['compute'](); // même appel que celui fait par ngOnInit au chargement

        expect(component['currentState']().pdc).toBe(4);
    });

    it('addToBag ajoute l\'item correspondant à l\'id dans starting_bag', (): void => {
        const item: Item = buildItem(1, 'water_#00');
        component['items'] = [item];

        component['addToBag'](1);

        expect(component['starting_bag']).toEqual([item]);
    });

    it('removeFromBag retire une seule occurrence', (): void => {
        const item: Item = buildItem(1, 'water_#00');
        component['starting_bag'] = [item, item];

        component['removeFromBag'](1);

        expect(component['starting_bag'].length).toBe(1);
    });

    it('emptyBagContent vide le sac', (): void => {
        const item: Item = buildItem(1, 'water_#00');
        component['starting_bag'] = [item, item];

        component['emptyBagContent']();

        expect(component['starting_bag'].length).toBe(0);
    });

    it('remainingBag se vide au fil des étapes et se reconstitue au retrait d\'étape', (): void => {
        const item: Item = buildItem(1, 'water_#00');
        component['starting_bag'] = [item, item];

        component['useItem'](item);
        expect(component['remainingBag']().length).toBe(1);

        component['removeStep'](0);
        expect(component['remainingBag']().length).toBe(2);
    });

    it('useItem ajoute une étape de consommation et déclenche le calcul', (): void => {
        const item: Item = buildItem(1, 'water_#00');

        component['useItem'](item);

        expect(component['steps'].length).toBe(1);
        expect(component['steps'][0].item).toBe(item);
        expect(state_service.simulate).toHaveBeenCalledTimes(1);
    });

    it('addToBag appelle rankOrders avec les ids du sac de départ', (): void => {
        const item: Item = buildItem(1, 'water_#00');
        component['items'] = [item];

        component['addToBag'](1);

        expect(state_service.rankOrders).toHaveBeenCalledTimes(1);
        expect(vi.mocked(state_service.rankOrders).mock.lastCall![1]).toEqual([1]);
    });

    it('best_order est peuplé selon le 1er candidat renvoyé par le service, doublons gérés', (): void => {
        const item1: Item = buildItem(1, 'water_#00');
        const item2: Item = buildItem(2, 'bandage_#00');
        state_service.rankOrders.mockReturnValue(of<RankedOrder[]>([
            new RankedOrder({
                order: [2, 1], tier: 'none', tierReachedAtDistance: null, totalDistance: 6, totalAp: 6, totalSp: 0,
                finalState: { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [] }
            })
        ]));
        component['items'] = [item1, item2];

        component['addToBag'](1);
        component['addToBag'](2);

        expect(component['best_order']()).toEqual([item2, item1]);
    });

    it('une réponse rankOrders tardive n\'écrase pas une réponse plus récente (switchMap)', (): void => {
        const item1: Item = buildItem(1, 'water_#00');
        const item2: Item = buildItem(2, 'bandage_#00');
        const stale$: Subject<RankedOrder[]> = new Subject<RankedOrder[]>();
        const fresh$: Subject<RankedOrder[]> = new Subject<RankedOrder[]>();
        state_service.rankOrders.mockReturnValueOnce(stale$).mockReturnValueOnce(fresh$);
        component['items'] = [item1, item2];
        const final_state = { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [] };

        component['addToBag'](1); // 1er appel réseau -> stale$
        component['addToBag'](2); // 2e appel réseau -> fresh$, doit annuler l'abonnement à stale$

        // La réponse la plus récente arrive en premier ; la réponse obsolète répond après.
        fresh$.next([new RankedOrder({ order: [2, 1], tier: 'none', tierReachedAtDistance: null, totalDistance: 6, totalAp: 6, totalSp: 0, finalState: final_state })]);
        stale$.next([new RankedOrder({ order: [1], tier: 'none', tierReachedAtDistance: null, totalDistance: 6, totalAp: 6, totalSp: 0, finalState: final_state })]);

        expect(component['best_order']()).toEqual([item2, item1]);
    });

    it('useItem consomme un objet du sac restant mais le classement reste basé sur le sac de départ complet', (): void => {
        const item: Item = buildItem(1, 'water_#00');
        state_service.rankOrders.mockReturnValue(of<RankedOrder[]>([
            new RankedOrder({
                order: [1], tier: 'none', tierReachedAtDistance: null, totalDistance: 6, totalAp: 6, totalSp: 0,
                finalState: { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [] }
            })
        ]));
        component['items'] = [item];
        component['addToBag'](1);
        state_service.rankOrders.mockClear();

        component['useItem'](item);

        expect(state_service.rankOrders).toHaveBeenCalledTimes(1);
        expect(vi.mocked(state_service.rankOrders).mock.lastCall![1]).toEqual([1]);
        expect(component['best_order']()).toEqual([item]);
    });

    it('sac vide : pas d\'appel réseau, best_order/ranked_orders restent vides', (): void => {
        state_service.rankOrders.mockClear();

        component['emptyBagContent']();

        expect(state_service.rankOrders).not.toHaveBeenCalled();
        expect(component['best_order']()).toEqual([]);
        expect(component['ranked_orders']()).toEqual([]);
    });

    it('ranked_orders résout chaque candidat en objets et conserve son état final et son tier', (): void => {
        const item1: Item = buildItem(1, 'water_#00');
        const item2: Item = buildItem(2, 'bandage_#00');
        const final_state: CitizenState = new CitizenState({
            ap: 5, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: []
        });
        state_service.rankOrders.mockReturnValue(of<RankedOrder[]>([
            new RankedOrder({
                order: [2, 1], tier: 'thirsty', tierReachedAtDistance: 11, totalDistance: 11, totalAp: 6, totalSp: 5, // clé stable renvoyée par l'API, traduite par le composant
                finalState: { ap: 5, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [] }
            })
        ]));
        component['items'] = [item1, item2];

        component['addToBag'](1);
        component['addToBag'](2);

        expect(component['ranked_orders']().length).toBe(1);
        expect(component['ranked_orders']()[0].tier).toBe('Soif');
        expect(component['ranked_orders']()[0].items).toEqual([item2, item1]);
        expect(component['ranked_orders']()[0].final_state.ap).toBe(final_state.ap);
        expect(component['ranked_orders']()[0].total_ap).toBe(6);
        expect(component['ranked_orders']()[0].total_sp).toBe(5);
    });

    it('addMountBikeStep puis addDismountBikeStep : monter à vélo redevient impossible', (): void => {
        expect(component['canMountBike']()).toBe(true);
        expect(component['canDismountBike']()).toBe(false);

        component['addMountBikeStep']();
        expect(component['canMountBike']()).toBe(false);
        expect(component['canDismountBike']()).toBe(true);

        component['addDismountBikeStep']();
        expect(component['canDismountBike']()).toBe(false);
        expect(component['canMountBike']()).toBe(false); // vélo déjà utilisé aujourd'hui, pas de remontée

        expect(component['steps'].map((entry) => entry.step.type)).toEqual(['mount_bike', 'dismount_bike']);
    });

    it('addEquipShoesStep : chausser les baskets n\'est possible qu\'une fois', (): void => {
        expect(component['canEquipShoes']()).toBe(true);

        component['addEquipShoesStep']();

        expect(component['canEquipShoes']()).toBe(false);
        expect(component['steps'][0].step.type).toBe('equip_shoes');
        expect(state_service.simulate).toHaveBeenCalledTimes(1);
    });

    it('has_bike initial à true : vélo déjà utilisé aujourd\'hui, remonter impossible après être descendu', (): void => {
        component['has_bike'] = true;

        expect(component['canMountBike']()).toBe(false);
        expect(component['canDismountBike']()).toBe(true);

        component['addDismountBikeStep']();

        expect(component['canMountBike']()).toBe(false);
        expect(component['canDismountBike']()).toBe(false);
    });

    it('buildStartingState transmet les champs PDC au service', (): void => {
        component['has_shield'] = true;
        component['has_defence_cp_item'] = true;
        component['is_guide'] = true;
        component['zone_citizen_count'] = 4;
        component['has_clean_pdc_perk'] = true;
        component['has_hydrated_pdc_perk'] = true;
        component['has_sober_pdc_perk'] = true;
        component['has_base_zone_control_perk'] = true;

        component['addMoveStep'](true);

        const sent_state = vi.mocked(state_service.simulate).mock.lastCall![0];
        expect(sent_state.has_shield).toBe(true);
        expect(sent_state.has_defence_cp_item).toBe(true);
        expect(sent_state.is_guide).toBe(true);
        expect(sent_state.zone_citizen_count).toBe(4);
        expect(sent_state.has_clean_pdc_perk).toBe(true);
        expect(sent_state.has_hydrated_pdc_perk).toBe(true);
        expect(sent_state.has_sober_pdc_perk).toBe(true);
        expect(sent_state.has_base_zone_control_perk).toBe(true);
    });

    it('buildStartingState transmet is_role_ghoul au service', (): void => {
        component['is_role_ghoul'] = true;

        component['addMoveStep'](true);

        const sent_state = vi.mocked(state_service.simulate).mock.lastCall![0];
        expect(sent_state.is_role_ghoul).toBe(true);
    });

    it('addBecomeGhoulStep : se goulifier n\'est possible qu\'une fois', (): void => {
        expect(component['canBecomeGhoul']()).toBe(true);

        component['addBecomeGhoulStep']();

        expect(component['canBecomeGhoul']()).toBe(false);
        expect(component['steps'][0].step.type).toBe('become_ghoul');
    });

    it('is_role_ghoul initial à true : se goulifier est déjà impossible', (): void => {
        component['is_role_ghoul'] = true;

        expect(component['canBecomeGhoul']()).toBe(false);
    });

    it('addSecondWindStep : n\'est possible qu\'une fois, avec le niveau sélectionné', (): void => {
        component['second_wind_level'] = 2;
        expect(component['canUseSecondWind']()).toBe(true);

        component['addSecondWindStep']();

        expect(component['canUseSecondWind']()).toBe(false);
        expect(component['steps'][0].step.type).toBe('second_wind');
        expect(component['steps'][0].step.level).toBe(2);
    });

    it('buildStartingState injecte un statut de blessure quand wounded est coché', (): void => {
        component['wounded'] = true;

        component['addMoveStep'](true);

        const sent_state = vi.mocked(state_service.simulate).mock.lastCall![0];
        expect(sent_state.statuses).toContain('wound1');
        expect(sent_state.statuses).not.toContain('tg_meta_wound'); // tag interne sans icône, redondant (Remove purge toute la famille)
    });

    it('addPickupDefenceCpItemStep ajoute l\'étape et rend le ramassage indisponible ensuite', (): void => {
        expect(component['canPickupDefenceCpItem']()).toBe(true);

        component['addPickupDefenceCpItemStep']();

        expect(component['steps'][0].step.type).toBe('pickup_defence_cp_item');
        expect(component['canPickupDefenceCpItem']()).toBe(false);
    });

    /** Fixe les PA/PE du serveur simulé : currentState() lit computed_starting_state, pas les champs bruts ap/sp. */
    function givenPoints(ap: number, sp: number): void {
        state_service.simulate.mockReturnValue(of(new CitizenStateTrace({
            startingState: { ap, sp, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [] },
            steps: []
        })));
        component['ap'] = ap;
        component['sp'] = sp;
        component['compute']();
    }

    it('canMove est faux à 0 PA/0 PE, même si le sac contient un objet (il faut le consommer d\'abord)', (): void => {
        givenPoints(0, 0);
        component['starting_bag'] = [buildItem(1, 'water_#00')];

        expect(component['canMove'](true)).toBe(false);
        expect(component['canMove'](false)).toBe(false);
    });

    it('canMove en zone proche exige des PA : les PE ne se substituent pas (DeductWithFallback plafonne les PA à 0)', (): void => {
        givenPoints(0, 2);

        expect(component['canMove'](true)).toBe(false);
        expect(component['canMove'](false)).toBe(true);
    });

    it('canMove en zone lointaine est vrai avec des PA seuls (repli sur les PA)', (): void => {
        givenPoints(1, 0);

        expect(component['canMove'](true)).toBe(true);
        expect(component['canMove'](false)).toBe(true);
    });

    it('orderedRemainingBag trie le sac restant selon best_order', (): void => {
        const item1: Item = buildItem(1, 'water_#00');
        const item2: Item = buildItem(2, 'bandage_#00');
        component['starting_bag'] = [item1, item2];
        component['best_order'].set([item2, item1]);

        expect(component['orderedRemainingBag']()).toEqual([item2, item1]);
    });

    it('orderedRemainingBag retombe sur l\'ordre du sac si best_order n\'est pas encore à jour', (): void => {
        const item1: Item = buildItem(1, 'water_#00');
        const item2: Item = buildItem(2, 'bandage_#00');
        component['starting_bag'] = [item1, item2];
        component['best_order'].set([]);

        expect(component['orderedRemainingBag']()).toEqual([item1, item2]);
    });

    it('compute peuple row.pdc depuis state.pdc renvoyé par le service', (): void => {
        // pdc est calculé côté serveur, jamais renvoyé par CitizenState.modelToDto() (voir sa
        // doc) : on passe donc le DTO brut attendu de la réponse HTTP directement, sans repasser
        // par CitizenStateStepResult.modelToDto() qui perdrait le champ.
        state_service.simulate.mockReturnValue(of(new CitizenStateTrace({
            startingState: { ap: 6, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 0, isDead: false, statuses: [], pdc: 2 },
            steps: [{
                description: 'Déplacement (zone proche)',
                stateAfter: { ap: 5, sp: 0, wounded: false, isEclaireur: false, hasBike: false, hasShoes: false, walkingDistance: 1, isDead: false, statuses: [], pdc: 9 }
            }]
        })));

        component['addMoveStep'](true);

        expect(component['rows']()[0].pdc).toBe(9);
    });

    // Régression OnPush (Task 14) : starting_bag alimente `[currentList]` de
    // `mho-list-element-add-remove` (input signal, composant OnPush) — une mutation en place
    // (.push()/.splice()) laisserait la référence inchangée et l'input ne se mettrait jamais à jour.
    it('addToBag réassigne starting_bag immuablement', (): void => {
        const item: Item = buildItem(1, 'water_#00');
        component['items'] = [item];
        const original: Item[] = component['starting_bag'];

        component['addToBag'](1);

        expect(component['starting_bag']).not.toBe(original);
    });

    it('removeFromBag réassigne starting_bag immuablement', (): void => {
        const item: Item = buildItem(1, 'water_#00');
        component['starting_bag'] = [item, item];
        const original: Item[] = component['starting_bag'];

        component['removeFromBag'](1);

        expect(component['starting_bag']).not.toBe(original);
    });
});
