export const STORAGE_KEY='arrival-ready-full-v1';

const PLAN_KEYS=['code','entrance','fallback','contact','backupContact','overnight'];
const draftPlan={code:'2846',entrance:'Green gate, number 18',fallback:'Staffed lodge side entrance, 25 m right',contact:'Anita',backupContact:'Ravi',overnight:'22:00 - 07:00'};
const hotelData={pine:{id:'pine',name:'Pine Lodge',price:3800},cedar:{id:'cedar',name:'Cedar Inn',price:4200}};
const incidentStates=['local','sent','received','reviewing','options','booked','resolved'];
const bool=value=>value===true;
const text=(value,max=1500)=>String(value??'').trim().slice(0,max);
const copyPlan=plan=>plan?{...plan}:null;
const clock=s=>{const minutes=60+Math.max(0,Number(s.clockMinute)||45);return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');};
const event=(s,patch,label)=>{const sequence=(s.sequence||0)+1;const next={...s,...patch,sequence};return {...next,events:[...(s.events||[]),{id:'event-'+sequence,time:clock(next),text:label}].slice(-200)};};
const msg=(s,from,value,queued=false,extra={})=>({id:'message-'+(s.sequence+1)+'-'+((s.messages?.length||0)+(s.supportMessages?.length||0)),from,text:text(value),time:clock(s),queued,...extra});
const isDelivered=s=>!!s.incident&&['received','reviewing','options','booked','resolved'].includes(s.incident.status);
const isActive=s=>!!s.incident&&s.incident.status!=='resolved';
const withReply=(s,label,patch={})=>{
 const incident=s.incident?{...s.incident,...patch.incident}:null;
 if(incident&&incident.receivedAt&&!incident.firstResponseAt)incident.firstResponseAt=clock(s);
 return event(s,{...patch,incident,supportMessages:[...(s.supportMessages||[]),msg(s,'Asha · support',label)]},label);
};
const cleanPlan=plan=>Object.fromEntries(PLAN_KEYS.map(k=>[k,text(plan?.[k],k==='fallback'?700:300)]));
const validPlan=plan=>/^\d{4,8}#?$/.test(plan.code)&&plan.entrance.length>=8&&plan.fallback.length>=12&&plan.fallback.toLowerCase()!==plan.entrance.toLowerCase()&&!!plan.contact&&!!plan.backupContact&&!!plan.overnight;

export function createInitialState(){
 const publishedPlan={...draftPlan,version:4,verifiedAt:'17:38',fallbackReady:true,hostAvailable:true};
 return {
  schemaVersion:1,sequence:2,clockMinute:45,elapsed:0,supportElapsed:0,
  battery:62,data:true,cell:true,saver:false,connectedDevice:'primary',primaryDevice:null,
  guestName:'Meera',hostName:'Anita',emergencyContact:'',arrivalTime:'01:45',notifications:true,largeText:false,locationSharing:false,
  packSaved:true,packVersion:4,latestVersion:4,hostVersion:4,packSavedAt:'17:40',packSnapshot:copyPlan(publishedPlan),
  peerSaved:false,peerAccepted:false,peerRevocationPending:false,companionSnapshot:null,shareStage:'idle',
  hostDraft:{...draftPlan},publishedPlan:copyPlan(publishedPlan),hostAvailable:true,fallbackReady:true,healthSource:'manual',healthUpdated:'17:38 today',
  party:[{id:'meera',name:'Meera',role:'Booking guest',saved:true},{id:'rohan',name:'Rohan',role:'Co-traveler',saved:false},{id:'sana',name:'Sana',role:'Co-traveler',saved:false},{id:'kabir',name:'Kabir',role:'Co-traveler',saved:false}],
  messages:[{id:'host-welcome',from:'host',text:'Hi Meera! Your late arrival is confirmed. Look for green gate 18. I verified the staffed lodge backup and left everything in your arrival guide.',time:'17:38',queued:false,delivered:true}],
  supportMessages:[],guideTab:'entrance',tripStatus:'confirmed',entered:false,lockStatus:'ready',diagnosticStep:0,callStatus:'idle',
  incident:null,reviewApproved:false,hotelAvailability:true,selectedHotel:'pine',includeRide:true,coverageCap:4500,booking:null,
  events:[{id:'event-1',time:'17:38',text:'Anita verified arrival plan version 4 and independent backup entry.'},{id:'event-2',time:'17:40',text:'Arrival pack version 4 saved on Meera’s device.'}]
 };
}

function onlinePatch(s,data,cell){
 let patch={data,cell};
 if(!data)return patch;
 patch.messages=(s.messages||[]).map(m=>m.queued?{...m,queued:false,delivered:false,time:clock(s)}:m);
 patch.supportMessages=(s.supportMessages||[]).map(m=>m.queued?{...m,queued:false,time:clock(s)}:m);
 if(s.incident?.status==='local')patch.incident={...s.incident,status:'sent',sentAt:clock(s)};
 if(s.peerRevocationPending){patch={...patch,peerRevocationPending:false,peerSaved:false,peerAccepted:false,companionSnapshot:null,party:s.party.map((p,i)=>i===1?{...p,saved:false}:p)};if(s.connectedDevice==='companion'){patch.packSaved=false;patch.packSnapshot=null;}}
 return patch;
}

function savePack(s){
 const snapshot=copyPlan(s.publishedPlan);
 const patch={packSaved:true,packSnapshot:snapshot,packVersion:s.latestVersion,packSavedAt:clock(s)};
 if(s.connectedDevice==='companion'){patch.companionSnapshot=snapshot;patch.peerSaved=true;patch.peerAccepted=true;patch.party=s.party.map((p,i)=>i===1?{...p,saved:true}:p);}
 else patch.party=s.party.map((p,i)=>i===0?{...p,saved:true}:p);
 return patch;
}

export function reducer(s,a){
 if(!s)return createInitialState();
 if(!a||typeof a.type!=='string')return s;
 switch(a.type){
  case 'RESET': return createInitialState();
  case 'SAVE_PACK':
  case 'SYNC_PACK': if(!s.data||s.battery<=0)return s;return event(s,savePack(s),'Arrival pack version '+s.latestVersion+' saved on this device.');
  case 'REMOVE_PACK': {
   const patch={packSaved:false,packSnapshot:null};
   if(s.connectedDevice==='companion'){patch.companionSnapshot=null;patch.peerSaved=false;patch.peerAccepted=false;patch.party=s.party.map((p,i)=>i===1?{...p,saved:false}:p);}
   else patch.party=s.party.map((p,i)=>i===0?{...p,saved:false}:p);
   return event(s,patch,'Saved arrival details removed from this device. Other accepted copies are unchanged.');
  }
  case 'SET_SAVER': return event(s,{saver:s.battery<5?true:bool(a.value)},s.battery<5?'Battery saver remains active below 5%. No charge was added.':a.value?'Battery saver enabled. Saved text remains available.':'Standard display restored.');
  case 'START_SHARE': if(!s.packSaved||!s.packSnapshot||s.battery<=0)return s;return event(s,{shareStage:'pairing'},'Nearby sharing session C742ME started. Both guests must accept.');
  case 'ACCEPT_SHARE': if(s.shareStage!=='pairing'||!s.packSaved||s.battery<=0)return s;return event(s,{shareStage:'accepted',peerSaved:true,peerAccepted:true,peerRevocationPending:false,companionSnapshot:copyPlan(s.packSnapshot),party:s.party.map((p,i)=>i===1?{...p,saved:true}:p)},'Both guests accepted the sample pairing. Rohan saved version '+s.packVersion+' on a companion device.');
  case 'FINISH_SHARE': return {...s,shareStage:'idle'};
  case 'REVOKE_PEER': if(!s.peerSaved&&!s.peerRevocationPending)return s;return s.data?event(s,{peerSaved:false,peerAccepted:false,peerRevocationPending:false,companionSnapshot:null,...(s.connectedDevice==='companion'?{packSaved:false,packSnapshot:null}:{}),party:s.party.map((p,i)=>i===1?{...p,saved:false}:p)},'Companion copy revoked in the connected-device simulation.'):event(s,{peerRevocationPending:true},'Companion revocation queued. An offline copy remains available until reconnection.');
  case 'SWITCH_DEVICE': {
   if(s.connectedDevice==='companion'){
    if(!s.primaryDevice)return s;
    return event(s,{...s.primaryDevice,primaryDevice:null,connectedDevice:'primary',companionSnapshot:s.packSaved?copyPlan(s.packSnapshot):null},'Returned to the original device. Its saved state and battery were preserved.');
   }
   if(!s.peerSaved||!s.companionSnapshot)return s;
   const primaryDevice={battery:s.battery,packSaved:s.packSaved,packVersion:s.packVersion,packSnapshot:copyPlan(s.packSnapshot),packSavedAt:s.packSavedAt,saver:s.saver};
   return event(s,{primaryDevice,connectedDevice:'companion',battery:48,saver:false,packSaved:true,packSnapshot:copyPlan(s.companionSnapshot),packVersion:s.companionSnapshot.version||s.packVersion,packSavedAt:'17:42'},'Continued on Rohan’s powered device using its accepted saved copy.');
  }
  case 'INVITE_GUEST': {
   const name=text(a.name,80),email=text(a.email,150).toLowerCase();
   if(!s.data||!name||!/^\S+@\S+\.\S+$/.test(email)||s.party.some(p=>p.email===email))return s;
   return event(s,{party:[...s.party,{id:'invite-'+(s.sequence+1),name,email,role:'Invited guest',saved:false,pending:true}]},'Local sample invitation added for '+name+'. No email was sent.');
  }
  case 'REMOVE_GUEST': {
   const person=s.party.find(p=>(p.id===a.id||p.name===a.id)&&p.pending);if(!person)return s;
   return event(s,{party:s.party.filter(p=>p!==person)},'Pending invitation for '+person.name+' removed.');
  }
  case 'SET_GUIDE_TAB': return ['entrance','essentials','departure'].includes(a.value)?{...s,guideTab:a.value}:s;
  case 'UPDATE_PREF': {
   if(!['guestName','emergencyContact','arrivalTime','notifications','largeText','locationSharing'].includes(a.key))return s;
   const value=['guestName','emergencyContact','arrivalTime'].includes(a.key)?text(a.value,a.key==='guestName'?80:180):bool(a.value);
   if(a.key==='guestName'&&!value)return s;
   if(a.key==='arrivalTime'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return s;
   return event(s,{[a.key]:value,...(a.key==='guestName'?{party:s.party.map((p,i)=>i===0?{...p,name:value}:p)}:{})},a.key==='guestName'?'Preferred guest name updated.':a.key==='emergencyContact'?'Local emergency-contact note saved. No one was notified.':a.key==='arrivalTime'?'Planned arrival time updated to '+value+'.':'Preference updated: '+a.key+'.');
  }
  case 'SEND_MESSAGE': {
   const value=text(a.text,2000);if(!value||s.battery<=0)return s;
   const attachment=typeof a.attachment==='string'&&a.attachment.startsWith('data:image/')&&a.attachment.length<4000000?a.attachment:undefined;
   return event(s,{messages:[...s.messages,msg(s,'guest',value,!s.data,{delivered:s.data,attachment,attachmentName:text(a.attachmentName,120)})]},s.data?'Guest message delivered in the simulated host conversation.':'Guest message saved locally. Delivery is not confirmed.');
  }
  case 'HOST_UPDATE': if(!PLAN_KEYS.includes(a.key))return s;return {...s,hostDraft:{...s.hostDraft,[a.key]:String(a.value??'').slice(0,a.key==='fallback'?700:300)}};
  case 'HOST_PUBLISH': {
   const plan=cleanPlan(s.hostDraft);if(!s.data||!s.fallbackReady||!validPlan(plan))return s;
   const version=s.latestVersion+1,publishedPlan={...plan,version,verifiedAt:clock(s),fallbackReady:s.fallbackReady,hostAvailable:s.hostAvailable};
   return event(s,{publishedPlan,hostDraft:plan,latestVersion:version,hostVersion:version,healthUpdated:clock(s)+' today',hostName:plan.contact.split(' ')[0]},'Host published arrival plan version '+version+'. Existing guest and companion copies have not been synced.');
  }
  case 'SET_HOST_AVAILABLE': return event(s,{hostAvailable:bool(a.value)},a.value?'Overnight contacts confirmed available.':'Overnight contact cover marked unavailable.');
  case 'SET_FALLBACK_READY': return event(s,{fallbackReady:bool(a.value)},a.value?'Host confirmed an independent backup route.':'Independent backup needs host review.');
  case 'SET_HEALTH_SOURCE': return ['manual','native','pms'].includes(a.value)?event(s,{healthSource:a.value},a.value==='manual'?'Showing the last manual host check.':a.value==='pms'?'PMS source selected. Real-time lock health remains Unknown.':'Direct integration example selected. This India listing has no eligible native health connection.'):s;
  case 'SET_DIAGNOSTIC': return Number.isInteger(a.value)&&a.value>=0&&a.value<=3?{...s,diagnosticStep:a.value}:s;
  case 'SET_LOCK_STATUS': return ['ready','code','dark','jam'].includes(a.value)?event(s,{lockStatus:a.value},'Guest reported entry state: '+({ready:'entrance unclear',code:'code rejected',dark:'keypad dark',jam:'mechanical jam'}[a.value])+'.'):s;
  case 'CALL_HOST': if(s.battery<=0)return s;return event(s,{callStatus:s.cell?'ringing':'unreachable'},s.cell?'Simulated call to the agreed overnight contact.':'No cellular service. The overnight call did not connect.');
  case 'SET_CALL_STATUS': if(!['idle','ringing','answered','missed','unreachable'].includes(a.value))return s;return event(s,{callStatus:!s.cell&&a.value==='answered'?'unreachable':a.value,...(a.value==='missed'?{clockMinute:s.clockMinute+4,elapsed:s.elapsed+4}:{})},a.value==='answered'&&s.cell?'Overnight contact answered. Working entry still needs confirmation.':a.value==='missed'?'Two sample contact attempts unanswered. Entry remains unresolved.':'Contact call state updated.');
  case 'CREATE_INCIDENT': {
   if(s.incident)return s;
   if(s.battery<=0)return s;
   const evidence=a.evidence||{},incident={id:'ARR-1842',status:s.data?'sent':'local',reason:text(a.reason||'Unable to enter',180),createdAt:clock(s),sentAt:s.data?clock(s):null,receivedAt:null,firstResponseAt:null,evidence:{arrival:bool(evidence.arrival),location:bool(evidence.location),attempts:bool(evidence.attempts),notes:text(evidence.notes,600)},outcome:null};
   return event(s,{incident,reviewApproved:false,supportElapsed:0},s.data?'Arrival report sent. Waiting for support receipt.':'Arrival report saved only on this device. Support has not received it.');
  }
  case 'UPDATE_EVIDENCE': if(!s.incident||!['arrival','location','attempts','notes'].includes(a.key))return s;return event(s,{incident:{...s.incident,evidence:{...s.incident.evidence,[a.key]:a.key==='notes'?text(a.value,600):bool(a.value)}}},'Guest arrival evidence updated.');
  case 'QUEUE_INCIDENT': if(!s.incident||isDelivered(s))return s;return event(s,{incident:{...s.incident,status:'local'}},'Arrival report kept locally. No receipt acknowledged.');
  case 'SEND_INCIDENT': if(!s.data||!s.incident||s.incident.status!=='local')return s;return event(s,{incident:{...s.incident,status:'sent',sentAt:clock(s)}},'Saved arrival report sent. Waiting for support receipt.');
  case 'ACK_INCIDENT':
  case 'SUPPORT_RECEIVE': {
   if(!s.data||!s.incident||isDelivered(s))return s;
   return event(s,{incident:{...s.incident,status:'received',sentAt:s.incident.sentAt||clock(s),receivedAt:clock(s)},supportElapsed:0,supportMessages:[...s.supportMessages,msg(s,'Arrival Ready','Your report reached arrival support. Your booking and entry attempts are attached.')]},'Support receipt acknowledged. The support response clock starts now.');
  }
  case 'REQUEST_OPTIONS': {
   if(!s.data||!s.incident)return s;
   if(s.incident.status==='received')return withReply(s,'I’m checking the failed entry, host backup, coverage and nearby stays for all four guests.',{incident:{...s.incident,status:'reviewing'}});
   if(s.incident.status==='reviewing')return withReply(s,s.hotelAvailability?'The sample recovery review is complete. Two example stays are ready for you to compare. Please review the coverage and accept before booking.':'The recovery review is complete, but no alternative stay is confirmed. I need to check another provider. Your issue stays open.',{reviewApproved:true,incident:{...s.incident,status:'options'}});
   return s;
  }
  case 'SUPPORT_REVIEW': if(!s.data||s.incident?.status!=='received')return s;return event(s,{incident:{...s.incident,status:'reviewing'}},'Support began the failed-entry and coverage review.');
  case 'SUPPORT_APPROVE': if(!s.data||s.incident?.status!=='reviewing')return s;return event(s,{reviewApproved:bool(a.value)},a.value?'Support reviewed the active booking and failed independent backup. Coverage review completed.':'Support requested more review information. Assistance remains available.');
  case 'SUPPORT_MARK_OPTIONS': if(!s.data||!s.reviewApproved||!s.hotelAvailability||!s.incident||!['reviewing','options'].includes(s.incident.status))return s;return withReply(s,'Nearby sample stay options are available for review. Your acceptance is required before confirmation.',{incident:{...s.incident,status:'options'}});
  case 'SEND_SUPPORT_MESSAGE': {
   const value=text(a.text,1500);if(!value||!s.incident||s.battery<=0)return s;
   return event(s,{supportMessages:[...s.supportMessages,msg(s,'guest',value,!s.data)]},s.data?'Guest message added to the simulated support conversation.':'Support message saved locally, not sent.');
  }
  case 'SUPPORT_SEND_MESSAGE': {
   const value=text(a.text,1500);if(!value||!s.data||!isDelivered(s)||!isActive(s))return s;
   return withReply(s,value);
  }
  case 'SELECT_HOTEL': return hotelData[a.value]?{...s,selectedHotel:a.value}:s;
  case 'SET_RIDE': return {...s,includeRide:bool(a.value)};
  case 'CONFIRM_BOOKING': {
   if(!s.data||s.battery<=0||!s.hotelAvailability||!s.reviewApproved||s.incident?.status!=='options'||a.consent!==true||(s.booking&&s.booking.status!=='cancelled'))return s;
   const hotel=hotelData[s.selectedHotel]||hotelData.pine,total=hotel.price+(s.includeRide?350:0),credit=Math.min(total,s.coverageCap),contribution=Math.max(0,total-credit);
   const booking={hotelId:hotel.id,name:hotel.name,ref:'DEMO-1842',ride:s.includeRide,status:'confirmed',total,credit,contribution,confirmedAt:clock(s)};
   return withReply(s,'Your example reservation at '+hotel.name+' is confirmed'+(s.includeRide?' with a group ride.':'.')+' Please tell us when your group is inside.',{booking,incident:{...s.incident,status:'booked'},entered:false});
  }
  case 'CANCEL_BOOKING': {
   if(!s.data||!s.booking||s.booking.status!=='confirmed')return s;
   const originalEntryConfirmed=s.entered&&s.tripStatus==='checked-in';
   return withReply(s,originalEntryConfirmed?'The sample alternative stay was cancelled. Your confirmed entry at Cedar House remains recorded.':'The sample alternative stay was cancelled. Your arrival issue is open until working entry or a different stay is confirmed.',{booking:{...s.booking,status:'cancelled',cancelReason:text(a.reason,180),cancelledAt:clock(s)},entered:originalEntryConfirmed,incident:s.incident?(originalEntryConfirmed?s.incident:{...s.incident,status:'options',outcome:null}):null});
  }
  case 'CONFIRM_ENTRY': if(s.battery<=0)return s;return event(s,{entered:true,tripStatus:'checked-in',...(s.incident?{incident:{...s.incident,status:'resolved',outcome:'Guest confirmed entry at Cedar House.',resolvedAt:clock(s)}}:{})},'Guest confirmed successful entry at the original property. Arrival resolved.');
  case 'CONFIRM_ARRIVAL': if(s.battery<=0||!s.booking||s.booking.status!=='confirmed')return s;return event(s,{entered:true,tripStatus:'relocated',booking:{...s.booking,status:'arrived',arrivedAt:clock(s)},incident:s.incident?{...s.incident,status:'resolved',outcome:'Guest confirmed arrival at '+s.booking.name+'.',resolvedAt:clock(s)}:null},'Guest confirmed the group is inside '+s.booking.name+'. Arrival resolved.');
  case 'SUPPORT_RESOLVE': if(!s.data||!s.incident||(!s.entered&&s.booking?.status!=='arrived'))return s;return event(s,{incident:{...s.incident,status:'resolved',outcome:text(a.outcome||'Guest arrival confirmed.',180),resolvedAt:clock(s)}},'Support closed the incident after actual guest arrival confirmation.');
  case 'SET_CONNECTION': {
   if(!['online','data-off','none'].includes(a.value))return s;
   const data=a.value==='online',cell=a.value!=='none';
   return event(s,onlinePatch(s,data,cell),data?'Connection restored. Queued messages and reports were sent, without assuming support receipt.':cell?'Mobile data unavailable. Saved content remains available; calls may work.':'No cellular service. Calls, SMS and new requests cannot leave this device.');
  }
  case 'SET_ENV': {
   if(a.key==='battery'){const value=Math.max(0,Math.min(100,Math.round(Number(a.value)||0)));return event(s,{battery:value,...(value<5?{saver:true}:{})},'Sample battery set to '+value+'%.');}
   if(a.key==='data')return reducer(s,{type:'SET_CONNECTION',value:a.value?'online':s.cell?'data-off':'none'});
   if(a.key==='cell')return reducer(s,{type:'SET_CONNECTION',value:a.value?(s.data?'online':'data-off'):'none'});
   if(['hotelAvailability','hostAvailable','fallbackReady'].includes(a.key))return event(s,{[a.key]:bool(a.value)},'Sample condition updated: '+a.key+' '+(a.value?'available':'unavailable')+'.');
   return s;
  }
  case 'ADVANCE_TIME': {
   const minutes=Math.max(0,Math.min(60,Math.round(Number(a.value)||0)));if(!minutes)return s;
   return event(s,{clockMinute:s.clockMinute+minutes,elapsed:s.elapsed+minutes,supportElapsed:s.supportElapsed+(s.incident?.receivedAt?minutes:0)},'Scenario advanced by '+minutes+' minutes. Support time advances only after receipt.');
  }
  case 'SCENARIO': {
   const value=a.value;
   if(value==='normal')return event(s,{...onlinePatch(s,true,true),battery:62,saver:false,lockStatus:'ready',hotelAvailability:true,hostAvailable:true,fallbackReady:true},'Standard arrival conditions restored. Existing trip progress is preserved.');
   if(value==='low')return event(s,{battery:3,saver:true,...onlinePatch(s,false,true)},'Scenario: 3% battery and no mobile data. Saved content remains available.');
   if(value==='no-signal')return event(s,onlinePatch(s,false,false),'Scenario: no cellular service. Existing confirmations remain saved.');
   if(value==='jam')return event(s,{lockStatus:'jam',diagnosticStep:0},'Scenario: primary lock has a mechanical jam. A new code cannot repair it.');
   if(value==='no-pack')return reducer({...s,...onlinePatch(s,false,true)},{type:'REMOVE_PACK'});
   if(value==='stale'){
    const version=Math.max(s.latestVersion,s.packVersion+1),publishedPlan={...s.publishedPlan,code:'9274',version,verifiedAt:clock(s)};
    return event(s,{latestVersion:version,hostVersion:version,publishedPlan,hostDraft:{...s.hostDraft,code:'9274'}},'Scenario: host published a newer sample code. Existing local copies remain unchanged.');
   }
   if(value==='no-availability')return event(s,{hotelAvailability:false},'Scenario: no alternative room has confirmed availability. Keep assistance pending.');
   if(value==='dead')return event(s,{battery:0,saver:true},'Scenario: original device is out of power. Its screen cannot show access details.');
   return s;
  }
  default:return s;
 }
}

export function loadState(){
 const initial=createInitialState();
 try{
  if(typeof localStorage==='undefined')return initial;
  const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(!raw||raw.schemaVersion!==1||!Array.isArray(raw.party)||!Array.isArray(raw.events)||!Number.isFinite(raw.latestVersion))return initial;
  const state={...initial};
  for(const key of Object.keys(initial))if(Object.prototype.hasOwnProperty.call(raw,key))state[key]=raw[key];
  for(const key of ['data','cell','saver','packSaved','peerSaved','peerAccepted','peerRevocationPending','hostAvailable','fallbackReady','entered','reviewApproved','hotelAvailability','includeRide','notifications','largeText','locationSharing'])state[key]=typeof state[key]==='boolean'?state[key]:initial[key];
  state.battery=Math.max(0,Math.min(100,Number(state.battery)||0));
  if(state.battery<5)state.saver=true;
  state.clockMinute=Math.max(45,Number(state.clockMinute)||45);
  state.sequence=Math.max(2,Number(state.sequence)||2);
  for(const key of ['messages','supportMessages','party','events'])if(!Array.isArray(state[key]))state[key]=initial[key];
  state.events=state.events.slice(-200);
  state.guestName=text(state.guestName,80)||'Meera';
  state.emergencyContact=text(state.emergencyContact,180);
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(state.arrivalTime))state.arrivalTime='01:45';
  state.hostDraft={...draftPlan,...cleanPlan(state.hostDraft)};
  if(!state.publishedPlan||!validPlan(cleanPlan(state.publishedPlan)))state.publishedPlan=copyPlan(initial.publishedPlan);
  state.latestVersion=Math.max(4,Math.round(Number(state.latestVersion)||4));
  state.packVersion=Math.max(1,Math.round(Number(state.packVersion)||4));
  if(state.packSaved&&(!state.packSnapshot||!validPlan(cleanPlan(state.packSnapshot)))){state.packSaved=false;state.packSnapshot=null;}
  if(state.peerSaved&&(!state.companionSnapshot||!validPlan(cleanPlan(state.companionSnapshot)))){state.peerSaved=false;state.companionSnapshot=null;}
  if(state.incident&&(!incidentStates.includes(state.incident.status)||!state.incident.id))state.incident=null;
  if(state.booking&&(!hotelData[state.booking.hotelId]||!['confirmed','arrived','cancelled'].includes(state.booking.status)))state.booking=null;
  if(!hotelData[state.selectedHotel])state.selectedHotel='pine';
  if(!['primary','companion'].includes(state.connectedDevice))state.connectedDevice='primary';
  if(!['idle','pairing','accepted'].includes(state.shareStage))state.shareStage='idle';
  if(!['ready','code','dark','jam'].includes(state.lockStatus))state.lockStatus='ready';
  return state;
 }catch{return initial;}
}
