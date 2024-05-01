import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-airspaces',
    version: '0.2.2',
    icon: '✈',
    title: 'Airspaces',
    description: 'Shows airspaces from openaip.net',
    author: 'Rittels',
    repository: 'github.com/rittels-windy-plugins/windy-plugin-airspaces.git',
    desktopUI: 'embedded',
    mobileUI: 'small',
    listenToSingleclick: true,
    //routerPath: '/my-plugin',
};

export default config;
