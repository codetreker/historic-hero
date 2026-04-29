# 数据质量审核报告（精简后第二轮）

**审核时间**: 2026-04-29
**数据文件**: persons.json, relationships.json

## 1. 人物总数和阵营分布

**人物总数**: 961

| 阵营 | 人数 | 占比 |
|------|------|------|
| wei | 266 | 27.7% |
| wu | 174 | 18.1% |
| other | 160 | 16.6% |
| shu | 157 | 16.3% |
| han | 119 | 12.4% |
| jin | 85 | 8.8% |

## 2. 重复检查

**ID 重复**: ✅ 无

**姓名重复**: 19 组
- 丁原 × 2: `han-ding-yuan`, `ding-yuan`
- 令狐愚 × 2: `wei-linghu-yu`, `linghu-yu`
- 何太后 × 2: `he-taihou`, `empress-dowager-he`
- 侯成 × 2: `other-hou-cheng`, `hou-cheng`
- 吾粲 × 2: `wu-wu-can`, `wu-can`
- 张皇后 × 2: `empress-zhang-1`, `empress-zhang-2`
- 文聘 × 2: `wen-pin`, `wen-pin-wen-ping`
- 曹性 × 2: `other-cao-xing`, `cao-xing`
- 波才 × 2: `other-bo-cai`, `bo-cai`
- 秦宓 × 2: `shu-qin-mi`, `qin-mi`
- 荀顗 × 2: `wei-xun-yi`, `xun-yi`
- 董承 × 2: `han-dong-cheng`, `dong-cheng`
- 许靖 × 2: `xu-you-caowei`, `xu-jing`
- 郝萌 × 2: `other-hao-meng`, `hao-meng`
- 郭女王 × 2: `guo-nuwang`, `guo-nwang`
- 陶璜 × 2: `wu-tao-huang`, `tao-huang`
- 霍峻 × 2: `shu-huo-jun`, `huo-jun`
- 霍弋 × 2: `shu-huo-yi`, `huo-yi`
- 马忠 × 2: `ma-zhong`, `ma-zhong-wu`

## 3. 阵营错误检查（之前发现的问题）

- 张郃(zhang-he): ❌ 仍错误，当前阵营 = `han`（应为 wei）
- 何太后(he-taihou): ✅ 已修复，当前阵营 = `han`
- 何皇后(empress-he): ✅ 已修复，当前阵营 = `han`
- 何太后(empress-dowager-he): ❌ 仍错误，当前阵营 = `wu`（应为 han）

### 其他可疑阵营归属（自动检测）

> 注：以下部分有争议。司马师/司马昭标 wei 也有道理（他们主要活动在曹魏时期），但数据已有 jin 阵营。董卓/袁绍/袁术/刘表标 han 也可理解（他们均为汉朝d臣），但作为独立势力标 other 也合理。需人工判断。

- 司马昭(sima-zhao): 当前 `wei`，预期 `jin`
- 司马师(sima-shi): 当前 `wei`，预期 `jin`
- 董卓(dong-zhuo): 当前 `han`，预期 `other`
- 袁绍(yuan-shao): 当前 `han`，预期 `other`
- 袁术(yuan-shu): 当前 `han`，预期 `other`
- 刘表(liu-biao): 当前 `han`，预期 `other`

## 4. 关系类型分布

**关系总数**: 5526

| 关系类型 | 数量 | 占比 |
|----------|------|------|
| colleagues | 3828 | 69.3% |
| lord-vassal | 1225 | 22.2% |
| father-son | 100 | 1.8% |
| subordinate | 55 | 1.0% |
| brothers | 53 | 1.0% |
| rivals | 46 | 0.8% |
| allies | 45 | 0.8% |
| killed-by | 36 | 0.7% |
| friends | 36 | 0.7% |
| betrayal | 26 | 0.5% |
| successor | 20 | 0.4% |
| husband-wife | 20 | 0.4% |
| in-law | 10 | 0.2% |
| mother-son | 10 | 0.2% |
| master-student | 7 | 0.1% |
| siblings | 4 | 0.1% |
| sworn-brothers | 3 | 0.1% |
| protector | 2 | 0.0% |

### 重点关注

- **同僚(colleagues)**: 3828 条 (69.3%)
- **君臣(lord-vassal)**: 1225 条 (22.2%)
- ⚠️ 同僚关系占比过高 (69.3%)，可能存在批量生成问题
- ✅ 君臣关系占比在合理范围

## 5. 孤立人物（无任何关系）

**孤立人物数**: 363

- 阿貴(agui) - 阵营: other
- 阿羅多(aluoduo) - 阵营: other
- 阿羅槃(aluopan) - 阵营: wei
- 阿騖(awu) - 阵营: other
- 巴祗(ba-zhi) - 阵营: han
- 白爵(bai-jue) - 阵营: other
- 白繞(bai-rao) - 阵营: other
- 柏孝長(bai-xiaochang) - 阵营: han
- 白虎文(baihuwen) - 阵营: other
- 頒下(banxia) - 阵营: other
- 鮑成(bao-cheng) - 阵营: other
- 鮑初(bao-chu) - 阵营: other
- 鮑融(bao-rong) - 阵营: wei
- 鮑韜(bao-tao) - 阵营: han
- 鲍信(bao-xin) - 阵营: han
- 鮑雅(bao-ya) - 阵营: other
- 鮑子春(bao-zichun) - 阵营: wei
- 卑衍(bei-yan) - 阵营: other
- 貝羽(bei-yu) - 阵营: han
- 卑湛(bei-zhan) - 阵营: wei
- 北宫伯玉(beigong-boyu) - 阵营: other
- 毕谌(bi-chen) - 阵营: wei
- 畢瑜(bi-yu) - 阵营: han
- 畢子禮(bi-zili) - 阵营: han
- 邊鴻(bian-hong) - 阵营: han
- 卞暉(bian-hui) - 阵营: wei
- 卞隆(bian-long) - 阵营: wei
- 边让(bian-rang) - 阵营: han
- 卞遠(bian-yuan) - 阵营: wei
- 边章(bian-zhang) - 阵营: han
- 邴春(bing-chun) - 阵营: jin
- 邴原(bing-yuan) - 阵营: han
- 波才(bo-cai) - 阵营: other
- 卜己 / 卜巳(bu-ji-bu-si) - 阵营: other
- 步练师(bu-lianshi) - 阵营: wu
- 卜清(bu-qing) - 阵营: other
- 卜賁邑(bubiyi) - 阵营: other
- 步度根(budugen) - 阵营: other
- 蔡琰(cai-yan) - 阵营: other
- 曹安民(cao-anmin) - 阵营: wei
- 曹豹(cao-bao) - 阵营: other
- 曹彬(cao-bin) - 阵营: wei
- 曹不兴(cao-buxing) - 阵营: wu
- 曹貢(cao-gong) - 阵营: wei
- 曹袞(cao-gun) - 阵营: wei
- 曹徽(cao-hui) - 阵营: wei
- 曹鑒(cao-jian) - 阵营: wei
- 曹矩(cao-ju) - 阵营: wei
- 曹均(cao-jun) - 阵营: wei
- 曹禮(cao-li) - 阵营: wei
- 曹廉(cao-lian) - 阵营: wei
- 曹霖(cao-lin) - 阵营: wei
- 曹鑠(cao-shuo) - 阵营: wei
- 曹腾(cao-teng) - 阵营: han
- 曹琬(cao-wan) - 阵营: wei
- 曹協(cao-xie) - 阵营: wei
- 曹性(cao-xing) - 阵营: other
- 曹玹(cao-xuan) - 阵营: wei
- 曹儼(cao-yan) - 阵营: wei
- 曹邕(cao-yong) - 阵营: wei
- 曹宇(cao-yu) - 阵营: wei
- 曹子乘(cao-zicheng) - 阵营: wei
- 曹子棘(cao-ziji) - 阵营: wei
- 曹子京(cao-zijing) - 阵营: wei
- 曹子勤(cao-ziqin) - 阵营: wei
- 曹子上(cao-zishang) - 阵营: wei
- 曹子整(cao-zizheng) - 阵营: wei
- 岑軻(cen-ke) - 阵营: wu
- 常忌(chang-ji) - 阵营: jin
- 常勗(chang-xu) - 阵营: jin
- 陈登(chen-deng) - 阵营: wei
- 陳宮(chen-gong) - 阵营: other
- 陈珪(chen-gui) - 阵营: wei
- 陈矫(chen-jiao) - 阵营: wei
- 陈兰(chen-lan) - 阵营: other
- 陳騫(chen-qian) - 阵营: jin
- 陈寿(chen-shou) - 阵营: jin
- 陈震(chen-zhen) - 阵营: shu
- 程秉(cheng-bing) - 阵营: wu
- 程瓊(cheng-qiong) - 阵营: shu
- 程他(cheng-ta) - 阵营: other
- 程武(cheng-wu) - 阵营: wei
- 成宜(cheng-yi) - 阵营: other
- 猝跋韓(cubahan) - 阵营: jin
- 崔林(cui-lin) - 阵营: wei
- 戴昌(dai-chang) - 阵营: jin
- 丁儀(ding-yi) - 阵营: wei
- 丁仪(ding-yi-politician) - 阵营: wei
- 丁原(ding-yuan) - 阵营: other
- 董白(dong-bai) - 阵营: other
- 董承(dong-cheng) - 阵营: han
- 董奉(dong-feng-physician) - 阵营: other
- 董旻(dong-min) - 阵营: other
- 董榮(dong-rong) - 阵营: jin
- 董越(dong-yue) - 阵营: other
- 董昭(dong-zhao) - 阵营: wei
- 杜夔(du-kui) - 阵营: wei
- 杜良(du-liang) - 阵营: jin
- 杜烈(du-lie) - 阵营: jin
- 杜禎(du-zhen) - 阵营: jin
- 俄何(ehe) - 阵营: other
- 卞皇后(empress-bian) - 阵营: wei
- 董太后(empress-dowager-dong) - 阵营: han
- 何太后(empress-dowager-he) - 阵营: wu
- 郭皇后(empress-guo) - 阵营: wei
- 何皇后(empress-he) - 阵营: han
- 毛皇后(empress-mao) - 阵营: wei
- 潘皇后(empress-pan) - 阵营: wu
- 吳皇后(empress-wu) - 阵营: shu
- 朱皇后(empress-zhu) - 阵营: wu
- 蛾遮塞(ezhesai) - 阵营: other
- 法衍(fa-yan) - 阵营: han
- 法真(fa-zhen) - 阵营: other
- 樊稠(fan-chou) - 阵营: other
- 樊能(fan-neng) - 阵营: other
- 費緝(fei-ji) - 阵营: jin
- 費立(fei-li) - 阵营: jin
- 傅嘏(fu-jia) - 阵营: wei
- 傅玄(fu-xuan) - 阵营: jin
- 傅巽(fu-xun) - 阵营: wei
- 干吉(gan-ji) - 阵营: other
- 高幹(gao-gan) - 阵营: other
- 高柔(gao-rou) - 阵营: wei
- 高順(gao-shun) - 阵营: other
- 高玩(gao-wan) - 阵营: jin
- 高堂隆(gaotang-long) - 阵营: wei
- 耿武(geng-wu) - 阵营: other
- 公孫範(gongsun-fan) - 阵营: other
- 公孫康(gongsun-kang) - 阵营: other
- 公孫續(gongsun-xu) - 阵营: other
- 公孫淵(gongsun-yuan) - 阵营: other
- 公孫越(gongsun-yue) - 阵营: other
- 顧奉(gu-feng) - 阵营: han
- 顧謙(gu-qian) - 阵营: wu
- 顧榮(gu-rong) - 阵营: jin
- 顧邵(gu-shao) - 阵营: wu
- 顧向(gu-xiang) - 阵营: wu
- 顧彦(gu-yan) - 阵营: wu
- 關靖(guan-jing) - 阵营: other
- 管輅(guan-lu) - 阵营: other
- 管寧(guan-ning) - 阵营: wei
- 關彝(guan-yi) - 阵营: shu
- 郭女王(guo-nwang) - 阵营: wei
- 郭汜/郭多(guo-si-guo-duo) - 阵营: other
- 郭奕(guo-yi) - 阵营: wei
- 郭攸之(guo-youzhi) - 阵营: shu
- 國淵(guo-yuan) - 阵营: wei
- 韓莒子(han-juzi) - 阵营: other
- 韓暹(han-xian) - 阵营: other
- 韓忠(han-zhong) - 阵营: other
- 郝萌(hao-meng) - 阵营: other
- 何觀(he-guan) - 阵营: jin
- 何夔(he-kui) - 阵营: wei
- 何曼(he-man) - 阵营: other
- 何攀(he-pan) - 阵营: jin
- 和洽(he-qia) - 阵营: wei
- 何儀(he-yi) - 阵营: other
- 何顒(he-yong) - 阵营: other
- 侯音(hou-yin) - 阵营: other
- 侯彈勃(houdanbo) - 阵营: jin
- 侯金多(houjinduo) - 阵营: jin
- 胡車兒(hu-cheer) - 阵营: other
- 胡文才(hu-wencai) - 阵营: han
- 胡軫(hu-zhen) - 阵营: other
- 胡質(hu-zhi) - 阵营: wei
- 華表(hua-biao) - 阵营: jin
- 華佗(hua-tuo) - 阵营: other
- 桓典(huan-dian) - 阵营: han
- 桓階(huan-jie) - 阵营: wei
- 桓嚴(huan-yan) - 阵营: han
- 黃承彥(huang-chengyan) - 阵营: other
- 黃射(huang-she) - 阵营: other
- 黃琬(huang-wan) - 阵营: other
- 黃祖(huang-zu) - 阵营: other
- 皇甫堅壽(huangfu-jianshou) - 阵营: han
- 皇甫謐(huangfu-mi) - 阵营: jin
- 吉本(ji-ben) - 阵营: han
- 吉邈(ji-miao) - 阵营: han
- 吉穆(ji-mu) - 阵营: han
- 賈範(jia-fan) - 阵营: other
- 蹇碩(jian-shuo) - 阵营: han
- 吉軻羅(jikeluo) - 阵营: jin
- 孔伷(kong-zhou) - 阵营: han
- 蒯良(kuai-liang) - 阵营: other
- 呂伯奢(l-boshe) - 阵营: other
- 呂布(l-bu) - 阵营: other
- 呂凱(l-kai) - 阵营: shu
- 呂淑(l-sh) - 阵营: jin
- 呂威璜(l-weihuang) - 阵营: other
- 柏夫人(lady-bai) - 阵营: wei
- 卞氏(lady-bian) - 阵营: wei
- 蔡氏(lady-cai) - 阵营: other
- 關氏(lady-guan) - 阵营: other
- 黃氏(lady-huang) - 阵营: other
- 吳氏(lady-wu) - 阵营: wu
- 謝氏(lady-xie) - 阵营: wu
- 徐氏(lady-xu) - 阵营: wu
- 甄氏(lady-zhen) - 阵营: wei
- 李豐(li-feng) - 阵营: wei
- 李堪(li-kan) - 阵营: other
- 李密(li-mi) - 阵营: jin
- 李求承(li-qiucheng) - 阵营: other
- 李權(li-quan) - 阵营: han
- 李憙(li-xi) - 阵营: jin
- 李暹(li-xian) - 阵营: other
- 李驤(li-xiang) - 阵营: jin
- 李胤(li-yin) - 阵营: jin
- 李意期(li-yiqi) - 阵营: other
- 梁綱(liang-gang) - 阵营: other
- 梁冀(liang-ji) - 阵营: han
- 涼茂(liang-mao) - 阵营: wei
- 梁興(liang-xing) - 阵营: other
- 劉豹(liu-bao) - 阵营: other
- 劉辯(liu-bian) - 阵营: han
- 劉岱(liu-dai) - 阵营: other
- 劉度(liu-du) - 阵营: shu
- 劉璝(liu-gui) - 阵营: other
- 劉宏(liu-hong) - 阵营: han
- 劉基(liu-ji) - 阵营: wu
- 劉伶(liu-ling) - 阵营: jin
- 劉磐(liu-pan) - 阵营: other
- 劉劭(liu-shao) - 阵营: wei
- 柳伸(liu-shen) - 阵营: jin
- 劉寔(liu-shi) - 阵营: jin
- 劉協(liu-xie) - 阵营: han
- 劉璇/劉璿(liu-xuan) - 阵营: wei
- 劉焉(liu-yan) - 阵营: other
- 劉廙(liu-yi) - 阵营: wei
- 劉虞(liu-yu) - 阵营: other
- 龍佑那/張龍佑那(long-younazhanglong-youna) - 阵营: other
- 樓玄(lou-xuan) - 阵营: wu
- 樓班(louban) - 阵营: other
- 陸駿(lu-jun) - 阵营: han
- 陸瑁(lu-mao) - 阵营: wu
- 陸喜(lu-xi) - 阵营: jin
- 陸延(lu-yan) - 阵营: wu
- 倫直(lun-zhi) - 阵营: other
- 羅憲(luo-xian) - 阵营: jin
- 馬鈞(ma-jun) - 阵营: wei
- 馬隆(ma-long) - 阵营: jin
- 馬邈(ma-miao) - 阵营: wei
- 馬日磾(ma-midi) - 阵营: other
- 馬秋(ma-qiu) - 阵营: other
- 馬元義(ma-yuanyi) - 阵营: other
- 沒骨能(meiguneng) - 阵营: jin
- 禰衡(mi-heng) - 阵营: other
- 迷當(midang) - 阵营: other
- 閔純(min-chun) - 阵营: other
- 區景(ou-jing) - 阵营: han
- 潘岳/潘安(pan-yuepan-an) - 阵营: jin
- 龐娥/趙娥(pang-e-zhao-e) - 阵营: other
- 龐淯(pang-yu) - 阵营: wei
- 裴潛(pei-qian) - 阵营: wei
- 裴秀(pei-xiu) - 阵营: jin
- 牽秀(qian-xiu) - 阵营: jin
- 橋玄(qiao-xuan) - 阵营: han
- 秦宓(qin-mi) - 阵营: shu
- 秦秀(qin-xiu) - 阵营: jin
- 乞文泥(qiwenni) - 阵营: other
- 全惠解(quan-huijie) - 阵营: wu
- 熱冏(rejiong) - 阵营: jin
- 任安(ren-an) - 阵营: other
- 任光(ren-guang) - 阵营: han
- 任峻(ren-jun) - 阵营: wei
- 任愷(ren-kai) - 阵营: jin
- 任熙(ren-xi) - 阵营: jin
- 任元(ren-yuan) - 阵营: shu
- 山濤(shan-tao) - 阵营: jin
- 申屠蟠(shentu-pan) - 阵营: other
- 石苞(shi-bao) - 阵营: jin
- 壽良(shou-liang) - 阵营: jin
- 司馬勝之(sima-shengzhi) - 阵营: jin
- 司馬攸(sima-you) - 阵营: jin
- 司馬芝(sima-zhi) - 阵营: wei
- 司馬伷(sima-zhou) - 阵营: jin
- 宋揚(song-yang) - 阵营: other
- 孫楚(sun-chu) - 阵营: jin
- 孫慮(sun-l) - 阵营: wu
- 索靖(suo-jing) - 阵营: jin
- 檀敷(tan-fu) - 阵营: han
- 唐彬(tang-bin) - 阵营: jin
- 陶璜(tao-huang) - 阵营: jin
- 滕芳蘭(teng-fanglan) - 阵营: wu
- 滕修(teng-xiu) - 阵营: jin
- 吐敦(tudun) - 阵营: other
- 王蕃(wang-fan) - 阵营: wu
- 王觀(wang-guan) - 阵营: wei
- 王和平(wang-heping) - 阵营: other
- 王化(wang-hua) - 阵营: jin
- 王渾(wang-hun) - 阵营: jin
- 王烈(wang-lie) - 阵营: han
- 王戎(wang-rong) - 阵营: jin
- 王商(wang-shang) - 阵营: other
- 王祥(wang-xiang) - 阵营: jin
- 王振(wang-zhen) - 阵营: jin
- 衛瓘(wei-guan) - 阵营: jin
- 衛覬(wei-ji) - 阵营: wei
- 魏舒(wei-shu) - 阵营: jin
- 衛臻(wei-zhen) - 阵营: wei
- 溫恢(wen-hui) - 阵营: wei
- 文立(wen-li) - 阵营: jin
- 武陔(wu-gai) - 阵营: jin
- 吳碩(wu-shuo) - 阵营: han
- 吾彥(wu-yan) - 阵营: jin
- 夏侯湛(xiahou-zhan) - 阵营: jin
- 襄楷(xiang-kai) - 阵营: han
- 向條(xiang-tiao) - 阵营: jin
- 向雄(xiang-xiong) - 阵营: jin
- 向秀(xiang-xiu) - 阵营: jin
- 向栩(xiang-xu) - 阵营: han
- 謝該(xie-gai) - 阵营: han
- 許劭(xu-shao) - 阵营: other
- 許瑒(xu-yang) - 阵营: han
- 荀爽(xun-shuang) - 阵营: other
- 荀勖(xun-xu) - 阵营: jin
- 荀顗(xun-yi) - 阵营: jin
- 荀悦(xun-yue) - 阵营: han
- 閻纘(yan-zuan) - 阵营: jin
- 楊白(yang-bai) - 阵营: other
- 楊帛(yang-bo) - 阵营: other
- 楊俊(yang-jun) - 阵营: wei
- 楊彭(yang-peng) - 阵营: jin
- 羊續(yang-xu) - 阵营: han
- 楊整修(yang-zhengxiu) - 阵营: han
- 藥蘭泥(yaolanni) - 阵营: other
- 潁容(ying-rong) - 阵营: other
- 應劭(ying-shao) - 阵营: other
- 庾純(yu-chun) - 阵营: jin
- 庾峻(yu-jun) - 阵营: jin
- 虞溥(yu-pu) - 阵营: jin
- 袁沛(yuan-pei) - 阵营: other
- 袁元長(yuan-yuanchang) - 阵营: han
- 樂廣(yue-guang) - 阵营: jin
- 臧洪(zang-hong) - 阵营: other
- 笮融(ze-rong) - 阵营: other
- 張超(zhang-chao) - 阵营: han
- 張華(zhang-hua) - 阵营: jin
- 張奐(zhang-huan) - 阵营: han
- 張角(zhang-jue-zhang-jiao) - 阵营: other
- 張梁(zhang-liang) - 阵营: other
- 張邈(zhang-miao) - 阵营: other
- 張衛(zhang-wei) - 阵营: other
- 張羡(zhang-xian) - 阵营: other
- 張楊(zhang-yang) - 阵营: other
- 張璋(zhang-zhang) - 阵营: han
- 趙岐(zhao-qi) - 阵营: han
- 趙儼(zhao-yan) - 阵营: wei
- 趙壹(zhao-yi) - 阵营: han
- 趙媛姜(zhao-yuanjiang) - 阵营: other
- 鄭沖(zheng-chong) - 阵营: jin
- 鄭渾(zheng-hun) - 阵营: wei
- 鄭袤(zheng-mao) - 阵营: wei
- 鄭泰/太(zheng-tai) - 阵营: other
- 鄭玄(zheng-xuan) - 阵营: other
- 鍾皓(zhong-hao) - 阵营: han
- 種輯(zhong-ji) - 阵营: han
- 仲長統(zhongchang-tong) - 阵营: wei
- 周處(zhou-chu) - 阵营: jin
- 周浚(zhou-jun) - 阵营: jin
- 周群(zhou-qun) - 阵营: shu
- 周宣(zhou-xuan) - 阵营: wei
- 朱建平(zhu-jianping) - 阵营: other
- 且萬能(zuwanneng) - 阵营: jin

## 6. 无效引用（关系指向不存在的人物）

✅ 所有关系引用均有效

## 7. 空数据（无描述的人物）

**无描述人物数**: 0 / 961 (0.0%)

**其他空字段统计**:
- 无角色(roles): 24 (2.5%)
- 无出生年(birth_year): 740 (77.0%)
- 无死亡年(death_year): 373 (38.8%)

## 8. 自引用（source == target）

**自引用关系数**: 1

- `other-zhang-yan-other-zhang-yan-lord-vassal`: other-zhang-yan → other-zhang-yan (type: lord-vassal)

## 9. 关系质量评估（抽查 20 条）

**可能批量生成的关系类型**: colleagues (3828) + lord-vassal (1225) = 5053 条

### 抽查样本

| # | 关系ID | 类型 | 来源 | 目标 | 描述 | 评价 |
|---|--------|------|------|------|------|------|
| 1 | `rel-1179` | colleagues | 于禁(wei) | 邓艾(wei) | 于禁与邓艾同属wei阵营，职责领域相近。 | ✅ 有具体描述 |
| 2 | `rel-471` | lord-vassal | 曹操(wei) | 曹林(wei) | 曹林名义上或实际从属于曹操阵营。 | ✅ 合理 |
| 3 | `auto-col-2919` | colleagues | 曹纯(wei) | 司马师(wei) | 无 | ⚠️ 无描述 |
| 4 | `auto-col-2672` | colleagues | 曹洪(wei) | 曹爽(wei) | 无 | ⚠️ 无描述 |
| 5 | `auto-lv-2494` | lord-vassal | 孙坚(wu) | 吾粲(wu) | 无 | ⚠️ 无描述 |
| 6 | `rel-1410` | colleagues | 邓艾(wei) | 曹泰(wei) | 邓艾与曹泰同属wei阵营，职责领域相近。 | ✅ 有具体描述 |
| 7 | `rel-1106` | colleagues | 张辽(wei) | 曹彰(wei) | 张辽与曹彰同属wei阵营，职责领域相近。 | ✅ 有具体描述 |
| 8 | `auto-col-5133` | colleagues | 朱然(wu) | 朱桓(wu) | 无 | ⚠️ 无描述 |
| 9 | `rel-979` | colleagues | 曹真(wei) | 诸葛绪(wei) | 曹真与诸葛绪同属wei阵营，职责领域相近。 | ✅ 有具体描述 |
| 10 | `auto-col-5503` | colleagues | 张布(wu) | 留赞(wu) | 无 | ⚠️ 无描述 |
| 11 | `auto-col-4122` | colleagues | 张苞(shu) | 冯习(shu) | 无 | ⚠️ 无描述 |
| 12 | `rel-527` | lord-vassal | 刘备(shu) | 马谡(shu) | 马谡名义上或实际从属于刘备阵营。 | ✅ 合理 |
| 13 | `rel-511` | lord-vassal | 曹操(wei) | 辛宪英(wei) | 辛宪英名义上或实际从属于曹操阵营。 | ✅ 合理 |
| 14 | `rel-1034` | colleagues | 夏侯渊(wei) | 程昱(wei) | 夏侯渊与程昱同属wei阵营，职责领域相近。 | ✅ 有具体描述 |
| 15 | `auto-lv-2457` | lord-vassal | 孙坚(wu) | 邓当(wu) | 无 | ⚠️ 无描述 |
| 16 | `auto-lv-2571` | lord-vassal | 孙策(wu) | 顧悌(wu) | 无 | ⚠️ 无描述 |
| 17 | `auto-col-4805` | colleagues | 陆抗(wu) | 陈武(wu) | 无 | ⚠️ 无描述 |
| 18 | `auto-col-5597` | colleagues | 孙桓(wu) | 朱异(wu) | 无 | ⚠️ 无描述 |
| 19 | `rel-484` | lord-vassal | 曹操(wei) | 常林(wei) | 常林名义上或实际从属于曹操阵营。 | ✅ 合理 |
| 20 | `auto-col-5263` | colleagues | 陆凯(wu) | 吕岱(wu) | 无 | ⚠️ 无描述 |

### 关系来源分析

| 来源 | 数量 | 占比 | 描述质量 |
|------|------|------|----------|
| 手工创建（如 liu-bei-guan-yu-sworn-brothers） | 574 | 10.4% | ✅ 高质量，有历史背景描述 |
| 批量生成带模板描述（rel-*） | 1233 | 22.3% | ⚠️ 82.2% 为模板句（"X与Y同属Z阵营，职责领域相近"） |
| 自动生成无描述（auto-*） | 3719 | 67.3% | ❌ 100% 无描述 |

### 时间线合理性抽查

在有明确生卒年的 auto-col 关系中抽查 500 条，52 条可验证时间线：
- **9 条存在时间线不重叠问题**（17.3%），即两人根本不可能共事
- 例：曹操(155-220) ↔ 钟会(225-264)、曹仁(168-223) ↔ 文鸯(238-291)
- 样本 #3 曹纯(?-210) ↔ 司马师(208-255)：勉强重叠但曹纯死时司马师仅2岁
- 样本 #17 陆抗(226-274) ↔ 陈武(?-215)：陆抗出生时陈武已死11年

### 描述质量统计

**批量类关系描述质量**: 1334/5053 有具体描述 (26.4%)
**同僚关系中同阵营**: 3826 (99.9%)
**同僚关系中跨阵营**: 2 (0.1%)
- ⚠️ 几乎所有同僚关系都是同阵营，高度疑似批量生成
- ❌ auto-* 关系全部无描述，仅凭同阵营建立连接
- ⚠️ rel-* 中 82% 使用模板描述，无实际历史信息量
- ⚠️ 存在跨时代错误关联（17% 的可验证样本时间线不重叠）

## 10. 附加检查：重复关系

**重复关系对**: 12 组

- 姜维 ↔ 钟会 (killed-by) × 2
- 刘备 ↔ 孙权 (allies) × 2
- 于禁 ↔ 乐进 (colleagues) × 2
- 程普 ↔ 黄盖 (colleagues) × 2
- 曹真 ↔ 司马懿 (colleagues) × 2
- 鲁肃 ↔ 周瑜 (colleagues) × 2
- 鲁肃 ↔ 诸葛瑾 (colleagues) × 2
- 陈泰 ↔ 郭淮 (colleagues) × 2
- 马谡 ↔ 王平 (colleagues) × 2
- 曹爽 ↔ 司马懿 (colleagues) × 2
- 孙坚 ↔ 孙权 (lord-vassal) × 2
- 孙策 ↔ 孙权 (lord-vassal) × 2

---

## 总结评价

### ⚠️ 发现 7 类问题

| 严重级 | 问题 | 数量 | 备注 |
|--------|------|------|------|
| 🔴 严重 | 孤立人物（无任何关系） | 363 | 占总人物 37.8%，网络图中完全不可见 |
| 🔴 严重 | 同僚关系占比过高 | 69.3% | auto-* 3719条全无描述，纯同阵营批量生成 |
| 🔴 严重 | 跨时代错误关联 | ~17% | 不同时代人物被标为同僚 |
| 🟡 中等 | 姓名重复 | 19组 | 之前发现 23+组，清理后仍剩 19组 |
| 🟡 中等 | 阵营错误未修复 | 2 | 张郃仍标 han，何太后(empress-dowager-he)仍标 wu |
| 🟢 轻微 | 重复关系 | 12组 | 同一对人+同类型出现两次 |
| 🟢 轻微 | 自引用 | 1条 | zhang-yan → zhang-yan |

### 关系质量分层评估

| 层级 | 数量 | 质量 | 说明 |
|------|------|------|------|
| 手工关系 | 574 | ⭐⭐⭐⭐⭐ | 有历史根据、具体描述、事件关联 |
| rel-* 有描述 | 219 | ⭐⭐⭐ | 有描述但多为模板句 |
| rel-* 模板描述 | 1014 | ⭐⭐ | "同属X阵营，职责领域相近"无信息量 |
| auto-* 无描述 | 3719 | ⭐ | 纯算法生成，无描述，部分跨时代错误 |

### 总体评价

**核心人物数据质量良好**：961人全部有描述，ID无重复，引用全部有效。

**关系数据质量严重不足**：5526条关系中，67.3%（3719条）是 auto-* 自动生成，全部无描述，仅凭“同阵营”建立连接。这些关系对网络图会产生大量噪音，让每个阵营内部变成“完全图”，淹没真正有意义的关系。

**孤立人物过多**：363人（37.8%）完全无关系，在网络图中不可见。这些多为较冷门的历史人物，建议要么补充关系，要么精简掉。

### 数据概览

- 人物总数: 961
- 关系总数: 5526
- 阵营数: 6
- 关系类型数: 18
- 人均关系数: 11.5 (双向计)
