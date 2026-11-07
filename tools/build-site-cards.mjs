// node tools/build-site-cards.mjs [path/to/bousai-src]
import { readFile, writeFile, mkdir, copyFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.resolve(process.argv[2] || path.join(root, '../bousai-src'));
const out = path.join(root, 'site/assets/card-face');
const files = ['020_cards.js', '030_cities.js', '070_card-face.js', '075_card-text-lines.js'];
const code = (await Promise.all(files.map(f => readFile(path.join(source, 'src/data', f), 'utf8')))).join('\n');
const data = vm.runInNewContext(code + '\nJSON.stringify({cards:ALL_CARDS,cities:CITIES,nt:CARD_FACE_NT,layout:CARD_FACE_LAYOUT,text:CARD_FACE_TEXT,lines:CARD_FACE_LINES,nameFs:CARD_FACE_NAME_FS,nameMaxWidth:CARD_FACE_NAME_MAXW})', {}, {timeout:1000});
const raw = JSON.parse(data);
const records = [...raw.cards, ...raw.cities].map(c => {
  if (!raw.nt.includes(c.id)) throw new Error('Missing text-free face: ' + c.id);
  const city = c.type === undefined;
  const layout = city ? 'city' : c.type === 'disaster' ? 'nature' : c.type === 'jinzai' ? 'human' : c.color === 'green' ? 'policy_green' : 'policy_gold';
  const typeLabel = city ? c.isCoastal ? '海岸都市' : c.isMountain ? '山間部都市' : '内陸都市' : c.type === 'disaster' ? '自然' : c.type === 'jinzai' ? '人為' : c.color === 'green' ? 'シールド' : '即時';
  return {id:c.id,name:c.name,kind:city?'city':c.type,layout,typeLabel,cost:c.cost,power:c.baseDamage,hp:c.hp,terrain:city?(c.isCoastal?'coast':c.isMountain?'mountain':'inland'):undefined,description:c.realConcept || c.column || c.abilityDesc || c.desc,text:raw.text[c.id],co:raw.lines[c.id+'.co'],vs:raw.lines[c.id+'.vs'] || raw.lines[c.id+'.co']};
});
await mkdir(out, {recursive:true});
for (const c of records) {
  const folder = c.kind === 'city' ? 'cities' : 'cards';
  const src = path.join(root, 'images', folder, 'nt', c.id+'.webp');
  await access(src);
  await mkdir(path.join(out,folder),{recursive:true});
  await copyFile(src,path.join(out,folder,c.id+'.webp'));
}
await writeFile(path.join(out,'cards.json'),JSON.stringify({nameFs:raw.nameFs,nameMaxWidth:raw.nameMaxWidth,layout:raw.layout,cards:records},null,2)+'\n');
// Keep the game typography as the source of truth; website adaptations live below it.
const css = await readFile(path.join(source,'src/styles/085_card-face.css'),'utf8');
const extra = await readFile(path.join(out,'site.css'),'utf8');
await writeFile(path.join(out,'card-face.css'),css+'\n'+extra);
console.log(`Generated ${records.length} faces from ${source}`);
