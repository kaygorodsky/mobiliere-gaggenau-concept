// Only verified source data participates in matching. No availability or compatibility is inferred.
export function buildRecommendations(products,answers){
 return answers.categories.map(category=>{
  if(category==='Аксессуары')return{category,products:[],note:'Подберём аксессуары после согласования моделей: важно проверить совместимость каждого артикула.'};
  let candidates=products.filter(p=>p.category===category);
  if(answers.series!=='any'&&candidates.some(p=>p.series))candidates=candidates.filter(p=>p.series===answers.series);
  if(['Духовой шкаф','Духовой шкаф с паром'].includes(category)&&answers.width!=='any')candidates=candidates.filter(p=>p.width===Number(answers.width));
  candidates=[...candidates].sort((a,b)=>(a.width===60?0:1)-(b.width===60?0:1));
  return{category,products:candidates.slice(0,2),note:'В проверенной подборке нет модели с таким сочетанием коллекции и ширины. Измените ответы или обсудите альтернативу с консультантом.'};
 });
}
