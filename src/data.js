/* =====================================================================
   大富翁 4Fun · 复刻版 —— 数据层
   48 格棋盘 / 7 组 28 块地产 / 12 种道具 / 6 位神仙 / 4 支股票 / 24 张卡片
   ===================================================================== */

const N = 48;                 // 棋盘格数
const START_CASH = 20000;     // 初始现金
const PASS_GO = 2000;         // 经过起点
const PASS_GO_PTS = 150;      // 经过起点获得的点数
const MAX_ROUNDS = 40;        // 回合上限
const RENT = [0.15, 0.45, 0.9, 1.6, 2.6];   // 各等级租金系数
const UPG = [0.5, 0.8, 1.2, 1.8];           // 各级升级费用系数
const LV_NAME = ['空地', '木屋', '洋房', '大楼', '摩天楼'];
const LV_ICON = ['', '🏠', '🏡', '🏢', '🏬'];
const MAX_LV = 4;
const INTEREST = 0.05;        // 银行存款回合利息
const GOD_TURNS = 4;          // 神仙附身回合数

const GROUPS = {
  hua:  {name: '华北',   color: '#a0522d'},
  dong: {name: '华东',   color: '#e2564d'},
  nan:  {name: '华南',   color: '#f0942c'},
  jk:   {name: '日韩',   color: '#4caf7d'},
  sea:  {name: '东南亚', color: '#4a90d9'},
  eu:   {name: '欧洲',   color: '#9a6bd0'},
  am:   {name: '美洲',   color: '#d94f8a'},
};

/* ---------------- 棋盘 ---------------- */
const TILES = [
  {type:'start',    name:'起点'},
  {type:'prop',     name:'北京',      group:'hua',  price:600},
  {type:'prop',     name:'天津',      group:'hua',  price:650},
  {type:'chance',   name:'机会'},
  {type:'prop',     name:'济南',      group:'hua',  price:700},
  {type:'prop',     name:'青岛',      group:'hua',  price:750},
  {type:'store',    name:'道具店'},
  {type:'prop',     name:'上海',      group:'dong', price:900},
  {type:'prop',     name:'杭州',      group:'dong', price:950},
  {type:'fate',     name:'命运'},
  {type:'prop',     name:'苏州',      group:'dong', price:1000},
  {type:'prop',     name:'南京',      group:'dong', price:1050},
  {type:'jail',     name:'监狱'},
  {type:'tax',      name:'税务局'},
  {type:'prop',     name:'广州',      group:'nan',  price:1200},
  {type:'prop',     name:'深圳',      group:'nan',  price:1250},
  {type:'chance',   name:'机会'},
  {type:'prop',     name:'厦门',      group:'nan',  price:1300},
  {type:'prop',     name:'香港',      group:'nan',  price:1400},
  {type:'stock',    name:'证券交易所'},
  {type:'prop',     name:'东京',      group:'jk',   price:1500},
  {type:'prop',     name:'大阪',      group:'jk',   price:1550},
  {type:'news',     name:'新闻'},
  {type:'prop',     name:'首尔',      group:'jk',   price:1600},
  {type:'hospital', name:'医院'},
  {type:'prop',     name:'釜山',      group:'jk',   price:1650},
  {type:'fate',     name:'命运'},
  {type:'prop',     name:'新加坡',    group:'sea',  price:1800},
  {type:'prop',     name:'曼谷',      group:'sea',  price:1800},
  {type:'bank',     name:'银行'},
  {type:'prop',     name:'吉隆坡',    group:'sea',  price:1900},
  {type:'prop',     name:'巴厘岛',    group:'sea',  price:1950},
  {type:'chance',   name:'机会'},
  {type:'prop',     name:'巴黎',      group:'eu',   price:2100},
  {type:'prop',     name:'伦敦',      group:'eu',   price:2200},
  {type:'store',    name:'道具店'},
  {type:'park',     name:'停车场'},
  {type:'prop',     name:'罗马',      group:'eu',   price:2150},
  {type:'prop',     name:'柏林',      group:'eu',   price:2100},
  {type:'fate',     name:'命运'},
  {type:'prop',     name:'纽约',      group:'am',   price:2500},
  {type:'prop',     name:'洛杉矶',    group:'am',   price:2400},
  {type:'tax',      name:'税务局'},
  {type:'prop',     name:'拉斯维加斯',group:'am',   price:2600},
  {type:'prop',     name:'里约',      group:'am',   price:2300},
  {type:'chance',   name:'机会'},
  {type:'temple',   name:'土地庙'},
  {type:'fate',     name:'命运'},
];

/* ---------------- 角色（含专属特技） ---------------- */
const CHARS = [
  {id:'tu',   name:'阿土伯',   color:'#5aa86a', tag:'勤俭农夫', skill:'买地 9 折，经过起点多领 $300'},
  {id:'mei',  name:'孙小美',   color:'#e86a9a', tag:'甜心主播', skill:'收到的租金 +25%'},
  {id:'qian', name:'钱夫人',   color:'#9a6bd0', tag:'豪门贵妇', skill:'存款利息翻倍，过起点多领 $500'},
  {id:'sha',  name:'沙隆巴斯', color:'#e8913c', tag:'沙漠商人', skill:'付出的租金 -20%'},
  {id:'nin',  name:'忍太郎',   color:'#3f8c95', tag:'东洋忍者', skill:'坐牢住院 -1 回合 · 踩雷减半'},
  {id:'wu',   name:'乌咪',     color:'#c9a227', tag:'猫眼少女', skill:'每回合 28% 概率白捡一件道具'},
];

/* ---------------- 道具（点数购买） ---------------- */
const ITEMS = [
  {id:'dice',    name:'遥控骰子', icon:'🎲', cost:80,  desc:'指定下一次掷出的总点数（2-12）'},
  {id:'block',   name:'路障',     icon:'🚧', cost:100, desc:'在前方 3-9 格放路障，谁经过都得停下'},
  {id:'mine',    name:'地雷',     icon:'💣', cost:120, desc:'在前方埋雷，踩到住院 3 回合并赔 $1500'},
  {id:'tp',      name:'传送卡',   icon:'🌀', cost:150, desc:'立刻传送到指定地点，跳过本次掷骰'},
  {id:'rich',    name:'均富卡',   icon:'⚖️', cost:200, desc:'所有玩家的现金重新平分'},
  {id:'buycard', name:'购地卡',   icon:'🏷️', cost:180, desc:'按 1.5 倍投资额强买对手一块地'},
  {id:'wreck',   name:'拆迁卡',   icon:'🔨', cost:140, desc:'把对手一栋楼拆回空地'},
  {id:'free',    name:'免费卡',   icon:'🎫', cost:100, desc:'下次付租金全免，自动生效'},
  {id:'swap',    name:'换地卡',   icon:'🔄', cost:220, desc:'用自己一块地换对手一块地'},
  {id:'reverse', name:'转向卡',   icon:'↩️', cost:60,  desc:'调头往回走，再使用一次恢复'},
  {id:'turtle',  name:'乌龟卡',   icon:'🐢', cost:160, desc:'指定对手 2 回合只能走 1-2 步'},
  {id:'angel',   name:'天使卡',   icon:'😇', cost:200, desc:'3 回合内免租金、免疫倒霉事件'},
];
const ITEM_MAP = Object.fromEntries(ITEMS.map(i => [i.id, i]));

/* ---------------- 神仙 ---------------- */
const GODS = {
  cai:  {name:'财神',   icon:'💰', good:true,  desc:'收租 ×2，过起点奖金 ×2'},
  tudi: {name:'土地公', icon:'⛩️', good:true,  desc:'停在自己地产免费升级'},
  fu:   {name:'福神',   icon:'🌟', good:true,  desc:'每次多走 2 步，抽卡偏好运'},
  angel:{name:'天使',   icon:'😇', good:true,  desc:'免付租金，免疫负面事件'},
  qiong:{name:'穷神',   icon:'😈', good:false, desc:'付租 ×2，每回合损失现金'},
  shuai:{name:'衰神',   icon:'☠️', good:false, desc:'每次少走 1 步，容易倒霉'},
};

/* ---------------- 股票 ---------------- */
const STOCK_DEFS = [
  {id:'tech', name:'科技',   code:'KJ', base:120},
  {id:'land', name:'地产',   code:'DC', base:80},
  {id:'bank', name:'金融',   code:'JR', base:100},
  {id:'oil',  name:'能源',   code:'NY', base:60},
];

/* ---------------- 机会（偏好事） ---------------- */
const CHANCE_CARDS = [
  {icon:'🎉', title:'中了彩票', text:'手气爆棚，奖金 <b>$5,000</b> 直接进账！',
   fn: async p => gain(p, 5000)},
  {icon:'📈', title:'股市内幕', text:'你提前听到风声，<b>随机一支股票暴涨 20%</b>（持有的人爽了）。',
   fn: async p => { const s = pick(S.stocks); s.price = Math.round(s.price * 1.2); log(`📈 ${s.name}股暴涨到 ${fmt(s.price)}`); }},
  {icon:'🎁', title:'神秘礼盒', text:'拆开礼盒，得到 <b>一件随机道具</b>。',
   fn: async p => { const it = pick(ITEMS); addItem(p, it.id, 1); log(`🎁 ${p.name} 获得「${it.name}」`); }},
  {icon:'🧧', title:'财神降临', text:'财神爷看中了你，<b>附身 ${GOD_TURNS} 回合</b>：收租翻倍！',
   fn: async p => attachGod(p, 'cai')},
  {icon:'🏦', title:'银行分红', text:'你的存款拿到 <b>10% 分红</b>（至少 $500）。',
   fn: async p => { const b = Math.max(500, Math.round(p.savings * 0.1)); gain(p, b); }},
  {icon:'🚗', title:'搭顺风车', text:'好心人载你一程，<b>前进 3 格</b>。',
   fn: async p => { await moveSteps(p, 3, 1); await resolveTile(p, 1); }},
  {icon:'🎂', title:'生日礼金', text:'今天生日，其他玩家每人送你 <b>$800</b>。',
   fn: async p => { for (const q of S.players) if (q.alive && q !== p) await payMoney(q, 800, p.id, true); }},
  {icon:'🏛️', title:'政府补贴', text:'旧城改造，<b>每块地名下 $300</b> 补贴。',
   fn: async p => { const amt = p.props.length * 300; if (amt) gain(p, amt); else toast('没有地产，一分钱也没拿到'); }},
  {icon:'✈️', title:'免费旅游', text:'机票中奖，直接飞回<b>起点</b>并领过路费。',
   fn: async p => { p.pos = 0; passGo(p, true); renderPawns(); }},
  {icon:'🎤', title:'才艺大赛', text:'你的表演拿了冠军，<b>+$2,000 与 80 点数</b>。',
   fn: async p => { gain(p, 2000); p.pts += 80; }},
  {icon:'😇', title:'天使庇佑', text:`天使降到肩头，<b>${GOD_TURNS} 回合免租金</b>。`,
   fn: async p => attachGod(p, 'angel')},
  {icon:'🔨', title:'强拆补偿', text:'对手一栋楼被拆，<b>补偿你 $1,200</b>。',
   fn: async p => { const cand = allPropsOfOthers(p).filter(t => t.level > 0);
     if (cand.length) { const t = pick(cand); t.level = 0; refreshTile(t.i); log(`🔨 「${t.name}」被拆回空地`); }
     gain(p, 1200); }},
];

/* ---------------- 命运（偏坏事） ---------------- */
const FATE_CARDS = [
  {icon:'📉', title:'股票大跌', bad:true, text:'抄底抄在半山腰，<b>亏损 $1,500</b>。',
   fn: async p => { await payMoney(p, 1500); }},
  {icon:'🏥', title:'食物中毒', bad:true, text:'路边摊吃坏肚子，<b>住院 2 回合</b>。',
   fn: async p => sendHospital(p, 2)},
  {icon:'🧾', title:'税务稽查', bad:true, text:'账目不清，<b>现金的 8%</b> 被收进停车奖池。',
   fn: async p => { const tax = Math.round(p.cash * 0.08); if (tax > 0) { const ok = await payMoney(p, tax); if (ok) { S.pot += tax; renderPark(); } } }},
  {icon:'😈', title:'穷神缠身', bad:true, text:`穷神跟上了你，<b>${GOD_TURNS} 回合付租翻倍</b>。`,
   fn: async p => attachGod(p, 'qiong')},
  {icon:'☠️', title:'衰神附体', bad:true, text:`衰神拍了拍你的肩，<b>${GOD_TURNS} 回合少走 1 步</b>。`,
   fn: async p => attachGod(p, 'shuai')},
  {icon:'🧭', title:'迷路了', bad:true, text:'方向感出走，<b>后退 3 格</b>。',
   fn: async p => { await moveSteps(p, 3, -1); await resolveTile(p, 1); }},
  {icon:'🤝', title:'朋友借钱', bad:true, text:'老友开口不好拒绝，<b>给最穷的玩家 $1,000</b>。',
   fn: async p => { const poorest = S.players.filter(q => q.alive && q !== p).sort((a, b) => totalAssets(a) - totalAssets(b))[0];
     if (poorest) await payMoney(p, 1000, poorest.id); }},
  {icon:'🚑', title:'车祸', bad:true, text:'被电动车撞了，<b>住院 3 回合</b>并付医药费 $800。',
   fn: async p => { await payMoney(p, 800); await sendHospital(p, 3); }},
  {icon:'🔧', title:'房屋维修', bad:true, text:'台风过境，<b>每栋建筑维修费 $400</b>。',
   fn: async p => { const n = p.props.filter(i => S.tiles[i].level > 0).length; if (n) await payMoney(p, n * 400); else toast('没有建筑，逃过一劫'); }},
  {icon:'❤️', title:'慈善捐款', bad:true, text:'你慷慨解囊，<b>现金的 5%</b> 捐给最穷的人。',
   fn: async p => { const amt = Math.round(p.cash * 0.05); const poorest = S.players.filter(q => q.alive && q !== p).sort((a, b) => totalAssets(a) - totalAssets(b))[0];
     if (amt > 0 && poorest) await payMoney(p, amt, poorest.id); }},
  {icon:'👮', title:'闯红灯被逮', bad:true, text:'交警把你送进<b>监狱反省 2 回合</b>。',
   fn: async p => sendJail(p, 2)},
  {icon:'💰', title:'意外之财', text:'旧衣服口袋里翻出一张支票，<b>+$3,000</b>。',
   fn: async p => gain(p, 3000)},
];

/* ---------------- 新闻（全局事件） ---------------- */
const NEWS = [
  {title:'央行降息', text:'存款利率临时下调，本回合利息减半。', fn: () => { S.interestMod = 0.5; }},
  {title:'股市沸腾', text:'资金涌入，随机一支股票暴涨 18%。',
   fn: () => { const s = pick(S.stocks); s.price = Math.round(s.price * 1.18); return `${s.name}股大涨至 ${fmt(s.price)}`; }},
  {title:'房市调控', text:'租金管制，本回合所有租金 -25%。', fn: () => { S.rentMod = 0.75; }},
  {title:'通货膨胀', text:'物价上涨，每位玩家现金 -3%。',
   fn: () => { S.players.filter(p => p.alive).forEach(p => { p.cash = Math.round(p.cash * 0.97); }); }},
  {title:'慈善晚宴', text:'最富的人要捐 10% 现金给最穷的人。',
   fn: () => { const list = S.players.filter(p => p.alive).sort((a, b) => totalAssets(b) - totalAssets(a));
     const rich = list[0], poor = list[list.length - 1];
     if (rich && poor && rich !== poor) { const amt = Math.round(rich.cash * 0.1); rich.cash -= amt; poor.cash += amt;
       log(`❤️ ${rich.name} 捐出 ${fmt(amt)} 给 ${poor.name}`); } }},
  {title:'城市改建', text:'随机一块地产免费升一级。',
   fn: () => { const cand = S.tiles.filter(t => isProp(t) && t.owner != null && t.level < MAX_LV);
     if (!cand.length) return '没有可改建的地产';
     const t = pick(cand); t.level++; refreshTile(t.i);
     return `「${t.name}」升级为${LV_NAME[t.level]}`; }},
  {title:'税务稽查', text:'现金最多的人被追缴 8% 税款（进奖池）。',
   fn: () => { const p = S.players.filter(x => x.alive).sort((a, b) => b.cash - a.cash)[0];
     const amt = Math.round(p.cash * 0.08); p.cash -= amt; S.pot += amt; renderPark();
     return `${p.name} 缴税 ${fmt(amt)}`; }},
  {title:'科技突破', text:'科技股涨停，价格上涨 22%。',
   fn: () => { const s = S.stocks.find(x => x.id === 'tech'); s.price = Math.round(s.price * 1.22); return `科技股 ${fmt(s.price)}`; }},
  {title:'旅游旺季', text:'酒店爆满，本回合租金 +20%。', fn: () => { S.rentMod = 1.2; }},
  {title:'地王诞生', text:'随机一位玩家获得 200 点数。',
   fn: () => { const p = pick(S.players.filter(x => x.alive)); p.pts += 200; return `${p.name} 获得 200 点数`; }},
  {title:'慈善彩票', text:'每位玩家获得 $600 红包。',
   fn: () => { S.players.filter(p => p.alive).forEach(p => { p.cash += 600; }); }},
];
