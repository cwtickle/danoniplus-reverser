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
const g_keyObj = {

    // キー別ヘッダー
    // - 譜面データ中に出てくる矢印(ノーツ)の種類と順番(ステップゾーン表示順)を管理する。
    // - ここで出てくる順番は、この後のstepRtn, keyCtrlとも対応している。 
    chara5_0: [`left`, `down`, `up`, `right`, `space`],
    chara7_0: [`left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara7i_0: [`left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara8_0: [`left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`, `sleft`],
    chara9A_0: [`left`, `down`, `up`, `right`, `space`, `sleft`, `sdown`, `sup`, `sright`],
    chara9B_0: [`left`, `down`, `up`, `right`, `space`, `sleft`, `sdown`, `sup`, `sright`],
    chara9i_0: [`sleft`, `sdown`, `sup`, `sright`, `left`, `down`, `up`, `right`, `space`],
    chara11_0: [`sleft`, `sdown`, `sup`, `sright`,
        `left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara11L_0: [`sleft`, `sdown`, `sup`, `sright`,
        `left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara11i_0: [`left`, `down`, `gor`, `up`, `right`, `space`,
        `sleft`, `sdown`, `siyo`, `sup`, `sright`],
    chara11W_0: [`sleft`, `sdown`, `sup`, `sright`,
        `left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara12_0: [`sleft`, `sdown`, `sup`, `sright`,
        `oni`, `left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara13_0: [`tleft`, `tdown`, `tup`, `tright`,
        `left`, `down`, `up`, `right`, `space`, `sleft`, `sdown`, `sup`, `sright`],
    chara14_0: [`sleftdia`, `sleft`, `sdown`, `sup`, `sright`, `srightdia`,
        `oni`, `left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara14i_0: [`gor`, `space`, `iyo`, `left`, `down`, `up`, `right`,
        `sleft`, `sleftdia`, `sdown`, `sspace`, `sup`, `srightdia`, `sright`],
    chara15A_0: [`sleft`, `sdown`, `sup`, `sright`, `tleft`, `tdown`, `tup`, `tright`,
        `left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara15B_0: [`sleft`, `sdown`, `sup`, `sright`, `tleft`, `tdown`, `tup`, `tright`,
        `left`, `leftdia`, `down`, `space`, `up`, `rightdia`, `right`],
    chara16i_0: [`gor`, `space`, `iyo`, `left`, `down`, `up`, `right`,
        `sleft`, `sdown`, `sup`, `sright`, `aspace`, `aleft`, `adown`, `aup`, `aright`],
    chara17_0: [`aleft`, `bleft`, `adown`, `bdown`, `aup`, `bup`, `aright`, `bright`, `space`,
        `cleft`, `dleft`, `cdown`, `ddown`, `cup`, `dup`, `cright`, `dright`],
};

/**
 * BPMからIntervalへ変換
 */
const bpmToInterval = () => {
    const bpms = document.getElementById(`bpm`).value;
    if (bpms === ``) return;

    let intervals = [];
    bpms.split(`,`).forEach(bpm => {
        intervals.push(1800 / bpm);
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
    const paramsTmp = document.getElementById(`separator`) === `amp` ? _dos.split(`&`).join(`|`) : _dos;
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
 * 譜面データを数字毎に分解して、名称別のオブジェクトへ格納
 * @param {array} _names 
 * @param {string} _scoreNo 
 * @param {number} _keyNum 
 */
const createBaseData = (_names, _scoreNo, _keyNum) => {

    let baseData = {};
    _names.forEach(name => {
        if (g_rootObj[`${name}${_scoreNo}_data`] !== undefined) {
            baseData[name] = (g_rootObj[`${name}${_scoreNo}_data`].split(`,`));
        }
    });

    // speedX_change があれば、speedX_data と置き換える（例外処理）
    if (g_rootObj[`speed${_scoreNo}_change`] !== undefined) {
        baseData.speed = g_rootObj[`speed${_scoreNo}_change`].split(`,`);
    }
    return baseData;
}

/**
 * セーブデータ生成処理（メイン）
 * @param {string} _str 
 */
const makeSaveData = (_str) => {

    // Interval未指定の場合はBPM値から取得
    let intervals = document.getElementById(`interval`).value;
    if (intervals === ``) {
        intervals = bpmToInterval();
    }

    // キー数及び譜面データ名の取得
    const keyLabel = document.getElementById(`keys`).value;
    const arrowNames = g_keyObj[`chara${keyLabel}_0`].concat();
    const frzNames = createFrzHeader(arrowNames);

    const keyNum = arrowNames.length;
    const keyNames = arrowNames.concat(frzNames, [`speed`, `boost`]);

    const tmpScoreNo = document.getElementById(`scoreNo`).value;
    const scoreNo = tmpScoreNo === `1` ? `` : tmpScoreNo;

    // 入力データを分解してオブジェクト化
    g_rootObj = rawDosToObject(_str);

    const baseData = createBaseData(keyNames, scoreNo, keyNum);

    console.log(baseData);

}
