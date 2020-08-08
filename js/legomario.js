;
export default class LEGOMarioMessage {
    constructor(messageType, buffer, payload) {
        this._messageType = messageType;
        this._buffer = buffer;
        this._payload = payload;
    }
    /**
     * getter
     */
    get messageType() {
        return this._messageType.toString();
    }
    get data() {
        return this._payload;
    }
    /**
     * Decode message from ArrayBuffer
     * @param buffer
     */
    static decode(buffer) {
        const uint8Array = new Uint8Array(buffer);
        const messageType = LEGOMarioMessage.MessageType[uint8Array[2]];
        let payload = {};
        switch (messageType) {
            case "Hub Properties":
                return new LEGOMarioMessage("Hub Properties", buffer, LEGOMarioMessage.decodeHubPropertyMessage(uint8Array));
        }
        return new LEGOMarioMessage(messageType, buffer, payload);
    }
    static decodeHubPropertyMessage(data) {
        if (LEGOMarioMessage.MessageType[data[2]] != "Hub Properties") {
            throw new Error("The message is not Hub Properties");
        }
        const length = data[0];
        const hubPropertyReference = LEGOMarioMessage.HubPropertyReference[data[3]];
        const hubPropertyOperation = LEGOMarioMessage.HubPropertyOperation[data[4]];
        switch (hubPropertyOperation) {
            case "Update (Upstream)":
                return {
                    reference: hubPropertyReference,
                    ...(() => {
                        switch (hubPropertyReference) {
                            case "Advertising Name":
                            case "Manufacturer Name":
                            case "Radio Firmware Version":
                                return {
                                    value: String.fromCharCode(...data.slice(5, length))
                                };
                            case "Button":
                                return {
                                    value: (data[5] === 0x01),
                                };
                            case "FW Version":
                            case "HW Version":
                                return {
                                    ...VersionNumberDecoder.decode(data.slice(5, length).reverse())
                                };
                            case "RSSI":
                                return {
                                    value: uint2sint(data[5])
                                };
                            case "Battery Voltage":
                                return {
                                    value: data[5]
                                };
                            case "Battery Type":
                                return {
                                    value: (data[5] === 0x00) ? "Normal Battery" : "Rechargeable"
                                };
                            case "LEGO Wireless Protocol Version":
                                return {
                                    value: `${((data[6] & 0xf0) >>> 4) * 10 + (data[6] & 0x0f)}.${((data[5] & 0xf0) >>> 4) * 10 + (data[5] & 0x0f)}`
                                };
                            case "System Type ID":
                                return {
                                    value: (() => {
                                        switch (data[5]) {
                                            case 0x00:
                                                return "LEGO Wedo 2.0";
                                            case 0x01:
                                                return "LEGO Duplo";
                                            case 0x02:
                                            case 0x03:
                                                return "LEGO System";
                                            default:
                                                return "Unknown";
                                        }
                                    })(),
                                };
                            default:
                                throw new Error(`Sorry, This HubProperties Reference is still not supported;(`);
                        }
                    })()
                };
                break;
            default:
                throw new Error("Sorry, This Hub Properties Operation is still not supported.");
        }
    }
}
LEGOMarioMessage.MessageType = {
    0x01: "Hub Properties",
    0x02: "Hub Actions",
    0x03: "Hub Alert",
    0x04: "Hub Attached I/O",
    0x05: "Generic Error Messages",
    0x08: "H/W Network Commands",
    0x10: "F/W Update - Go Into BootMode",
    0x11: "F/W Update Lock Memory",
    0x12: "F/W Update Lock Status Request",
    0x13: "F/W Lock Status",
    0x21: "Port Information Request",
    0x22: "Port Mode Information Request",
    0x41: "Port Input Format Setup (Single)",
    0x42: "Port Input Format Setup (CombinedMode)",
    0x43: "Port Information",
    0x44: "Port Mode Information",
    0x45: "Port Value (Single)",
    0x46: "Port Value (CombinedMode)",
    0x47: "Port Input Format (Single)",
    0x48: "Port Input Format (CombinedMode)",
    0x61: "Virtual Port Setup",
    0x81: "Port Output Command",
    0x82: "Port Output Command Feedback",
};
LEGOMarioMessage.HubPropertyReference = {
    0x01: "Advertising Name",
    0x02: "Button",
    0x03: "FW Version",
    0x04: "HW Version",
    0x05: "RSSI",
    0x06: "Battery Voltage",
    0x07: "Battery Type",
    0x08: "Manufacturer Name",
    0x09: "Radio Firmware Version",
    0x0A: "LEGO Wireless Protocol Version",
    0x0B: "System Type ID",
    0x0C: "H/W Network ID",
    0x0D: "Primary MAC Address",
    0x0E: "Secondary MAC Address",
    0x0F: "Hardware Network Family",
};
LEGOMarioMessage.HubPropertyOperation = {
    0x01: "Set (Downstream)",
    0x02: "Enable Updates (Downstream)",
    0x03: "Disable Updates (Downstream)",
    0x04: "Reset (Downstream)",
    0x05: "Request Update (Downstream)",
    0x06: "Update (Upstream)"
};
export class VersionNumberDecoder {
    static decode(data) {
        const majorVersion = (data[0] & this.MAJOR_VERSION_BITMASK) >>> 4;
        const minorVersion = (data[0] & this.MINOR_VERSION_BITMASK);
        const bugfixNumber = ((data[1] & 0xf0) >>> 4) * 10 + (data[1] & 0x0f);
        const buildNumber = ((data[2] & 0xf0) >>> 4) * 1000 + (data[2] & 0x0f) * 100 + ((data[3] & 0xf0) >>> 4) * 10 + (data[3] & 0x0f);
        return {
            version: `${majorVersion}.${minorVersion}.${bugfixNumber}.${buildNumber}`,
            major: majorVersion,
            minor: minorVersion,
            bugfixNumber: bugfixNumber,
            buildNumber: buildNumber
        };
    }
}
VersionNumberDecoder.MAJOR_VERSION_BITMASK = 0b01110000;
VersionNumberDecoder.MINOR_VERSION_BITMASK = 0b00001111;
function uint2sint(data) {
    if ((data & 0x80) > 0) {
        return -1 * (((data ^ 0xff) + 1) & 0xff);
    }
    else {
        return data;
    }
}
//# sourceMappingURL=legomario.js.map