import {MRFField} from "./MRF";
import {useRef} from "react";
import * as _ from 'lodash'
import moment from "moment";

export let bindWithSave = (field: MRFField, save: (field: MRFField, e: any) => any) => {
    let bind = field.bind();
    return {
        ...bind, onChange: (e) => {
            // console.log(`onChange e`, e);
            bind.onChange(e);
            save(field, e)
        }
    }
}

export let useAS = (save: (field: MRFField, e: any) => any, interval = 100) => useRef(_.debounce(save, interval, {trailing: true}))
export let bindWithAS = (field: MRFField, as) => {
    return bindWithSave(field, (field, e) => as.current(field, e))
}

export let bindWithAntdDateSave = (field: MRFField, save: (field: MRFField, e: any) => any) => {
    let bind = field.bind();
    return {
        ...bind, onChange: (e, s) => {
            // console.log(`onChange e`, e);
            let value = s && moment(s, dateFormat).toDate();
            bind.onChange(value);
            save(field, value)
        },
        value: bind.value && moment(bind.value),
        format: dateFormat
    }
}
export let bindWithAntdDateAS = (field: MRFField, as) => {
    return bindWithAntdDateSave(field, (field, e) => as.current(field, e))
}

export let dateFormat = 'DD/MM/YYYY HH:mm'


export let parseDuration = (str, sec = false) => {
    const x = sec ? 1 : 1000;
    if (typeof str !== 'string') return 0;
    const fixed = str.replace(/\s/g, '');
    const tail = +fixed.match(/-?\d+$/g) || 0;
    const parts = (fixed.match(/-?\d+[^-0-9]+/g) || [])
        .map(v => +v.replace(/[^-0-9]+/g, '') * ({
            s: x,
            m: 60 * x,
            h: 3600 * x,
            d: 86400 * x
        }[v.replace(/[-0-9]+/g, '')] || 0));
    return [tail, ...parts].reduce((a, b) => a + b, 0);
};

// export let formatDuration = (duration) => {
//     let ms = duration
//     let msToH = 3600 * 1000;
//     let h = ms / msToH
//     let intH = Math.trunc(h);
//     let remainderH = h - intH;
//     let m = remainderH * 60
//     let intM = Math.trunc(m);
//     let remainderM = m - intM;
//     let s = Math.round(remainderM * 60)
//     let str = [{l: 'h', v: intH}, {l: 'm', v: m}, {l: 's', v: s}].filter(u => u.v > 0).map(u => `${Math.floor(u.v)}${u.l}`).join(' ')
//     return str
// }
export function formatDuration(duration, clock: boolean = false) {
    var seconds = Math.abs(Math.ceil(duration / 1000)),
        h = (seconds - seconds % 3600) / 3600,
        m = (seconds - seconds % 60) / 60 % 60,
        s = seconds % 60;
    let seps = clock ? [':', ':', ''] : ['h ', 'm ', 's']

    return (duration < 0 ? '-' : '') + ((h > 0 || clock) ? h + seps[0] : '')
        + (m > 0 || clock ? _.padStart(m.toString(), clock ? 2 : 0, '0') + seps[1] : '')
         + (s > 0 || clock ? _.padStart(s.toString(), clock ? 2 : 0, '0') + seps[2] : '') ;
}

export const nest = (items, id = null, link = 'parentId') => {
    // console.log(`items`, items);
    return items
        .filter(item => item[link] === id)
        .map(item => ({...item, children: nest(items, item.id)}));
};

export let nextAnimationFrame = async () => new Promise((resolve, reject) => requestAnimationFrame(resolve))
export let nextTimeout = async (ms?) => new Promise((resolve, reject) => setTimeout(resolve, ms))

export let arrToObj = (arr: any[], key = 'id') => {
    return Object.fromEntries(arr.map(e => ([e.id, e])))
}

export let objToArr = (obj: any): any[] => {
    return Object.values(obj || {})
}

export let unnestIds = (obj: any): any => {
    let newObj = {}
    Object.keys(obj).forEach(k => {
        let v = obj[k];
        if (v?.id) newObj[`${k}Id`] = v.id
        else newObj[k] = v
    })
    return newObj
}

export let nestIds = (obj: any) => {
    let newObj = {}
    Object.keys(obj).forEach(k => {
        let v = obj[k];
        if (k.endsWith('Id') && k !== 'id') {
            let s = k.substring(0, k.length - 2)
            newObj[s] = v
        } else newObj[k] = v
    })
    return newObj
}



/**
 * @property {number} EPSILON
 */
export const EPSILON = 0.000001;

/**
 * @method random
 */
export const random = Math.random;
