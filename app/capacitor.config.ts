/// <reference types="@capacitor/status-bar" />
/// <reference types="@capacitor/keyboard" />

import type {
  CapacitorConfig,
} from '@capacitor/cli'
import {
  KeyboardResize,
  KeyboardStyle,
} from '@capacitor/keyboard'

const config: CapacitorConfig = {
  appId: 'com.brewlink.app',
  appName: 'BrewLink',
  webDir: 'out',

  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#f8f7f4',
    },

    Keyboard: {
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Light,
      resizeOnFullScreen: true,
      autoBackdropColor: 'dom',
    },
  },
}

export default config