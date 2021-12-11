import crypto from 'crypto';
import { RGBAarrType } from '../../image-utils/build/index'
import _ from 'lodash'

type CompressedGraph = {
    position: { x: number, y: number };
    dimensions: { width: number, height: number };
    color: [number, number, number, number] | number[];
}[]

type ExpressionFormat = {
    type: string;
    id: number;
    color: string;
    latex: string;
    fillOpacity: string;
    lineOpacity: string;
    lineWidth: string;
}

/*
  desmos expression format: {
                type: 'expression',
                id: incrementing number,
                color: hex color,
                latex: `{START_X}\\le x\\le{END_X}\\left\\{{START_Y}\\le y\\le{END_Y}\\right\\}`
            }

            x is left to right
            y is bottom to top
*/

function imageToGraph(img: RGBAarrType) {
    let res = []
    const image = img.reverse()
    for (let i = 0; i < image.length; i++) {
        for (let j = 0; j < image[i].length; j++) {
            if (image[i][j].reduce((a, c) => a + c, 0) === 0) continue;
            res.push({
                type: 'expression',
                id: i + j,
                color: `#${image[i][j].splice(0, 3).map(a => a.toString(16).padStart(2, '0')).join('')}`,
                latex: `${round(j * .1)}\\le x\\le${round((j + 1) * .1)}\\left\\{${round(i * .1)}\\le y\\le${round((i + 1) * .1)}\\right\\}`,
                fillOpacity: "1",
                lineOpacity: "1",
                lineWidth: "2"
            })
        }
    }
    return res
}

function compressColors(color: RGBAarrType, precision: number = 4): RGBAarrType {
    let res: RGBAarrType = []
    for (let i = 0; i < color.length; i++) {
        res.push([])
        for (let j = 0; j < color[i].length; j++) {
            let r = color[i][j][0]
            let g = color[i][j][1]
            let b = color[i][j][2]
            let a = color[i][j][3]
            res[i].push([
                Math.round(r / precision) * precision,
                Math.round(g / precision) * precision,
                Math.round(b / precision) * precision,
                a
            ])
        }
    }
    return res
}

function compressGraph(img: RGBAarrType): CompressedGraph {
    let res: CompressedGraph = []
    let image = img.reverse()
    for (let i = 0; i < image.length; i++) {
        for (let j = 0; j < image[i].length; j++) {
            if (image[i][j].reduce((a, c) => a + c, 0) === 0) continue;
            let color = image[i][j]
            let width = 1
            let height = 1
            let x = j
            let y = i
            if (image[i][j].reduce((a, c) => a + c, 0) === 0) continue;
            for (let k = j; k < image[i].length; k++) {
                if (image[i][k].reduce((a, c) => a + c, 0) === 0) break;
                if (image[i][k].every((a, b) => a === color[b])) {
                    width++
                } else {
                    break
                }
            }
            for (let k = i; k < image.length; k++) {
                if (image[k][j].reduce((a, c) => a + c, 0) === 0) break;
                if (image[k][j].every((a, b) => a === color[b])) {
                    height++
                } else {
                    break
                }
            }
            if (width === 1 && height === 1) continue;
            res.push({
                position: { x: x, y: y },
                dimensions: { width, height },
                color: color
            })
        }
    }
    return res
}

function graphToDesmos(graph: CompressedGraph): ExpressionFormat[] {
    let res: ExpressionFormat[] = []
    for (let i = 0; i < graph.length; i++) {
        let { position, dimensions, color } = graph[i]
        let { x, y } = position
        let { width, height } = dimensions
        if (color.length === 3) {
            color.push(255)
        }
        res.push({
            type: 'expression',
            id: i,
            color: `#${color.map(a => a.toString(16).padStart(2, '0')).join('')}`,
            latex: `${round(x * .1)}\\le x\\le${round((x + width) * .1)}\\left\\{${round(y * .1)}\\le y\\le${round((y + height) * .1)}\\right\\}`,
            fillOpacity: "1",
            lineOpacity: "1",
            lineWidth: "2"
        })
    }
    return res
}

function getData(id: string, list: any): Record<string, string> {
    if (id.length !== 10) throw new Error('Invalid ID')
    return {
        "calc_state": JSON.stringify({
            "version": 9,
            "randomSeed": crypto.randomBytes(16).toString('hex'),
            "graph": {
                "viewport": {
                    "xmin": -100,
                    "ymin": -170.88827258320127,
                    "xmax": 100,
                    "ymax": 170.88827258320127
                }
            },
            "expressions": {
                list
            }
        }),
        "graph_hash": id,
        "is_update": "false",
        "lang": "en",
        "my_graphs": "false"
    }
}

function genPoints(x: number, y: number): ExpressionFormat[] {
    let r = []
    for (let i = 0; i < x; i++) {
        for (let j = 0; j < y; j++) {
            r.push(
                {
                    type: "expression",
                    id: i + j,
                    color: "#" + crypto.randomBytes(3).toString('hex'),
                    latex: `\\frac{${i + 1}y}{x}=\\sin\\left(${j + 1}x^{2}+y^{2}\\right)`,
                    fillOpacity: "1",
                    lineOpacity: "1",
                    lineWidth: "2"
                }
            )
        }
    }
    return r
}

function RGBtoHex([r, g, b]: number[]) {
    if ([r, g, b].reduce((a, c) => a || c === null || c === undefined, false)) throw new Error('Invalid color')
    if (r > 255 || g > 255 || b > 255) throw new Error('Invalid color')
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function toDataURL(img: Buffer) {
    return `data:image/png;base64,${img.toString('base64')}`
}

function round(num: number) {
    return Math.round(num * 10) / 10
}

export default {
    getData,
    imageToGraph,
    genPoints,
    toDataURL,
    round,
    compressGraph,
    graphToDesmos,
    RGBtoHex,
    compressColors
}
