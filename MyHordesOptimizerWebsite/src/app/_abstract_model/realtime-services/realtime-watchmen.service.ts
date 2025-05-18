import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { getTown } from '../../shared/utilities/localstorage.util';
import { WatchmanDTO } from '../dto/watchman.dto';
import { dtoToModelArray } from '../types/_common.class';
import { Bag } from '../types/bag.class';
import { Watchman } from '../types/watchman.class';
import { RealtimeGlobalService } from './_realtime-global.service';

@Injectable({
    providedIn: 'root'
})
export class RealtimeWatchmenService extends RealtimeGlobalService {

    private watchman_updated_subject: Subject<Watchman> = new Subject<Watchman>();
    public watchman_updated$: Observable<Watchman> = this.watchman_updated_subject.asObservable();

    private watchmen_updated_subject: Subject<Watchman[]> = new Subject<Watchman[]>();
    public watchmen_updated$: Observable<Watchman[]> = this.watchmen_updated_subject.asObservable();

    private watchman_deleted_subject: Subject<number> = new Subject<number>();
    public watchman_deleted$: Observable<number> = this.watchman_deleted_subject.asObservable();

    private watchman_bag_updated_subject: Subject<Bag> = new Subject<Bag>();
    public watchman_bag_updated$: Observable<Bag> = this.watchman_bag_updated_subject.asObservable();

    private watchman_bag_deleted_subject: Subject<number> = new Subject<number>();
    public watchman_bag_deleted$: Observable<number> = this.watchman_bag_deleted_subject.asObservable();

    private user_joined_subject: Subject<number[]> = new Subject<number[]>();
    public user_joined$: Observable<number[]> = this.user_joined_subject.asObservable();

    private user_left_subject: Subject<number[]> = new Subject<number[]>();
    public user_left$: Observable<number[]> = this.user_left_subject.asObservable();

    constructor() {
        super();

        this.defineConnexion('watchmen').then(() => {

            this.hubConnection.on('WatchmanUpdated', (watchman: WatchmanDTO) => {
                console.log('receive', 'WatchmanUpdated', watchman);
                this.watchman_updated_subject.next(new Watchman(watchman));
            });

            this.hubConnection.on('WatchmenUpdated', (watchmen: WatchmanDTO[]) => {
                console.log('receive', 'WatchmenUpdated', watchmen);
                this.watchmen_updated_subject.next(dtoToModelArray(Watchman, watchmen));
            });

            this.hubConnection.on('WatchmanDeleted', (watchman_id: number) => {
                console.log('receive', 'WatchmanDeleted', watchman_id);
                this.watchman_deleted_subject.next(watchman_id);
            });

            this.hubConnection.on('WatchmanBagUpdated', (watchman_citizen_bag: Bag) => {
                console.log('receive', 'WatchmanBagUpdated', watchman_citizen_bag);
                this.watchman_bag_updated_subject.next(new Bag());
            });

            this.hubConnection.on('WatchmanBagDeleted', (watchman_citizen_bag_id: number) => {
                console.log('receive', 'WatchmanBagDeleted', watchman_citizen_bag_id);
                this.watchman_bag_deleted_subject.next(watchman_citizen_bag_id);
            });

            this.hubConnection.on('UserJoined', (user_ids: string) => {
                console.log('receive', 'UserJoined', user_ids);
                this.user_joined_subject.next(JSON.parse(user_ids));
            });

            this.hubConnection.on('UserLeft', (user_ids: string) => {
                console.log('receive', 'UserLeft', user_ids);
                this.user_left_subject.next(JSON.parse(user_ids));
            });
        });
    }

    public async updateWatchman(day: number, watchman: Watchman): Promise<void> {
        console.log('send', 'PostWatchman', getTown()?.town_id, day, watchman.modelToDto());
        await this.invokeHub('PostWatchman', getTown()?.town_id, day, JSON.stringify(watchman.modelToDto()));
    }

    public async deleteWatchman(watchman: Watchman): Promise<void> {
        console.log('send', 'DeleteWatchman', watchman.id);
        await this.invokeHub('DeleteWatchman', watchman.id);
    }

    public async copyWatchmen(from_day: number, to_day: number): Promise<void> {
        console.log('send', 'CopyWatchmen', getTown()?.town_id, from_day, to_day);
        await this.invokeHub('CopyWatchmen', getTown()?.town_id, from_day, to_day);
    }

    public async updateWatchmanBag(bag: Bag): Promise<void> {
        console.log('send', 'SaveWatchmanBag', bag, bag.modelToDtoShort());
        await this.invokeHub('SaveWatchmanBag', bag, JSON.stringify(bag.modelToDtoShort()));
    }

    public async deleteWatchmanBag(bag: Bag): Promise<void> {
        console.log('send', 'DeleteWatchmanBag', bag.bag_id);
        await this.invokeHub('DeleteWatchmanBag', bag.bag_id);
    }
}
