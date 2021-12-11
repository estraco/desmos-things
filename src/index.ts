import axios from 'axios';
import fs from 'fs';
import funcs from './funcs';
import imageUtils from 'png-to-rgba'
import randomstring from 'randomstring';
import sharp from 'sharp';

(async (size: number) => {
    const params = new URLSearchParams()

    params.append('thumb_data', funcs.toDataURL(fs.readFileSync('./image.png')))
    const data = funcs.getData(process.argv[2] || randomstring.generate({
        length: 10,
        charset: 'alphabetic'
    }).toLowerCase(), funcs.graphToDesmos(funcs.compressGraph(imageUtils.PNGToRGBAArray(await sharp(fs.readFileSync('./image.png'))
        .resize({
            width: size,
            height: size,
            fit: 'contain',
            position: 'left bottom',
            background: {
                r: 255,
                g: 255,
                b: 255,
                alpha: 0.0
            }
        })
        .toBuffer()).rgba)))

    for (const key in data) {
        params.append(key, data[key])
    }

    console.log(`Sending #bytes ${params.toString().length}`)

    axios({
        url: "https://www.desmos.com/api/v1/calculator/save",
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Opera GX\";v=\"81\", \" Not;A Brand\";v=\"99\", \"Chromium\";v=\"95\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            "Referer": "https://www.desmos.com/calculator",
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "data": params.toString(),
        "method": "POST"
    }).then(res => {
        res.data.url = `https://desmos.com/calculator/${res.data.hash}`
        res.data.length = params.toString().length
        console.log(res.data)
    })
})(125)