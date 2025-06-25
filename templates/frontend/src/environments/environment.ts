// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  wsUrl: 'http://localhost:3000',
  firebase: {
    apiKey: 'AIzaSyDbIv3q8VmphMuwFCNDHxo82xfj4ETa158',
    authDomain: 'chi-proj.firebaseapp.com',
    projectId: 'chi-proj',
    storageBucket: 'chi-proj.firebasestorage.app',
    messagingSenderId: '736918829959',
    appId: '1:736918829959:web:7bd7c09296ae80fbeef122',
    measurementId: 'G-EG7F7FSJTR',
    vapidKey:
      'BBnZD_RIbsOEpLEne9IOZEiikdrPPiW94T2xNGc6dz0t28WahIZcojsW1xagryqsBgIGt1Cd1EZrYGjD19-Yt-Y',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
