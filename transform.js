const minimist = require('minimist');
const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const Json2csvParser = require('json2csv').Parser;

const WEIGHT_MAP = {
    '0': null,
    '--': -2,
    '-': -1,
    '+': 1,
    '++': 2,
};

const argv = minimist(process.argv.slice(2));

const inputPath = argv.i;
if (inputPath) {
    const json = readJSON(inputPath);
    const actionSystems = json.actionSystems;
    const lifeEntries = json.lifeEntries;
    const connections = json.connections;

    const nodes = [];
    const edges = [];

    // actionSystems.forEach((a) => {
    //     nodes.push({
    //         id: a.id,
    //         label: a.name,
    //         type: 'actionSystem',
    //     });
    // });

    lifeEntries.forEach((l) => {
       nodes.push({
           id: l.id,
           label: l.title,
           type: 'lifeEntry',
           actionSystem: _.findWhere(actionSystems, { id: l.actionSystemId }).name,
        });

       // edges.push({
       //     source: l.actionSystemId,
       //     target: l.id,
       //     type: 'undirected',
       //     weight: 0,
       // });
    });

    connections.forEach((targets, sindex) => {
        targets.forEach((weightChar, tindex) => {
            const weight = decodeWeight(weightChar);
            if (weight !== null) {
                const source = lifeEntries[sindex];
                const target = lifeEntries[tindex];

                edges.push({
                    source: source.id,
                    target: target.id,
                    weight: weight,
                    type: 'directed',
                });
            }
        });
    });

    if (!fs.existsSync('./export')) {
        fs.mkdirSync('./export');
    }

    const basename = path.basename(inputPath, '.json');
    if (!fs.existsSync(`./export/${basename}`)) {
        fs.mkdirSync(`./export/${basename}`);
    }

    exportNodes(nodes, `./export/${basename}`);
    exportEdges(edges, `./export/${basename}`);
}

function readJSON(path) {
    if (fs.existsSync(path)) {
        return JSON.parse(fs.readFileSync(path, 'utf-8'));
    }
    throw new Error('No file found');
}

function decodeWeight(char) {
    return WEIGHT_MAP[char];
}

function exportNodes(nodes, path) {
    const fields = ['id', 'label', 'type', 'actionSystem'];

    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(nodes);
    fs.writeFileSync(`${path}/nodes.csv`, csv, 'UTF-8');
}

function exportEdges(edges, path) {
    const fields = ['source', 'target', 'weight', 'type'];
    const json2csvParser = new Json2csvParser({ fields });

    const csv = json2csvParser.parse(edges);
    fs.writeFileSync(`${path}/edges.csv`, csv, 'UTF-8');
}

