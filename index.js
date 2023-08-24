function getIncomingData(sigfox_incoming_data) {
  let result;

  try {
    let messageID = parseInt("0x" + sigfox_incoming_data.substring(0, 2)) & 0x1f;

    switch (messageID) {
      case 1:
        result = data100(sigfox_incoming_data);
        break;
      case 2:
      case 3:
      case 4:
      case 5:
        result = { MesID: messageID, "Meter Number": sigfox_incoming_data.substring(3, 14) };
        break;
      case 6:
        result = data300(sigfox_incoming_data);
        break;
      case 7:
        result = consumption(sigfox_incoming_data);
        break;
      case 8:
        result = dataMessage8(sigfox_incoming_data);
        break;
      case 9:
        result = dataMessage9(sigfox_incoming_data);
        break;
      default:
        result = { MesID: messageID, Error: "Invalid Message" };
        break;
    }
  } catch (err) {
    return console.log(err);
  }

  return result;
}

function dataMessage8(sigfox_incoming_data) {
  let result = {};

  try {
    let bytes = new Array(12);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt("0x" + sigfox_incoming_data.substring(i * 2, i * 2 + 2));
    }
    result["MesID"] = bytes[0] & 0x1f;

    let buffer = new ArrayBuffer(4);
    let view = new DataView(buffer);
    view.setUint8(0, bytes[1]);
    view.setUint8(1, bytes[2]);
    view.setUint8(2, bytes[3]);
    let total = view.getInt32(0, true);

    let decimals = (bytes[4] & 0xc0) >> 6;
    switch (decimals) {
      case 0:
        result["Totalizer"] = total * 1000;
        break;
      case 1:
        result["Totalizer"] = total * 100;
        break;
      case 2:
        result["Totalizer"] = total * 10;
        break;
      case 3:
        result["Totalizer"] = total;
        break;
    }
    result["Decimals"] = decimals;

    let text;
    let profile = bytes[5] & 3;
    switch (profile) {
      default:
      case 0:
        text = "0-Daily";
        break;
      case 1:
        text = "1-Hourly";
        break;
      case 2:
        text = "2-30 Minutes";
        break;
      case 3:
        text = "3-15 Minutes";
        break;
    }
    result["Uplink Profile"] = text;

    let leak = (bytes[5] & 4) >> 2;
    switch (leak) {
      default:
      case 0:
        text = "0-No Leak";
        break;
      case 1:
        text = "1-Possible Leak";
        break;
    }
    result["Water Leak"] = text;

    let battery = (bytes[5] & 0x18) >> 3;
    switch (battery) {
      case 0:
        text = "0-OK";
        break;
      case 1:
        text = "1-Low";
        break;
      case 2:
        text = "2-Empty";
        break;
      default:
        text = "3-Reserved";
        break;
    }
    result["Battery Status"] = text;

    let tamper = (bytes[5] & 0x80) >> 7;
    tamper |= (bytes[5] & 0x20) >> 3;
    switch (tamper) {
      default:
      case 0:
        text = "0-No Tamper";
        break;
      case 1:
        text = "1-Removed";
        break;
      case 2:
        text = "2-Cable Cut";
        break;
      case 3:
        text = "3-Removed & Cut";
        break;
    }
    result["Tamper"] = text;

    let error = bytes[7] & 0x1f;
    switch (error) {
      case 0:
        text = "No Error";
        break;
      case 2:
        text = "Battery Empty";
        break;
      case 3:
        text = "No Flow or Meter Pulses";
        break;
      case 5:
        text = "Date & Time Reset";
        break;
      case 11:
        text = "Eeprom Memory Failure";
        break;
      case 13:
        text = "Flash Memory CRC Failure ";
        break;
      case 15:
        text = "RTC Failure";
        break;
      case 16:
        text = "Crystal Failure";
        break;
      case 20:
        text = "No Smodem Response";
        break;
      case 21:
        text = "Invalid Smodem Response";
        break;
      default:
        text = "Reserved";
        break;
    }
    result["Error"] = error + "-" + text;

    let leakSize = (bytes[6] & 0xf) << 8;
    leakSize |= bytes[8];
    result["Leak Size"] = leakSize + "L/hour";

    view.setUint8(0, bytes[9]);
    view.setUint8(1, bytes[10]);
    view.setUint8(2, bytes[11]);

    let consumption = view.getInt32(0, true);
    consumption *= 100;
    result["Current Month Consumption"] = consumption;
  } catch (err) {
    console.log(err);
  }
  return result;
}

function dataMessage9(sigfox_incoming_data) {
  let result = {};

  try {
    let bytes = new Array(8);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt("0x" + sigfox_incoming_data.substring(i * 2, i * 2 + 2));
    }
    result["MesID"] = bytes[0] & 0x1f;

    let buffer = new ArrayBuffer(4);
    let view = new DataView(buffer);
    view.setUint8(0, bytes[1]);
    view.setUint8(1, bytes[2]);
    view.setUint8(2, bytes[3]);

    let total = view.getInt32(0, true);
    result["Burst Size"] = total;
    result["Burst Active"] = bytes[5] + " hours";
  } catch (err) {
    return console.log(err);
  }

  return result;
}

function data100(sigfox_incoming_data) {
  let result = {};

  try {
    let bytes = new Array(12);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt("0x" + sigfox_incoming_data.substring(i * 2, i * 2 + 2));
    }
    result["MesID"] = bytes[0] & 0x1f;

    let buffer = new ArrayBuffer(4);
    let view = new DataView(buffer);
    view.setUint8(0, bytes[1]);
    view.setUint8(1, bytes[2]);
    view.setUint8(2, bytes[3]);

    let total = view.getInt32(0, true);
    result["Totalizer"] = total;

    let text;
    let valve = bytes[5] & 3;
    switch (valve) {
      default:
      case 0:
        text = "0-Closed";
        break;
      case 1:
        text = "1-Open";
        break;
      case 2:
        text = "2-Reserved";
        break;
      case 3:
        text = "3-Reserved";
        break;
    }
    result["Valve Position"] = text;

    let leak = (bytes[5] & 4) >> 2;
    switch (leak) {
      default:
      case 0:
        text = "0-No Leak";
        break;
      case 1:
        text = "1-Possible Leak";
        break;
    }
    result["Water Leak"] = text;

    let battery = (bytes[5] & 0x18) >> 3;
    switch (battery) {
      case 0:
        text = "0-OK";
        break;
      case 1:
        text = "1-Low";
        break;
      case 2:
        text = "2-Empty";
        break;
      default:
        text = "3-Reserved";
        break;
    }
    result["Battery Status"] = text;

    let lock = (bytes[5] & 0x60) >> 5;
    switch (lock) {
      default:
      case 0:
        text = "0-Auto";
        break;
      case 1:
        text = "1-Closed";
        break;
      case 2:
        text = "2-Override";
        break;
      case 3:
        text = "3-Locked";
        break;
    }
    result["Lock Status"] = text;

    let tamper = (bytes[5] & 0x80) >> 7;
    switch (tamper) {
      default:
      case 0:
        text = "0-No Tamper";
        break;
      case 1:
        text = "1-Tamper Mode";
        break;
    }
    result["Tamper"] = text;

    let credit = bytes[6] & 7;
    switch (credit) {
      default:
      case 0:
        text = "0-Paid";
        break;
      case 1:
        text = "1-FBW";
        break;
      case 2:
        text = "2-Special Grant";
        break;
      case 3:
        text = "3-Lifeline";
        break;
      case 4:
        text = "4-Emergency";
        break;
      case 5:
        text = "5-Test Credit";
        break;
      case 6:
        text = "6-Reserved";
        break;
      case 7:
        text = "7-Reserved";
        break;
    }
    result["Credit Mode"] = text;

    let meter = (bytes[6] & 0x38) >> 3;
    switch (meter) {
      default:
      case 0:
        text = "0-Invalid";
        break;
      case 1:
        text = "1-Prepaid";
        break;
      case 2:
        text = "2-PostPaid";
        break;
      case 3:
        text = "3-Conventional";
        break;
      case 4:
        text = "4-FWD";
        break;
      case 5:
        text = "5-Reserved";
        break;
      case 6:
        text = "6-Reserved";
        break;
      case 7:
        text = "7-Reserved";
        break;
    }
    result["Meter Mode"] = text;

    let status = (bytes[6] & 0xc0) >> 6;
    switch (status) {
      default:
      case 0:
        text = "0-No Credit";
        break;
      case 1:
        text = "1-Credit Low";
        break;
      case 2:
        text = "2-Credit";
        break;
      case 3:
        text = "3-Negative Credit";
        break;
    }
    result["Credit Status"] = status;

    let error = bytes[7] & 0x1f;
    switch (error) {
      default:
      case 0:
        text = "0-No Error";
        break;
      case 1:
        text = "1-Tamper Mode";
        break;
      case 2:
        text = "2-Battery Empty";
        break;
      case 3:
        text = "3-No Flow or Meter Pulses";
        break;
      case 4:
        text = "4-Not Used";
        break;
      case 5:
        text = "5-Date & Time Reset";
        break;
      case 6:
        text = "6-Valve Stuck Open";
        break;
      case 7:
        text = "7-Not Used";
        break;
      case 8:
        text = "8-Valve Disconnected";
        break;
      case 11:
        text = "11-Eeprom Memory Failure";
        break;
      case 12:
        text = "12-Valve Timeout";
        break;
      case 13:
        text = "13-Flash Memory Failure";
        break;
      case 14:
        text = "14-Radio-SPI Failure";
        break;
      case 15:
        text = "15-RTC Failure";
        break;
      case 16:
        text = "16-Crystal Failure";
        break;
      case 17:
        text = "17-Radio-Chip Failure";
        break;
      case 18:
        text = "18-Radio-IRQ Shorted";
        break;
    }
    result["Error"] = text;

    let ciu = (bytes[7] & 0x60) >> 5;
    switch (ciu) {
      default:
      case 0:
        text = "0-Ok";
        break;
      case 1:
        text = "1-Low";
        break;
      case 2:
        text = "2-Empty";
        break;
      case 3:
        text = "3-Reserved";
        break;
    }
    result["CIU Battery Status"] = text;

    let leakSize = bytes[8];
    result["Leak Size"] = leakSize + "L/hour";

    view.setUint8(0, bytes[9]);
    view.setUint8(1, bytes[10]);
    view.setUint8(2, bytes[11]);

    let consumption = view.getInt32(0, true);
    consumption *= 100;
    result["Current Month Consumption"] = consumption;
  } catch (err) {
    return console.log(err);
  }

  return result;
}

function data300(sigfox_incoming_data) {
  let result = {};

  try {
    let bytes = new Array(12);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt("0x" + sigfox_incoming_data.substring(i * 2, i * 2 + 2));
    }
    result["MesID"] = bytes[0] & 0x1f;

    let buffer = new ArrayBuffer(4);
    let view = new DataView(buffer);
    view.setUint8(0, bytes[1]);
    view.setUint8(1, bytes[2]);
    view.setUint8(2, bytes[3]);

    let total = view.getInt32(0, true);
    result["Totalizer"] = total;

    let leak = (bytes[5] & 4) >> 2;
    switch (leak) {
      default:
      case 0:
        text = "0-No Leak";
        break;
      case 1:
        text = "1-Possible Leak";
        break;
    }
    result["Water Leak"] = text;

    let battery = (bytes[5] & 0x18) >> 3;
    switch (battery) {
      case 0:
        text = "0-OK";
        break;
      case 1:
        text = "1-Low";
        break;
      case 2:
        text = "2-Empty";
        break;
      default:
        text = "3-Reserved";
        break;
    }
    result["Battery Status"] = text;

    let tamper = (bytes[5] & 0x80) >> 7;
    switch (tamper) {
      default:
      case 0:
        text = "0-No Tamper";
        break;
      case 1:
        text = "1-Tamper Mode";
        break;
    }
    result["Tamper"] = text;

    let error = bytes[7] & 0x1f;
    switch (error) {
      default:
      case 0:
        text = "0-No Error";
        break;
      case 1:
        text = "1-Tamper Mode";
        break;
      case 2:
        text = "2-Battery Empty";
        break;
      case 3:
        text = "3-No Flow or Meter Pulses";
        break;
      case 4:
        text = "4-Not Used";
        break;
      case 5:
        text = "5-Date & Time Reset";
        break;
      case 6:
        text = "6-Valve Stuck Open";
        break;
      case 7:
        text = "7-Not Used";
        break;
      case 8:
        text = "8-Valve Disconnected";
        break;
      case 11:
        text = "11-Eeprom Memory Failure";
        break;
      case 12:
        text = "12-Valve Timeout";
        break;
      case 13:
        text = "13-Flash Memory Failure";
        break;
      case 14:
        text = "14-Radio-SPI Failure";
        break;
      case 15:
        text = "15-RTC Failure";
        break;
      case 16:
        text = "16-Crystal Failure";
        break;
      case 17:
        text = "17-Radio-Chip Failure";
        break;
      case 18:
        text = "18-Radio-IRQ Shorted";
        break;
    }
    result["Error"] = text;

    let ciu = (bytes[7] & 0x60) >> 5;
    switch (ciu) {
      default:
      case 0:
        text = "0-Ok";
        break;
      case 1:
        text = "1-Low";
        break;
      case 2:
        text = "2-Empty";
        break;
      case 3:
        text = "3-Reserved";
        break;
    }
    result["CIU Battery Status"] = text;

    let leakSize = bytes[8];
    result["Leak Size"] = leakSize + "L/hour";

    view.setUint8(0, bytes[9]);
    view.setUint8(1, bytes[10]);
    view.setUint8(2, bytes[11]);

    let consumption = view.getInt32(0, true);
    consumption *= 100;
    result["Current Month Consumption"] = consumption;
  } catch (err) {
    return console.log(err);
  }

  return result;
}

function consumption(sigfox_incoming_data) {
  let result = {};

  try {
    let bytes = new Array(12);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt("0x" + sigfox_incoming_data.substring(i * 2, i * 2 + 2));
    }
    result["MesID"] = bytes[0] & 0x1f;

    let text;
    let type = bytes[1] & 0xf;
    switch (type) {
      case 0:
        text = "0-Total";
        break;
      case 1:
        text = "1-Paid";
        break;
      case 2:
        text = "2-FBW";
        break;
      case 3:
        text = "3-Special";
        break;
      case 4:
        text = "4-Lifeline";
        break;
      case 5:
        text = "5-Emergency";
        break;
      case 6:
        text = "6-Test Consumption";
        break;
      default:
        text = "Reserved";
        break;
    }
    result["Consumption Type"] = text;

    let buffer = new ArrayBuffer(4);
    let view = new DataView(buffer);
    view.setUint8(0, bytes[2]);
    view.setUint8(1, bytes[3]);
    view.setUint8(2, bytes[4]);

    let total = view.getInt32(0, true);
    result["Previous Month Consumption"] = total;

    let year = bytes[9] & 0x1f;
    let month = (bytes[9] & 0xe0) >> 5;
    month = month | ((bytes[10] & 1) << 4);
    let day = 2000 + ((bytes[10] & 0xfe) >> 1);
    let hour = bytes[7] & 0x1f;
    let minute = bytes[8] & 0x3f;
    text =
      year.toString().padStart(2, "0") +
      "/" +
      month.toString().padStart(2, "0") +
      "/" +
      day.toString().padStart(2, "0") +
      "  " +
      hour.toString().padStart(2, "0") +
      ":" +
      minute.toString().padStart(2, "0");
    result["Last Tamper"] = text;
  } catch (err) {
    return console.log(err);
  }

  return result;
}

module.exports = getIncomingData;
