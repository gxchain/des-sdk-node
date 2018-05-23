import DESMerchantClient from "../lib/client/DESMerchantClient";

let client = new DESMerchantClient("5Ka9YjFQtfUUX2Ddnqka...", "1.2.19");
console.time("data-exchange");
client.createDataExchangeRequest(4, {
    name: "name",
    idcard: "idcard"
}).then(result => {
    console.log("request created:", result);
    client.getResult(result.request_id).then(result => {
        console.log(JSON.stringify(result, null, 2));
        console.timeEnd("data-exchange");
    }).catch(ex => {
        console.error("error when get result:", ex);
    });
}).catch(ex => {
    console.error("error when create data exchange request:", ex);
});
