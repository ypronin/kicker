import { observable, action, computed } from 'mobx';
import { Participant, Player, TablePosition, GameEvent, GameActions } from '../types';
import ParticipantStore from './ParticipantStore';

export class TableStore {
    @observable participants = new Map<TablePosition, Participant>();
    @observable events: GameEvent[] = [];

    @computed get pickParticipants() {
        return this.participants.size < 4;
    }

    @action addPlayer(position: TablePosition, player: Player) {
        this.participants.set(position, {
            player,
            participant: new ParticipantStore(position, this.events),
        });
    }

    @action addPlayerRandomly(player: Player) {
        if (!this.participants.has(TablePosition.AWAY_DEF)) {
            this.participants.set(TablePosition.AWAY_DEF, {
                player, participant: new ParticipantStore(TablePosition.AWAY_DEF, this.events),
            });
        } else if (!this.participants.has(TablePosition.AWAY_OFF)) {
            this.participants.set(TablePosition.AWAY_OFF, {
                player, participant: new ParticipantStore(TablePosition.AWAY_OFF, this.events),
            });
        } else if (!this.participants.has(TablePosition.HOME_DEF)) {
            this.participants.set(TablePosition.HOME_DEF, {
                player, participant: new ParticipantStore(TablePosition.HOME_DEF, this.events),
            });
        } else if (!this.participants.has(TablePosition.HOME_OFF)) {
            this.participants.set(TablePosition.HOME_OFF, {
                player, participant: new ParticipantStore(TablePosition.HOME_OFF, this.events),
            });
        }
    }

    @computed get score() {
        return this.events.reduce(
            (mem, e: GameEvent) => {
                if (e.action as GameActions === GameActions.SCORE_GOAL) {
                    if (this.isAway(e.position)) {
                        mem.away++;
                    } else if (this.isHome(e.position)) {
                        mem.home++;
                    }
                } else if (e.action as GameActions === GameActions.SCORE_OWN_GOAL) {
                    if (this.isAway(e.position)) {
                        mem.home++;
                    } else if (this.isHome(e.position)) {
                        mem.away++;
                    }
                }

                return mem;
            },
            { away: 0, home: 0 }
        );
    }

    @action undo = () => {
        this.events.splice(-1, 1);
    }

    isHome = (pos: TablePosition) => {
        return TablePosition.HOME_DEF == pos || TablePosition.HOME_OFF == pos;
    }

    isAway = (pos: TablePosition) => {
        return TablePosition.AWAY_DEF == pos || TablePosition.AWAY_OFF == pos;
    }

    @action scoreGoal = (position: TablePosition) => {
        this.events.push({ action: GameActions.SCORE_GOAL, position });
    }

    @action scoreOwnGoal = (position: TablePosition) => {
        this.events.push({ action: GameActions.SCORE_OWN_GOAL, position });
    }
}

const tableStore = new TableStore();

// const player1: Player = { f/irstName: 'Donnie', lastName: 'Abner', _id: '5' };

// const player1: Player = { firstName: 'Jerold', lastName: 'Beatrix', _id: '1' };
// const player2: Player = { firstName: 'Toni', lastName: 'Patton', _id: '2' };
// const player3: Player = { firstName: 'Kelli', lastName: 'Read', _id: '3' };
// const player4: Player = { firstName: 'Claire', lastName: 'Jerrod', _id: '4' };

// tableStore.addPlayer(TablePosition.AWAY_DEF, player1);
// tableStore.addPlayer(TablePosition.AWAY_OFF, player2);
// tableStore.addPlayer(TablePosition.HOME_DEF, player3);
// tableStore.addPlayer(TablePosition.HOME_OFF, player4);

export default tableStore;