import { observer } from 'mobx-react'
import * as React from 'react'
import '../App.css'
import { cookie_save } from '../cookies'
import { State, Status } from '../model/State'
import { ColumnView } from './ColumnView'
import { spinner } from './Spinner'

@observer
export class BibMain extends React.Component<{state: State}, {}> {
    generate_sources() {
        const state = this.props.state
        const bib = this.props.state.bibmodel

        if (state.isdisabled) {
            return null
        }

        if (!bib.availableDS || bib.availableDS.length === 0) {
            return (<div><span>No data provider available</span></div>)
        }

        const sources = bib.availableDS.map(
            (i): JSX.Element => {
                if (bib.currentDS === i) {
                    return <span className='bib-selected'>{i.longname}</span>
                } else {
                    return <span><a href='javascript:;' onClick={() => bib.setDS(i)}>{i.longname}</a></span>
                }
            }
        ).reduce(
            (accu, elem) => accu === null ? elem : (<span>{accu}<span> | </span>{elem}</span>)
        )

        return (<div><span>Select data provider: </span>{sources}</div>)
    }

    generate_messages() {
        const state = this.props.state

        if (state.isdisabled) {
            return null
        }

        const msglist = state.errors ? state.errors : state.messages
        const msgs = msglist.map(
            (i) => (<li className='msg'>{i.length < 80 ? i : i.slice(0, 80) + '...'}</li>)
        )

        return (<ul className='msgs'>{msgs}</ul>)
    }

    toggle() {
        const state = this.props.state
        if (state.isdisabled) {
            state.state = Status.INIT
            state.bibmodel.reconfigureSources()
            cookie_save(true)
        } else {
            state.state = Status.DISABLED
            cookie_save(false)
        }
    }

    render() {
        const state = this.props.state
        const bib = this.props.state.bibmodel
        const ds = bib.currentDS

        let body: JSX.Element | null = null

        if (state.isfailed || state.isdisabled) {
            body = null
        }

        if (state.isloading) {
            body = spinner()
        }

        if (state.isloaded) {
            body = (
                <div className='bib-col2'>
                    <ColumnView name='References' paperGroup={bib.references} dataSource={ds}/>
                    <ColumnView name='Citations' paperGroup={bib.citations} dataSource={ds}/>
                </div>
            )
        }

        return (
            <div className='bib-main'>
              <div className='references-citations'>
                <h2>References and citations</h2>
                <div className='references-citations-boxes'>
                  <div className='bib-sidebar-source'>{this.generate_sources()}</div>
                  <div className='bib-sidebar-msgs'>{this.generate_messages()}</div>
                </div>
                <span>[<a id='biboverlay_toggle' href='javascript:;'
                    onClick={() => this.toggle()}>{state.isdisabled ? 'Enable' : 'Disable'}</a></span>
                <span> (<a href='/help/bibex/'>What is this?</a>)]</span>
              </div>
              {body}
            </div>
        )
    }
}
// https://reactjs.org/docs/error-boundaries.html
