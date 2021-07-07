import User, {UserDoc} from "../models/user";
import Wallet from "../models/wallet";
import {getKeyPair} from "./bitclout";
import * as config from "../config"
import {encryptGCM} from "./crypto";
/*
Only use initially when having to generate user bitclout wallets

*/
export const generateUserBitcloutWallets = async () => {
    const users = await User.find({}).exec()
    users.forEach(async (user: UserDoc) => {
        try {
            const encryptedUserPublicKey = encryptGCM(user._id.toString(), config.WALLET_HASHKEY)
            const keyPair = (await getKeyPair({Mnemonic: config.MNEMONIC, ExtraText: encryptedUserPublicKey, Index: 0})).data
            const userWallet = new Wallet({
                keyInfo: {
                    bitclout: {
                        publicKeyBase58Check: keyPair.PrivateKeyBase58Check,
                        publicKeyHex: keyPair.PublicKeyHex,
                        privateKeyBase58Check: encryptGCM(keyPair.PrivateKeyBase58Check, config.WALLET_HASHKEY),
                        privateKeyHex: encryptGCM(keyPair.PrivateKeyHex, config.WALLET_HASHKEY),
                        extraText: encryptedUserPublicKey,
                        index: 0,
                    },
                },
                user: user._id,
                balance: {
                    bitclout: 0,
                }
            })
            await userWallet.save()
            // console.log(user.bitclout.username, keyPair.PublicKeyBase58Check)
        } catch (e) {
            console.error(e)
        }
    })
}