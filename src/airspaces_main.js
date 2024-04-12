import plugins from '@windy/plugins';
import utils from '@windy/utils';
import { map } from '@windy/map';
import bcast from '@windy/broadcast';
import { emitter as picker } from '@windy/picker';
import rs from '@windy/rootScope';
const { $, getRefs } = utils;

import config from './pluginConfig';
const { name } = config;
import { loadPlugins } from './loadPlugins.js';
import {  insertGlobalCss, removeGlobalCss } from './globalCss.js';

let thisPlugin;
let refs, node;

let hasHooks = false;

let pickerT, embedbox;  // while embedbox is not used,  it must still be opened.

const whichPicker = () => (rs.isMobileOrTablet ? 'picker-mobile' : 'picker');

let countries,
    schema,
    schemaSel = [];


function init(plgn) {
    //grab node and refs

    thisPlugin = plgn;
    thisPlugin.isActive = true;

    ({ node } = thisPlugin.window);
    ({ refs } = getRefs(node));

    loadPlugins().then(mods => ({ pickerT, embedbox } = mods)).then(() => {
        pickerT.addRightPlugin(name); // only use the right div
        pickerT.drag(pickerOpenOrMoved, 350); //every 350ms: callbackfx is called
        let c = pickerT.getParams();
        if (c) pickerOpenOrMoved(c);
    });

    if (hasHooks) return;

    insertGlobalCss();
    fetchSchemaAndCountries();
    picker.on('pickerOpened', pickerOpenOrMoved);
    picker.on('pickerMoved', pickerOpenOrMoved);
    picker.on('pickerClosed', clearAsp);
    bcast.on('pluginOpened', onPluginOpened);
    thisPlugin.closeCompletely = closeCompletely;
};



function closeCompletely() {
    console.log("Airspaces closing completely");

    removeGlobalCss();

    picker.off('pickerOpened', pickerOpenOrMoved);
    picker.off('pickerMoved', pickerOpenOrMoved);
    pickerT.dragOff(pickerOpenOrMoved);

    pickerT.remRightPlugin(name);

    bcast.on('pluginOpened', onPluginOpened);
    removeAllAsp();
    thisPlugin.isActive = false;

    schema = null; //needed?
    countries = null; //needed?

    bcast.fire('rqstClose', name);
    hasHooks = false;
}


function onPluginOpened(p) {
    if (p.includes('windy-plugin') && p !== name) {
        clearAsp(); //clears highlighted airspaces only,   if the plugin is still active,  moving the picker will still highlight.
    }
}

function pickerOpenOrMoved(c) {
    console.log('picker open or moved in airspases', c);
    if (!c) return;
    if (pickerT.getRightPlugin() != name) {
        console.log(
            'Airspaces cannot use right div because',
            pickerT.getRightPlugin(),
            'is using it',
        );
        return;
    }
    pickerT[whichPicker() == 'picker-mobile' ? 'fillLeftDiv' : 'fillRightDiv'](findAsp(c).txt);
}

////can be cut from here if not windy module

//let map;
let mapLibre;

/**
 * @param m - leaflet map
 * @desc - in Windy map = W.map.map,  reference2map not called
 **/
/*
 function reference2map(m, mL) {
    if (m) map = m;
    if (mL) mapLibre = mL;
}
*/

/*
function appendAspListToDiv(divId) {
    document.querySelector('#' + divId).appendChild(refs.mainDiv);
}
*/

let url3 = 'https://www.openaipgeojson.com/',
    url1 = 'https://www.flymap.org.za/openaip/geojsonbr/',
    //url1 = 'https://www.clreis.co.za/airspace_redirect/',
    url2 = 'https://www.flymap.co.za/openaipgeojson/';
let url = url1;

let php = ''; //'getFile.php?fname=';

let typeOrIcao = 'type';
let position;
let aspOpac = 0.5;
let prevLayerAr = []; //previously found layers
const mapLibreSources = [];

let text4Info;


const createListDiv = (s, col = 'transparent') => {
    let div = document.createElement('div');
    div.className = 'list-line-div';
    let bullet = document.createElement('div');
    bullet.className = 'bullet';
    bullet.style.backgroundColor = col;
    let txt = document.createElement('span');
    txt.innerHTML = s;
    txt.className = 'list-line-div-txt';
    let msg = document.createElement('span');
    msg.classList.add('message');
    msg.innerHTML = '&nbsp;&nbsp;&nbsp;Loading....';
    div.appendChild(bullet);
    div.appendChild(txt);
    div.appendChild(msg);
    return div;
};

const fetchSchema = fetchTries => {
    //return fetch('https://www.flymap.org.za/openaip/geojson/' + 'schema.json').then((r) => r.json())

    return new Promise((res, rej) => {
        if (schema) res(schema);
        else
            res(
                fetch(url + php + 'schema.json')
                    .then(r => r.json())
                    .then(r => {
                        schema = r;
                        //Object.assign(thisPlugin.vars, { schema, schemaSel });
                        return;
                    }),
            );
    }).then(() => {
        console.log('schema', schema);
        for (let k in schema) {
            schemaSel[k] = [];
        }

        const showAll = k => {
            schemaSel[k].forEach((e, i, ar) => (ar[i] = true));
            for (let i in schemaSel[k]) schemaSel[k][i] = true;
            Array.from(refs[k + 'List'].children)
                .slice(0, -2)
                .forEach(e => e.classList.add('highlight'));
            countries.forEach((c, i) => {
                applyFilter(k, c);
            });
        };

        const hideAll = k => {
            schemaSel[k].forEach((e, i, ar) => (ar[i] = false));
            Array.from(refs[k + 'List'].children)
                .slice(0, -2)
                .forEach(e => e.classList.remove('highlight'));
            countries.forEach((c, i) => {
                applyFilter(k, c);
            });
        };

        ['type', 'icao'].forEach(k => {
            for (let ix in schema[k]) {
                let p = { [k]: ix };
                //console.log(p);
                let div = createListDiv(schema[k][ix], aspColor(p));
                div.classList.add('highlight', 'hidden');
                refs[k + 'List'].appendChild(div);
                schemaSel[k][+ix] = true;
                div.dataset.ix = ix;
                div.addEventListener('click', () => {
                    if (k != typeOrIcao) {
                        // if selected according to type,  show all classes.
                        showAll(typeOrIcao);
                        typeOrIcao = k;
                    }
                    schemaSel[k][ix] = !schemaSel[k][ix];
                    div.classList[schemaSel[k][ix] ? 'add' : 'remove']('highlight');
                    //console.log(k, schema[k][ix], schemaSel[k][+ix]);
                    countries.forEach(c => {
                        applyFilter(k, c, ix);
                    });
                    if (position) findAsp(position);
                });
            }
            let addAll = createListDiv('Select All');
            addAll.firstElementChild.style.opacity = '0';
            refs[k + 'List'].appendChild(addAll);

            addAll.addEventListener('click', () => {
                showAll(k);
                if (position) findAsp(position);
            });
            let remAll = createListDiv('Deselect All');
            remAll.firstElementChild.style.opacity = '0';
            refs[k + 'List'].appendChild(remAll);
            remAll.addEventListener('click', () => {
                hideAll(k);
                if (position) findAsp(position);
            });
        });
    });
};

const fetchLastUpdate = () => {
    return fetch(url + php + 'lastUpdate.json')
        .then(r => r.json())
        .then(r => {
            //console.log(r);
            refs.lastUpdate.innerHTML = r.lastUpdate;
            refs.available.innerHTML = r.airspaces;
        });
};

const fetchCountryList = fetchTries => {
    return new Promise((res, rej) => {
        if (countries) res(countries);
        else
            res(
                fetch(url + php + 'countries.json')
                    .then(r => r.json())
                    .then(r => {
                        r.sort((a, b) => (a.name > b.name ? 1 : -1));
                        countries = r;
                        //Object.assign(thisPlugin.vars, { countries });
                        return;
                    }),
            );
    })
        .then(() => {
            //http.get(url + php + 'countries.json').then(d => {return d.data})//.then(r => JSON.parse(r))
            //countryFetchPromise = fetch(url + php + 'countries.json')
            //    .then(r => r.json())
            //    .then(r => {

            //countries = r;
            console.log('countries fetched', countries);
            countries.forEach((e, i) => {
                let countryCode = e.name.slice(-2);
                let s = e.name.slice(0, -3);
                s = s[0].toUpperCase() + s.slice(1);
                for (let j = 0, l = s.length; j < l; j++)
                    if (s[j] == '_')
                        s = s.slice(0, j) + ' ' + s[j + 1].toUpperCase() + s.slice(j + 2);
                s += ' (' + countryCode + ')';
                let cntdiv = createListDiv(s);
                e.cntdiv = cntdiv;
                cntdiv.addEventListener('click', () => {
                    if (!(countries[i].gjLayer || countries[i].mlLayer)) {
                        cntdiv.classList.add('highlight', 'loading-asp');
                        fetchAsp(i, true).then(() =>
                            setTimeout(() => cntdiv.classList.remove('loading-asp'), 100),
                        );
                    } else {
                        ////
                        removeLayer(i);
                        ///
                        cntdiv.classList.remove('highlight');
                    }
                    if (position) findAsp(position);
                });
                if (e.fetched) cntdiv.classList.add('highlight');
                refs.airspaceList.appendChild(cntdiv);
            });
            let addAll = createListDiv('Select All');
            refs.airspaceList.appendChild(addAll);
            addAll.addEventListener('click', () => {
                countries.forEach((c, i) => {
                    if (!(c.gjLayer || c.mlLayer)) {
                        c.cntdiv.classList.add('highlight', 'loading-asp');
                        fetchAsp(i).then(() => c.cntdiv.classList.remove('loading-asp'));
                    }
                });
                if (position) findAsp(position);
            });
            let remAll = createListDiv('Deselect All');
            refs.airspaceList.appendChild(remAll);
            remAll.addEventListener('click', () => {
                countries.forEach((c, i) => {
                    if (countries[i].gjLayer || countries[i].mlLayer) {
                        ////

                        removeLayer(i);
                        ///

                        c.cntdiv.classList.remove('highlight');
                    }
                });
                if (position) findAsp(position);
            });
        })
        .catch(error => {
            console.error('Error:', error, 'Attempt', fetchTries);
            if (fetchTries < 3) {
                setTimeout(fetchCountryList, 2000, fetchTries + 1);
            } else if (fetchTries < 6) {
                url = url2;
                setTimeout(fetchCountryList, 2000, fetchTries + 1);
            } else
                refs.aipDiv.innerHTML =
                    'Failed to load country list.<br>You can try to reload plugin.';
        });
};

////drag

function addDrag() {
    refs.aipInfo.style.top = 'calc(100% - 120px)';
    refs.aipDiv.style.bottom = '120px';
    refs.dragHandle.style.top = 'calc(100% - 120px)';
    let el = refs.dragHandle;
    let top, topOffs;
    let mouseDown = false;
    const handleStart = e => {
        e.preventDefault();
        e.stopPropagation();
        top = el.offsetTop;
        let pos = e.targetTouches ? e.targetTouches[0] : e;
        topOffs = top - pos.pageY;
        mouseDown = true;
    };
    const handleEnd = e => {
        mouseDown = false;
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('mousemove', handleMove);
    };
    const handleCancel = e => {
        console.log('cancel', e);
    };
    const handleMove = e => {
        if (!mouseDown) return;
        let pos = e.targetTouches ? e.targetTouches[0] : e;
        el.style.top = topOffs + pos.clientY + 20 + 'px';
        refs.aipInfo.style.top = topOffs + pos.clientY + 20 + 'px';
        refs.aipDiv.style.bottom = 'calc(100% - ' + (topOffs + pos.clientY + 20) + 'px)';
    };
    el.addEventListener('touchstart', handleStart);
    el.addEventListener('touchend', handleEnd);
    el.addEventListener('touchcancel', handleCancel);
    el.addEventListener('touchmove', handleMove);
    el.addEventListener('mousedown', e => {
        handleStart(e);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('mousemove', handleMove);
    });
}
//addDrag();
/////

/////  map interaction,   either  leaflet or mapLibre

function loadGeoJson2Leaflet(i) {
    countries[i].gjLayer = L.geoJSON(countries[i].asp, {
        style: feature => {
            return {
                interactive: false,
                weight: 1,
                fill: 0,
                opacity: aspOpac,
                color: aspColor(feature.properties),
            };
        },
        onEachFeature: (feature, layer) => {
            countries[i].asp.features.find(
                f => f.properties._id == feature.properties._id,
            ).featureLayer = layer;
        },
    }).addTo(map);
}

function loadGeoJson2mapLibre(i) {
    let n = countries[i].name;

    if (!mapLibreSources.includes(n)) {
        const filter = (k, v) => {
            if (k == 'featureLayer') return undefined;
            else return v;
        };
        let clone = JSON.parse(JSON.stringify(countries[i].asp, filter));
        clone.features.forEach(f => {
            f.properties.ulval =
                f.properties.ul.value *
                (f.properties.ul.unit == 1 ? 0.3048 : f.properties.ul.unit == 6 ? 30.48 : 1);
            f.properties.llval =
                f.properties.ll.value *
                (f.properties.ll.unit == 1 ? 0.3048 : f.properties.ll.unit == 6 ? 30.48 : 1);
        });
        let cloneGJ = {
            type: 'geojson',
            data: clone,
            promoteId: '_id',
        };

        mapLibreSources.push(n);
        mapLibre.addSource(n, cloneGJ);
    }

    let lineColor = ['case'];
    for (let type = 1; type <= 3; type++) {
        lineColor.push(['==', ['get', 'type'], type], aspColor({ type }));
    }
    for (let icao = 0; icao <= 8; icao++) {
        lineColor.push(['==', ['get', 'icao'], icao], aspColor({ icao }));
    }
    lineColor.push('black');

    mapLibre.addLayer({
        id: n,
        type: 'line',
        source: n,
        layout: {
            'line-join': 'round',
            'line-cap': 'round',
        },
        paint: {
            'line-color': lineColor,
            'line-opacity': [
                'case',
                ['boolean', ['feature-state', 'no-highlight'], true],
                aspOpac,
                1,
            ],
            'line-width': ['case', ['boolean', ['feature-state', 'no-highlight'], true], 1, 3],
        },
    });

    for (let ic = 0; ic < 9; ic++) {
        let shift = (ic + 1) * 10;
        mapLibre.addLayer({
            id: n + '_extrusion_' + ic,
            type: 'fill-extrusion',
            source: n, //+'_extrusion',
            filter: ['==', ['get', 'icao'], ic],
            paint: {
                'fill-extrusion-color': lineColor,
                'fill-extrusion-height': ['number', ['-', ['get', 'ulval'], shift]],
                'fill-extrusion-base': ['number', ['+', ['get', 'llval'], shift]],
                'fill-extrusion-opacity': 0.2,
            },
            layout: {
                visibility: on3d ? 'visible' : 'none',
            },
        });
    }
    countries[i].mlLayer = true;
}

function filterTypeIcao() {
    const availType = [],
        availIcao = [];
    countries.forEach(c => {
        if ((map && !c.gjLayer) || (mapLibre && !c.mlLayer)) return;
        c.asp.features.forEach(({ properties: { type, icao } }) => {
            if (!availType.includes(type)) availType.push(type);
            if (!availIcao.includes(icao)) availIcao.push(icao);
        });
    });
    for (let c of refs.typeList.children) {
        if (c.dataset.ix === undefined) continue;
        c.classList[availType.includes(+c.dataset.ix) ? 'remove' : 'add']('hidden');
    }
    for (let c of refs.icaoList.children) {
        if (c.dataset.ix === undefined) continue;
        c.classList[availIcao.includes(+c.dataset.ix) ? 'remove' : 'add']('hidden');
    }
    return { availType, availIcao };
}

function load(i) {
    if (map) loadGeoJson2Leaflet(i);
    if (mapLibre) loadGeoJson2mapLibre(i);
    filterTypeIcao();
}

function removeLayer(i) {
    if (map) {
        map.removeLayer(countries[i].gjLayer);
        delete countries[i].gjLayer;
    }
    if (mapLibre) {
        mapLibre.removeLayer(countries[i].name);
        mapLibre.removeLayer(countries[i].name + '_extrusion');
        countries[i].mlLayer = false;
    }
    filterTypeIcao();
}

//only for mapLibre
function toggleExtrusion(on) {
    on3d = on;
    if (mapLibre) {
        countries.forEach(c => {
            //console.log(c);
            if (c.mlLayer) {
                //console.log(c.name);
                mapLibre.setLayoutProperty(
                    c.name + '_extrusion',
                    'visibility',
                    on ? 'visible' : 'none',
                );
            }
        });
    }
}

function fitBounds(bnds) {
    if (map) map.fitBounds(bnds);
    if (mapLibre)
        mapLibre.fitBounds([
            [bnds[0][1], bnds[0][0]],
            [bnds[1][1], bnds[1][0]],
        ]);
}

/**
 * @param k:  type or icao
 * @param c: country
 * @param ix : index of schemaSelected,  if undefined,  then use position 0,  all will be the same
 **/
function applyFilter(k, c, ix) {
    if (map) {
        if (c.gjLayer) {
            c.asp.features.forEach(f => {
                if (f.properties[k] == ix || ix === undefined) {
                    //f.featureLayer.setStyle({ opacity: schemaSel[k][ix === undefined ? 0 : ix] ? aspOpac : 0 });
                    let keep = schemaSel[k][ix === undefined ? 0 : ix];
                    f.featureLayer[keep ? 'addTo' : 'remove'](map);
                }
            });
        }
    }

    if (mapLibre) {
        if (mapLibre.getLayer(c.name)) {
            mapLibre.setFilter(c.name, [
                'boolean',
                ['at', ['get', k], ['literal', schemaSel[k]]],
            ]);
            mapLibre.setFilter(c.name + '_extrusion', [
                'boolean',
                ['at', ['get', k], ['literal', schemaSel[k]]],
            ]);
        }
    }
}

function highLightFeature(f, country) {
    if (map) {
        f.featureLayer.setStyle({ color: aspColor(f.properties), weight: 2, opacity: 1 });
    }
    if (mapLibre) {
        mapLibre.setFeatureState(
            { source: country, id: f.properties._id },
            { 'no-highlight': false },
        );
    }
}

function removeHighLight(f, country) {
    if (map) {
        let opacity =
            schemaSel.type[f.properties.type] && schemaSel.icao[f.properties.icao]
                ? aspOpac
                : 0;
        f.featureLayer.setStyle({ color: aspColor(f.properties), weight: 1, opacity });
    }
    if (mapLibre) {
        mapLibre.setFeatureState(
            { source: country, id: f.properties._id },
            { 'no-highlight': true },
        );
    }
}

///// end of map interaction

const getOpac = () => {
    return aspOpac;
};

/**
 * fetch and load on available map
 */
const fetchAsp = function (i, fitbnds, cbf) {
    let bnds = countries[i].bounds[0];
    if (fitbnds) fitBounds(bnds);
    if (!countries[i].fetched) {
        countries[i].fetched = true;
        //http.get(`${url+php}${countries[i].name}.geojson`).then(d => d.data).then(r => {
        return fetch(`${url + php}${countries[i].name}.geojson`)
            .then(r => r.json())
            .then(r => {
                countries[i].asp = r; //JSON.parse(r);
                load(i);
                //if (cbf) cbf(countries[i]);  // not used?
            })
            .catch(err => {
                countries[i].fetched = false;
                console.log('failed to fetch', err);
            });
    } else if (!countries[i].gjLayer) {
        load(i);
        return Promise.resolve();
        //if (cbf) cbf(countries[i]);   //not used
    }
};

const aspColor = function (p) {
    let n =
        p.type !== void 0 && Number(p.type) >= 1 && Number(p.type <= 3)
            ? schema.type[p.type]
            : p.icao !== void 0
                ? schema.icao[p.icao]
                : 'default';

    let light = true;

    if (light) {
        switch (n.toUpperCase()) {
            case 'RESTRICTED':
                return 'lightpink';
            case 'PROHIBITED':
                return 'orange';
            case 'DANGER':
                return 'orangered';
            case 'CTR':
                return 'lightblue';
            case 'A':
                return 'yellow';
            case 'B':
                return 'white';
            case 'C':
                return 'cyan';
            case 'D':
                return 'aqua';
            case 'E':
                return 'peachpuff';
            case 'F':
                return 'lawngreen';
            case 'B':
                return 'lightcyan';
            case 'G':
                return 'lightyellow';
            case 'SUA':
                return 'lightgreen';
            //case 'WAVE': return 'mistyrose';
            //case 'RMZ': return 'palegreen';
            //case 'gliding': return 'lightsalmon';
            //case 'FIR': return 'aquamarine';
            default:
                return 'white';
        }
    } else {
        switch (n.toUpperCase()) {
            //dark colors
            case 'RESTRICTED':
                return 'pink';
            case 'PROHIBITED':
                return 'darkorange';
            case 'DANGER':
                return 'orangered';
            case 'CTR':
                return 'blue';
            case 'A':
                return 'darkblue';
            case 'C':
                return 'darkcyan';
            case 'D':
                return 'DarkTurquoise';
            case 'E':
                return 'brown';
            case 'F':
                return 'darkgreen';
            case 'B':
                return 'cyan';
            case 'G':
                return 'fuchsia';
            case 'SUA':
                return 'green';
            default:
                return 'rgb(20,20,20)';
        }
    }
};

function fetchSchemaAndCountries() {
    Promise.all([fetchLastUpdate(0), fetchSchema(0), fetchCountryList(0)]).then(() => {
        //may already be loaded countries
        filterTypeIcao();
    });
    addDrag();
}


//  point-in-polygon
const checkPoly = function (point, vs) {
    var x = point[0],
        y = point[1];
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i][0],
            yi = vs[i][1];
        var xj = vs[j][0],
            yj = vs[j][1];
        var intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
};
///

function altUnit(u) {
    switch (schema.altUnit[u].toUpperCase()) {
        case 'FEET':
            return 'ft';
        case 'FLIGHT LEVEL':
            return 'FL';
        case 'METER':
            return 'm';
    }
}
function makeText4Picker(aspAr) {
    let txt = '';
    aspAr.forEach(p => {
        txt += `<div onclick='
                    let d=this.nextElementSibling; 
                        if(d.style.display=="none"){
                            d.style.display=""
                        } else{ 
                            d.style.display="none"
                        }' style = 'color:${aspColor(p)}; cursor:pointer; z-Index:999; word-wrap:normal;'>
                        ${p.name} &nbsp;&nbsp;&nbsp; 
                    </div>
                    <div style='display:none'>
                        <span style='font-size:9px;'>&nbsp;&nbsp;Cat:&nbsp;${schema.icao[p.icao]}</span><br>
                        <span style='font-size:9px;'>&nbsp;&nbsp;Type:&nbsp;${schema.type[p.type]}</span><br>
                        <span style='font-size:9px;'>&nbsp;&nbsp;${p.ll.value}${altUnit(p.ll.unit)} ${schema.altRef[p.ll.referenceDatum]}-${p.ul.value}${altUnit(p.ul.unit)} ${schema.altRef[p.ul.referenceDatum]}</span>
                    </div>`;
    });
    return txt;
}
function makeText4Info(aspAr) {
    let txt = '';
    aspAr.forEach(p => {
        txt += `<div><b>${p.name}</b></div>
                    <div>
                        <span style='font-size:10px;'>&nbsp;&nbsp;&nbsp;&nbsp;Cat:&nbsp;${schema.icao[p.icao]}</span>
                        <span style='font-size:10px;'>&nbsp;&nbsp;&nbsp;&nbsp;Type:&nbsp;${schema.type[p.type]}</span><br>
                        <span style='font-size:10px;'>&nbsp;&nbsp;&nbsp;&nbsp;${p.ll.value}${altUnit(p.ll.unit)} ${schema.altRef[p.ll.referenceDatum]}-${p.ul.value}${altUnit(p.ul.unit)} ${schema.altRef[p.ul.referenceDatum]}</span><br>
                        ${p.freq ? '<span style="font-size:9px;">&nbsp;&nbsp&nbsp;&nbsp;Freq:&nbsp; ' + p.freq[0].val + '</span>' : ''}
                        <br><br>
                    </div>`;
    });
    return txt;
}

//--find airspace:
function findAsp(e, showInInfo) {
    let txt = '';
    let aspAr = [];

    position = e;

    if (countries) {
        let c = [e.lon || e.lng, e.lat]; //points obj for geojson
        let cc = [e.lat, e.lon || e.lng]; //points obj for leaflet

        let layerAr = []; // found layers

        /** b: [[ minlat , minlng], [maxlat, maxlng]],
         *  c: [lat,lng] */
        const contains = (b, cc) =>
            cc[0] >= b[0][0] && cc[0] <= b[1][0] && cc[1] >= b[0][1] && cc[1] <= b[1][1];

        const cntryBounds = i => countries[i].bounds.some(bb => contains(bb, cc));

        for (let i = 0; i < countries.length; i++) {
            if (
                (countries[i].gjLayer || (mapLibre && mapLibre.getLayer(countries[i].name))) &&
                cntryBounds(i)
            ) {
                let { features } = countries[i].asp;
                features.forEach(f => {
                    if (
                        contains(f.properties.bnd, cc) && //airspace bounds stored in properties.
                        (isNaN(f.properties.type) || schemaSel.type[f.properties.type]) &&
                        (isNaN(f.properties.icao) || schemaSel.icao[f.properties.icao])
                    ) {
                        if (checkPoly(c, f.geometry.coordinates[0])) {
                            aspAr.push(f.properties);
                            layerAr.push({ f, country: countries[i].name });
                            highLightFeature(f, countries[i].name);
                        }
                    }
                });
            }
        }
        prevLayerAr.forEach(({ f, country }) => {
            let id = f.properties._id;
            let prevFeaturePersists = layerAr.find(({ f: ff }) => ff.properties._id == id);
            if (!prevFeaturePersists) {
                removeHighLight(f, country);
            }
        });
        txt = makeText4Picker(aspAr);
        prevLayerAr = layerAr.map(e => e);
    }
    //console.log('TXT', txt);
    //console.log(refs);

    refs.aipInfo.innerHTML = makeText4Info(aspAr);

    return { txt, aspAr };
}

function clearAsp() {
    //clear all airspaces highlights
    prevLayerAr.forEach(({ f, country }) => removeHighLight(f, country));
    prevLayerAr = [];
}

function removeAllAsp() {
    countries.forEach(c => {
        if (map && c.gjLayer) {
            map.removeLayer(c.gjLayer);
            delete c.gjLayer;
        }
        if (mapLibre && c.mlLayer) {
            mapLibre.removeLayer(c.name);
            mapLibre.removeLayer(c.name + '_extrusion');
            c.mlLayer = false;
        }
        c.cntdiv.classList.remove('highlight');
    });
}

function setOpac(op) {
    //change opacity
    /*  todo
        aspOpac = op / 100;
        for (let i = 0; i < countries.length; i++) {
            if (countries[i].gjLayer) {
                countries[i].asp.features.forEach(f => {
                    //if not highlighted then set opac
                    if (prevLayerAr.find(pl => pl.properties._id == f.properties._id)) {
                        e.setStyle({ color: aspColor(e.feature.properties), weight: 1, opacity: aspOpac });
                    }
                });
            }
        };
        */
}

function getCountries() {
    return countryFetchPromise.then(() => countries);
}

let exports = {
    findAsp,
    clearAsp,
    getCountries,
    //appendAspListToDiv,
    //reference2map,
    prevLayerAr,

    //plugins_openAIPasp,
    fetchAsp,
    findAsp,
    clearAsp,
    removeAllAsp,
    load,
    setOpac,
    getOpac,
    //    toggleExtrusion, //only applicable for mapLibre
};

export { exports, init, closeCompletely };
