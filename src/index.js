import polyfill from 'es6-promise';
import 'isomorphic-fetch';
import fetch from './fetch';

// API Paths:
const registerAPI = "/v1/registerclient";
const verifylocationAPI = "/v1/verifylocation";
const findcloudletAPI = "/v1/findcloudlet";
const getlocatiyonAPI = "/v1/getlocation";
const appinstlistAPI = "/v1/getappinstlist";
const dynamiclocgroupAPI = "/v1/dynamiclocgroup";

const timeoutSec = 5000;
const devName = "MobiledgeX"; // Your developer name
const appName = "MobiledgeX SDK Demo"; // Your application name
const appVersionStr = "2.0";

let localhostDME = {};

function getCurrentPosition() {
    if (navigator && navigator.geolocation) {
        return new Promise(
            (resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject)
        )
    } else {
        return new Promise(
            resolve => resolve({})
        )
    }
}

export class GPSLocation {
    constructor() {
        this.latitude = null;
        this.longitude = null;
        this.horizontal_accuracy = null;
        this.timestamp = null;
        this.course = 0;
        this.speed = 0;
        this.vertical_accuracy = 0;
        this.altitude = 0;
    }

    setBrowserLocation() {
        getCurrentPosition()
            .then(
                position => {
                    console.log(positon);
                    if (position.coords) {
                        /*
                        timestamp:1389094994694,
                        coords: {
                            speed: null,
                            heading: null,
                            altitudeAccuracy: null,
                            accuracy:122000,
                            altitude:null,
                            longitude:-3.60512,
                            latitude:55.070859
                        }
                        */
                        position => console.log(positon);
                        const coords = position.coords;
                        this.latitude = coords.latitude;
                        this.timestamp = {
                            "seconds": coords.timestamp,
                            "nanos": 0
                        };
                        this.course = coords.heading;
                        this.speed = coords.speed;
                        this.vertical_accuracy = coords.altitudeAccuracy;
                        this.longitude = coords.longitude;
                        this.altitude = coords.altitude;
                        this.horizontal_accuracy = coords.accurary;

                    } else {
                        alert('Geolocation is not supported by this browser.');
                    }
                }
            ).catch(
                // error => console.log(error);
                // Or
                error => {
                    console.log(error);
                    var msg = null;
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            msg = "User denied the request for Geolocation.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            msg = "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            msg = "The request to get user location timed out.";
                            break;
                        case error.UNKNOWN_ERROR:
                            msg = "An unknown error occurred.";
                            break;
                    }
                    alert(msg);
                }
            )
    }

    setLocation(
        latitude,
        longitude,
        horizontal_accuracy,
        timestamp = null,
        course = 0,
        speed = 0,
        vertical_accuracy = 0,
        altitude = 0
    ) {
        this.latitude = latitude;
        if (timestamp == null) {
            timestamp = Math.floor(Date.now() / 1000);
        }

        // this.timestamp = timestamp.toString();

        this.timestamp = {
            "seconds": timestamp.toString(),
            "nanos": 0
        };

        this.course = course;
        this.speed = speed;
        this.vertical_accuracy = vertical_accuracy;
        this.longitude = longitude;
        this.altitude = altitude;
        this.horizontal_accuracy = horizontal_accuracy;
    }
}

export class MobiledgeXClient {

    // class methods
    constructor(dev_name,
        app_name,
        app_vers) {
        this.dev_name = dev_name;
        this.app_name = app_name;
        this.app_vers = app_vers;
        this.session_cookie = null;
    }

    registerClient(
        auth_token = "", // optional
        carrier_name, // not currently used
        cell_id, // optional
        tags,  // optional
        unique_id, // optional
        unique_id_type // optional
    ) {
        let self = this;
        return new Promise(function (resolve, reject) {

            fetch.fetchResource(registerAPI, {
                method: 'POST',
                body: {
                    app_name: self.app_name,
                    app_vers: self.app_vers,
                    auth_token, // optional
                    carrier_name, // not currently used
                    cell_id, // optional
                    dev_name: self.dev_name,
                    tags,  // optional
                    unique_id, // optional
                    unique_id_type, // optional
                    ver: 1
                }
            }).then(userData => {
                // Do something with the "data"
                self.session_cookie = userData.session_cookie;
                resolve(userData);
            })
                .catch(error => {
                    // Handle error
                    // error.message (error text)
                    // error.status (HTTTP status or 'REQUEST_FAILED')
                    // error.response (text, object or null)
                    // console.log(error);
                    reject(error)
                })

        })
    }

    static buildAppUrls(dmeData) {

        let fqdn = dmeData.fqdn;
        let appUrls = [];
        dmeData.ports.forEach(port => {
            appUrls.push(port.fqdn_prefix + fqdn + ':' + port.public_port);
        });
        return appUrls;
    }

    findCloudlet(
        carrier_name,
        gps_location,
        cell_id = 0, // optional
        tags = [] // optional
    ) {
        let self = this;
        return new Promise(function (resolve, reject) {


            fetch.fetchResource(findcloudletAPI, {
                method: 'POST',
                body: {
                    session_cookie: self.session_cookie,
                    /*
                    "carrierName": "wifi",
                    "gps_location": { "latitude": 49.282, "longitude": 123.11 }
                    */
                    app_name: self.app_name,
                    app_vers: self.app_vers,
                    session_cookie: self.session_cookie,
                    carrier_name, // not currently used
                    cell_id, // optional
                    dev_name: self.dev_name,
                    gps_location: gps_location,
                    tags,  // optional
                    ver: 1,

                }
            }).then(userData => {
                // Do something with the "data"
                // console.log(userData);
                resolve(userData);
            }).catch(error => {
                // Handle error
                // error.message (error text)
                // error.status (HTTTP status or 'REQUEST_FAILED')
                // error.response (text, object or null)
                // console.log(error.response);
                reject(error)
            })
        })
    }

    findClosestCloudlet(carrierName, gpsLocation) {

        let self = this;
        return new Promise(function (resolve, reject) {

            if (carrierName === 'localhost') {
                return handleLocalhost(resolve, reject, self.app_name);
            } else {
                self.findCloudlet(carrierName, gpsLocation).then(response => {
                    let appUrls = MobiledgeXClient.buildAppUrls(response);
                    resolve(appUrls[0]);

                }).catch(error => {
                    console.log("Error" + error);
                    reject('FIND_NOTFOUND');
                });
            }
        })
    }

    verifyLocation() {

    }
}

export function initLocalhostDME(localhostAppConfig) {
    localhostDME = localhostAppConfig;
}

function handleLocalhost(resolve, reject, appName) {
    if (appName in localhostDME) {
        let appConfig = localhostDME[appName];
        resolve(appConfig.url)
    } else {
        reject('FIND_NOTFOUND');
    }
}

export function findClosestCloudlet(devName, appName, appVersionStr, carrierName, gpsLocation) {

    return new Promise(function (resolve, reject) {

        if (carrierName === 'localhost') {
            return handleLocalhost(resolve, reject, appName);
        } else {
            let client = new MobiledgeXClient(devName, appName, appVersionStr);
            client.registerClient().then(userData => {
                client.findClosestCloudlet(carrierName, gps_location).then(url => {
                    resolve(url);
                })
            }).catch(error => {
                console.log("Error: " + error);
                reject('FIND_NOTFOUND');
            });
        }
    })
}

/*
module.exports = {
    MobiledgeXClient: MobiledgeXClient,
    GPSLocation: GPSLocation,
    initLocalhostDME: initLocalhostDME,
    findClosestCloudlet: findClosestCloudlet
}
*/

initLocalhostDME({
    "MobiledgeX SDK Demo": {
        url: 'localhost:8080'
    }
})

let client = new MobiledgeXClient(devName, appName, appVersionStr);
const gps_location = new GPSLocation();
gps_location.setLocation(10, 10, 0);


client.registerClient().then(userData => {

    client.findClosestCloudlet('localhost', gps_location).then(url => {
        console.log('localhost: ' + url);
    }).catch(error => {
        console.log("Error" + error);
    });

    client.findClosestCloudlet('wifi', gps_location).then(url => {
        console.log('wifi: ' + url);
    }).catch(error => {
        console.log("Error" + error);
    });
})

findClosestCloudlet(devName, appName, appVersionStr, 'localhost', gps_location).then(url => {
    console.log('localhost: ' + url);
}).catch(error => {
    console.log("Error" + error);
});

findClosestCloudlet(devName, appName, appVersionStr, 'wifi', gps_location).then(url => {
    console.log('wifi: ' + url);
}).catch(error => {
    console.log("Error" + error);
});


