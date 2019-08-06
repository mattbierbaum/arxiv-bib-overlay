import { observer } from 'mobx-react'
import * as React from 'react'
import '../App.css'
import * as CONFIG from '../bib_config'
import { State } from '../model/State'
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

        return (<span><span>Select data provider: </span>{sources}</span>)
    }

    generate_messages() {
        const state = this.props.state
        const ds = this.props.state.bibmodel.currentDS

        if (state.isdisabled) {
            return null
        }

        let dataerror = false
        let msglist: string[] = []

        if (state.errors) {
            msglist = state.errors.map((i) => i.message)
            dataerror = state.errors.some((i) => i.name === 'DataError')
        } else {
            msglist = state.messages
            dataerror = false
        }

        const msgs = msglist.map(
            (i) => (<li className='msg'>{i.length < 80 ? i : i.slice(0, 80) + '...'}</li>)
        )

        if (msgs.length > 0) {
            if (ds && dataerror) {
                const helpline = (
                    <div>
                    <p>Articles recently added or updated may not have propagated to data providers yet.
                       If you believe there is an error,
                       contact <b><a href={ds.help}>{ds.longname}</a></b>.</p>
                    </div>
                )

                return (<div><ul className='msgs'>{msgs}</ul>{helpline}</div>)
            } else {
                return (<ul className='msgs'>{msgs}</ul>)
            }
        } else {
            return
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

        const name = CONFIG.POLICY_PROJECT_SHORTNAME
        const help = CONFIG.POLICY_SHOW_HELP_LINKS ? (
            <span>
            <span>[<a id='biboverlay_toggle' href='javascript:;'
                onClick={() => state.toggle()}>{
                    state.isdisabled ? `Enable ${name}` : `Disable ${name}`}</a></span>
            <span>(<a href={CONFIG.POLICY_DESCRIPTION_PAGE}>What is {name}?</a>)]</span>
            </span>
        ) : null

        if (bib && bib.availableDS && bib.availableDS.length === 0 && !CONFIG.POLICY_ALWAYS_DISPLAY_SECTION) {
            return null
        }

        const alertbox = (
            <div style={{display: 'block', position: 'relative', width: '100px'}}>
                <span className='tooltiptext'>
                    <span>Try the Bibliographic Explorer</span><br/>
                    <span>(can be disabled at any time)</span><br/>
                    <div>
                    <span><a href='javascript:;' onClick={() => state.toggle()} className='green'>Enable</a></span>
                    <span><a href='javascript:;' onClick={() => state.acknowledge()}>Don't show again</a></span>
                    </div>
                </span>
            </div>
        )

        const showalert = state.show_alert ? alertbox : null

        return (
            <div className='bib-main'>
              <div className='references-citations'>
                {showalert}
                <h2>{CONFIG.POLICY_SECTION_HEADER}</h2>
                <div className='references-citations-boxes'>
                  <div className='bib-sidebar-source'>{this.generate_sources()}<span> {help}</span></div>
                  <div className='bib-sidebar-msgs'>{this.generate_messages()}</div>
                </div>
              </div>
              {body}
            </div>
        )
    }
}
// https://reactjs.org/docs/error-boundaries.html
