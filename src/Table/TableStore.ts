import { observable, action, computed, toJS } from 'mobx';
import { Participant, Player, TablePosition, GameEvent, GameActions, Game } from '../types';
import ParticipantStore from './ParticipantStore';
import * as firebase from 'firebase/app';
import db from '../firebase';

export class TableStore {
    @observable participants = new Map<TablePosition, Participant>();
    @observable events: GameEvent[] = [];

    gamesCol = db.collection('games/');

    @computed get pickParticipants() {
        return this.participants.size < 4;
    }

    @action addPlayer(position: TablePosition, player: Player) {
        this.participants.set(position, {
            player,
            participant: new ParticipantStore(position, this.events),
        });
    }

    @action swapPositions = (posA: TablePosition, posB: TablePosition) => {
        const participantA = this.participants.get(posA);
        const participantB = this.participants.get(posB);

        if (participantA && participantB) {
            this.participants.set(posA, {
                player: participantB.player,
                participant: participantA.participant,
            });
            this.participants.set(posB, {
                player: participantA.player,
                participant: participantB.participant,
            });
        }
    }

    @action cancelGame = () => {
        this.events = [];
        this.participants = new Map();
    }

    @action addPlayerRandomly(player: Player) {
        if (!this.participants.has(TablePosition.AWAY_OFF)) {
            this.participants.set(TablePosition.AWAY_OFF, {
                player, participant: new ParticipantStore(TablePosition.AWAY_OFF, this.events),
            });
        } else if (!this.participants.has(TablePosition.AWAY_DEF)) {
            this.participants.set(TablePosition.AWAY_DEF, {
                player, participant: new ParticipantStore(TablePosition.AWAY_DEF, this.events),
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
        return TablePosition.HOME_DEF === pos || TablePosition.HOME_OFF === pos;
    }

    isAway = (pos: TablePosition) => {
        return TablePosition.AWAY_DEF === pos || TablePosition.AWAY_OFF === pos;
    }

    @action scoreGoal = (position: TablePosition) => {
        this.events.push({ action: GameActions.SCORE_GOAL, position });
    }

    @action scoreOwnGoal = (position: TablePosition) => {
        this.events.push({ action: GameActions.SCORE_OWN_GOAL, position });
    }

    @action finishGame = (time: number) => {
        const game: Game[] = [];
        const { away, home } = this.score;
        this.participants.forEach((participant, position) => {
            const { participant: { score: { ownGoals, goals } }, player: playerObservable } = participant;

            const player = toJS(playerObservable);

            if (player) {
                game.push({ position, player, goals, ownGoals });
            }
        });

        if (game.length === 4 && away !== home) {
            this.gamesCol.add({
                game, length: time,
                score: this.score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.events = [];
            this.participants = new Map();
        }
    }
}

const tableStore = new TableStore();

export default tableStore;
