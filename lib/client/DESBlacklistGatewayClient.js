import {PrivateKey, Signature} from "gxbjs";
import superagent from "superagent";
import camelCase from "lodash/camelCase";

class DESBlacklistGatewayClient {
    privateKey = null;  // Private Key
    account_id = "";    // Account ID
    baseURL = "";       // DES Base URL

    constructor(privateKey, account_id, baseURL = "https://survey.gxb.io") {
        this.privateKey = PrivateKey.fromWif(privateKey);
        this.account_id = account_id;
        this.baseURL = baseURL;
    }

    /**
     * get question token
     * @param requestId
     * @param redirectUrl
     * @param loanInfoList
     * @returns {Promise<any>}
     */
    getQuestionToken(requestId, redirectUrl, loanInfoList = []) {
        return new Promise((resolve, reject) => {
            let loanInfoStr = "";
            let timestamp = new Date().getTime() + 60000;
            loanInfoList.forEach((loanInfo) => {
                loanInfoStr += `${loanInfo.platform}|${loanInfo.app_id}|${loanInfo.loan_type}|${loanInfo.loan_status}|${loanInfo.loan_amount}|${loanInfo.contract_date}|${loanInfo.repay_status}|${loanInfo.arrears.toFixed(2)}|`;
            });
            let tokenString = `${requestId}|${timestamp}|${redirectUrl}|${loanInfoStr}`;
            let signature = Signature.sign(tokenString, this.privateKey);

            let body = {
                requestId: requestId,
                redirectUrl: redirectUrl,
                timestamp: timestamp,
                signature: signature.toHex(),
                loanInfos: loanInfoList.map(info => {
                    let result = {};
                    for (let key in info) {
                        result[camelCase(key)] = info[key];
                    }
                    return result;
                })
            };

            console.log(JSON.stringify(body));
            superagent.post(`${this.baseURL}/blacklist/token`).send(body)
                .end((err, resp) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(resp.body);
                    }
                });
        });
    }

    /**
     * get question report
     * @param token
     * @returns {Promise<any>}
     */
    getQuestionReport(token) {
        return new Promise((resolve, reject) => {
            let timestamp = new Date().getTime() + 60000;
            let tokenString = `${token}|${timestamp}`;
            let signature = Signature.sign(tokenString, this.privateKey);
            let body = {
                token: token,
                timestamp: timestamp,
                signature: signature.toHex()
            };
            console.log(body);
            superagent.post(`${this.baseURL}/blacklist/question/report`).send(body).end((err, resp) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp.body);
                }
            });
        });
    }
}

export default DESBlacklistGatewayClient;
