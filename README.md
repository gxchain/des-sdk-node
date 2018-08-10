# Install

```bash
npm install des-sdk --save
```

# Usage

```js
import {DESMerchantClient} from 'des-sdk'

let client = new DESMerchantClient('5Ka9YjFQtfUUX2Ddnqka...', '1.2.19');
console.time('data-exchange');
client.createDataExchangeRequest(4, {
    name: 'name',
    idcard: 'idcard'
}).then(result => {
    console.log('request created:', result);
    client.getResult(result.request_id).then(result => {
        console.log(JSON.stringify(result,null,2));
        console.timeEnd('data-exchange');
    }).catch(ex => {
        console.error('error when get result:', ex);
    });
}).catch(ex => {
    console.error('error when create data exchange request:', ex);
});

```

## Blacklist api

```
import {DESBlackListGatewayClient} from "des-sdk";

let client = new DESBlackListGatewayClient("5KHoUrUT...", "1.2.2316");

let loanInfoList = [
    {
        platform: "1.2.902895",
        app_id: "jx",
        loan_type: 1,
        loan_amount: "1-1.5",
        loan_status: "3",
        repay_status: "M(2)",
        arrears: 1000.00,
        contract_date: "2017-05-01"
    }
];

console.log("=========GET TOKEN=========");
client.getQuestionToken("QmP3vkTwxRH6d1Masg1GU3fCRqvkc1d8FxYnZF41SmriKd", "http://127.0.0.1/question?token=", loanInfoList).then(resp => {
    console.log(resp);
    console.log("=========GET REPORT=========");
    client.getQuestionReport("GXBBLec8ed80782624cbe818b0aeddcf81c30").then(resp => {
        console.log(resp);
    }).catch(ex => {
        console.error(ex);
    });
}).catch(ex => {
    console.error(ex);
});
```

# Dev Documents

https://doc.gxb.io/des/
