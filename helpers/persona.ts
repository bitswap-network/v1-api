import axios from "axios";
import * as config from "../config";
export const createPersonaAccount = (publicKey: string) => {
  return axios.post(
    "https://withpersona.com/api/v1/accounts",
    {
      data: {
        type: "account",
        attributes: {
          "reference-id": publicKey,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${config.PERSONA_APIKEY}`,
      },
    }
  );
};
export const getPersonaAccount = (publicKey: string) => {
  return axios.get(`https://withpersona.com/api/v1/accounts?filter\[reference-id\]=${publicKey}`, {
    headers: {
      Authorization: `Bearer ${config.PERSONA_APIKEY}`,
    },
  });
};

export const getInquiry = (inquiryId: string) => {
  return axios.get(`https://withpersona.com/api/v1/inquiries/${inquiryId}`, {
    headers: {
      Authorization: `Bearer ${config.PERSONA_APIKEY}`,
    },
  });
};
