import {createInitialState as createArrival,reducer as arrivalReducer} from './prototype-store.js';
export const STORAGE_KEY='airbnb-arrival-ready-v3';
const market={schemaVersion:3,showAdditions:true,signedIn:true,helpTopic:'arrival',changeRequest:null,selectedListing:'cedar-house',searchDestination:'',searchStart:'2026-11-20',searchEnd:'2026-11-23',searchGuests:4,searchChildren:0,searchInfants:0,searchCategory:'homes',wishlistIds:['cedar-house','pine-cabin'],wishlistName:'Next time in the hills',priceMax:12000,bedroomsMin:0,instantBook:false,propertyType:'all',searchSort:'recommended',tripTab:'upcoming',currency:'INR',language:'English',requestedStays:[]};
export function createInitialState(){return {...createArrival(),...market,coverageCap:4350,totalIncidentCap:4500,staffCost:150}}
export function reducer(s,a){
 if(a.type==='RESET')return createInitialState();
 if(a.type==='SET_MARKET'){
  if(!Object.hasOwn(market,a.key))return s;
  let v=a.value;
  if(['showAdditions','instantBook'].includes(a.key))v=!!v;
  else if(['searchGuests','priceMax','bedroomsMin'].includes(a.key))v=Math.max(a.key==='priceMax'?500:0,Math.min(a.key==='priceMax'?50000:a.key==='searchGuests'?16:8,Number(v)||0));
  else if(typeof market[a.key]==='string')v=String(v??'').trim().slice(0,120);
  return {...s,[a.key]:v};
 }
 if(a.type==='SELECT_LISTING')return {...s,selectedListing:String(a.id||a.value||'cedar-house').slice(0,80)};
 if(a.type==='TOGGLE_WISHLIST'){const id=String(a.id||a.value||'');return id?{...s,wishlistIds:s.wishlistIds.includes(id)?s.wishlistIds.filter(x=>x!==id):[...s.wishlistIds,id]}:s;}
 if(a.type==='REQUEST_STAY')return {...s,requestedStays:[...s.requestedStays,{id:a.id,at:new Date().toISOString()}]};
 return arrivalReducer(s,a);
}
export function loadState(){
 const initial=createInitialState();
 try{
  const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
  if(!raw||raw.schemaVersion!==3||!Array.isArray(raw.party)||!Array.isArray(raw.events))return initial;
  const s={...initial,...raw,coverageCap:4350,totalIncidentCap:4500,staffCost:150};
  for(const key of ['party','messages','supportMessages','events','wishlistIds','requestedStays']){
   if(!Array.isArray(s[key]))s[key]=initial[key];
  }
  s.events=s.events.slice(-200);
  if(!s.publishedPlan||!s.hostDraft)return initial;
  if(s.packSaved&&!s.packSnapshot){s.packSaved=false;s.packSnapshot=null;}
  s.battery=Math.max(0,Math.min(100,Number(s.battery)||0));
  if(s.booking){
   const previous=s.booking;
   const roomPrice=previous.hotelId==='cedar'?4200:3800;
   const total=Number.isFinite(previous.total)?previous.total:roomPrice+(previous.ride?350:0);
   const credit=Math.min(total,s.coverageCap);
   const platformCost=credit+s.staffCost;
   s.booking={...previous,total,credit,contribution:Math.max(0,total-credit),staffCost:s.staffCost,totalIncidentCap:s.totalIncidentCap,platformCost,headroom:Math.max(0,s.totalIncidentCap-platformCost)};
  }
  return s;
 }catch{return initial;}
}
