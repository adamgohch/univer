// Pure boundary: only supported, finite, unlocked scheme parameters may be changed.
export function validateUniverChange(rows,change){
 const row=rows.find(r=>r.id===change?.key);
 if(!row?.editable)throw Error('This cell is calculated, connected or unavailable. Change its source instead.');
 if(typeof change.value!=='number'||!Number.isFinite(change.value))throw Error('Enter a finite number.');
 if(Number.isFinite(row.min)&&change.value<row.min||Number.isFinite(row.max)&&change.value>row.max)throw Error(`Enter a value between ${row.min} and ${row.max}.`);
 if(row.step===1&&!Number.isInteger(change.value))throw Error('This input requires a whole number.');
 return row;
}
export function assertUniverRevision(expected,current){if(expected!==current)throw Error('The scheme changed after this proposal. Preview again before accepting.');}

export function workbookFromScheme(data){
 const primary=['gfa','cost','land','total','revenue','profit','margin','tdc','finCost','devProfit','devMargin','peakDebt','irrProject','irrEquity'];
 const ordered=[...primary.map(id=>data.rows.find(r=>r.id===id)).filter(Boolean),...data.rows.filter(r=>!primary.includes(r.id))];
 const positions=Object.fromEntries(ordered.map((r,i)=>[r.id,i+3]));
 const arithmetic={total:c=>`${c}cost+${c}land`,profit:c=>`${c}revenue-${c}total`,margin:c=>`IFERROR(${c}profit/${c}total*100,0)`,devProfit:c=>`${c}revenue-${c}tdc-${c}finCost`,devMargin:c=>`IFERROR(${c}devProfit/(${c}tdc+${c}finCost)*100,0)`};
 const formulas=(id,col)=>{if(!arithmetic[id])return null;let ok=true;const f=arithmetic[id]('@').replace(/@([A-Za-z]+)/g,(_,key)=>{if(!positions[key])ok=false;return col+positions[key];});return ok?'='+f:null;};
 const cells={0:{0:{v:data.name,s:'title'}},1:{0:{v:'Line item',s:'head'},1:{v:'Current scheme',s:'head'},2:{v:data.preview?'Proposed':'No proposal',s:'head'},3:{v:'Unit',s:'head'},4:{v:'Source / calculation',s:'head'}}};
 ordered.forEach((r,i)=>{const style=r.money?'money':'number';cells[i+2]={0:{v:r.label},3:{v:r.unit||''},4:{v:r.formula||'Saved scheme input'}};for(const [col,letter,v]of [[1,'B',r.value],[2,'C',r.proposed??r.value]]){const f=formulas(r.id,letter);cells[i+2][col]=f?{f,s:style}:Number.isFinite(v)?{v,t:2,s:style}:{v:'—'};}});
 const monthly={0:{0:{v:'Monthly cash flow · current scheme',s:'title'}},1:{0:{v:'Line item',s:'head'}}};
 (data.monthly?.rows||[]).forEach((row,r)=>{monthly[r+2]={0:{v:row.label}};row.values.forEach((v,c)=>{monthly[r+2][c+1]={v,t:2,s:'money'};monthly[1][c+1]={v:'Month '+(c+1),s:'head'};});});
 const common={rowCount:Math.max(100,ordered.length+5),columnCount:Math.max(12,(data.monthly?.months||0)+1),defaultRowHeight:29,defaultColumnWidth:125,zoomRatio:.9,freeze:{xSplit:1,ySplit:2,startRow:2,startColumn:1}};
 return {snapshot:{id:'zorel-scheme',name:data.name,appVersion:'1.1.0',locale:'enUS',styles:{title:{bg:{rgb:'#005166'},cl:{rgb:'#FFFFFF'},bl:1},head:{bg:{rgb:'#E7EFEB'},bl:1},money:{n:{pattern:'"$"#,##0.00;[Red]("$"#,##0.00)'}},number:{n:{pattern:'#,##0.00'}}},sheetOrder:['feasibility','monthly'],sheets:{feasibility:{...common,id:'feasibility',name:'Feasibility',cellData:cells,columnData:{0:{w:240},1:{w:150},2:{w:150},3:{w:70},4:{w:420}}},monthly:{...common,id:'monthly',name:'Monthly cash flow',cellData:monthly,columnData:{0:{w:240}}}}},positions,ordered};
}
