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
//additional_info,      11
//highlight_clip_url    12


const csv = `
158,502,faceoff,1,19:50,10,10,-69,-22,0,10,,
449,507,missed-shot,1,19:48,12,12,-49,-13,8482055,23,wrist;wide-left,
444,507,missed-shot,1,19:30,30,30,-77,-7,8480748,23,tip-in;wide-right,
447,503,hit,1,19:19,41,41,-95,-23,8476853,10,,
446,504,giveaway,1,18:59,61,61,-82,-25,8480078,23,,
429,507,missed-shot,1,18:39,81,81,-50,39,8478444,23,wrist;wide-left,
432,503,hit,1,18:25,95,95,-20,-27,8474574,23,,
419,507,missed-shot,1,17:50,130,130,-78,8,8480459,23,tip-in;wide-right,
420,503,hit,1,17:11,169,169,-32,-13,8478483,10,,
412,509,penalty,1,16:56,184,184,-81,-36,0,10,,
157,502,faceoff,1,16:56,184,184,-69,-22,0,10,,
409,506,shot-on-goal,1,16:54,186,186,-81,8,8482496,23,snap,
408,506,shot-on-goal,1,16:53,187,187,-45,3,8474574,23,slap,
407,508,blocked-shot,1,16:39,201,201,-82,-5,8481535,23,blocked,
398,506,shot-on-goal,1,16:12,228,228,-78,16,8479425,23,wrist,
156,502,faceoff,1,15:48,252,252,-69,-22,0,10,,
378,507,missed-shot,1,15:05,295,295,68,-2,8479318,10,wrist;wide-left,
376,508,blocked-shot,1,14:58,302,302,60,-16,8475690,10,blocked,
501,507,missed-shot,1,14:36,324,324,-83,-6,8478856,23,wrist;wide-left,
380,504,giveaway,1,14:24,336,336,-37,26,8479425,23,,
369,506,shot-on-goal,1,14:18,342,342,-70,-24,8478856,23,wrist,
360,507,missed-shot,1,13:42,378,378,-78,-27,8480012,23,wrist;hit-crossbar,
357,507,missed-shot,1,13:25,395,395,69,6,8474157,10,tip-in;wide-right,
395,503,hit,1,13:23,397,397,96,4,8480144,10,,
362,504,giveaway,1,13:07,413,413,21,-42,8477969,23,,
390,503,hit,1,13:06,414,414,20,-40,8480144,10,,
373,503,hit,1,12:51,429,429,-93,31,8476927,23,,
342,508,blocked-shot,1,12:31,449,449,-76,-2,8475762,23,blocked,
361,503,hit,1,11:43,497,497,85,-37,8483678,23,,
334,503,hit,1,11:05,535,535,-6,39,8481122,10,,
313,508,blocked-shot,1,10:30,570,570,82,4,8476931,10,blocked,
324,525,takeaway,1,10:21,579,579,84,40,8477939,10,,
322,503,hit,1,10:08,592,592,-94,-20,8480748,23,,
155,502,faceoff,1,10:00,600,600,-69,-22,0,23,,
305,507,missed-shot,1,09:58,602,602,-46,-30,8483678,23,slap;high-and-wide-left,
295,506,shot-on-goal,1,09:26,634,634,52,18,8479318,10,slap,
312,504,giveaway,1,09:23,637,637,62,42,8475171,10,,
311,525,takeaway,1,09:14,646,646,-96,26,8482720,10,,
290,506,shot-on-goal,1,09:00,660,660,-40,13,8476927,23,wrist,
289,507,missed-shot,1,08:53,667,667,62,21,8482720,10,wrist;high-and-wide-right,
307,504,giveaway,1,08:47,673,673,-88,-33,8479026,10,,
310,503,hit,1,08:33,687,687,-58,41,8480078,23,,
279,508,blocked-shot,1,08:21,699,699,-42,-14,8483678,23,blocked,
291,503,hit,1,07:43,737,737,29,-38,8475171,10,,
266,506,shot-on-goal,1,07:28,752,752,82,5,8477939,10,wrist,
280,503,hit,1,07:04,776,776,-95,-9,8478057,23,,
259,505,goal,1,07:00,780,780,-80,10,8479425,23,snap,https://nhl.com/video/tor-van-hronek-scores-goal-against-joseph-woll-6368531808112
56,502,faceoff,1,07:00,780,780,0,0,0,23,,
264,525,takeaway,1,06:54,786,786,-89,-34,8480012,23,,
258,506,shot-on-goal,1,06:49,791,791,-83,-8,8478498,23,wrist,
257,506,shot-on-goal,1,06:48,792,792,-37,-27,8475762,23,wrist,
249,508,blocked-shot,1,06:15,825,825,-86,3,8476927,23,teammate-blocked,
262,503,hit,1,06:08,832,832,-76,-39,8474157,10,,
248,506,shot-on-goal,1,06:05,835,835,-33,-23,8477969,23,slap,
247,507,missed-shot,1,06:00,840,840,-47,-32,8477969,23,snap;wide-right,
237,506,shot-on-goal,1,05:31,869,869,-76,13,8480078,23,wrist,
245,504,giveaway,1,05:12,888,888,26,-40,8483678,23,,
227,508,blocked-shot,1,04:56,904,904,-50,23,8479425,23,blocked,
226,506,shot-on-goal,1,04:51,909,909,-59,14,8478057,23,wrist,
236,504,giveaway,1,04:35,925,925,-18,25,8481122,10,,
154,502,faceoff,1,04:19,941,941,-69,-22,0,10,,
221,504,giveaway,1,03:55,965,965,-81,-16,8479318,10,,
203,507,missed-shot,1,03:25,995,995,-59,30,8480012,23,tip-in;wide-right,
225,503,hit,1,03:22,998,998,-56,-40,8479026,10,,
222,503,hit,1,03:09,1011,1011,62,40,8480748,23,,
147,506,shot-on-goal,1,03:06,1014,1014,45,-41,8479026,10,wrist,
220,503,hit,1,03:06,1014,1014,50,-37,8479425,23,,
210,504,giveaway,1,02:59,1021,1021,-29,37,8476927,23,,
209,503,hit,1,02:14,1066,1066,-9,32,8480995,10,,
134,506,shot-on-goal,1,02:08,1072,1072,61,-28,8482259,10,wrist,
131,506,shot-on-goal,1,02:01,1079,1079,69,30,8481582,10,wrist,
130,507,missed-shot,1,02:00,1080,1080,80,-19,8480995,10,backhand;wide-left,
54,502,faceoff,1,01:42,1098,1098,0,0,0,23,,
153,502,faceoff,1,01:26,1114,1114,-69,22,0,10,,
119,508,blocked-shot,1,01:23,1117,1117,-78,26,8478856,23,blocked,
129,504,giveaway,1,01:19,1121,1121,-98,-1,8478057,23,,
128,503,hit,1,00:47,1153,1153,94,29,8477369,23,,
124,504,giveaway,1,00:46,1154,1154,87,7,8477967,23,,
108,506,shot-on-goal,1,00:36,1164,1164,27,-13,8475171,10,wrist,
53,502,faceoff,1,00:27,1173,1173,69,22,0,10,,
121,503,hit,1,00:19,1181,1181,98,2,8474157,10,,
107,504,giveaway,1,00:14,1186,1186,32,-8,8483678,23,,
109,503,hit,1,00:06,1194,1194,-32,-39,8483678,23,,
51,502,faceoff,1,00:00,1200,1200,0,0,0,23,,
797,505,goal,2,19:54,6,1206,-66,22,8476853,10,wrist,https://nhl.com/video/tor-van-rielly-scores-goal-against-kevin-lankinen-6368536115112
63,502,faceoff,2,19:54,6,1206,0,0,0,10,,
795,507,missed-shot,2,19:50,10,1210,-59,-11,8479318,10,slap;wide-left,
169,502,faceoff,2,19:37,23,1223,-69,-22,0,10,,
790,506,shot-on-goal,2,19:35,25,1225,-47,-15,8477503,10,wrist,
783,508,blocked-shot,2,18:44,76,1276,-72,-20,8477939,10,blocked,
781,506,shot-on-goal,2,18:30,90,1290,-78,-17,8475166,10,wrist,
778,509,penalty,2,17:50,130,1330,90,32,0,23,,
168,502,faceoff,2,17:50,130,1330,-69,-22,0,10,,
768,506,shot-on-goal,2,17:17,163,1363,83,14,8478856,23,wrist,
505,507,missed-shot,2,17:06,174,1374,85,3,8480459,23,backhand;wide-left,
766,506,shot-on-goal,2,17:04,176,1376,90,-16,8478856,23,backhand,
765,506,shot-on-goal,2,17:01,179,1379,29,-29,8474574,23,wrist,
767,503,hit,2,16:35,205,1405,-32,-41,8479425,23,,
756,503,hit,2,15:54,246,1446,83,-37,8480748,23,,
35,507,missed-shot,2,15:52,248,1448,77,13,8480748,23,wrist;wide-right,
746,507,missed-shot,2,15:43,257,1457,-53,12,8479026,10,wrist;wide-right,
732,506,shot-on-goal,2,14:59,301,1501,-49,4,8474157,10,wrist,
731,506,shot-on-goal,2,14:38,322,1522,-35,-7,8476931,10,wrist,
728,506,shot-on-goal,2,14:31,329,1529,-44,2,8475171,10,wrist,
742,503,hit,2,14:25,335,1535,80,-39,8478057,23,,
721,506,shot-on-goal,2,14:11,349,1549,-68,-37,8476853,10,wrist,
712,506,shot-on-goal,2,13:31,389,1589,-42,-31,8481582,10,slap,
723,503,hit,2,13:09,411,1611,-97,-20,8477939,10,,
707,507,missed-shot,2,13:05,415,1615,-29,4,8477939,10,wrist;above-crossbar,
62,502,faceoff,2,12:59,421,1621,69,22,0,23,,
167,502,faceoff,2,12:23,457,1657,-69,-22,0,10,,
699,507,missed-shot,2,12:14,466,1666,-34,-8,8475171,10,wrist;wide-right,
697,508,blocked-shot,2,12:06,474,1674,-69,1,8475171,10,teammate-blocked,
166,502,faceoff,2,12:02,478,1678,-69,22,0,10,,
693,508,blocked-shot,2,11:57,483,1683,-65,-29,8482720,10,blocked,
165,502,faceoff,2,11:41,499,1699,-69,-22,0,23,,
504,507,missed-shot,2,11:38,502,1702,-64,-2,8478483,10,deflected;high-and-wide-right,
695,504,giveaway,2,11:21,519,1719,-30,-39,8478483,10,,
692,503,hit,2,11:06,534,1734,-71,40,8478057,23,,
164,502,faceoff,2,11:00,540,1740,-69,-22,0,10,,
680,507,missed-shot,2,10:58,542,1742,-77,1,8478904,10,tip-in;wide-left,
686,503,hit,2,10:46,554,1754,5,-41,8478904,10,,
684,503,hit,2,10:42,558,1758,-95,-26,8474157,10,,
675,507,missed-shot,2,10:29,571,1771,-86,-15,8476853,10,wrist;wide-left,
674,507,missed-shot,2,10:27,573,1773,-70,11,8474157,10,tip-in;wide-right,
664,506,shot-on-goal,2,09:47,613,1813,-42,-39,8480995,10,wrist,
672,503,hit,2,09:40,620,1820,78,39,8480078,23,,
661,508,blocked-shot,2,09:34,626,1826,83,-3,8477369,23,blocked,
662,504,giveaway,2,08:53,667,1867,36,37,8475762,23,,
503,508,blocked-shot,2,08:20,700,1900,-61,-1,8479318,10,blocked,
649,506,shot-on-goal,2,08:14,706,1906,-63,12,8479318,10,wrist,
652,503,hit,2,07:56,724,1924,96,2,8480748,23,,
640,507,missed-shot,2,07:53,727,1927,53,28,8474574,23,wrist;hit-crossbar,
638,507,missed-shot,2,07:46,734,1934,76,26,8474574,23,wrist;hit-right-post,
637,506,shot-on-goal,2,07:10,770,1970,50,-19,8480748,23,wrist,
639,525,takeaway,2,07:04,776,1976,-35,39,8480012,23,,
636,508,blocked-shot,2,06:56,784,1984,-39,15,8475171,10,blocked,
163,502,faceoff,2,06:53,787,1987,-69,-22,0,10,,
631,506,shot-on-goal,2,06:51,789,1989,-45,-38,8474157,10,wrist,
634,503,hit,2,06:44,796,1996,97,24,8478057,23,,
162,502,faceoff,2,06:20,820,2020,-69,-22,0,23,,
627,504,giveaway,2,06:11,829,2029,-24,42,8477369,23,,
612,503,hit,2,03:58,962,2162,-33,-40,8477939,10,,
601,506,shot-on-goal,2,03:46,974,2174,45,41,8475762,23,wrist,
61,502,faceoff,2,03:44,976,2176,69,22,0,23,,
497,507,missed-shot,2,03:41,979,2179,48,18,8475762,23,slap;wide-right,
499,503,hit,2,03:19,1001,2201,-92,32,8482720,10,,
161,502,faceoff,2,03:17,1003,2203,-69,22,0,23,,
502,506,shot-on-goal,2,03:13,1007,2207,-33,6,8482720,10,backhand,
490,507,missed-shot,2,02:43,1037,2237,-36,-1,8480144,10,backhand;wide-left,
484,506,shot-on-goal,2,02:25,1055,2255,-37,-25,8476931,10,wrist,
473,508,blocked-shot,2,01:33,1107,2307,72,1,8478444,23,blocked,
485,503,hit,2,01:33,1107,2307,85,-20,8481122,10,,
160,502,faceoff,2,01:15,1125,2325,-69,-22,0,10,,
475,504,giveaway,2,01:02,1138,2338,97,10,8476853,10,,
159,502,faceoff,2,00:50,1150,2350,-69,-22,0,23,,
465,506,shot-on-goal,2,00:48,1152,2352,-65,-26,8478483,10,slap,
60,502,faceoff,2,00:36,1164,2364,69,22,0,10,,
459,506,shot-on-goal,2,00:34,1166,2366,47,26,8480748,23,wrist,
463,503,hit,2,00:11,1189,2389,-7,-39,8480748,23,,
59,502,faceoff,2,00:06,1194,2394,0,0,0,10,,
57,502,faceoff,2,00:00,1200,2400,0,0,0,23,,
1161,504,giveaway,3,19:56,4,2404,68,-41,8480748,23,,
1159,508,blocked-shot,3,19:56,4,2404,34,-33,8478483,10,blocked,
1151,507,missed-shot,3,19:04,56,2456,-87,6,8477969,23,wrist;hit-right-post,
511,507,missed-shot,3,18:59,61,2461,66,-8,8476927,23,wrist;wide-right,
1098,506,shot-on-goal,3,18:44,76,2476,77,9,8475166,10,wrist,
1096,508,blocked-shot,3,18:33,87,2487,85,-6,8475166,10,blocked,
1095,506,shot-on-goal,3,18:22,98,2498,57,-27,8479318,10,slap,
1158,504,giveaway,3,18:17,103,2503,93,-24,8475762,23,,
1156,525,takeaway,3,18:15,105,2505,66,-33,8474574,23,,
74,502,faceoff,3,18:03,117,2517,69,-22,0,10,,
1089,506,shot-on-goal,3,18:01,119,2519,76,-18,8479318,10,wrist,
1084,509,penalty,3,16:58,182,2582,62,-13,0,23,,
72,502,faceoff,3,16:58,182,2582,69,22,0,10,,
1080,508,blocked-shot,3,16:56,184,2584,69,-14,8476853,10,blocked,
1079,507,missed-shot,3,16:54,186,2586,81,4,8482720,10,tip-in;wide-right,
1075,508,blocked-shot,3,16:20,220,2620,61,-22,8479318,10,blocked,
179,502,faceoff,3,16:03,237,2637,-69,-22,0,23,,
510,507,missed-shot,3,16:01,239,2639,-87,-4,8480459,23,wrist;short,
509,506,shot-on-goal,3,16:00,240,2640,-87,-6,8480459,23,bat,
1074,525,takeaway,3,15:56,244,2644,-97,-22,8478856,23,,
71,502,faceoff,3,15:40,260,2660,20,-22,0,10,,
1055,507,missed-shot,3,14:38,322,2722,-65,-12,8478498,23,wrist;wide-right,
178,502,faceoff,3,13:58,362,2762,-69,22,0,23,,
508,507,missed-shot,3,13:52,368,2768,-82,7,8482055,23,backhand;wide-left,
1041,508,blocked-shot,3,13:50,370,2770,-79,-1,8476927,23,blocked,
1043,525,takeaway,3,13:17,403,2803,58,41,8474157,10,,
1046,503,hit,3,13:13,407,2807,98,-18,8477369,23,,
1025,506,shot-on-goal,3,12:54,426,2826,67,-30,8477939,10,wrist,
1038,503,hit,3,12:43,437,2837,-92,30,8476931,10,,
1018,507,missed-shot,3,12:27,453,2853,79,2,8482259,10,tip-in;wide-right,
1007,507,missed-shot,3,11:41,499,2899,-30,35,8474574,23,slap;wide-right,
556,508,blocked-shot,3,10:12,588,2988,-43,15,8481535,23,blocked,
177,502,faceoff,3,10:10,590,2990,-20,22,0,10,,
981,508,blocked-shot,3,09:39,621,3021,87,-11,8482259,10,blocked,
994,503,hit,3,09:22,638,3038,-8,-40,8482259,10,,
70,502,faceoff,3,09:12,648,3048,69,22,0,10,,
980,504,giveaway,3,09:00,660,3060,13,38,8474157,10,,
973,505,goal,3,08:56,664,3064,-66,-1,8478444,23,wrist,https://nhl.com/video/tor-van-boeser-scores-goal-against-joseph-woll-6368535757112
69,502,faceoff,3,08:56,664,3064,0,0,0,10,,
972,507,missed-shot,3,08:43,677,3077,-38,29,8479425,23,slap;wide-right,
971,507,missed-shot,3,08:32,688,3088,-88,4,8478057,23,deflected;wide-right,
968,506,shot-on-goal,3,08:12,708,3108,-94,8,8476931,10,wrist,
176,502,faceoff,3,08:08,712,3112,-69,-22,0,10,,
966,506,shot-on-goal,3,08:05,715,3115,-85,-6,8480078,23,poke,
962,509,penalty,3,07:43,737,3137,-90,-27,0,10,,
175,502,faceoff,3,07:43,737,3137,-69,-22,0,10,,
68,502,faceoff,3,07:21,759,3159,0,0,0,10,,
507,507,missed-shot,3,07:01,779,3179,-60,-2,8480078,23,wrist;short,
900,508,blocked-shot,3,06:59,781,3181,-60,17,8480078,23,blocked,
895,507,missed-shot,3,06:38,802,3202,-35,-34,8475762,23,slap;high-and-wide-right,
957,525,takeaway,3,06:19,821,3221,0,-11,8480748,23,,
887,506,shot-on-goal,3,06:08,832,3232,-1,12,8480012,23,wrist,
67,502,faceoff,3,05:47,853,3253,69,22,0,10,,
878,506,shot-on-goal,3,05:44,856,3256,69,18,8482259,10,snap,
965,503,hit,3,04:53,907,3307,-98,0,8476927,23,,
867,506,shot-on-goal,3,04:39,921,3321,-83,-13,8476927,23,wrist,
866,507,missed-shot,3,04:37,923,3323,-32,-15,8483678,23,wrist;hit-left-post,
173,502,faceoff,3,04:34,926,3326,-69,-22,0,23,,
862,507,missed-shot,3,04:33,927,3327,-34,-34,8483678,23,wrist;wide-right,
861,508,blocked-shot,3,04:28,932,3332,-60,26,8481535,23,blocked,
882,504,giveaway,3,04:20,940,3340,-18,-29,8477939,10,,
855,507,missed-shot,3,04:12,948,3348,-76,-19,8480078,23,wrist;wide-left,
48,506,shot-on-goal,3,03:42,978,3378,-83,1,8482055,23,tip-in,
865,504,giveaway,3,03:41,979,3379,-95,29,8475690,10,,
172,502,faceoff,3,03:24,996,3396,-20,22,0,23,,
842,508,blocked-shot,3,03:15,1005,3405,80,8,8475171,10,blocked,
840,508,blocked-shot,3,03:04,1016,3416,38,33,8475171,10,blocked,
848,504,giveaway,3,03:00,1020,3420,61,42,8480144,10,,
839,508,blocked-shot,3,02:56,1024,3424,47,27,8475171,10,blocked,
835,506,shot-on-goal,3,02:38,1042,3442,-73,-31,8478856,23,wrist,
871,503,hit,3,02:28,1052,3452,-48,-39,8480995,10,,
830,504,giveaway,3,01:54,1086,3486,80,-31,8480995,10,,
171,502,faceoff,3,01:19,1121,3521,-69,-22,0,10,,
818,506,shot-on-goal,3,01:18,1122,3522,-61,1,8480078,23,wrist,
823,525,takeaway,3,01:16,1124,3524,-99,-6,8482055,23,,
849,503,hit,3,01:14,1126,3526,-98,2,8478444,23,,
841,503,hit,3,01:00,1140,3540,-89,33,8478444,23,,
820,504,giveaway,3,00:50,1150,3550,5,40,8477969,23,,
809,508,blocked-shot,3,00:27,1173,3573,66,18,8476931,10,blocked,
807,506,shot-on-goal,3,00:17,1183,3583,-68,-21,8475690,10,wrist,
66,502,faceoff,3,00:08,1192,3592,69,-22,0,23,,
804,506,shot-on-goal,3,00:06,1194,3594,59,-38,8478483,10,wrist,
64,502,faceoff,3,00:00,1200,3600,0,0,0,23,,
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
    //return xyz.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    let vectors = [];
    for(let i = 0; i < xyz.length; i++) {
        vectors.push(new THREE.Vector3(xyz[i][0], xyz[i][1], xyz[i][2]));
    }
    return vectors;
}

const DEFAULT_SIZE = 3;
const DEFAULT_HEIGHT = 1;
const DEFAULT_ALPHA = 0.1;

const sizes = {
    505: 8,
    506: 6,
    507: 4.5,
}

const heights = {
    505: 30,
    506: 15,
    507: 7.5,
}

const alphas = {
    505: 1.0,
    506: 0.8,
    507: 0.6,
}

// hash table for team id: hex colors
const colors = {
    10: 0x082057,
    //23: 0x0a1b2b
    //23: 0xf5e4d4,
    23: 0xff1111,
}

function renderPoint(d) {
    const c = d[1];

    // if code in table then take the value else default
    const size = sizes.hasOwnProperty(c) ? sizes[c] : DEFAULT_SIZE;
    const height = heights.hasOwnProperty(c) ? heights[c] : DEFAULT_HEIGHT;
    const alpha = alphas.hasOwnProperty(c) ? alphas[c] : DEFAULT_ALPHA;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', 
        new THREE.Float32BufferAttribute([
            d[7],   // x
            d[8],   // y
            height  // z
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
    let data = parseCSV();
    renderEvents(data);
    //console.log(data);
    //let terrain = renderTerrain(points);
    renderRink();
}

// position ranges from -100 to 100 meters on the x-axis and -42.5 to 42.5 meters on the y-axis 
function renderRink() {
    // NHL rink dimensions
    const geometry = new THREE.PlaneGeometry(200, 85); 
    
    // ice ice material with realistic properties
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xf2f8fc,         // slight blue-white tint
        metalness: 0.2,          // low metalness for more icy look
        roughness: 0.1,          // smooth surface, ice
        transmission: 0.7,
        thickness: 0.7,          // material thickness for transmission
        clearcoat: 1.0,          // add clearcoat for extra shine
        clearcoatRoughness: 0.1, // smooth clearcoat
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide
    });

    const rink = new THREE.Mesh(geometry, material);
    rink.position.set(0, 0, 0);
    
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
    
    scene.add(rink);
    
    // subtle fog for depth
    //scene.fog = new THREE.Fog(0x878787, 100, 700);
    
    return rink;
}

// render visual helpers
function renderTools() {
    const size = 1000;
    const divisions = 10;
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
camera.position.set(0, -50, 100);
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

