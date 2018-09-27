import * as React from 'react'

export function spinner() {
    // number of pulse dots is determined by number of empty divs within the
    // bib-pulse container, currently set to 3
    return (
        <div className='bib-pulse-container'>
            <div className='bib-pulse'>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
    )
}
