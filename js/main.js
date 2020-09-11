`use strict`;
/**
 * Dancing☆Onigiri (CW Edition) 
 * ChartReverser
 *
 * Source by tickle
 * Created : 2020/09/09
 * Revised : 
 *
 * https://github.com/cwtickle/danoniplus-reverser
 */
const g_version = `Ver 0.1.0`;

let g_rootObj = {};
let g_paramObj = {};
const g_keyObj = {

    // キー別ヘッダー
    // - 譜面データ中に出てくる矢印(ノーツ)の種類と順番(ステップゾーン表示順)を管理する。
    // - ここで出てくる順番は、この後のstepRtn, keyCtrlとも対応している。 
    chara5_0: [`left`, `down`, `up`, `right`, `space`],
    chara7_0: [`left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara7i_0: [`left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara9_0: [`left`, `down`, `up`, `right`, `space`, `sleft`, `sdown`, `sup`, `sright`],
    chara11_0: [`left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`,
        `sleft`, `sdown`, `sup`, `sright`],

    chara11i_0: [`left`, `down`, `gor`, `up`, `right`, `space`,
        `sleft`, `sdown`, `siyo`, `sup`, `sright`],
    chara12_0: [`oni`, `left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`,
        `sleft`, `sdown`, `sup`, `sright`],
    chara13_0: [`left`, `down`, `up`, `right`, `space`, `sleft`, `sdown`, `sup`, `sright`,
        `tleft`, `tdown`, `tup`, `tright`],
    chara14_0: [`sleftdia`, `sleft`, `sdown`, `sup`, `sright`, `srightdia`,
        `oni`, `left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara14i_0: [`gor`, `space`, `iyo`, `left`, `down`, `up`, `right`,
        `sleft`, `sleftdia`, `sdown`, `sspace`, `sup`, `srightdia`, `sright`],
    chara15_0: [`left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`,
        `sleft`, `sdown`, `sup`, `sright`, `tleft`, `tdown`, `tup`, `tright`],
    chara16i_0: [`gor`, `space`, `iyo`, `left`, `down`, `up`, `right`,
        `sleft`, `sdown`, `sup`, `sright`, `aspace`, `aleft`, `adown`, `aup`, `aright`],
    chara17_0: [`aleft`, `bleft`, `adown`, `bdown`, `aup`, `bup`, `aright`, `bright`, `space`,
        `cleft`, `dleft`, `cdown`, `ddown`, `cup`, `dup`, `cright`, `dright`],
};

/**
 * 拍子別の小節数 (4拍子のみ例外的に2を指定)
 */
const g_measure = {
    2: 16,
    3: 15,
    5: 15,
    7: 14,
};

/**
 * BPMからIntervalへ変換
 */
const bpmToInterval = () => {
    const bpms = document.getElementById(`bpm`).value;
    if (bpms === ``) return;

    let intervals = [];
    bpms.split(`,`).forEach(bpm => {
        intervals.push(Math.round(1800 / bpm * 10000) / 10000);
    });
    document.getElementById(`interval`).value = intervals.join(`,`);
    return intervals.join(`,`);
}

/**
 * 先頭文字を大文字化
 * @param {string} _str 
 */
const toCapitalize = (_str) => {
    if (!_str || typeof _str !== `string`) return _str;
    return `${_str.charAt(0).toUpperCase()}${_str.slice(1)}`;
}

/**
 * 単発矢印の名前からフリーズアローの名前へ変換
 * @param {array} _array 
 */
const createFrzHeader = (_array) => {

    let frzNames = [];
    _array.forEach(name => {

        let frzName = name.replace(`leftdia`, `frzLdia`)
            .replace(`rightdia`, `frzRdia`)
            .replace(`left`, `frzLeft`)
            .replace(`down`, `frzDown`)
            .replace(`up`, `frzUp`)
            .replace(`right`, `frzRight`)
            .replace(`space`, `frzSpace`)
            .replace(`iyo`, `frzIyo`)
            .replace(`gor`, `frzGor`)
            .replace(`oni`, `foni`);

        if (frzName.indexOf(`frz`) === -1 && frzName.indexOf(`foni`) === -1) {
            if ((frzName.startsWith(`s`)) || frzName.startsWith(`t`) ||
                (frzName.startsWith(`a`) && !frzName.startsWith(`arrow`))) {
                frzName = frzName.replace(frzName.slice(1), `frz${toCapitalize(frzName.slice(1))}`);
            } else {
                frzName = frzName.replace(frzName, `frz${toCapitalize(frzName)}`);
            }
        }
        frzNames.push(frzName);
    });

    return frzNames;
}

/**
 * 入力データを区切り文字を元に分解して、オブジェクト化
 * @param {string} _dos 
 */
const rawDosToObject = (_dos) => {

    const obj = {};
    const paramsTmp = document.getElementById(`separator`).value === `amp` ? _dos.split(`&`).join(`|`) : _dos;
    const params = paramsTmp.split(`|`);
    for (let j = 0; j < params.length; j++) {
        const pos = params[j].indexOf(`=`);
        if (pos > 0) {
            const pKey = params[j].substring(0, pos);
            const pValue = params[j].substring(pos + 1);

            if (pKey !== undefined) {
                obj[pKey] = pValue;
            }
        }
    }
    return obj;
}

/**
 * 最小値を取得
 * @param {number} a 
 * @param {number} b 
 */
const getMin = (a, b) => Math.min(a, b);

/**
 * 最大値を取得
 * @param {number} a 
 * @param {number} b 
 */
const getMax = (a, b) => Math.max(a, b);

/**
 * 奇数・偶数番号の配列を取得
 * @param {array} _array 
 * @param {number} _oddEvenFlg (1: odd, 2: even)
 */
const getOddEvenArray = (_array, _oddEvenFlg) => _array.filter((value, i) => i % 2 === _oddEvenFlg - 1);

/**
 * 譜面データを数字毎に分解して、名称別のオブジェクトへ格納
 * @param {array} _names 
 * @param {string} _scoreNo 
 * @param {number} _keyNum 
 */
const createBaseData = (_names, _scoreNo, _keyNum) => {

    let baseData = {};
    _names.forEach(name => {
        if (g_rootObj[`${name}${_scoreNo}_data`] !== undefined && g_rootObj[`${name}${_scoreNo}_data`] !== ``) {
            baseData[name] = g_rootObj[`${name}${_scoreNo}_data`].split(`,`).map(data => parseFloat(data)).sort((a, b) => a - b);
        }
    });

    // 速度変化情報を付加
    const speedList = [`speed${_scoreNo}_data`, `speed${_scoreNo}_change`, `boost${_scoreNo}_data`];
    const speedCategory = [`speed`, `speed`, `boost`];
    speedList.forEach((data, i) => {
        if (g_rootObj[data] !== undefined && g_rootObj[data] !== ``) {
            const tmpSpeeds = g_rootObj[data].split(`,`);
            baseData[`${speedCategory[i]}Frame`] = getOddEvenArray(tmpSpeeds, 1).map(data => parseFloat(data));
            baseData[`${speedCategory[i]}Dat`] = getOddEvenArray(tmpSpeeds, 2).map(data => parseFloat(data));
        }
    });

    return baseData;
}

/**
 * ファーストナンバーの自動取得
 * @param {array} _names 
 * @param {object} _baseData 
 */
const getFirstNum = (_names, _baseData) => {

    let minData = [];
    const keyNames = _names.concat([`speedFrame`, `boostFrame`]);
    keyNames.forEach(name => {
        if (_baseData[name] !== undefined) {
            minData.push(_baseData[name].reduce(getMin));
        }
    });
    return minData.reduce(getMin);
}

/**
 * ラストナンバーの自動取得
 * @param {array} _names 
 * @param {object} _baseData 
 */
const getLastNum = (_names, _baseData) => {

    let maxData = [];
    const keyNames = _names.concat([`speedFrame`, `boostFrame`]);
    keyNames.forEach(name => {
        if (_baseData[name] !== undefined) {
            maxData.push(_baseData[name].reduce(getMax));
        }
    });
    return maxData.reduce(getMax);
}

/**
 * 各種パラメーターの設定
 * @param {array} _names 
 * @param {object} _baseData 
 * @param {string} _intervals 
 */
const setParameters = (_names, _baseData) => {

    // ファーストナンバーの取得
    const firstNums = document.getElementById(`firstNum`).value;
    if (g_rootObj.first_num !== undefined) {
        g_paramObj.firstNums = g_rootObj.first_num.split(`,`).map(data => parseFloat(data));
    } else if (firstNums !== ``) {
        g_paramObj.firstNums = firstNums.split(`,`);
    } else {
        g_paramObj.firstNums = [getFirstNum(_names, _baseData)];
    }
    document.getElementById(`firstNum`).value = g_paramObj.firstNums.join(`,`);

    // Intervalの取得
    const intervals = document.getElementById(`interval`).value;
    if (g_rootObj.haba_num !== undefined) {
        g_paramObj.intervals = g_rootObj.haba_num.split(`,`).map(data => parseFloat(data));
    } else if (intervals !== ``) {
        g_paramObj.intervals = intervals.split(`,`);
    } else {
        const tmpIntervals = bpmToInterval();
        g_paramObj.intervals = (tmpIntervals !== undefined ? tmpIntervals.split(`,`) : [10]);
    }
    document.getElementById(`interval`).value = g_paramObj.intervals.join(`,`);

    // BPMの取得
    g_paramObj.bpms = g_paramObj.intervals.map(interval => Math.round((1800 / interval * 10000) / 10000));
    document.getElementById(`bpm`).value = g_paramObj.bpms.join(`,`);

    // テンポ変化位置の取得
    const tempos = document.getElementById(`tempo`).value;
    if (g_rootObj.haba_page_num !== undefined) {
        g_paramObj.tempos = g_rootObj.haba_page_num.split(`,`).map(data => parseFloat(data));
    } else {
        g_paramObj.tempos = (tempos !== `` ? tempos.split(`,`) : [0]);
    }
    document.getElementById(`tempo`).value = g_paramObj.tempos.join(`,`);

    // 拍子データの取得
    const rhythm = parseFloat(document.getElementById(`rhythm`).value);
    if (g_rootObj.beat_num !== undefined) {
        g_paramObj.rhythm = parseFloat(g_rootObj.beat_num === `4` ? `2` : g_rootObj.beat_num);
    } else {
        g_paramObj.rhythm = rhythm;
    }
    document.getElementById(`rhythm`).value = g_paramObj.rhythm;

    console.log(g_paramObj);
}

/**
 * エディター上の位置を計算
 * @param {array} _names 
 * @param {object} _baseData 
 */
const calcPoint = (_names, _baseData) => {

    let maxPage = 200;
    let currentPos = {};
    let saveBaseData = {};
    const keyNames = _names.concat([`speedFrame`, `boostFrame`]);
    keyNames.forEach(name => {

        if (_baseData[name] === undefined) {
            return;
        }
        currentPos[name] = 0;
        saveBaseData[name] = [];

        for (let j = 0; j < g_paramObj.firstNums.length; j++) {
            const nextFirst = (j === g_paramObj.firstNums.length - 1 ? Infinity : g_paramObj.firstNums[j + 1]);
            const currentFirst = g_paramObj.firstNums[j];
            const currentInterval = (g_paramObj.intervals[j] !== undefined ? g_paramObj.intervals[j] : 10);
            const currentTempo = (g_paramObj.tempos[j] !== undefined ? g_paramObj.tempos[j] : maxPage);
            g_paramObj.intervals[j] = currentInterval;
            g_paramObj.tempos[j] = currentTempo;

            for (let k = currentPos[name]; k < _baseData[name].length; k++) {
                const num = _baseData[name][k];
                if (nextFirst - num > 0) {
                    saveBaseData[name].push(Math.round((num - currentFirst) / (currentInterval / 2))
                        + currentTempo * g_measure[g_paramObj.rhythm] * 4);
                    currentPos[name]++;
                } else {
                    const currentMaxPage = Math.ceil(saveBaseData[name][saveBaseData[name].length - 1]) / (g_measure[g_paramObj.rhythm] * 4);
                    if (currentMaxPage > maxPage) {
                        maxPage = currentMaxPage;
                    }
                    break;
                }
            }

            const currentMaxPage = Math.ceil(saveBaseData[name][saveBaseData[name].length - 1]) / (g_measure[g_paramObj.rhythm] * 4);
            if (currentMaxPage > maxPage) {
                maxPage = currentMaxPage;
            }
        }
    });
    g_paramObj.maxPage = maxPage;

    console.log(saveBaseData);
    return saveBaseData;

}

/**
 * FUJIさんエディター Ver2版出力
 * @param {string} _keys 
 * @param {array} _names 
 * @param {object} _saveData 
 * @param {object} _baseData 
 * @param {string} _scoreNo 
 * @param {array} _lastNums 
 * @param {number} _maxBar 
 */
const printFuji2 = (_keys, _names, _saveData, _baseData, _scoreNo, _lastNums, _maxBar) => {
    let saveData = `${_keys}key2.00\r\n${_scoreNo}\r\n\r\n0/${Math.round(g_paramObj.firstNums[0] * 10)},`;

    for (let j = 1; j < g_paramObj.firstNums.length; j++) {
        saveData += `${g_paramObj.tempos[j] * 4}/`
        if (g_paramObj.firstNums[j] !== g_paramObj.firstNums[j - 1] + _lastNums[j - 1]) {
            let tmpLastNum = Math.round(g_paramObj.firstNums[j - 1] * 10) + Math.round(_lastNums[j - 1] * 10);
            saveData += `${tmpLastNum}/`;
        }
        saveData += `${Math.round(g_paramObj.firstNums[j] * 10)},`;
    }
    const lastn = g_paramObj.firstNums.length - 1;
    let tmpLastNum = Math.round(g_paramObj.firstNums[lastn] * 10) + Math.round(_lastNums[lastn] * 10);
    saveData += `${_maxBar}/${tmpLastNum},\r\n`;

    saveData += `\r\n;===以下譜面\r\n`;

    let editorData = [];
    _names.forEach((name, i) => {

        if (_saveData[name] === undefined) {
            return;
        }
        if (i < _names.length / 2) {
            // 小節部:00～15, 矢印部:0～6, 調整部:1桁
            // 譜面(矢印出力)
            _saveData[name].forEach(koma => {
                if (editorData[koma] === undefined) {
                    editorData[koma] = [];
                }
                editorData[koma].push(`${(koma % 16).toString(16)}${i.toString(36)}0`);
            });
        } else {
            // フリーズ開始：小節部:00～15, 矢印部:0～6, 調整部:1桁(開始Def:5)
            // 譜面(フリーズアロー出力)
            const frzStarts = getOddEvenArray(_saveData[name], 1);
            const frzEnds = getOddEvenArray(_saveData[name], 2);
            frzStarts.forEach((koma, i) => {
                if (editorData[koma] === undefined) {
                    editorData[koma] = [];
                }
                editorData[koma].push(`${(koma % 16).toString(16)}${i.toString(36)}0+${String(frzEnds[i] - koma).padStart(3, '0')}`);
            })
        }
    });

    console.log(editorData);

};

/**
 * セーブデータの出力処理
 */
const printSaveData = {

    tickle: (_keys, _names, _saveData, _baseData, _scoreNo) => {
        let saveData = `${_keys}/`;
        _names.forEach(name => {
            if (_saveData[name] !== undefined) {
                saveData += `${_saveData[name].join(',')}`;
            }
            saveData += `&`;
        });

        [`speed`, `boost`].forEach(name => {
            if (_saveData[`${name}Frame`] !== undefined) {
                let speedPrintArray = [];
                for (let k = 0; k < _saveData[`${name}Frame`].length; k++) {
                    speedPrintArray.push(`${_saveData[`${name}Frame`][k]}=${_baseData[`${name}Dat`][k]}`);
                }
                saveData += `${speedPrintArray.join(',')}`;
            }
            saveData += `&`;
        });

        saveData += `&`;
        saveData += `${g_paramObj.firstNums.join(',')}&`;
        saveData += `${g_paramObj.intervals.join(',')}&`;
        saveData += `${g_paramObj.tempos.join(',')}&`;
        saveData += `${_scoreNo}&`;
        saveData += `${g_paramObj.maxPage < 100 ? 100 : g_paramObj.maxPage}&`;
        saveData += `${g_measure[g_paramObj.rhythm]}&${g_paramObj.rhythm}&`;
        saveData += `${g_rootObj.label_num !== undefined ? g_rootObj.label_num : '0'}&`;

        return saveData;
    },

    doyle: (_keys, _names, _saveData, _baseData, _scoreNo) => {
        let saveData = `Dancing Onigiri Save Data`;
        saveData += `&musicTitle=&artist=&artistUrl=&difName=Normal&speedlock=1&index=${_scoreNo}&keys=${_keys}`;

        _names.forEach((name, i) => {

            if (i < _names.length / 2) {
                saveData += `&arrow_data(${i})=${_saveData[name] !== undefined ? _saveData[name].join(',') : ''}`;
            } else {
                saveData += `&frzarrow_data(${i - _names.length / 2})=${_saveData[name] !== undefined ? _saveData[name].join(',') : ''}`;
            }
        });

        [`speed`, `boost`].forEach(name => {
            if (_saveData[`${name}Frame`] !== undefined) {
                let speedPrintArray = [];
                for (let k = 0; k < _saveData[`${name}Frame`].length; k++) {
                    speedPrintArray.push(`${_saveData[`${name}Frame`][k]},${_baseData[`${name}Dat`][k]}`);
                }
                saveData += `${speedPrintArray.join(',')}`;
            }
            saveData += `&`;
        });

        saveData += `&first_data=${g_paramObj.firstNums.join(',')}&interval_data=${g_paramObj.intervals.join(',')}`;
        saveData += `&rhythmchange_data=&version=2.38&dosPath=&tuning=name`;

        return saveData;
    },

    fuji: (_keys, _names, _saveData, _baseData, _scoreNo) => {
        const lastNum = getLastNum(_names, _baseData);
        let maxBar = Math.ceil((lastNum + 1) / g_measure[g_paramObj.rhythm]);
        if (maxBar < 120) {
            maxBar = 120;
        }

        let lastNums = [];
        g_paramObj.firstNums.forEach((firstNum, i) => {
            const tempoBar = g_paramObj.tempos[i] * 4;
            if (tempoBar > maxBar || i === g_paramObj.firstNums.length - 1) {
                lastNums[i] = g_paramObj.intervals[i]
                    * (maxBar - tempoBar) * g_measure[g_paramObj.rhythm] / 2;
            } else {
                lastNums[i] = g_paramObj.intervals[i]
                    * (g_paramObj.tempos[i + 1] - g_paramObj.tempos[i]) * g_measure[g_paramObj.rhythm] * 2;
            }
        });

        let saveData = ``;
        if ([`5`, `7`, `7i`, `9`, `11`].includes(_keys)) {
            saveData = printFuji2(_keys, _names, _saveData, _baseData, _scoreNo, lastNums, maxBar);
        } else {

        }
    },
};

/**
 * セーブデータ生成処理（メイン）
 * @param {string} _str 
 */
const makeSaveData = (_str) => {

    // キー数及び譜面データ名の取得
    const keyLabel = document.getElementById(`keys`).value;
    const arrowNames = g_keyObj[`chara${keyLabel}_0`].concat();
    const frzNames = createFrzHeader(arrowNames);

    const keyNum = arrowNames.length;
    const keyNames = arrowNames.concat(frzNames);

    const tmpScoreNo = document.getElementById(`scoreNo`).value;
    const scoreNo = tmpScoreNo === `1` ? `` : tmpScoreNo;

    // 入力データを分解してオブジェクト化
    g_rootObj = rawDosToObject(_str);
    const baseData = createBaseData(keyNames, scoreNo, keyNum);

    console.log(baseData);

    // パラメーターの設定
    setParameters(keyNames, baseData);

    // エディター上の位置を計算
    const saveBaseData = calcPoint(keyNames, baseData);

    const editorPtn = document.getElementById(`editor`).value;
    return printSaveData[editorPtn](keyLabel, keyNames, saveBaseData, baseData, scoreNo);

}
