import superagent from 'superagent';
import validator from '../common/validator';
import {ops, PrivateKey, Signature, TransactionHelper} from 'gxbjs';
import {decrypt_msg, encrypt_params} from "../common/util";
import {MD5} from 'crypto-js';

const DEFAULT_TIMEOUT = 30 * 60 * 1000;

class DESMerchantClient {

    privateKey = null;  // Private Key
    account_id = '';    // Account ID
    baseURL = '';       // DES Base URL
    static publicKeyMap = {};

    constructor(privateKey, account_id, baseURL = 'https://des.gxchain.cn') {
        this.privateKey = PrivateKey.fromWif(privateKey);
        this.account_id = account_id;
        this.baseURL = baseURL;
    }

    /**
     * fetch product info by product id
     * @param productId
     * @returns {Promise<any>}
     */
    getProduct(productId) {
        return new Promise((resolve, reject) => {
            superagent.get(`${this.baseURL}/api/product/${productId}`).end((err, resp) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp.body);
                }
            });
        });
    }

    /**
     * create data exchange request
     * @param productId
     * @param params
     * @returns {Promise<any>}
     */
    createDataExchangeRequest(productId, params) {
        return new Promise((resolve, reject) => {
            this.getProduct(productId).then(prod => {
                try {
                    let reqBody = [];
                    let filteredParams = validator.validate(params, prod.product.input);
                    let bodyParam = {
                        params: filteredParams,
                        timestamp: new Date().getTime()
                    };
                    let expiration = Math.floor((new Date().getTime() + DEFAULT_TIMEOUT) / 1000) * 1000;
                    prod.onlineDatasources.forEach(datasource => {
                        DESMerchantClient.publicKeyMap[datasource.accountId] = datasource.publicKey;
                        let operation = {
                            from: this.account_id,
                            to: datasource.accountId,
                            proxy_account: prod.des.accountId,
                            percentage: prod.des.percent,
                            amount: {
                                amount: prod.product.price.amount,
                                asset_id: prod.product.price.assetId
                            },
                            expiration: new Date(expiration),
                            // memo:'5c37400e6e71b9faec6974e7fc219e72',
                            memo: MD5(JSON.stringify(bodyParam)).toString(),
                            signatures: []
                        };
                        let signature = Signature.signBuffer(ops.signed_proxy_transfer_params.toBuffer(operation), this.privateKey);
                        let nonce = TransactionHelper.unique_nonce_uint64();
                        reqBody.push({
                            params: encrypt_params(bodyParam, this.privateKey, datasource.publicKey, nonce),
                            nonce: nonce,
                            requestParams: {
                                from: operation.from,
                                to: operation.to,
                                proxyAccount: operation.proxy_account,
                                percent: operation.percentage,
                                amount: {
                                    amount: operation.amount.amount,
                                    assetId: operation.amount.asset_id
                                },
                                expiration: Math.floor(expiration / 1000),
                                memo: operation.memo,
                                signatures: [
                                    signature.toHex()
                                ]
                            }
                        });
                    });
                    superagent.post(`${this.baseURL}/api/request/create/${productId}`).send(reqBody).end((err, resp) => {
                        if (err) {
                            reject(resp.body);
                        } else {
                            resolve(resp.body);
                        }
                    });
                } catch (ex) {
                    reject(ex);
                }
            });
        });
    }

    /**
     * fetch result by request id
     * @param requestId
     * @param timeout
     * @returns {Promise<any>}
     */
    getResult(requestId, timeout = 8000) {
        let start = new Date();
        let latestResult = null;
        return new Promise((resolve, reject) => {
            function innerFetch() {
                superagent.get(`${this.baseURL}/api/request/${requestId}`).end((err, resp) => {
                    if (!err) {
                        latestResult = resp.body;
                        if (latestResult && latestResult.status !== 'IN_PROGRESS') {
                            resolve(this.decryptResult(latestResult));
                        } else {
                            if (new Date() - start < timeout) {
                                setTimeout(() => {
                                    innerFetch.call(this);
                                }, 60);
                            } else {
                                resolve(this.decryptResult(latestResult));
                            }
                        }
                    } else {
                        if (new Date() - start < timeout) {
                            setTimeout(() => {
                                innerFetch.call(this);
                            }, 60);
                        } else {
                            resolve(this.decryptResult(latestResult));
                        }
                    }
                });
            }

            innerFetch.call(this);
        });
    }

    /**
     * decrypt result before it returned
     * @param result
     * @returns {*}
     */
    decryptResult(result) {
        if (result && result.datasources) {
            result.datasources = result.datasources.map(item => {
                let newItem = item;
                if (newItem.status === 'SUCCESS') {
                    newItem.data = JSON.parse(decrypt_msg(newItem.data, this.privateKey, newItem.datasourcePublicKey, newItem.nonce));
                }
                return newItem;
            });
        }
        return result;
    }
}

export default DESMerchantClient;
