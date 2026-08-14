/* Ready or Not 公式サイト プロトタイプ用データ
   実装時はゲーム本体の POLICY_CARDS / DISASTER_CARDS / CITIES から生成する。

   ── 5色の構造（ゲーム本体のギャラリー分類と一致させること）──
   青 都市／赤 自然災害／紫 人為災害／緑 政策・シールド／黄 政策・即時
   各色は「代表カード1枚」を持ち、それを押すと同色の全カードが開く。 */

const RON_COLORS = [
  { id:'city',   name:'都市',        en:'CITY',     hue:'#388bfd',
    icon:'assets/icons/neon_city.webp',            dir:'cities', rep:'kobe',
    lead:'守る対象。すべて実在の都市で、それぞれが災害史を背負っている' },
  { id:'dis',    name:'自然災害',    en:'DISASTER', hue:'#f85149',
    icon:'assets/icons/neon_disaster.webp',        dir:'cards',  rep:'earthquake',
    lead:'いつ来るか誰にも分からない。順番も規模も選べない' },
  { id:'hum',    name:'人為災害',    en:'HUMAN',    hue:'#a371f7',
    icon:'assets/icons/neon_jinzai.webp',          dir:'cards',  rep:'rumor',
    lead:'脅威は自然だけではない。人がつくる災害もある' },
  { id:'shield', name:'政策・シールド', en:'SHIELD', hue:'#3fb950',
    icon:'assets/icons/neon_policy_shield.webp',   dir:'cards',  rep:'quake_wall',
    lead:'事前に置いて備える。起きてからでは、もう遅い' },
  { id:'inst',   name:'政策・即時',  en:'INSTANT',  hue:'#e3b341',
    icon:'assets/icons/neon_policy_instant.webp',  dir:'cards',  rep:'drill',
    lead:'その場で使う。訓練・情報・連携が、緊急時の行動を変える' },
];

const RON_CARDS = [
  /* 自然災害（赤） */
  {id:'earthquake', c:'dis', n:'地震',       r:'プレート境界の国に暮らす前提。備えの有無が被害を分ける'},
  {id:'tsunami',    c:'dis', n:'津波',       r:'海岸都市に追加被害。地形が曝露の大きさを決める'},
  {id:'flood',      c:'dis', n:'洪水',       r:'水害は最も頻度が高い。堤防と避難の両輪で備える'},
  {id:'typhoon',    c:'dis', n:'台風',       r:'手札を奪う。備蓄が尽きる状況を再現する'},
  {id:'wildfire',   c:'dis', n:'大火災',     r:'延焼は地震の二次災害としても起きる'},
  {id:'landslide',  c:'dis', n:'土砂崩れ',   r:'山間の都市に追加被害。地形リスクの現れ'},
  {id:'compound',   c:'dis', n:'複合災害',   r:'対応する余裕を奪う。同時多発の恐ろしさ'},
  /* 人為災害（紫） */
  {id:'pollution',  c:'hum', n:'公害',       r:'人がつくる災害。自然災害だけが脅威ではない'},
  {id:'terror',     c:'hum', n:'テロ攻撃',   r:'対応の余地を奪う。想定外への備えを問う'},
  {id:'rumor',      c:'hum', n:'デマ拡散',   r:'社会的脆弱性。情報の混乱が被害を広げる'},
  /* 政策・シールド（緑） */
  {id:'quake_wall', c:'shield', n:'耐震補強',   r:'事前投資の代表。1981年の新耐震基準に基づく構造強化'},
  {id:'dam',        c:'shield', n:'堤防建設',   r:'ハード対策。高コストだが特定の災害に確実に効く'},
  {id:'evacuation', c:'shield', n:'広域避難指示', r:'逃げるという判断の制度化。特殊効果を打ち消す'},
  {id:'bousai_cho', c:'shield', n:'防災庁設置', r:'恒久的な体制づくり。2025年に日本で実際に設置された'},
  /* 政策・即時（黄） */
  {id:'drill',      c:'inst', n:'避難訓練',   r:'ソフト対策。訓練が緊急時の行動を変える'},
  {id:'agreement',  c:'inst', n:'相互支援協定', r:'自治体間の広域連携。大きく立て直せる'},
  {id:'hazard_map', c:'inst', n:'ハザードマップ整備', r:'情報整備が選択肢を広げる。備えの前提は情報'},
  {id:'rolling_stock', c:'inst', n:'ローリングストック', r:'備蓄は回して更新し続けてこそ機能する'},
];

const RON_CITIES = [
  {id:'kobe',        c:'city', n:'神戸',           r:'1995年 阪神・淡路大震災。復興が防災投資を制度化した'},
  {id:'sendai',      c:'city', n:'仙台',           r:'2011年 東日本大震災。仙台防災枠組が世界の政策を変えた'},
  {id:'tokyo',       c:'city', n:'東京',           r:'1923年 関東大震災。首都直下地震という最大の宿題'},
  {id:'osaka',       c:'city', n:'大阪',           r:'地下街と高潮。南海トラフに向き合う西日本の中枢'},
  {id:'nagoya',      c:'city', n:'名古屋',         r:'1959年 伊勢湾台風。日本初の災害対策基本法を生んだ'},
  {id:'kumamoto',    c:'city', n:'熊本',           r:'2016年 熊本地震。前震と本震、想定外への適応'},
  {id:'niigata',     c:'city', n:'新潟',           r:'1964年 新潟地震。液状化研究の原点となった'},
  {id:'hiroshima',   c:'city', n:'広島',           r:'2014年 8月豪雨。山地に囲まれた地形と土砂災害'},
  {id:'kagoshima',   c:'city', n:'鹿児島',         r:'桜島と共生する。ゼロリスクを目指さない防災哲学'},
  {id:'rotterdam',   c:'city', n:'ロッテルダム',   r:'国土の1/4が海面下。水と共存するオランダ型防災'},
  {id:'new_orleans', c:'city', n:'ニューオーリンズ', r:'2005年 ハリケーン・カトリーナ。堤防決壊と避難の失敗'},
  {id:'istanbul',    c:'city', n:'イスタンブール', r:'北アナトリア断層直上。事後学習型防災の現実'},
];

/* 色IDから、その色に属する全カード（都市を含む）を引く */
function ronCardsOf(colorId){
  return colorId === 'city'
    ? RON_CITIES
    : RON_CARDS.filter(function(c){ return c.c === colorId; });
}
/* カードの画像パス。都市だけ cities/ に入っている */
function ronImg(card){
  return (card.c === 'city' ? 'assets/cities/' : 'assets/cards/') + card.id + '.webp';
}
