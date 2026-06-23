import {state} from '../state';

export function getCurrentPosition() {
    return document.querySelector('.current-location')?.innerText.replace(/.*: ?/, '').split('/') ?? [0, 0];
}


export function getCellDetailsByPosition() {
    let position = getCurrentPosition();
    if (position && state.map && state.map.cells) {
        return state.map.cells.find((cell) => +cell.displayX === +position[0] && +cell.displayY === +position[1]);
    }
}
