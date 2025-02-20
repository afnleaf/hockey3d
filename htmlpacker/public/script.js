//event_id,             0
//type_code,            1
//event_type,           2
//period,               3
//time_period_mmss,     4
//time_period_seconds,  5
//time_game_seconds,    6
//x_coord,              7
//y_coord,              8
//player_id,            9
//team_id,              10
//shot_type,            11
//shot_miss_reason,     12
//highlight_clip_url    13

const csv = `
101,502,faceoff,1,20:00,0,0,0,0,0,66,,,
103,502,faceoff,1,19:55,5,5,-20,22,0,60,,,
167,504,giveaway,1,19:37,23,23,97,25,8476463,66,,,
168,503,hit,1,19:37,23,23,96,20,8477492,60,,,
164,509,penalty,1,19:16,44,44,57,36,0,66,,,
105,502,faceoff,1,19:16,44,44,69,22,0,66,,,
169,505,goal,1,19:04,56,56,78,19,8477492,60,wrist,,https://nhl.com/video/can-swe-mackinnon-scores-ppg-against-filip-gustavsson-6368733412112
106,502,faceoff,1,19:04,56,56,0,0,0,60,,,
301,507,missed-shot,1,18:50,70,70,79,2,8478402,60,tip-in,wide-left,
175,508,blocked-shot,1,18:47,73,73,84,2,8478402,60,,blocked,
176,508,blocked-shot,1,18:41,79,79,75,3,8477504,60,,blocked,
177,506,shot-on-goal,1,18:34,86,86,66,25,8477933,60,wrist,,
107,502,faceoff,1,18:32,88,88,69,22,0,60,,,
181,508,blocked-shot,1,18:31,89,89,59,10,8478439,60,,blocked,
184,525,takeaway,1,18:27,93,93,14,-31,8474563,60,,,
223,503,hit,1,18:12,108,108,-96,-26,8477496,66,,,
185,508,blocked-shot,1,17:58,122,122,-79,-6,8478042,66,,blocked,
193,504,giveaway,1,17:52,128,128,-41,41,8476463,66,,,
207,504,giveaway,1,17:26,154,154,99,-6,8479406,66,,,
192,507,missed-shot,1,17:25,155,155,72,0,8478010,60,deflected,wide-left,
195,506,shot-on-goal,1,17:05,175,175,85,25,8473419,60,snap,,
267,503,hit,1,16:28,212,212,-34,-39,8476892,60,,,
271,503,hit,1,16:14,226,226,-70,-39,8476483,66,,,
109,507,missed-shot,1,15:51,249,249,77,-4,8478402,60,snap,wide-left,
110,502,faceoff,1,15:23,277,277,69,22,0,60,,,
219,508,blocked-shot,1,15:21,279,279,76,8,8478038,60,,blocked,
221,508,blocked-shot,1,15:04,296,296,74,6,8478038,60,,blocked,
222,507,missed-shot,1,14:59,301,301,37,-24,8480069,60,snap,wide-right,
236,525,takeaway,1,14:34,326,326,-66,33,8476887,66,,,
242,504,giveaway,1,14:29,331,331,-12,13,8476887,66,,,
234,508,blocked-shot,1,13:56,364,364,-78,6,8476887,66,,blocked,
251,504,giveaway,1,13:47,373,373,-44,-40,8482093,60,,,
111,507,missed-shot,1,13:05,415,415,-3,18,8477939,66,wrist,wide-right,
263,504,giveaway,1,12:52,428,428,84,29,8477492,60,,,
265,504,giveaway,1,12:44,436,436,71,40,8478493,66,,,
266,504,giveaway,1,12:39,441,441,80,-34,8480069,60,,,
268,525,takeaway,1,12:18,462,462,28,13,8480012,66,,,
112,502,faceoff,1,12:03,477,477,69,22,0,66,,,
371,503,hit,1,12:00,480,480,98,24,8476463,66,,,
277,504,giveaway,1,11:50,490,490,-68,37,8477504,60,,,
283,525,takeaway,1,11:43,497,497,-40,41,8478483,60,,,
113,502,faceoff,1,11:12,528,528,20,22,0,60,,,
374,503,hit,1,10:46,554,554,-26,40,8475913,60,,,
395,503,hit,1,10:31,569,569,-73,-25,8476887,66,,,
416,503,hit,1,09:33,627,627,61,40,8477504,60,,,
362,506,shot-on-goal,1,09:07,653,653,-57,-41,8476892,60,wrist,,
114,502,faceoff,1,09:01,659,659,69,-22,0,66,,,
368,504,giveaway,1,08:53,667,667,46,-21,8477933,60,,,
366,506,shot-on-goal,1,08:34,686,686,66,-26,8480069,60,snap,,
116,502,faceoff,1,08:32,688,688,69,-22,0,66,,,
303,507,missed-shot,1,08:20,700,700,-37,7,8480839,66,wrist,short,
384,508,blocked-shot,1,07:37,743,743,78,-17,8474563,60,,blocked,
393,506,shot-on-goal,1,07:07,773,773,78,-4,8478519,60,tip-in,,
117,502,faceoff,1,07:04,776,776,69,-22,0,60,,,
397,507,missed-shot,1,07:02,778,778,79,-33,8473419,60,backhand,wide-right,
398,505,goal,1,06:45,795,795,75,7,8473419,60,snap,,https://nhl.com/video/can-swe-marchand-scores-goal-against-filip-gustavsson-6368734035112
118,502,faceoff,1,06:45,795,795,0,0,0,60,,,
437,503,hit,1,06:40,800,800,18,40,8480839,66,,,
119,502,faceoff,1,06:34,806,806,69,22,0,66,,,
403,508,blocked-shot,1,06:22,818,818,64,11,8475913,60,,blocked,
405,507,missed-shot,1,06:11,829,829,-82,-23,8477939,66,backhand,wide-left,
120,502,faceoff,1,05:39,861,861,-20,22,0,60,,,
420,507,missed-shot,1,04:47,913,913,-60,-30,8478055,66,snap,wide-right,
121,502,faceoff,1,04:45,915,915,-69,-22,0,60,,,
436,504,giveaway,1,04:36,924,924,-59,-38,8477939,66,,,
302,508,blocked-shot,1,04:29,931,931,-80,1,8474578,66,,blocked,
438,508,blocked-shot,1,03:26,994,994,72,-8,8480069,60,,blocked,
490,503,hit,1,03:06,1014,1014,18,40,8478493,66,,,
448,507,missed-shot,1,02:51,1029,1029,-39,-1,8475167,66,slap,wide-left,
449,506,shot-on-goal,1,02:44,1036,1036,-30,-31,8478055,66,snap,,
122,502,faceoff,1,02:42,1038,1038,-69,-22,0,66,,,
453,507,missed-shot,1,02:13,1067,1067,73,11,8477933,60,tip-in,wide-right,
470,504,giveaway,1,01:30,1110,1110,-2,24,8480069,60,,,
469,506,shot-on-goal,1,00:44,1156,1156,-16,31,8477496,66,tip-in,,
478,506,shot-on-goal,1,00:20,1180,1180,-37,-27,8482078,66,snap,,
123,502,faceoff,1,00:18,1182,1182,-69,-22,0,66,,,
651,508,blocked-shot,1,00:06,1194,1194,-53,36,8478493,66,,blocked,
489,503,hit,1,00:06,1194,1194,-57,40,8477492,60,,,
486,507,missed-shot,1,00:03,1197,1197,-78,37,8479407,66,wrist,wide-right,
124,502,faceoff,2,20:00,0,1200,0,0,0,60,,,
555,503,hit,2,19:25,35,1235,98,-9,8476483,66,,,
557,525,takeaway,2,19:12,48,1248,-35,-18,8476459,66,,,
500,506,shot-on-goal,2,18:59,61,1261,-60,-21,8478402,60,snap,,
126,502,faceoff,2,18:57,63,1263,-69,-22,0,66,,,
573,503,hit,2,18:53,67,1267,-81,40,8478439,60,,,
580,503,hit,2,18:43,77,1277,98,8,8474679,66,,,
571,504,giveaway,2,18:42,78,1278,94,13,8476892,60,,,
589,503,hit,2,18:41,79,1279,30,-39,8478519,60,,,
592,503,hit,2,18:37,83,1283,92,-19,8477496,66,,,
595,503,hit,2,18:30,90,1290,-90,-36,8478439,60,,,
598,503,hit,2,18:27,93,1293,-53,40,8479542,60,,,
701,503,hit,2,18:26,94,1294,-16,40,8478519,60,,,
705,503,hit,2,18:18,102,1302,97,-19,8477960,66,,,
564,506,shot-on-goal,2,18:15,105,1305,63,-27,8477960,66,tip-in,,
565,507,missed-shot,2,18:13,107,1307,74,20,8477960,66,wrist,wide-left,
567,507,missed-shot,2,18:08,112,1312,67,-1,8477960,66,tip-in,wide-right,
127,502,faceoff,2,17:57,123,1323,-69,22,0,60,,,
572,507,missed-shot,2,17:50,130,1330,-28,1,8474563,60,slap,above-crossbar,
908,503,hit,2,17:37,143,1343,-55,-40,8477960,66,,,
718,503,hit,2,17:27,153,1353,-86,-34,8473419,60,,,
128,502,faceoff,2,16:26,214,1414,20,22,0,60,,,
597,504,giveaway,2,16:23,217,1417,52,35,8476892,60,,,
593,506,shot-on-goal,2,16:18,222,1422,74,7,8477939,66,backhand,,
304,507,missed-shot,2,16:17,223,1423,92,8,8477939,66,snap,failed-bank-attempt,
129,502,faceoff,2,16:05,235,1435,20,22,0,60,,,
703,504,giveaway,2,15:56,244,1444,-45,24,8476483,66,,,
599,506,shot-on-goal,2,15:46,254,1454,-69,-18,8477933,60,snap,,
130,502,faceoff,2,15:37,263,1463,-69,22,0,60,,,
704,507,missed-shot,2,15:34,266,1466,-45,37,8478038,60,snap,wide-left,
711,506,shot-on-goal,2,15:07,293,1493,-77,-29,8477492,60,snap,,
730,503,hit,2,15:00,300,1500,-58,40,8475913,60,,,
131,502,faceoff,2,14:56,304,1504,20,-22,0,60,,,
715,506,shot-on-goal,2,14:42,318,1518,74,10,8482078,66,backhand,,
133,502,faceoff,2,14:39,321,1521,69,22,0,60,,,
134,502,faceoff,2,14:33,327,1527,69,-22,0,66,,,
722,508,blocked-shot,2,14:16,344,1544,-77,4,8474563,60,,blocked,
135,502,faceoff,2,13:48,372,1572,-20,-22,0,60,,,
741,504,giveaway,2,13:16,404,1604,-77,-29,8478402,60,,,
743,504,giveaway,2,13:14,406,1606,-19,30,8482078,66,,,
739,506,shot-on-goal,2,12:50,430,1630,-65,15,8475913,60,snap,,
136,502,faceoff,2,12:29,451,1651,69,22,0,66,,,
745,506,shot-on-goal,2,12:25,455,1655,49,35,8476887,66,slap,,
137,502,faceoff,2,12:23,457,1657,69,22,0,60,,,
751,508,blocked-shot,2,11:51,489,1689,59,3,8476887,66,,blocked,
757,506,shot-on-goal,2,11:31,509,1709,4,-32,8480012,66,wrist,,
138,502,faceoff,2,11:27,513,1713,69,-22,0,66,,,
769,503,hit,2,11:11,529,1729,-98,-14,8479542,60,,,
139,502,faceoff,2,10:54,546,1746,-69,22,0,66,,,
770,508,blocked-shot,2,10:49,551,1751,-47,-26,8478038,60,,blocked,
775,505,goal,2,10:27,573,1773,64,-34,8476463,66,snap,,https://nhl.com/video/can-swe-brodin-scores-goal-against-jordan-binnington-6368734978112
140,502,faceoff,2,10:27,573,1773,0,0,0,66,,,
141,502,faceoff,2,10:07,593,1793,69,-22,0,66,,,
781,508,blocked-shot,2,09:58,602,1802,73,-2,8477939,66,,blocked,
782,506,shot-on-goal,2,09:54,606,1806,76,-2,8476483,66,tip-in,,
144,502,faceoff,2,09:51,609,1809,69,-22,0,60,,,
786,508,blocked-shot,2,09:30,630,1830,81,3,8476483,66,,blocked,
787,508,blocked-shot,2,09:23,637,1837,41,-35,8474578,66,,blocked,
788,508,blocked-shot,2,09:15,645,1845,72,-16,8477939,66,,blocked,
789,508,blocked-shot,2,09:05,655,1855,55,-17,8474578,66,,blocked,
809,503,hit,2,08:29,691,1891,-78,-39,8482093,60,,,
808,504,giveaway,2,08:17,703,1903,43,21,8478042,66,,,
814,503,hit,2,08:14,706,1906,14,-39,8478042,66,,,
819,503,hit,2,07:59,721,1921,-92,-32,8478439,60,,,
821,503,hit,2,07:46,734,1934,-97,26,8479542,60,,,
810,508,blocked-shot,2,07:40,740,1940,-57,-11,8480069,60,,blocked,
145,502,faceoff,2,07:34,746,1946,0,0,0,60,,,
815,506,shot-on-goal,2,07:09,771,1971,-74,9,8475913,60,backhand,,
305,508,blocked-shot,2,07:07,773,1973,-88,2,8471675,60,,blocked,
146,502,faceoff,2,07:04,776,1976,-69,-22,0,60,,,
822,506,shot-on-goal,2,06:50,790,1990,-30,22,8476892,60,slap,,
147,502,faceoff,2,06:48,792,1992,-69,22,0,60,,,
826,508,blocked-shot,2,06:36,804,2004,62,15,8475167,66,,blocked,
827,507,missed-shot,2,06:31,809,2009,-56,-14,8471675,60,wrist,hit-crossbar,
306,507,missed-shot,2,05:52,848,2048,92,-28,8480012,66,backhand,wide-right,
847,503,hit,2,05:42,858,2058,95,-23,8477960,66,,,
848,504,giveaway,2,05:39,861,2061,77,-41,8477960,66,,,
850,525,takeaway,2,05:36,864,2064,35,-39,8476887,66,,,
839,507,missed-shot,2,05:23,877,2077,49,19,8477960,66,slap,high-and-wide-left,
846,508,blocked-shot,2,04:56,904,2104,66,26,8478042,66,,blocked,
849,507,missed-shot,2,04:48,912,2112,66,21,8478042,66,slap,wide-left,
860,504,giveaway,2,04:24,936,2136,93,-30,8478038,60,,,
875,525,takeaway,2,03:39,981,2181,50,-42,8480069,60,,,
909,503,hit,2,03:35,985,2185,67,-40,8478493,66,,,
867,506,shot-on-goal,2,03:19,1001,2201,48,-21,8482078,66,snap,,
869,507,missed-shot,2,03:14,1006,2206,41,-11,8475218,66,slap,above-crossbar,
879,505,goal,2,02:32,1048,2248,-63,8,8475913,60,snap,,https://nhl.com/video/can-swe-stone-scores-goal-against-filip-gustavsson-6368736695112
148,502,faceoff,2,02:32,1048,2248,0,0,0,60,,,
885,508,blocked-shot,2,01:50,1090,2290,66,-3,8474578,66,,blocked,
149,508,blocked-shot,2,01:40,1100,2300,75,-8,8475218,66,,blocked,
889,506,shot-on-goal,2,01:30,1110,2310,76,-1,8476887,66,deflected,,
150,502,faceoff,2,01:26,1114,2314,69,22,0,66,,,
951,508,blocked-shot,2,01:23,1117,2317,62,27,8477939,66,,blocked,
893,504,giveaway,2,01:21,1119,2319,85,25,8476887,66,,,
900,504,giveaway,2,00:45,1155,2355,-94,-13,8477504,60,,,
501,502,faceoff,2,00:01,1199,2399,69,22,0,66,,,
502,508,blocked-shot,2,00:01,1199,2399,71,20,8478493,66,,blocked,
503,502,faceoff,3,20:00,0,2400,0,0,0,66,,,
505,502,faceoff,3,19:49,11,2411,-69,22,0,66,,,
913,507,missed-shot,3,19:46,14,2414,-68,11,8477939,66,tip-in,wide-right,
916,507,missed-shot,3,19:26,34,2434,-33,-42,8475167,66,snap,wide-left,
927,504,giveaway,3,19:08,52,2452,99,-17,8480839,66,,,
925,506,shot-on-goal,3,19:05,55,2455,30,-30,8476892,60,slap,,
506,502,faceoff,3,19:03,57,2457,69,-22,0,60,,,
928,507,missed-shot,3,18:47,73,2473,78,12,8478483,60,deflected,wide-right,
940,503,hit,3,18:37,83,2483,18,40,8477933,60,,,
937,505,goal,3,18:06,114,2514,-50,2,8477960,66,snap,,https://nhl.com/video/can-swe-kempe-scores-goal-against-jordan-binnington-6368739343112
507,502,faceoff,3,18:06,114,2514,0,0,0,60,,,
941,507,missed-shot,3,17:46,134,2534,-75,37,8476887,66,snap,wide-right,
508,502,faceoff,3,16:24,216,2616,-20,-22,0,60,,,
1011,508,blocked-shot,3,16:07,233,2633,-67,9,8480839,66,,blocked,
1021,503,hit,3,16:04,236,2636,-98,19,8476483,66,,,
1022,504,giveaway,3,15:55,245,2645,53,-15,8478055,66,,,
1033,503,hit,3,15:43,257,2657,87,-33,8479542,60,,,
1036,525,takeaway,3,15:15,285,2685,85,35,8479542,60,,,
1023,506,shot-on-goal,3,15:11,289,2689,32,-41,8474563,60,snap,,
1038,504,giveaway,3,15:06,294,2694,99,-1,8478439,60,,,
1044,525,takeaway,3,14:44,316,2716,64,-36,8473419,60,,,
509,502,faceoff,3,14:36,324,2724,0,0,0,60,,,
1048,503,hit,3,14:34,326,2726,13,-40,8476887,66,,,
1060,504,giveaway,3,14:30,330,2730,90,35,8476463,66,,,
1061,504,giveaway,3,14:27,333,2733,81,16,8475167,66,,,
1056,503,hit,3,14:14,346,2746,-97,-1,8477960,66,,,
1046,506,shot-on-goal,3,13:40,380,2780,-79,0,8478042,66,tip-in,,
1063,504,giveaway,3,13:32,388,2788,65,-24,8480839,66,,,
1064,504,giveaway,3,13:30,390,2790,41,-32,8480069,60,,,
1050,508,blocked-shot,3,13:26,394,2794,-54,31,8477496,66,,blocked,
510,502,faceoff,3,13:01,419,2819,69,22,0,66,,,
1066,508,blocked-shot,3,12:39,441,2841,56,-35,8474563,60,,blocked,
511,502,faceoff,3,12:37,443,2843,69,-22,0,60,,,
1070,506,shot-on-goal,3,12:35,445,2845,31,-14,8478038,60,snap,,
512,502,faceoff,3,12:33,447,2847,69,-22,0,66,,,
1086,503,hit,3,11:46,494,2894,9,34,8479542,60,,,
513,506,shot-on-goal,3,11:42,498,2898,-82,29,8477960,66,backhand,,
1083,508,blocked-shot,3,11:22,518,2918,-82,19,8474578,66,,blocked,
514,502,faceoff,3,11:07,533,2933,-69,-22,0,66,,,
1087,505,goal,3,11:01,539,2939,-85,7,8478493,66,wrist,,https://nhl.com/video/can-swe-eriksson-ek-scores-goal-against-jordan-binnington-6368737891112
515,502,faceoff,3,11:01,539,2939,0,0,0,66,,,
1093,503,hit,3,10:56,544,2944,97,7,8482093,60,,,
516,502,faceoff,3,10:50,550,2950,-20,-22,0,60,,,
517,502,faceoff,3,10:19,581,2981,-69,22,0,66,,,
1103,508,blocked-shot,3,10:16,584,2984,-51,-23,8478055,66,,blocked,
518,502,faceoff,3,10:14,586,2986,-69,-22,0,60,,,
1108,506,shot-on-goal,3,09:45,615,3015,-58,-24,8477939,66,snap,,
1112,506,shot-on-goal,3,09:31,629,3029,69,14,8478038,60,snap,,
522,502,faceoff,3,09:30,630,3030,69,22,0,60,,,
1129,525,takeaway,3,09:20,640,3040,53,-42,8480069,60,,,
1134,504,giveaway,3,09:18,642,3042,31,-40,8480069,60,,,
1118,506,shot-on-goal,3,08:54,666,3066,76,8,8478038,60,snap,,
1204,504,giveaway,3,08:31,689,3089,13,41,8477492,60,,,
1128,508,blocked-shot,3,08:22,698,3098,-62,-34,8475167,66,,blocked,
524,502,faceoff,3,08:04,716,3116,-20,22,0,60,,,
1205,503,hit,3,07:30,750,3150,-98,-14,8480012,66,,,
1142,508,blocked-shot,3,07:21,759,3159,78,-3,8480069,60,,blocked,
1144,507,missed-shot,3,07:20,760,3160,88,-11,8473419,60,backhand,wide-right,
1150,509,penalty,3,07:06,774,3174,-60,-39,0,60,,,
525,502,faceoff,3,07:06,774,3174,-69,-22,0,66,,,
1208,508,blocked-shot,3,06:40,800,3200,-56,3,8475167,66,,blocked,
526,502,faceoff,3,06:38,802,3202,-69,22,0,66,,,
1223,504,giveaway,3,06:30,810,3210,-69,42,8478038,60,,,
1218,506,shot-on-goal,3,05:59,841,3241,-76,21,8474578,66,wrist,,
1219,507,missed-shot,3,05:50,850,3250,55,16,8480069,60,snap,above-crossbar,
1231,504,giveaway,3,05:38,862,3262,-15,-21,8476887,66,,,
1234,506,shot-on-goal,3,04:58,902,3302,-69,-32,8477960,66,snap,,
1237,508,blocked-shot,3,04:37,923,3323,-68,24,8477496,66,,blocked,
527,502,faceoff,3,04:35,925,3325,-69,22,0,60,,,
528,502,faceoff,3,04:28,932,3332,-69,22,0,60,,,
1242,506,shot-on-goal,3,04:22,938,3338,-28,-35,8476483,66,wrist,,
529,502,faceoff,3,04:15,945,3345,-69,-22,0,60,,,
530,502,faceoff,3,03:49,971,3371,69,22,0,60,,,
1263,525,takeaway,3,03:37,983,3383,-94,-29,8475913,60,,,
1271,504,giveaway,3,03:23,997,3397,69,42,8482078,66,,,
1270,503,hit,3,03:22,998,3398,45,41,8478493,66,,,
1274,525,takeaway,3,02:55,1025,3425,89,33,8478038,60,,,
1279,504,giveaway,3,02:43,1037,3437,-24,42,8478010,60,,,
1273,508,blocked-shot,3,02:24,1056,3456,54,19,8477504,60,,blocked,
1281,503,hit,3,02:10,1070,3470,98,-23,8476463,66,,,
1275,506,shot-on-goal,3,02:04,1076,3476,85,9,8477933,60,snap,,
531,502,faceoff,3,02:02,1078,3478,69,22,0,66,,,
1296,503,hit,3,01:29,1111,3511,35,-40,8478055,66,,,
1289,506,shot-on-goal,3,01:04,1136,3536,-70,36,8475167,66,snap,,
1290,506,shot-on-goal,3,00:56,1144,3544,-45,-40,8480839,66,snap,,
1300,508,blocked-shot,3,00:35,1165,3565,82,-5,8476892,60,,teammate-blocked,
1309,504,giveaway,3,00:18,1182,3582,60,31,8477492,60,,,
532,502,faceoff,4,10:00,600,4200,0,0,0,66,,,
1321,506,shot-on-goal,4,08:36,684,4284,-72,10,8477492,60,snap,,
534,502,faceoff,4,08:34,686,4286,-69,22,0,66,,,
1326,506,shot-on-goal,4,08:05,715,4315,67,17,8476459,66,wrist,,
535,502,faceoff,4,08:03,717,4317,69,22,0,60,,,
1330,506,shot-on-goal,4,07:47,733,4333,-69,-14,8477492,60,wrist,,
536,502,faceoff,4,07:46,734,4334,-69,-22,0,60,,,
1333,506,shot-on-goal,4,07:25,755,4355,-62,-3,8477492,60,snap,,
1340,504,giveaway,4,07:20,760,4360,-76,18,8476887,66,,,
1335,506,shot-on-goal,4,07:13,767,4367,-58,-3,8480069,60,snap,,
1339,506,shot-on-goal,4,06:57,783,4383,-66,-15,8479542,60,wrist,,
1345,506,shot-on-goal,4,06:16,824,4424,-68,13,8478483,60,snap,,
307,507,missed-shot,4,06:14,826,4426,-79,8,8478010,60,snap,wide-left,
537,502,faceoff,4,06:12,828,4428,-69,22,0,60,,,
308,506,shot-on-goal,4,05:35,865,4465,-84,0,8476459,66,deflected,,
652,506,shot-on-goal,4,05:34,866,4466,83,-1,8476483,66,backhand,,
1349,506,shot-on-goal,4,05:26,874,4474,-65,-11,8477492,60,snap,,
1401,507,missed-shot,4,05:18,882,4482,56,-30,8476459,66,slap,above-crossbar,
538,508,blocked-shot,4,05:10,890,4490,69,-2,8477960,66,,blocked,
653,507,missed-shot,4,05:00,900,4500,58,-23,8480012,66,slap,wide-right,
1406,508,blocked-shot,4,04:56,904,4504,61,6,8478055,66,,blocked,
1407,506,shot-on-goal,4,04:50,910,4510,83,0,8477960,66,tip-in,,
1417,505,goal,4,03:54,966,4566,-56,8,8478483,60,snap,,https://nhl.com/video/can-swe-marner-scores-goal-against-filip-gustavsson-6368740170112
`;


// parse data from csv string
function parseCSV() {
    const ds = [];
    let l = "";
    for(let i = 0; i < csv.length; i++) {
        if(csv[i] != "\n") {
            l += csv[i];
        } else {
            l += ",";
            ds.push(parseLine(l));
            l = "";
        }
    }
    return ds;
}

// parse line for values
function parseLine(l) {
    const d = [];
    let v = "";
    for(let i = 0; i < l.length; i++) {
        if(l[i] != ",") {
            v += l[i];
        } else {
            d.push(parseFloat(v));
            v = "";
        }
    }
    return d;
}

function calcVectors(xyz) {
    let vectors = [];
    for(let i = 0; i < xyz.length; i++) {
        vectors.push(new THREE.Vector3(xyz[i][0], xyz[i][1], xyz[i][2]));
    }
    return vectors;
}

const DEFAULT_SIZE = 1.5;
const DEFAULT_HEIGHT = 1;
const DEFAULT_ALPHA = 0.1;

const sizes = {
    505: 6,
    506: 3.5,
    507: 2,
}

const heights = {
    505: 30,
    506: 15,
    507: 5,
}

const alphas = {
    505: 1.0,
    506: 0.8,
    507: 0.6,
}

// hash table for team id: hex colors
const colors = {
    //10: 0x082057,
    //23: 0x0a1b2b
    //23: 0xf5e4d4,
    //23: 0xff1111,
    66: 0xfed000,
    60: 0xff1111,
}

function renderPoint(d) {
    const c = d[1];
    const p = d[3];

    let x = d[7];
    let y = d[8];
    
    // mirror during 2nd period
    // easy to do cause around 0,0,0
    if((p % 2) == 0) {
        x = -x;
        y = -y;
    }

    // if code in table then take the value else default
    const size = sizes.hasOwnProperty(c) ? sizes[c] : DEFAULT_SIZE;
    const z = heights.hasOwnProperty(c) ? heights[c] : DEFAULT_HEIGHT;
    const alpha = alphas.hasOwnProperty(c) ? alphas[c] : DEFAULT_ALPHA;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', 
        new THREE.Float32BufferAttribute([
            x,
            y,
            z,
        ], 3));

    const color = colors[parseInt(d[10])]
    const material = new THREE.PointsMaterial({ 
        color: color,
        size: size,
        transparent: true,
        opacity: alpha
    });
    
    const point = new THREE.Points(geometry, material);
    scene.add(point);
}

function renderEvents(data) {
    //let points = [];
    data.forEach((d) => {
        renderPoint(d);
    //points.push(point);
    });
}

// render the river and animate it
function renderGame() {
    console.log("test1");
    let data = parseCSV();
    renderEvents(data);
    console.log("test2");
    renderRink();
}

function renderRink() {
    renderIce();
    renderLines();
    renderNets();
    renderLights();
}

// position ranges from -100 to 100 meters on the x-axis and -42.5 to 42.5 meters on the y-axis 
function renderIce() {
    // NHL rink dimensions
    const geometry = new THREE.PlaneGeometry(200, 85); 
    
    // ice material with realistic properties
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xf2f8fc,            // slight blue-white tint
        metalness: 0.0,             // low metalness for more icy look
        roughness: 0.05,            // smooth surface, ice
        transmission: 0.9,
        thickness: 0.1,             // material thickness for transmission
        // clearcoat worse when on
        //clearcoat: 0.0,           // add clearcoat for extra shine
        //clearcoatRoughness: 0.0,  // smooth clearcoat
        transparent: true,
        //opacity: 0.95,
        side: THREE.DoubleSide,
        //side: THREE.FrontSide,
    });

    const rink = new THREE.Mesh(geometry, material);
    rink.position.set(0, 0, 0);
    
    scene.add(rink);
    
    // subtle fog for depth
    //scene.fog = new THREE.Fog(0x878787, 100, 700);
}


function renderLines() {
    const geometry = new THREE.PlaneGeometry(1, 85); 
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.1,
        transparent: true,
        opacity: 0.6,
        side: THREE.FrontSide,
    });
    const centerLine = new THREE.Mesh(geometry, material);
    centerLine.position.set(0, 0, 0.05);
    scene.add(centerLine);

    renderOffsides();
    renderGoalLines();
    renderFaceoffCircles();
}

function renderGoalLines() {
    const geometry = new THREE.PlaneGeometry(0.5, 85); 
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.1,
        transparent: true,
        opacity: 0.8,
        side: THREE.FrontSide,
    });

    const leftGoalLine = new THREE.Mesh(geometry, material);
    leftGoalLine.position.set(-89, 0, 0.05);
    
    const rightGoalLine = new THREE.Mesh(geometry, material);
    rightGoalLine.position.set(89, 0, 0.05);
    
    scene.add(leftGoalLine);
    scene.add(rightGoalLine);
}

function renderOffsides() {
    const geometry = new THREE.PlaneGeometry(1.5, 85); 
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x0000ff,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.1,
        transparent: true,
        opacity: 0.8,
        side: THREE.FrontSide,
    });

    const left_offside_line = new THREE.Mesh(geometry, material);
    left_offside_line.position.set(-26.5, 0, 0.05);
    
    const right_offside_line = new THREE.Mesh(geometry, material);
    right_offside_line.position.set(26.5, 0, 0.05);
    
    scene.add(left_offside_line);
    scene.add(right_offside_line);
}

function renderNets() {
    const netL = createHockeyNet();
    netL.rotation.z = Math.PI / 2;
    netL.rotation.y = Math.PI / 2;
    netL.position.set(-89, 0, 0);
    const netR = createHockeyNet();
    netR.rotation.z = -Math.PI / 2;
    netR.rotation.y = -Math.PI / 2;
    netR.position.set(89, 0, 0);
    
    scene.add(netL);
    scene.add(netR);
}

// hockey Net dimensions in feet
const NET_WIDTH = 6;
const NET_HEIGHT = 4;
const NET_DEPTH = 2.5;
const PIPE_RADIUS = 0.1;

function createHockeyNet() {
    const netGroup = new THREE.Group();
    
    const pipeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.8,
      //roughness: 0.2
    });

    // pipe geometry
    function createPipe(start, end) {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        const geometry = new THREE.CylinderGeometry(
          PIPE_RADIUS, 
          PIPE_RADIUS, 
          length,
          8  // n segments
        );
        
        const pipe = new THREE.Mesh(geometry, pipeMaterial);
        
        // position and rotate the pipe according to start and end positions
        pipe.position.copy(start);
        pipe.position.add(direction.multiplyScalar(0.5));
        pipe.lookAt(end);
        pipe.rotateX(Math.PI / 2);
        
        return pipe;
    }

    // create the frame pipes positions
    const corners = {
        bottomLeft: new THREE.Vector3(-NET_WIDTH/2, 0, 0),
        bottomRight: new THREE.Vector3(NET_WIDTH/2, 0, 0),
        topLeft: new THREE.Vector3(-NET_WIDTH/2, NET_HEIGHT, 0),
        topRight: new THREE.Vector3(NET_WIDTH/2, NET_HEIGHT, 0),
        bottomBackLeft: new THREE.Vector3(-NET_WIDTH/2, 0, -NET_DEPTH),
        bottomBackRight: new THREE.Vector3(NET_WIDTH/2, 0, -NET_DEPTH),
        topBackLeft: new THREE.Vector3(-NET_WIDTH/2, NET_HEIGHT, -NET_DEPTH),
        topBackRight: new THREE.Vector3(NET_WIDTH/2, NET_HEIGHT, -NET_DEPTH)
    };

    // front frame
    netGroup.add(createPipe(corners.bottomLeft, corners.topLeft));
    netGroup.add(createPipe(corners.bottomRight, corners.topRight));
    netGroup.add(createPipe(corners.topLeft, corners.topRight));
    
    // back frame
    netGroup.add(createPipe(corners.bottomBackLeft, corners.bottomBackRight));
    netGroup.add(createPipe(corners.bottomBackLeft, corners.topBackLeft));
    netGroup.add(createPipe(corners.bottomBackRight, corners.topBackRight));
    netGroup.add(createPipe(corners.topBackLeft, corners.topBackRight));
    
    // connecting pipes
    netGroup.add(createPipe(corners.bottomLeft, corners.bottomBackLeft));
    netGroup.add(createPipe(corners.bottomRight, corners.bottomBackRight));
    netGroup.add(createPipe(corners.topLeft, corners.topBackLeft));
    netGroup.add(createPipe(corners.topRight, corners.topBackRight));
    
    // support pipes at back to indicate so
    const centerBottom = new THREE.Vector3(0, 0, -NET_DEPTH);
    const centerTop = new THREE.Vector3(0, NET_HEIGHT, -NET_DEPTH);
    netGroup.add(createPipe(centerBottom, centerTop));

    return netGroup;
}

const endZoneFaceoffPositions = [
    { x: -69, y: -22 },
    { x: -69, y: 22 },
    { x: 69, y: -22 },
    { x: 69, y: 22 }
];

const neutralZoneFaceoffPositions = [
    { x: -20, y: -22 },
    { x: -20, y: 22 },
    { x: 20, y: -22 },
    { x: 20, y: 22 }
]

function renderFaceoffCircles() {
    renderCenterFaceoffCircle();
    // puck drop
    const radius = 1;
    const segments = 64;
    const circleGeometry = new THREE.CircleGeometry(radius, segments);
    const circleMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xff0000,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.1,
        transparent: true,
        opacity: 0.95,
        side: THREE.FrontSide,
    });
    const outlineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        linewidth: 1,
    });
    // loop through end zone faceoff pos
    endZoneFaceoffPositions.forEach(pos => {
        // puck drop
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.position.set(pos.x, pos.y, 0.06);
        scene.add(circle);
        // outline
        const curve = new THREE.EllipseCurve(
            pos.x, pos.y,
            15, 15,
            0, 2 * Math.PI,
            false,
            0
        );
        const points = curve.getPoints(500);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const outline = new THREE.Line(geometry, outlineMaterial);
        scene.add(outline);
    });

    // loop through neutral zone faceoff pos
    neutralZoneFaceoffPositions.forEach(pos => {
        // puck drop
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.position.set(pos.x, pos.y, 0.06);
        scene.add(circle);
    });
}

function renderCenterFaceoffCircle() {
    // puck drop
    const radius = 1;
    const segments = 64;
    const centerCircleGeometry = new THREE.CircleGeometry(radius, segments);
    const centerCircleMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x0000ff,
        metalness: 0.0,
        roughness: 0.05,
        transmission: 0.9,
        thickness: 0.1,
        transparent: true,
        opacity: 0.95,
        side: THREE.FrontSide,
    });
    const centerCircle = new THREE.Mesh(
        centerCircleGeometry, 
        centerCircleMaterial
    );
    centerCircle.position.set(0, 0, 0.06);
    scene.add(centerCircle);

    // outline
    // Create a curve that forms a circle
    const curve = new THREE.EllipseCurve(
        0, 0,            // Center x, y
        15, 15,         // X radius, Y radius
        0, 2 * Math.PI,  // Start angle, end angle
        false,           // Clockwise
        0               // Rotation
    );
    
    // Create points along the curve
    const points = curve.getPoints(500);
    
    // Convert points to a geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create a line material
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
    
    // Create the final circle
    const circle = new THREE.Line(geometry, material);
    scene.add(circle);
}

function renderLights() {
    // overhead lights
    const mainLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight1.position.set(0, 100, 100);
    scene.add(mainLight1);
    const mainLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight2.position.set(0, -100, 100);
    scene.add(mainLight2);
    
    // corner lights for more realistic rink lighting
    const cornerLights = [
        { x: 100, y: 42.5 },
        { x: -100, y: 42.5 },
        { x: 100, y: -42.5 },
        { x: -100, y: -42.5 }
    ];
    
    cornerLights.forEach(pos => {
        const light = new THREE.PointLight(0xffffff, 0.3);
        light.position.set(pos.x, pos.y, 50);
        scene.add(light);
    });
    
    // subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // subtle hemisphere light for better color blending
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xb4d4ff, 0.3);
    scene.add(hemiLight);
}

// render visual helpers
function renderTools() {
    const size = 1000;
    const divisions = 40;
    const gridHelper = new THREE.GridHelper( size, divisions );
    gridHelper.rotation.x = Math.PI / 2;
    scene.add( gridHelper );
    const axesHelper = new THREE.AxesHelper( 500 );
    //const red = new THREE.Color("rgb(255, 0, 0)");
    //const green = new THREE.Color("rgb(0, 255, 0)");
    //const blue = new THREE.Color("rgb(0, 0, 255)");
    //axesHelper.setColors(red, green, blue);
    scene.add(axesHelper);
}

// global render
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.autoClear = false;
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// global cam
const fov = 75;
const aspect = w / h;
const near = 0.1;
const far = 10000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
// set cam default
//x, y, z
camera.position.set(0, -75, 75);
//camera.position.set(50, -200, 75);
camera.lookAt(0, 0, 0);
camera.up.set(0, 0, 1);

// global scene
const scene = new THREE.Scene();

//scene.background = new THREE.Color(0xe8e6d8);
scene.background = new THREE.Color(0x878787);

// update the renderer for better visual effects
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// do this once
//const textureLoader = new THREE.TextureLoader();
//const icogeo = new THREE.IcosahedronGeometry(1, 16);

render();

// global controls
const controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.enable = true;
controls.minDistance = 5;
controls.maxDistance = 3000;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.staticMoving = false;
controls.zoomSpeed = 1.2;
controls.rotateSpeed = 1.0;
controls.panSpeed = 0.8;

renderTools();
renderGame();

// render the rendering renderer
function render() {
    renderer.render(scene, camera)
}

// animate the scene lel
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
}

window.addEventListener("resize", () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    controls.update();
    renderer.setSize(w, h);
    render();
});

animate();

