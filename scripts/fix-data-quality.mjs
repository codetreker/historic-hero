import fs from 'node:fs';

const PERSONS_PATH = 'data/persons.json';
const RELATIONSHIPS_PATH = 'data/relationships.json';
const EVENTS_PATH = 'data/events.json';

const persons = JSON.parse(fs.readFileSync(PERSONS_PATH, 'utf8'));
const relationships = JSON.parse(fs.readFileSync(RELATIONSHIPS_PATH, 'utf8'));
const events = JSON.parse(fs.readFileSync(EVENTS_PATH, 'utf8'));

const zhWiki = (name) => `https://zh.wikipedia.org/wiki/${name}`;

const newPersons = [
  ['han-ding-yuan', '丁原', '建阳', '并州刺史', 'han', ['warlord', 'official'], null, 189, '并州', '东汉末年并州刺史，吕布早年依附的主君，后在董卓入京后的权力斗争中被吕布所杀。'],
  ['other-lady-yan', '严氏', null, '吕布妻', 'other', ['noblewoman'], null, null, '并州', '吕布正妻，见于吕布被围下邳时期的记载，曾劝阻吕布轻率出城。'],
  ['other-gao-shun', '高顺', null, '陷阵营统领', 'other', ['general'], null, 199, '并州', '吕布麾下名将，以统率陷阵营著称，曾击破刘备军，吕布败亡后一同被处死。'],
  ['other-chen-gong', '陈宫', '公台', '谋士', 'other', ['advisor', 'official'], null, 199, '兖州东郡', '东汉末年谋士，先助曹操入主兖州，后投吕布，在下邳之战后被曹操处死。'],
  ['other-bo-cai', '波才', null, '黄巾军将领', 'other', ['rebel', 'general'], null, 184, '豫州', '黄巾之乱豫州方面首领，曾在长社围攻皇甫嵩、朱儁军。'],
  ['other-peng-tuo', '彭脱', null, '黄巾军将领', 'other', ['rebel', 'general'], null, 184, '汝南', '黄巾之乱汝南、颍川一带的黄巾首领之一，后被东汉军击败。'],
  ['other-zhang-mancheng', '张曼成', null, '神上使', 'other', ['rebel', 'general'], null, 184, '南阳', '黄巾之乱南阳渠帅，自称神上使，攻杀南阳太守褚贡，后为秦颉所破。'],
  ['other-han-zhong-yt', '韩忠', null, '黄巾军将领', 'other', ['rebel', 'general'], null, 184, '南阳', '南阳黄巾军将领，在张曼成死后继续据守宛城，后向朱儁投降被杀。'],
  ['other-zhao-hong', '赵弘', null, '黄巾军将领', 'other', ['rebel', 'general'], null, 184, '南阳', '南阳黄巾军将领，张曼成死后继起，被朱儁等东汉军击破。'],
  ['other-bu-ji', '卜己', null, '黄巾军将领', 'other', ['rebel', 'general'], null, 184, '东郡', '黄巾之乱东郡渠帅，曾据守仓亭一带，后被皇甫嵩讨平。'],
  ['other-guan-cheng', '管承', null, '海贼首领', 'other', ['rebel'], null, null, '青州', '汉末青州海贼首领，曾割据沿海，被曹操部将讨平。'],
  ['other-zhang-yan', '张燕', '飞燕', '平北将军', 'other', ['warlord', 'general'], null, null, '常山真定', '黑山军首领，聚众活跃于太行山一带，后接受曹操官爵。'],
  ['other-sui-gu', '眭固', '白兔', '黑山军将领', 'other', ['rebel', 'general'], null, 199, '河内', '黑山军将领，曾与张杨旧部往来，后被曹操军击败。'],
  ['other-bai-rao', '白绕', null, '黑山军将领', 'other', ['rebel', 'general'], null, null, '冀州', '黑山军将领之一，汉末在冀州、兖州边界活动。'],
  ['other-yu-du', '于毒', null, '黑山军将领', 'other', ['rebel', 'general'], null, null, '冀州', '黑山军将领，曾袭扰魏郡、东郡一带。'],
  ['other-yang-feng', '杨奉', null, '车骑将军', 'other', ['general', 'warlord'], null, 197, '河东', '白波军出身的汉末将领，护送汉献帝东归，后与曹操交战败亡。'],
  ['other-han-xian', '韩暹', null, '大将军', 'other', ['general', 'warlord'], null, null, '河东', '白波军将领，曾参与护送汉献帝东归洛阳，后与杨奉失势。'],
  ['other-hu-cai', '胡才', null, '白波军将领', 'other', ['rebel', 'general'], null, null, '河东', '白波军将领之一，汉献帝东归时曾与李乐、杨奉等护驾。'],
  ['other-li-le', '李乐', null, '白波军将领', 'other', ['rebel', 'general'], null, null, '河东', '白波军将领之一，参与汉献帝东归过程中的护卫与争夺。'],
  ['other-guo-tai', '郭太', null, '白波军首领', 'other', ['rebel'], null, null, '河东白波谷', '白波军首领，汉末黄巾余部之一，活跃于河东白波谷。'],
  ['other-sui-yuanjin', '眭元进', null, '袁绍部将', 'other', ['general'], null, 200, '冀州', '袁绍部将，官渡之战期间与韩猛等运粮，乌巢失利后被曹操军击破。'],
  ['other-chang-xi', '昌豨', null, '东海豪强', 'other', ['general', 'rebel'], null, 206, '东海', '泰山诸将之一，先后依附吕布、刘备、曹操，后反叛被于禁处置。'],
  ['other-sun-guan', '孙观', '仲台', '青州刺史', 'wei', ['general'], null, null, '泰山', '泰山诸将之一，后归附曹操，参与曹魏早期征战。'],
  ['other-yin-li', '尹礼', null, '泰山将领', 'wei', ['general'], null, null, '泰山', '泰山诸将之一，后随臧霸集团归附曹操。'],
  ['other-wu-dun', '吴敦', null, '泰山将领', 'wei', ['general'], null, null, '泰山', '泰山诸将之一，曾与臧霸、孙观等割据徐州、青州之间。'],
  ['other-chang-ba', '昌霸', null, '泰山将领', 'wei', ['general'], null, null, '泰山', '泰山诸将之一，属于臧霸集团，后归入曹魏势力。'],
  ['other-cao-xing', '曹性', null, '吕布部将', 'other', ['general'], null, null, '并州', '吕布部将，史载曾在濮阳、下邳一带随吕布军作战。'],
  ['other-hao-meng', '郝萌', null, '吕布部将', 'other', ['general'], null, 196, '河内', '吕布部将，曾在下邳反叛吕布，被高顺、曹性平定。'],
  ['other-cheng-lian', '成廉', null, '吕布骑将', 'other', ['general'], null, null, '并州', '吕布麾下骁将，曾随吕布与曹操、袁术等势力周旋。'],
  ['other-wei-xu', '魏续', null, '吕布部将', 'other', ['general'], null, null, '并州', '吕布部将，下邳之战时与侯成、宋宪等降曹。'],
  ['other-song-xian', '宋宪', null, '吕布部将', 'other', ['general'], null, null, '并州', '吕布部将，下邳被围时参与擒获陈宫、高顺并归降曹操。'],
  ['other-hou-cheng', '侯成', null, '吕布部将', 'other', ['general'], null, null, '并州', '吕布部将，下邳之战时率众归降曹操。'],
  ['shu-liu-yin', '柳隐', null, '巴郡太守', 'shu', ['general', 'official'], null, null, '益州', '蜀汉后期将领，曾守巴郡，蜀亡后入晋。'],
  ['shu-huo-jun', '霍峻', '仲邈', '梓潼太守', 'shu', ['general'], 178, 217, '南郡枝江', '刘备部将，入蜀后镇守葭萌关，以少数兵力抗拒刘璋军多年。'],
  ['shu-huo-yi', '霍弋', '绍先', '南中都督', 'shu', ['general', 'official'], null, null, '南郡枝江', '霍峻之子，蜀汉后期镇守南中，蜀亡后降晋。'],
  ['shu-luo-xian', '罗宪', '令则', '巴东太守', 'shu', ['general', 'official'], 218, 270, '襄阳', '蜀汉后期将领，蜀亡后坚守永安抵御吴军，后仕晋。'],
  ['shu-zong-yu', '宗预', '德艳', '镇军大将军', 'shu', ['diplomat', 'official'], null, 264, '南阳安众', '蜀汉官员、外交人物，多次出使东吴，蜀亡后迁徙洛阳。'],
  ['shu-mi-fang', '糜芳', '子方', '南郡太守', 'shu', ['general', 'official'], null, null, '东海朐县', '刘备妻族，曾任南郡太守，关羽北伐时与傅士仁降吴。'],
  ['shu-qin-mi', '秦宓', '子敕', '蜀汉大夫', 'shu', ['scholar', 'official'], null, 226, '广汉绵竹', '蜀汉学者、官员，以辩才和经学著称，曾与东吴使者张温论难。'],
  ['shu-wu-ban', '吴班', '元雄', '骠骑将军', 'shu', ['general'], null, null, '陈留', '蜀汉将领，吴懿族弟，曾参加夷陵之战及诸葛亮北伐。'],
  ['shu-chen-shi', '陈式', null, '蜀汉将领', 'shu', ['general'], null, null, '益州', '蜀汉将领，诸葛亮北伐时曾与魏延等攻取武都、阴平。'],
  ['shu-cheng-ji', '程畿', '季然', '从事祭酒', 'shu', ['official'], null, 222, '巴西阆中', '刘备入蜀后的官员，夷陵之战败退时不肯弃船逃生而死。'],
  ['wei-wang-hun', '王浑', '玄冲', '征东大将军', 'wei', ['general', 'official'], 223, 297, '太原晋阳', '曹魏、晋初将领，参与灭吴战略部署，后为西晋重臣。'],
  ['wei-wei-guan', '卫瓘', '伯玉', '司空', 'wei', ['general', 'official'], 220, 291, '河东安邑', '曹魏、晋初官员，参与平定钟会、姜维之乱，后为西晋重臣。'],
  ['wei-xun-yi', '荀顗', '景倩', '司空', 'wei', ['official'], 205, 274, '颍川颍阴', '荀彧之子，曹魏后期及西晋初年重臣，参与礼制建设。'],
  ['wei-sima-wang', '司马望', '子初', '司徒', 'wei', ['general', 'official'], 205, 271, '河内温县', '司马氏宗族，曹魏后期将领，曾镇守关中防御蜀汉北伐。'],
  ['wei-cao-xun', '曹训', null, '曹魏宗室', 'wei', ['official'], null, 249, '沛国谯县', '曹爽之弟，高平陵之变后与曹爽集团同被司马懿诛杀。'],
  ['wei-huan-fan', '桓范', '元则', '大司农', 'wei', ['advisor', 'official'], null, 249, '沛国龙亢', '曹魏官员，曹爽被司马懿控制后曾劝曹爽挟天子据许昌，失败后被杀。'],
  ['wei-wang-jing', '王经', '彦纬', '尚书', 'wei', ['general', 'official'], null, 260, '清河', '曹魏官员，曾任雍州刺史抵御姜维，后因同情曹髦被司马昭所杀。'],
  ['wei-xu-zhi', '徐质', null, '曹魏将领', 'wei', ['general'], null, 254, '魏国', '曹魏将领，姜维北伐时与蜀军交战，后战死。'],
  ['wu-wu-can', '吾粲', '孔休', '太子太傅', 'wu', ['official', 'scholar'], null, 245, '吴郡乌程', '东吴官员、名士，支持太子孙和，在二宫之争中被孙权下狱处死。'],
  ['wu-quan-duan', '全端', null, '东吴将领', 'wu', ['general'], null, null, '吴郡钱唐', '全琮族人，东吴后期将领，诸葛诞叛乱时率军赴寿春。'],
  ['wu-lu-yin', '陆胤', '敬宗', '交州刺史', 'wu', ['general', 'official'], null, null, '吴郡吴县', '陆逊族人，东吴将领，长期经营交州、广州地区。'],
  ['wu-quan-shang', '全尚', '子真', '城门校尉', 'wu', ['official'], null, 258, '吴郡钱唐', '东吴外戚，全皇后之父，孙綝政变时被杀。'],
  ['wu-quan-ji', '全纪', null, '黄门侍郎', 'wu', ['official'], null, 258, '吴郡钱唐', '全尚之子，参与孙亮谋诛孙綝，事泄被杀。'],
  ['wu-tao-huang', '陶璜', '世英', '交州牧', 'wu', ['general', 'official'], null, 290, '丹阳秣陵', '东吴后期至西晋初年将领，长期镇守交州。'],
  ['han-huang-zu', '黄祖', null, '江夏太守', 'han', ['general', 'official'], null, 208, '荆州', '刘表部将，长期镇守江夏，多次与孙坚、孙策、孙权交战。'],
  ['shu-zhao-lei', '赵累', null, '关羽部将', 'shu', ['general'], null, 219, '荆州', '关羽部将，随关羽守荆州，败走临沮时同被东吴俘杀。'],
  ['shu-fan-qiang', '范疆', null, '张飞部将', 'shu', ['general'], null, null, '蜀郡', '张飞帐下将领，与张达刺杀张飞后投奔东吴。'],
  ['shu-zhang-da', '张达', null, '张飞部将', 'shu', ['general'], null, null, '蜀郡', '张飞帐下将领，与范疆刺杀张飞后投奔东吴。'],
  ['wei-cheng-ji-regicide', '成济', null, '太子舍人', 'wei', ['officer'], null, 260, '魏国', '曹魏军官，受贾充指挥，在曹髦讨伐司马昭时弑杀曹髦。'],
  ['wei-cheng-cui', '成倅', null, '曹魏军官', 'wei', ['officer'], null, 260, '魏国', '成济之兄，曹髦之变后与成济同被处死。'],
  ['wei-linghu-yu', '令狐愚', '公治', '兖州刺史', 'wei', ['official', 'rebel'], null, 249, '太原', '曹魏官员，王凌外甥，与王凌密谋拥立楚王曹彪。'],
  ['wei-hu-lie', '胡烈', '玄武', '秦州刺史', 'wei', ['general'], null, 270, '安定临泾', '曹魏、晋初将领，参与灭蜀及平定钟会之乱。'],
  ['wei-tian-xu', '田续', null, '曹魏将领', 'wei', ['general'], null, null, '魏国', '曹魏将领，灭蜀后参与乱局，史载曾杀害姜维。'],
  ['wei-deng-zhong', '邓忠', null, '邓艾之子', 'wei', ['general'], null, 264, '义阳棘阳', '邓艾之子，随父参与灭蜀，后在钟会之乱后被杀。'],
  ['wei-shi-zuan', '师纂', null, '曹魏将领', 'wei', ['general'], null, 264, '魏国', '邓艾属官，参与灭蜀，后与邓艾父子同被杀。'],
  ['other-qu-yi', '麴义', null, '袁绍部将', 'other', ['general'], null, null, '凉州', '袁绍部将，以强弩兵击败公孙瓒白马义从，后被袁绍所杀。'],
  ['han-dong-cheng', '董承', null, '车骑将军', 'han', ['general', 'official'], null, 200, '冀州', '东汉外戚、将领，护送汉献帝东归，后参与衣带诏密谋反曹被杀。'],
  ['other-gongsun-xu', '公孙续', null, '公孙瓒之子', 'other', ['general'], null, 199, '辽西令支', '公孙瓒之子，易京被围时曾向黑山军求援。'],
  ['shu-meng-da', '孟达', '子度', '新城太守', 'shu', ['general'], null, 228, '扶风', '先仕刘璋、刘备，后降魏据新城，又谋归蜀，事泄为司马懿所破。'],
  ['wei-shen-yi', '申仪', null, '魏兴太守', 'wei', ['general', 'official'], null, null, '魏兴', '新城一带地方将领，孟达反魏时没有响应，后为司马懿所用。'],
  ['wei-hao-zhao', '郝昭', '伯道', '杂号将军', 'wei', ['general'], null, 229, '太原', '曹魏将领，守陈仓抵御诸葛亮第二次北伐，以寡敌众守城成功。'],
  ['other-gongsun-yuan', '公孙渊', '文懿', '燕王', 'other', ['warlord'], null, 238, '辽东襄平', '辽东公孙氏末代统治者，叛魏自立为燕王，被司马懿征灭。'],
  ['shu-guo-xiu', '郭修', null, '降将', 'shu', ['assassin', 'general'], null, 253, '魏国', '曹魏降将，入蜀后刺杀蜀汉大将军费祎。'],
  ['wu-bu-chan', '步阐', '仲思', '西陵督', 'wu', ['general', 'rebel'], null, 272, '临淮淮阴', '步骘之子，东吴西陵督，孙皓时叛吴降晋，引发西陵之战。'],
  ['wu-lu-yan', '陆晏', null, '裨将军', 'wu', ['general'], null, 280, '吴郡吴县', '陆抗之子，吴亡时参与抵抗晋军。'],
  ['wei-empress-guo', '郭太后', null, '明元郭皇后', 'wei', ['empress'], null, 264, '西平', '曹叡皇后，曹芳、曹髦时期为皇太后，参与曹魏后期废立事务。'],
  ['other-zhang-xiu', '张绣', null, '破羌将军', 'other', ['warlord', 'general'], null, 207, '武威祖厉', '董卓旧部张济之侄，割据宛城，后降曹操。'],
  ['han-huangfu-jianshou', '皇甫坚寿', null, '东汉官员', 'han', ['official'], null, null, '安定朝那', '皇甫嵩之子，汉末名臣之后。'],
  ['other-gongsun-kang', '公孙康', null, '襄平侯', 'other', ['warlord'], null, null, '辽东襄平', '辽东太守公孙度之子，继掌辽东，曾斩袁尚、袁熙首级献曹操。'],
  ['wu-gui-lan', '妫览', null, '丹阳将领', 'wu', ['general', 'rebel'], null, 204, '丹阳', '孙翊部下，参与杀害孙翊，后被孙翊旧部诛杀。']
].map(([id, name, courtesy_name, title, faction, roles, birth_year, death_year, birth_place, description]) => ({
  id,
  name,
  courtesy_name,
  title,
  faction,
  roles,
  birth_year,
  death_year,
  birth_place,
  description,
  source_urls: [zhWiki(name)]
}));

const personByName = new Map(persons.map((person) => [person.name, person]));
const personById = new Map(persons.map((person) => [person.id, person]));

for (const person of newPersons) {
  if (!personById.has(person.id) && !personByName.has(person.name)) {
    persons.push(person);
    personById.set(person.id, person);
    personByName.set(person.name, person);
  }
}

const idOf = (name) => {
  const person = personByName.get(name);
  if (!person) throw new Error(`Missing person for name: ${name}`);
  return person.id;
};

const relationshipKeys = new Set(relationships.map((rel) => `${rel.source}|${rel.target}|${rel.type}`));

const addRelationship = ({ source, target, type, label, description, bidirectional = false, start_year = null, end_year = null, source_urls }) => {
  const sourceId = idOf(source);
  const targetId = idOf(target);
  const key = `${sourceId}|${targetId}|${type}`;
  if (relationshipKeys.has(key)) return;
  relationshipKeys.add(key);
  relationships.push({
    id: `${sourceId}-${targetId}-${type}`.replace(/[^a-z0-9-]/g, '-'),
    source: sourceId,
    target: targetId,
    type,
    label,
    description,
    bidirectional,
    start_year,
    end_year,
    source_urls: source_urls ?? [zhWiki(source), zhWiki(target)]
  });
};

const service = (lord, vassal, start_year = null, end_year = null) => addRelationship({
  source: lord,
  target: vassal,
  type: 'lord-vassal',
  label: '君臣',
  description: `${vassal}曾依附或仕于${lord}势力。`,
  start_year,
  end_year
});

const colleague = (a, b) => addRelationship({
  source: a,
  target: b,
  type: 'colleagues',
  label: '同僚',
  description: `${a}与${b}同属相关势力或共同参与军事政治事务。`,
  bidirectional: true
});

const rival = (a, b, description, start_year = null, end_year = null) => addRelationship({
  source: a,
  target: b,
  type: 'rivals',
  label: '对手',
  description,
  start_year,
  end_year
});

const ally = (a, b, description, start_year = null, end_year = null) => addRelationship({
  source: a,
  target: b,
  type: 'allies',
  label: '同盟',
  description,
  bidirectional: true,
  start_year,
  end_year
});

const family = (a, b, type, label, description) => addRelationship({
  source: a,
  target: b,
  type,
  label,
  description,
  bidirectional: true
});

// Lü Bu, Zhao Yun, and the previously isolated records.
service('丁原', '吕布', null, 189);
addRelationship({ source: '吕布', target: '丁原', type: 'killed-by', label: '被杀', description: '丁原被部将吕布杀害，吕布随后投靠董卓。', start_year: 189, end_year: 189 });
family('吕布', '严氏', 'husband-wife', '夫妻', '严氏为吕布正妻。');
service('吕布', '高顺', null, 199);
ally('吕布', '陈宫', '陈宫辅佐吕布据守兖州、徐州。', 194, 199);
rival('吕布', '刘备', '吕布夺取刘备徐州，二人多次互相牵制。', 196, 199);
service('吕布', '曹性', null, 199);
service('吕布', '郝萌', null, 196);
service('吕布', '成廉', null, 199);
service('吕布', '魏续', null, 199);
service('吕布', '宋宪', null, 199);
service('吕布', '侯成', null, 199);
addRelationship({ source: '侯成', target: '吕布', type: 'betrayal', label: '背叛', description: '侯成在下邳之战中降曹，导致吕布集团瓦解。', start_year: 199, end_year: 199 });
addRelationship({ source: '宋宪', target: '吕布', type: 'betrayal', label: '背叛', description: '宋宪在下邳之战中参与降曹。', start_year: 199, end_year: 199 });
addRelationship({ source: '魏续', target: '吕布', type: 'betrayal', label: '背叛', description: '魏续在下邳之战中随侯成等降曹。', start_year: 199, end_year: 199 });

colleague('赵云', '诸葛亮');
colleague('赵云', '魏延');
addRelationship({ source: '赵云', target: '刘禅', type: 'protector', label: '保护', description: '长坂坡之战中赵云保护幼主刘禅脱险。', start_year: 208, end_year: 208 });
addRelationship({ source: '赵云', target: '糜夫人', type: 'protector', label: '保护', description: '长坂坡事迹中赵云寻护刘备家眷。', start_year: 208, end_year: 208 });
rival('赵云', '曹操', '长坂坡之战中赵云突围于曹操追击军之间。', 208, 208);

family('张角', '张宝', 'siblings', '兄弟', '张宝为张角之弟，同为黄巾起义首领。');
family('张角', '张梁', 'siblings', '兄弟', '张梁为张角之弟，同为黄巾起义首领。');
family('张宝', '张梁', 'siblings', '兄弟', '张宝、张梁同为张角之弟。');
service('张角', '管亥', 184, null);
rival('管亥', '孔融', '管亥率黄巾余部围攻北海孔融。');
family('孟获', '祝融夫人', 'husband-wife', '夫妻', '祝融夫人为南中首领孟获之妻。');
family('孟获', '孟优', 'siblings', '兄弟', '孟优为孟获之弟。');
ally('孟获', '朵思大王', '朵思大王为南中势力，曾与孟获阵营互相呼应。');
rival('轲比能', '曹叡', '轲比能统合鲜卑势力，多次威胁曹魏北边。', 220, 235);
rival('轲比能', '田豫', '田豫在曹魏北疆长期牵制鲜卑轲比能。', 220, 235);
ally('蹋顿', '袁绍', '蹋顿所部乌桓曾支持袁氏势力。', 190, 207);
ally('蹋顿', '袁熙', '袁熙、袁尚败后投奔乌桓蹋顿。', 205, 207);
rival('蹋顿', '曹操', '曹操北征乌桓，在白狼山击破蹋顿。', 207, 207);

// Service and association links for newly added figures so no new isolated nodes are introduced.
for (const name of ['波才', '彭脱', '张曼成', '韩忠', '赵弘', '卜己']) service('张角', name, 184, 184);
rival('波才', '皇甫嵩', '波才在长社与皇甫嵩、朱儁军交战。', 184, 184);
rival('彭脱', '朱儁', '彭脱在汝南、颍川一带被朱儁等汉军讨平。', 184, 184);
rival('张曼成', '朱儁', '张曼成死后南阳黄巾继续为朱儁所讨。', 184, 184);
for (const name of ['张燕', '眭固', '白绕', '于毒']) service('张燕', name, 184, 205);
service('曹操', '张燕', 205, null);
rival('管承', '曹操', '管承为青州海贼首领，后被曹操势力讨平。', 200, 210);
rival('眭固', '曹操', '眭固据射犬一带，后为曹操军击破。', 199, 199);
rival('白绕', '曹操', '白绕等黑山军曾进入东郡，被曹操击退。', 191, 191);
rival('于毒', '曹操', '于毒等黑山军曾袭扰魏郡、东郡。', 192, 193);
for (const name of ['杨奉', '韩暹', '胡才', '李乐', '郭太']) service('汉献帝', name, 195, 196);
ally('杨奉', '韩暹', '杨奉、韩暹同为护送汉献帝东归的白波军将领。', 195, 196);
ally('胡才', '李乐', '胡才、李乐同属白波军，参与献帝东归。', 195, 196);
rival('杨奉', '曹操', '曹操迎献帝后击败杨奉、韩暹。', 196, 197);
service('袁绍', '眭元进', 200, 200);
service('曹操', '昌豨', 198, 206);
service('曹操', '孙观', 198, null);
service('曹操', '尹礼', 198, null);
service('曹操', '吴敦', 198, null);
service('曹操', '昌霸', 198, null);
colleague('孙观', '臧霸');
colleague('尹礼', '臧霸');
colleague('吴敦', '臧霸');
colleague('昌霸', '臧霸');
for (const name of ['柳隐', '霍峻', '霍弋', '罗宪', '宗预', '糜芳', '秦宓', '吴班', '陈式', '程畿', '赵累', '范疆', '张达']) service('刘备', name, null, null);
service('刘禅', '霍弋', 223, 263);
service('刘禅', '罗宪', 223, 263);
service('刘禅', '宗预', 223, 263);
colleague('吴班', '诸葛亮');
colleague('陈式', '魏延');
colleague('赵累', '关羽');
addRelationship({ source: '范疆', target: '张飞', type: 'betrayal', label: '背叛', description: '范疆与张达刺杀张飞后投吴。', start_year: 221, end_year: 221 });
addRelationship({ source: '张达', target: '张飞', type: 'betrayal', label: '背叛', description: '张达与范疆刺杀张飞后投吴。', start_year: 221, end_year: 221 });
for (const name of ['王浑', '卫瓘', '荀顗', '司马望', '曹训', '桓范', '王经', '徐质', '成济', '成倅', '令狐愚', '胡烈', '田续', '邓忠', '师纂']) service('曹叡', name, null, null);
service('司马昭', '王浑', 255, 265);
service('司马昭', '卫瓘', 263, 264);
service('司马昭', '成济', 260, 260);
service('司马昭', '成倅', 260, 260);
colleague('邓忠', '邓艾');
colleague('师纂', '邓艾');
ally('王凌', '令狐愚', '王凌与令狐愚密谋拥立曹彪。', 249, 251);
for (const name of ['吾粲', '全端', '陆胤', '全尚', '全纪', '陶璜']) service('孙权', name, null, null);
service('孙皓', '陶璜', 264, 280);
colleague('全端', '全琮');
family('全尚', '全纪', 'father-son', '父子', '全尚为全纪之父。');
service('刘表', '黄祖', 190, 208);
rival('黄祖', '孙坚', '黄祖部将伏击孙坚，孙坚在襄阳战事中阵亡。', 191, 191);
rival('黄祖', '孙权', '孙权多次进攻江夏，最终击破黄祖。', 203, 208);
service('袁绍', '麴义', 191, 195);
service('汉献帝', '董承', 195, 200);
service('公孙瓒', '公孙续', 190, 199);
service('刘备', '孟达', 214, 220);
service('曹叡', '孟达', 220, 228);
service('曹叡', '申仪', 220, 228);
service('曹叡', '郝昭', 220, 229);
service('曹叡', '公孙渊', 220, 237);
service('刘禅', '郭修', 253, 253);
service('孙皓', '步阐', 264, 272);
service('孙皓', '陆晏', 274, 280);
family('曹叡', '郭太后', 'husband-wife', '夫妻', '郭太后为曹叡皇后。');
service('张济', '张绣', 192, 196);
service('皇甫嵩', '皇甫坚寿', null, null);
family('皇甫嵩', '皇甫坚寿', 'father-son', '父子', '皇甫坚寿为皇甫嵩之子。');
family('公孙度', '公孙康', 'father-son', '父子', '公孙康为辽东太守公孙度之子。');
service('孙翊', '妫览', 200, 204);

const eventAdditions = {
  'dong-zhuo-burns-luoyang': [['李儒', '谋士'], ['吕布', '执行者']],
  'battle-of-xiangyang-191': [['黄祖', '刘表部将'], ['韩当', '孙坚部将']],
  'battle-of-jieqiao': [['麴义', '袁绍部将'], ['赵云', '公孙瓒部将']],
  'emperor-xian-flees-changan': [['杨奉', '护驾者'], ['韩暹', '护驾者'], ['董承', '护驾者']],
  'battle-of-yijing': [['公孙续', '公孙瓒之子'], ['田丰', '袁绍谋士']],
  'battle-of-bowang': [['诸葛亮', '策划者'], ['赵云', '刘备部将']],
  'zhuge-liang-joins-liu-bei': [['关羽', '刘备部将'], ['张飞', '刘备部将']],
  'battle-of-jiangxia-208': [['黄祖', '守将'], ['凌统', '参战者']],
  'death-of-pang-tong': [['张任', '敌方将领'], ['黄忠', '刘备部将']],
  'cao-cao-becomes-king': [['荀彧', '反对者'], ['华歆', '魏臣']],
  'cao-pi-usurps-han': [['华歆', '禅让推动者'], ['贾诩', '魏臣']],
  'death-of-guan-yu': [['吕蒙', '东吴统帅'], ['陆逊', '东吴将领'], ['关平', '同死者']],
  'death-of-cao-cao': [['曹植', '曹操之子'], ['曹彰', '曹操之子']],
  'death-of-lu-meng': [['吕蒙', '逝者'], ['陆逊', '继任者']],
  'sun-quan-submits-to-wei': [['刘备', '对立方'], ['陆逊', '东吴重臣']],
  'liu-bei-becomes-emperor': [['许靖', '蜀汉大臣'], ['糜竺', '蜀汉大臣']],
  'death-of-zhang-fei': [['范疆', '凶手'], ['张达', '凶手'], ['张苞', '张飞之子']],
  'sun-quan-declares-independence': [['陆逊', '吴臣'], ['诸葛瑾', '吴臣']],
  'xincheng-rebellion': [['孟达', '叛乱者'], ['申仪', '参与者']],
  'second-northern-expedition': [['陈式', '蜀将'], ['郝昭', '魏将']],
  'shu-wu-mutual-recognition': [['诸葛瑾', '吴臣'], ['邓芝', '蜀使']],
  'third-northern-expedition': [['陈式', '蜀将'], ['魏延', '蜀将']],
  'sun-quan-becomes-emperor': [['陆逊', '吴臣'], ['诸葛瑾', '吴臣']],
  'sima-yi-liaodong-campaign': [['公孙渊', '辽东割据者'], ['毌丘俭', '魏将']],
  'two-palaces-conflict': [['孙和', '太子'], ['孙霸', '鲁王'], ['吾粲', '太子党']],
  'wang-ling-rebellion': [['令狐愚', '同谋'], ['曹彪', '拥立对象']],
  'death-of-fei-yi': [['郭修', '刺客'], ['刘禅', '蜀帝']],
  'death-of-sima-shi': [['毌丘俭', '叛乱者'], ['文钦', '叛乱者']],
  'sun-hao-succeeds': [['濮阳兴', '拥立者'], ['张布', '拥立者']],
  'battle-of-xiling': [['步阐', '叛将'], ['孙皓', '吴帝']],
  'death-of-lu-kang': [['陆晏', '陆抗之子'], ['陆机', '陆抗之子']],
  'event-098': [['张梁', '黄巾将领'], ['朱儁', '汉军将领']],
  'event-099': [['管亥', '黄巾余部'], ['孔融', '北海相']],
  'event-101': [['何太后', '受害者'], ['李儒', '董卓谋士']],
  'event-112': [['张郃', '曹操部将'], ['高览', '袁绍部将']],
  'event-114': [['袁尚', '袁氏势力'], ['曹洪', '曹操部将']],
  'event-134': [['夏侯霸', '蜀将'], ['徐质', '魏将']],
  'event-150': [['曹真', '辅政大臣'], ['陈群', '辅政大臣']],
  'event-151': [['曹爽', '辅政大臣'], ['司马懿', '辅政大臣']],
  'event-152': [['司马师', '废立者'], ['郭太后', '参与者']],
  'event-153': [['司马昭', '拥立者'], ['郭太后', '参与者']],
  'event-154': [['诸葛亮', '辅政大臣'], ['李严', '辅政大臣']],
  'event-155': [['诸葛恪', '辅政大臣'], ['孙峻', '宗室大臣']],
  'event-156': [['孙綝', '拥立者'], ['孙峻', '前权臣']],
  'event-157': [['濮阳兴', '拥立者'], ['张布', '拥立者']],
  'event-158': [['曹芳', '魏帝'], ['曹爽', '政敌']],
  'event-159': [['曹髦', '魏帝'], ['钟会', '司马氏幕僚']],
  'event-160': [['袁绍', '参与者'], ['张让', '十常侍']],
  'event-161': [['李傕', '加害者'], ['郭汜', '加害者']],
  'event-162': [['刘表', '敌方主君'], ['黄祖', '伏击方']],
  'event-163': [['刘备', '继承徐州'], ['糜竺', '拥戴者']],
  'event-164': [['曹操', '处决者'], ['刘备', '劝杀者'], ['陈宫', '同死者']],
  'event-165': [['刘备', '截击者'], ['曹操', '敌对者']],
  'event-166': [['刘琮', '继任者'], ['刘琦', '长子'], ['蔡瑁', '荆州将领']],
  'event-167': [['黄忠', '击杀者'], ['法正', '刘备谋主']],
  'event-168': [['吕蒙', '东吴统帅'], ['陆逊', '东吴将领'], ['关平', '同死者']],
  'event-169': [['刘禅', '继任者'], ['诸葛亮', '托孤大臣']],
  'event-170': [['曹叡', '继任者'], ['司马懿', '托孤大臣']],
  'event-171': [['刘禅', '蜀帝'], ['诸葛亮', '同僚']],
  'event-172': [['曹叡', '魏帝'], ['司马懿', '魏将']],
  'event-173': [['姜维', '蜀将'], ['杨仪', '长史'], ['魏延', '蜀将']],
  'event-174': [['费祎', '继任执政'], ['刘禅', '蜀帝']],
  'event-175': [['司马懿', '政变者'], ['桓范', '曹爽党羽']],
  'event-176': [['郭修', '刺客'], ['刘禅', '蜀帝']],
  'event-177': [['孙綝', '继任权臣'], ['孙亮', '吴帝']],
  'event-178': [['司马昭', '被讨伐者'], ['贾充', '指挥者'], ['成济', '弑君者']],
  'event-179': [['钟会', '同乱者'], ['卫瓘', '平乱者'], ['田续', '加害者']],
  'event-180': [['姜维', '同乱者'], ['卫瓘', '平乱者'], ['胡烈', '魏将']],
  'event-181': [['司马炎', '继任者'], ['贾充', '晋臣']],
  'event-182': [['杜预', '继任军务'], ['司马炎', '晋帝']],
  'event-183': [['司马炎', '晋帝'], ['陆抗', '旧敌']],
  'event-184': [['皇甫嵩', '汉军统帅'], ['张角', '黄巾首领']],
  'event-185': [['张宝', '弟弟'], ['张梁', '弟弟']],
  'event-186': [['皇甫嵩', '汉军统帅'], ['张角', '兄长']],
  'event-187': [['张让', '同党'], ['袁绍', '诛宦者者']],
  'event-188': [['何进', '外戚'], ['何太后', '皇后']],
  'event-189': [['董卓', '加害者'], ['汉献帝', '儿子']],
  'event-190': [['袁绍', '诛宦者者'], ['何进', '引发者']],
  'event-191': [['袁绍', '诛宦者者'], ['何进', '引发者']],
  'event-192': [['关羽', '击杀者'], ['孙坚', '盟军将领']],
  'event-193': [['王允', '处置者'], ['董卓', '关联者']],
  'event-194': [['刘备', '门生'], ['公孙瓒', '门生']],
  'event-195': [['董卓', '主君'], ['李傕', '西凉将领']],
  'event-196': [['曹操', '敌方主君'], ['夏侯惇', '曹操部将']],
  'event-197': [['曹操', '儿子'], ['张绣', '加害方']],
  'event-198': [['曹操', '旧部'], ['皇甫坚寿', '亲属']],
  'event-199': [['董卓', '故主'], ['李傕', '西凉将领']],
  'event-200': [['张绣', '部属'], ['刘表', '盟主']],
  'event-201': [['曹操', '父亲'], ['陶谦', '关联方']],
  'event-202': [['曹操', '主君'], ['张绣', '敌方']],
  'event-203': [['李傕', '同党'], ['汉献帝', '朝廷']],
  'event-204': [['孙策', '盟友'], ['太史慈', '对手']],
  'event-205': [['曹操', '讨伐者'], ['汉献帝', '朝廷']],
  'event-206': [['袁绍', '敌方'], ['公孙续', '儿子']],
  'event-207': [['袁术', '主君'], ['刘备', '敌方']],
  'event-208': [['曹操', '袭击方'], ['许攸', '献策者']],
  'event-209': [['曹操', '处决者'], ['袁绍', '主君']],
  'event-210': [['袁绍', '处决者'], ['曹操', '敌方']],
  'event-211': [['关羽', '击杀者'], ['曹操', '曹军主帅']],
  'event-212': [['关羽', '击杀者'], ['曹操', '曹军主帅']],
  'event-213': [['袁尚', '袁氏继承者'], ['审配', '同僚']],
  'event-214': [['甘宁', '击杀者'], ['凌统', '儿子']],
  'event-215': [['孙策', '外甥'], ['孙权', '继承势力']],
  'event-216': [['公孙康', '继任者'], ['曹操', '北方霸主']],
  'event-217': [['曹操', '处决者'], ['袁尚', '主君']],
  'event-218': [['孙权', '宗族'], ['孙韶', '继承部曲']],
  'event-219': [['孙权', '兄长'], ['妫览', '叛乱者']],
  'event-220': [['曹操', '主君'], ['许褚', '冲突者']]
};

const eventById = new Map(events.map((event) => [event.id, event]));
for (const [eventId, additions] of Object.entries(eventAdditions)) {
  const event = eventById.get(eventId);
  if (!event) throw new Error(`Missing event: ${eventId}`);
  event.participants ??= [];
  const seen = new Set(event.participants.map((participant) => participant.person_id));
  for (const [name, role] of additions) {
    const personId = idOf(name);
    if (!seen.has(personId)) {
      event.participants.push({ person_id: personId, role });
      seen.add(personId);
    }
  }
}

const allPersonIds = new Set(persons.map((person) => person.id));
for (const rel of relationships) {
  if (!allPersonIds.has(rel.source)) throw new Error(`Relationship ${rel.id} has missing source ${rel.source}`);
  if (!allPersonIds.has(rel.target)) throw new Error(`Relationship ${rel.id} has missing target ${rel.target}`);
}

const duplicateRelationship = new Set();
for (const rel of relationships) {
  const key = `${rel.source}|${rel.target}|${rel.type}`;
  if (duplicateRelationship.has(key)) throw new Error(`Duplicate relationship: ${key}`);
  duplicateRelationship.add(key);
}

for (const event of events) {
  for (const participant of event.participants ?? []) {
    if (!allPersonIds.has(participant.person_id)) {
      throw new Error(`Event ${event.id} references missing participant ${participant.person_id}`);
    }
  }
}

const relationshipPersonIds = new Set();
for (const rel of relationships) {
  relationshipPersonIds.add(rel.source);
  relationshipPersonIds.add(rel.target);
}
const isolated = persons.filter((person) => !relationshipPersonIds.has(person.id));
const shortEvents = events.filter((event) => (event.participants ?? []).length < 3);

if (persons.length < 500) throw new Error(`Expected at least 500 persons, found ${persons.length}`);
if (shortEvents.length > 0) throw new Error(`Expected no events with <3 participants, found ${shortEvents.length}: ${shortEvents.map((event) => event.id).join(', ')}`);
if (isolated.length > 0) throw new Error(`Expected no isolated persons, found ${isolated.length}: ${isolated.map((person) => person.name).join(', ')}`);

fs.writeFileSync(PERSONS_PATH, `${JSON.stringify(persons, null, 2)}\n`);
fs.writeFileSync(RELATIONSHIPS_PATH, `${JSON.stringify(relationships, null, 2)}\n`);
fs.writeFileSync(EVENTS_PATH, `${JSON.stringify(events, null, 2)}\n`);

console.log(JSON.stringify({
  persons: persons.length,
  relationships: relationships.length,
  events: events.length,
  isolated: isolated.length,
  eventsWithFewerThanThreeParticipants: shortEvents.length
}, null, 2));
