import {PrivateKey, Signature, TransactionHelper} from "gxbjs";
import superagent from 'superagent';
import {decrypt_msg, encrypt_params} from '../common/util';

class DESDatasourceClient {
    privateKey = null;  // Private Key
    account_id = '';    // Account ID
    baseURL = '';       // DES Base URL

    constructor(privateKey, account_id, baseURL = 'https://des.gxchain.cn') {
        this.privateKey = PrivateKey.fromWif(privateKey);
        this.account_id = account_id;
        this.baseURL = baseURL;
    }

    /**
     * heart beat to des server
     * @param products
     * @returns {Promise<any>}
     */
    heartbeat(products) {
        return new Promise((resolve, reject) => {
            let timestamp = new Date().getTime() + 3000;
            let params = {
                account: this.account_id,
                products: products,
                timestamp: timestamp,
                signature: Signature.sign(`${this.account_id}|${JSON.stringify(products)}|${timestamp}`)
            };
            superagent.post(`${this.baseURL}/api/datasource/heartbeat`).send(params).end((err, resp) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(resp.body);
                }
            });
        });
    }

    /**
     * encrypt data with shared secret
     * @param params
     * @param publicKey
     * @returns {{data: string, nonce: *}}
     */
    encrypt(params, publicKey) {
        let nonce = TransactionHelper.unique_nonce_uint64();
        return {
            data: encrypt_params(params, this.privateKey, publicKey, nonce),
            nonce: nonce
        };
    }

    /**
     * decrypt message with shared secret
     * @param message
     * @param nonce
     * @param publicKey
     */
    decrypt(message, nonce, publicKey) {
        return decrypt_msg(message, this.privateKey, publicKey, nonce);
    }
}

export default DESDatasourceClient;
