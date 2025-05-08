import { Capacitor } from '@capacitor/core';

let apiHostname: string = import.meta.env.VITE_APP_API_HOSTNAME || '';
let wsHostname: string = import.meta.env.VITE_APP_WS_HOSTNAME || '';

console.log('API Hostname:', wsHostname);

export { apiHostname, wsHostname };
