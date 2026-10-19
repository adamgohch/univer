import {createUniver,LocaleType,mergeLocales} from '@univerjs/presets';
import {UniverSheetsCorePreset} from '@univerjs/preset-sheets-core';
import EnUS from '@univerjs/preset-sheets-core/locales/en-US';
import '@univerjs/preset-sheets-core/lib/index.css';
import './univer-frame.css';
import {workbookFromScheme} from './univer-model.js';
const token=location.hash.slice(1),send=message=>parent.postMessage({...message,channel:'zorel-univer',token},location.origin);
document.querySelector('#app').innerHTML=`<div class="frame-top"><strong id="name">Opening saved scheme…</strong><span>Univer · saved Zorel figures</span></div><div id="sheet"></div><div class="frame-tools"><label>Change input<select id="input" aria-label="Spreadsheet input"></select></label><label>Proposed value<input id="value" type="number" aria-label="Proposed spreadsheet value"></label><button id="preview">Preview change</button><button id="accept" hidden>Accept change</button><button id="reject" hidden>Reject</button></div><div id="selected">Select a cell to carry its context into Zorel.</div><div id="status" role="status">No API calls. Read-only inspection; changes go through Zorel’s review and save path.</div>`;
const {univerAPI:api}=createUniver({locale:LocaleType.EN_US,locales:{[LocaleType.EN_US]:mergeLocales(EnUS)},presets:[UniverSheetsCorePreset({container:'sheet',header:true,toolbar:false,formulaBar:true,footer:true,disableAutoFocus:true})]});
let book,data,mapping,subscription,change=null,updating=false;
const status=text=>document.querySelector('#status').textContent=text;
function selection(){if(!book||updating)return;const s=book.getActiveSheet(),r=s.getSelection()?.getActiveRange();if(!r||s.getSheetId()!=='feasibility')return;const row=mapping.ordered[r.getRow()-2];if(!row)return;const cell=s.getRange(r.getRow(),r.getColumn(),1,1);document.querySelector('#selected').textContent=`${row.label} · ${cell.getA1Notation()} · ${cell.getDisplayValue()}${cell.getFormulas()[0]?.[0]?' · '+cell.getFormulas()[0][0]:''}`;send({type:'select',key:row.id});}
function update(next){updating=true;data=next;const oldKey=document.querySelector('#input').value;subscription?.dispose();if(book)api.disposeUnit(book.getId());mapping=workbookFromScheme(data);book=api.createWorkbook(mapping.snapshot);book.setEditable(false);subscription=book.onCommandExecuted(command=>{if(command.id==='sheet.operation.set-selections')queueMicrotask(selection);});document.querySelector('#name').textContent=data.name;
 const options=document.querySelector('#input');options.replaceChildren(...data.rows.filter(r=>r.editable).map(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=r.label;return o;}));options.value=data.rows.some(r=>r.id===oldKey&&r.editable)?oldKey:data.rows.some(r=>r.id==='buildRate'&&r.editable)?'buildRate':options.options[0]?.value||'';fill();document.querySelector('#preview').disabled=!options.value;
 document.querySelector('#accept').hidden=!data.preview;document.querySelector('#reject').hidden=!data.preview;status(data.preview?'Proposal only. Current scheme is unchanged until accepted.':'Connected to the current saved scheme. Select cells to use them in Zorel.');updating=false;api.getFormula().executeCalculation();}
function fill(){const r=data?.rows.find(r=>r.id===document.querySelector('#input').value);const input=document.querySelector('#value');input.value=(data?.preview?r?.proposed??r?.value:r?.value)??'';for(const k of ['min','max','step'])if(r?.[k]!=null)input.setAttribute(k,r[k]);else input.removeAttribute(k);}
function invalidate(){change=null;document.querySelector('#accept').hidden=true;if(data?.preview)status('The input changed. Preview again before accepting; the sheet still shows the previous proposal.');}
document.querySelector('#input').onchange=()=>{fill();invalidate();};
document.querySelector('#value').oninput=invalidate;
document.querySelector('#preview').onclick=()=>{const value=document.querySelector('#value');if(!value.value||!value.reportValidity())return;change={key:document.querySelector('#input').value,value:Number(value.value),version:data.version};send({type:'preview',...change});};
document.querySelector('#accept').onclick=()=>{if(change)send({type:'accept',...change});};
document.querySelector('#reject').onclick=()=>{send({type:'reject'});change=null;};
window.addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin||event.data?.channel!=='zorel-univer'||event.data.token!==token)return;if(event.data.type==='snapshot')update(event.data.data);if(event.data.type==='error')status(event.data.message);});
send({type:'ready'});
