import { Paper } from '../api/document'

/** 
 * Function to sort Papers for ColumnView.
 * This sorts the Paper array in place.
 */
export const sorter = (arr: Paper[], field: (p: Paper) => number|string, ord: 'up'|'down'): Paper[] => {
    const sign = (ord === 'up') ? 1 : -1
    return arr.sort((a, b) => {
        if (field(a) > field(b)) { return -1 * sign }
        if (field(a) < field(b)) { return +1 * sign }
        if (a.simpletitle  > b.simpletitle) {  return +1 }
        if (a.simpletitle  < b.simpletitle) {  return -1 }
        return 0
    })
  }
