import { Capacitor } from '@capacitor/core';

const API_BASE_URL = Capacitor.isNativePlatform()
    ? 'https://178.16.140.5/api'
    : '/api';

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    APP_VERSION: '30.19.2',
    HEADERS: {
        CONTENT_TYPE: 'application/json',
    },
    TIMEOUT: {
        DEFAULT: 30_000,
        LOGIN: 15_000,
    },
};
