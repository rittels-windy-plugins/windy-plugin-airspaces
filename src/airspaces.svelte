<div data-tooltip={`Click checkbox focus on this plugin.\n\rClick Airspaces to select Airspaces.>`}>
    <span
        class="checkbox"
        class:checkbox--off={!thisPlugin.isFocused}
        style="position:relative; top:0.1em"
        on:click={focus}
    ></span>

    <span
        on:click={() => {
            showInfo(name);
            focus();
        }}
        style:cursor="pointer">Airspaces</span
    >
</div>

<div
    bind:this={mainDiv}
    id={`${name}-info`}
    data-ref="mainDiv"
    class="bg-transparent dark-content"
    class:showAirspaces
>
    <div class="aipHead plugin__title">
        <a href="http://www.openaip.net" target="_blank"><u>openAIP</u></a> airspaces:
    </div>
    <div
        class="closing-x"
        on:click={() => {
            document.body.classList.remove(`on${name}-info`);
        }}
    ></div>

    <div bind:this={aipDiv} data-ref="aipDiv" class="plugin-content">
        <input type="checkbox" class="section-checkbox" />
        <label class="section-head">Country List</label>
        <div class="space-div"></div>
        <div data-ref="airspaceList" class=" airspace-list"></div>

        <input type="checkbox" class="section-checkbox" />
        <label class="section-head">Select Type</label>
        <div class="space-div"></div>
        <div data-ref="typeList" class="type-list"></div>

        <input type="checkbox" class="section-checkbox" />
        <label class="section-head">Select Icao Class</label>
        <div class="space-div"></div>
        <div data-ref="icaoList" class="icao-list"></div>
    </div>
    <div bind:this={aipInfo} data-ref="aipInfo" class="plugin-content aipInfo"></div>
    <div class="aipFoot">
        Airspaces data from <a
            style="text-decoration:underline"
            href="http://www.openaip.net"
            target="_blank">openAIP</a
        >.<br />
        Available airspaces: <span data-ref="available"></span>. Updated:
        <span data-ref="lastUpdate"></span>.
    </div>
    <div bind:this={dragHandle} data-ref="dragHandle" class="drag-handle"></div>
    <div bind:this={cornerHandle} data-ref="cornerHandle" class="corner-handle"></div>
</div>

<script>
    import { onDestroy, onMount } from 'svelte';

    import bcast from '@windy/broadcast';
    import plugins from '@windy/plugins';

    import { init, closeCompletely, exports } from './airspaces_main.js';
    import { addDrag, showInfo } from './infoWinUtils.js';
    import { getPickerMarker } from './picker-src/picker.js';

    import config from './pluginConfig';

    const { title, name } = config;

    const thisPlugin = plugins[name];

    let showAirspaces = false;
    let closeButtonClicked = false;
    let mainDiv;
    let node;
    let dragHandle, cornerHandle, aipInfo, aipDiv;

    function focus() {
        for (let p in plugins) {
            if (p.includes('windy-plugin') && p !== name && plugins[p].defocus) {
                plugins[p].defocus();
            }
        }
        thisPlugin.isFocused = true;

        // now do whatever,  for this plugin,  only addRightPlugin;
        let marker = getPickerMarker();
        marker?.addRightPlugin(name);
        if (marker?.getParams()) {
            marker.openMarker(marker.getParams());
        }
    }

    function defocus() {
        thisPlugin.isFocused = false;

        // put stuff here.  such as clearAsp()
        exports.clearAsp();
    }

    onMount(() => {
        init(thisPlugin);
        node = thisPlugin.window.node;

        // move to body immediately,  remove when plugin closed,  change display when .onwindy-plugin-airspaces-info is toggled on body
        document.body.appendChild(mainDiv);

        //thisPlugin.exports = exports;   // not needed now

        addDrag(cornerHandle, (x, y) => {
            mainDiv.style.height = y + 'px';
            mainDiv.style.width = x + 'px';
        });

        //// this should not be needed later
        node.querySelector(':scope > .closing-x').addEventListener(
            'click',
            () => (closeButtonClicked = true),
        );
        ////

        aipInfo.style.top = 'calc(100% - 120px)';
        aipDiv.style.bottom = '120px';
        dragHandle.style.top = 'calc(100% - 120px)';
        addDrag(dragHandle, (x, y) => {
            console.log(x, y);
            aipInfo.style.top = y + 'px';
            aipDiv.style.bottom = 'calc(100% - ' + y + 'px)';
        });

        focus();
        thisPlugin.focus = focus;
        thisPlugin.defocus = defocus;
    });

    onDestroy(() => {
        mainDiv.remove();
        document.body.classList.remove(`on${name}-info`);

        //// Should not be neede later
        if (!closeButtonClicked) setTimeout(() => thisPlugin.open());
        else closeCompletely();
        ////
    });

    export const onopen = _params => {};
</script>

<style lang="less">
    @import 'airspaces.less?1714573521041';
</style>
