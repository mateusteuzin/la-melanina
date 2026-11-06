import { useEffect, useState } from 'react';
import { adminAvailableTimes } from './store';

export function Availability({date, serviceId, excludeId, value, onChange, onReady, revision=0}: {
 date:string; serviceId:string; excludeId?:string; value:string; onChange:(time:string)=>void; onReady?:(ready:boolean)=>void; revision?:number;
}) {
 const [state,setState]=useState<{key:string;times:string[];error:string}>({key:'',times:[],error:''});
 const [retry,setRetry]=useState(0);
 const key=[date,serviceId,excludeId,revision,retry].join('|');
 useEffect(()=>{
  let cancelled=false;
  onReady?.(false);
  if(!date||!serviceId) return;
  adminAvailableTimes(date,serviceId,excludeId).then(times=>{if(!cancelled)setState({key,times,error:''});}).catch(e=>{if(!cancelled)setState({key,times:[],error:e.message});});
  return ()=>{cancelled=true;};
 },[key]);
 const ready=state.key===key&&!state.error;
 useEffect(()=>{onReady?.(ready&&state.times.includes(value));},[ready,value,state]);
 if(state.key!==key) return <p className="adm-help" role="status">Consultando horários disponíveis…</p>;
 if(state.error) return <div className="adm-slot-error" role="alert"><p>{state.error}</p><button type="button" className="adm-button" onClick={()=>setRetry(v=>v+1)}>Tentar novamente</button></div>;
 if(!state.times.length) return <p className="adm-help">Nenhuma vaga disponível. Escolha outra data ou confira os bloqueios.</p>;
 const natural=state.times[0].startsWith('Vaga');
 return <div className="adm-slots">
  {(natural?['Vagas do bronze natural']:['Manhã','Tarde e noite']).map((label,index)=>{
   const times=state.times.filter(t=>natural||(index===0?Number(t.slice(0,2))<12:Number(t.slice(0,2))>=12));
   return times.length>0&&<div key={label}><h4>{label}</h4><div className="adm-slot-grid">{times.map(t=><button type="button" key={t} aria-pressed={value===t} className={'adm-slot '+(value===t?'selected':'')} onClick={()=>onChange(t)}>{t}</button>)}</div></div>;
  })}
  <p className="adm-help">Somente vagas livres. A disponibilidade é conferida novamente ao salvar.</p>
 </div>;
}
