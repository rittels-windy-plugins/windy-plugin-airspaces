import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-airspaces',
    version: '0.2.19',
    icon: '✈',
    title: 'Airspaces',
    description: 'Shows airspaces from openaip.net.  Open the plugin with "windy.com/plugin/airspaces',
    author: 'Rittels',
    repository: 'https://www.github.com/rittels-windy-plugins/windy-plugin-airspaces.git',
    desktopUI: 'embedded',
    mobileUI: 'small',
    listenToSingleclick: true,
    routerPath: '/airspaces/:list?',
};

export default config;
