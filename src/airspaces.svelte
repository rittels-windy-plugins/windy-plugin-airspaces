<div class="plugin__mobile-header">
    {title}
</div>
<section class="plugin__content">
    <div id="openaip_airspaces_id" data-ref="mainDiv" style="overflow-y:scroll">
        <div
            class="aipHead plugin__title plugin__title--chevron-back"
            on:click={() => bcast.emit('rqstOpen', 'menu')}
        >
            <a href="http://www.openaip.net" target="_blank">openAIP</a> airspaces:
        </div>
        <div class="closing-x" on:click={closeCompletely}></div>

        <div data-ref="aipDiv" class="plugin-content">
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
        <div data-ref="aipInfo" class="plugin-content aipInfo"></div>
        <div class="aipFoot">
            Airspaces data from <a
                style="text-decoration:underline"
                href="http://www.openaip.net"
                target="_blank">openAIP</a
            >.<br />
            Available airspaces: <span data-ref="available"></span>. Updated:
            <span data-ref="lastUpdate"></span>.
        </div>
        <div data-ref="dragHandle" class="drag-handle"></div>
    </div>
</section>

<script>
    import { onDestroy, onMount } from 'svelte';

    import bcast from '@windy/broadcast';
    import plugins from '@windy/plugins';

    import { init, closeCompletely, exports } from './airspaces_main.js';

    import config from './pluginConfig';

    const { title, name } = config;

    const thisPlugin = plugins[name];

    onMount(() => {
        init(thisPlugin);
        thisPlugin.exports = exports;
    });

    export const onopen = _params => {};

    onDestroy(() => {});
</script>

<style lang="less">
    @import 'airspaces.less?1712734735752';
</style>
