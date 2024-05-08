import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-airspaces',
    version: '0.2.4',
    icon: '✈',
    title: 'Airspaces',
    description: 'Shows airspaces from openaip.net',
    author: 'Rittels',
    repository: 'github.com/rittels-windy-plugins/windy-plugin-airspaces.git',
    desktopUI: 'embedded',
    mobileUI: 'small',
    listenToSingleclick: true,
    routerPath: '/airspaces/:list?',
};

export default config;
