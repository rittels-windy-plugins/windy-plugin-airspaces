<div class="embed-window">
    <span
        class="checkbox"
        class:checkbox--off={!thisPlugin.isFocused}
        style="position:relative; top:0.1em"
        data-tooltip={`Picker focuses on the ${title} plugin.`}
        on:click={focus}>&nbsp;</span
    >
    <span
        on:click={() => {
            showInfo(name);
            focus();
        }}
        style:cursor="pointer">Show Airspaces</span
    >
    <div data-ref="messageDiv" class="hidden"></div>

</div>

<div bind:this={mainDiv} id={`${name}-info`} data-ref="mainDiv" class="bg-transparent dark-content">
    <div
        class="closing-x"
        on:click={() => {
            document.body.classList.remove(`on${name}-info`);
        }}
    ></div>
    <div bind:this={cornerHandle} data-ref="cornerHandle" class="corner-handle"></div>
    <div bind:this={cornerHandleTop} data-ref="cornerHandleTop" class="corner-handle-top"></div>

    <div class="overflow-hidden">
        <div class="aipHead plugin__title">
            <a href="http://www.openaip.net" target="_blank"><u>openAIP</u></a> airspaces:
        </div>
        <div bind:this={aipDiv} data-ref="aipDiv" class="scrollable">
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
            Airspaces data from <a style="text-decoration:underline" href="http://www.openaip.net" target="_blank">openAIP</a>.<br />
            Available airspaces: <span data-ref="available"></span>. Updated:
            <span data-ref="lastUpdate"></span>.
        </div>
        <div bind:this={dragHandle} data-ref="dragHandle" class="drag-handle"></div>
    </div>
</div>

<script>
    import { onDestroy, onMount } from 'svelte';

    import bcast from '@windy/broadcast';
    import plugins from '@windy/plugins';

    import { init, closeCompletely, exports } from './airspaces_main.js';
    import { addDrag, showInfo, getWrapDiv, makeBottomRightHandle, makeTopLeftHandle, embedForTablet } from './infoWinUtils.js';
    import { getPickerMarker } from './picker.js';

    import config from './pluginConfig';

    const { title, name } = config;

    const thisPlugin = plugins[name];
    let node;
    let mainDiv;
    let cornerHandle, cornerHandleTop;
    let closeButtonClicked = false;

    let dragHandle, aipInfo, aipDiv;

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

        const wrapDiv = getWrapDiv();
        wrapDiv.appendChild(mainDiv);

        makeBottomRightHandle(cornerHandle, mainDiv);
        makeTopLeftHandle(cornerHandleTop, mainDiv);
        embedForTablet(thisPlugin);

        //// this should not be needed later
        node.querySelector(':scope > .closing-x').addEventListener('click', () => (closeButtonClicked = true));
        ////

        focus();
        thisPlugin.focus = focus;
        thisPlugin.defocus = defocus;

        aipInfo.style.top = 'calc(100% - 120px)';
        aipDiv.style.bottom = '120px';
        dragHandle.style.top = 'calc(100% - 120px)';
        addDrag(dragHandle, (x, y) => {
            aipInfo.style.top = y + 'px';
            aipDiv.style.bottom = 'calc(100% - ' + y + 'px)';
            dragHandle.style.top = y + 'px';
        });
    });

    onDestroy(() => {
        mainDiv.remove();
        document.body.classList.remove(`on${name}-info`);

        //// Should not be neede later
        if (!closeButtonClicked) setTimeout(() => thisPlugin.open({}));
        else closeCompletely();
        ////
    });

    export const onopen = _params => {
        let list = _params?.list?.split(',').map(c => c.trim());
        if (list && list.length) {
            exports.fetchCountryList().then(cs =>
                list.forEach(a => {
                    let i = cs.findIndex(c => c.name.slice(-2) == a);
                    if (i >= 0) exports.fetchAsp(i, list.length == 1 ? true : false);
                }),
            );
        }
    };
</script>

<style lang="less">
    @import 'airspaces.less?1731483774553';
</style>
