// Only the most recent requested collection may update the visible panel.
export function createCollectionController({load,show,pending,failed}){
 let revision=0;
 return async function select(key,options={}){
  const request=++revision;
  pending(true,key);
  try{
   const image=await load(key);
   if(request!==revision)return {status:'superseded'};
   show(key,image,options);
   pending(false,key);
   return {status:'shown',key};
  }catch(error){
   if(request!==revision)return {status:'superseded'};
   pending(false,key);
   failed(key,error);
   return {status:'failed',key};
  }
 };
}
