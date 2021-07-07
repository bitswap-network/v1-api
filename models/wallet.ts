import {model, Schema, Document} from "mongoose";

export interface walletDoc extends Document {
    keyInfo: {
        bitclout: {
            publicKeyBase58Check: string;
            publicKeyHex: string;
            privateKeyBase58Check: string;
            privateKeyHex: string;
            extraText: string;
            index: number;
        };
    };
    user: Schema.Types.ObjectId;
    balance: {
        bitclout: number;
    }
}

const walletSchema = new Schema<walletDoc>({
    keyInfo: {
        bitclout: {
            publicKeyBase58Check: {type: String, required: true, unique: true},
            publicKeyHex: {type: String, required: true, unique: true},
            privateKeyBase58Check: {type: String, required: true, unique: true},
            privateKeyHex: {type: String, required: true, unique: true},
            extraText: {type: String, required: true, unique: true},
            index: {type: Number, required: true}
        }
    },
    user: {type: Schema.Types.ObjectId, ref: "User", required: true},
    balance: {
        bitclout: {type: Number, default: 0, required: true},
    },
});

const Wallet = model<walletDoc>("Wallet", walletSchema);

export default Wallet;