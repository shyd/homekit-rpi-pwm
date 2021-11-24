import {
  Accessory,
  Categories,
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  Service,
  uuid
} from "hap-nodejs";

import { readFileSync, writeFileSync } from 'fs';

// optionally set a different storage location with code below. HAPStorage needs to be added to the list of imports above.
// HAPStorage.setCustomStoragePath("...");

const accessoryUuid = uuid.generate("hap.examples.light.raspberry.pi");
const accessory = new Accessory("Raspberry Pi", accessoryUuid);

const lightService = new Service.Lightbulb("PWM0 Light");

let targetBrightness = 100;
const pwmExport = "/sys/class/pwm/pwmchip0/export";
const pwmPeriod = "/sys/class/pwm/pwmchip0/pwm0/period";
const pwmEnable = "/sys/class/pwm/pwmchip0/pwm0/enable";
const pwmDutyCycle = "/sys/class/pwm/pwmchip0/pwm0/duty_cycle";
const fadeDelay = 10;

const period = 50000;

function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

function setPwm(brightness: number) {
  let duty_cycle: number = period * brightness / 100;
  console.log("Setting pwm level to: " + duty_cycle);
  try { writeFileSync(pwmDutyCycle, duty_cycle.toString()); } catch {}
}

async function fadePwm(current: number) {
  if (targetBrightness < 10) {
    targetBrightness = 10;
  }
  if (targetBrightness < current) {
    for (let i = current; i >= targetBrightness; i--) {
      setPwm(i);
      await delay(fadeDelay);
    }
  } else {
    for (let i = current; i <= targetBrightness; i++) {
      setPwm(i);
      await delay(fadeDelay);
    }
  }
};

function startPwm() {
  try { writeFileSync(pwmExport, "1"); } catch {}
  writeFileSync(pwmPeriod, period.toString());
  setPwm(100);
  writeFileSync(pwmEnable, "1");
}

function getPwm() {
  const p: number = +readFileSync(pwmPeriod, 'utf8');
  const d: number = +readFileSync(pwmDutyCycle, 'utf8');
  return d / p * 100;
}

startPwm();

// 'On' characteristic is required for the light service
const onCharacteristic = lightService.getCharacteristic(Characteristic.On)!;
// 'Brightness' characteristic is optional for the light service; 'getCharacteristic' will automatically add it to the service!
const brightnessCharacteristic = lightService.getCharacteristic(Characteristic.Brightness)!;


// with the 'on' function we can add event handlers for different events, mainly the 'get' and 'set' event
onCharacteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
  let currentLightState = getPwm() != 0;
  console.log("Queried current light state: " + currentLightState);
  callback(undefined, currentLightState);
});
onCharacteristic.on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
  console.log("Setting light state to: " + value);
  if (!(value as boolean)) {
    targetBrightness = 0; //value as boolean ? 100 : 0;
    fadePwm(getPwm());
  }
  callback();
});


brightnessCharacteristic.on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
  const currentBrightnessLevel = getPwm();
  console.log("Queried current brightness level: " + currentBrightnessLevel);
  callback(undefined, currentBrightnessLevel);
});
brightnessCharacteristic.on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
  console.log("Setting brightness level to: " + value);
  targetBrightness = value as number;
  fadePwm(getPwm());
  callback();
});


accessory.addService(lightService); // adding the service to the accessory

// once everything is set up, we publish the accessory. Publish should always be the last step!
accessory.publish({
  username: "17:51:07:F4:BC:0F",
  pincode: "678-90-842",
  port: 47128,
  category: Categories.LIGHTBULB, // value here defines the symbol shown in the pairing screen
});

console.log("Accessory setup finished!");
