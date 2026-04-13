import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

const API_BASE_URL = isNative
    ? 'https://app.sodacristal.com.br/api'
    : '/api';

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    IS_NATIVE: isNative,
    APP_VERSION: '30.19.2',
    HEADERS: {
        CONTENT_TYPE: 'application/json',
    },
    TIMEOUT: {
        DEFAULT: 30_000,
        LOGIN: 15_000,
    },
};
