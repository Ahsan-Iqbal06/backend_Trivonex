import axios, { type AxiosInstance } from "axios";
import { env } from "./env.js";

export interface InitiateMAParams {
  orderId: string;
  amount: string | number;
  mobileAccountNo: string;
  emailAddress: string;
}

export interface InquireStatusParams {
  orderId: string;
}

interface EasypaisaBaseResponse {
  responseCode: string;
  responseDesc: string;
  [key: string]: unknown;
}

export interface InitiateMAResponse extends EasypaisaBaseResponse {
  orderId: string;
  storeId: number;
  transactionId?: string;
  transactionDateTime?: string;
}

export interface InquireStatusResponse extends EasypaisaBaseResponse {
  orderId: string;
  transactionStatus?: "PAID" | "FAILED" | "PENDING" | "BLOCKED" | "EXPIRED" | "REVERSED" | string;
  transactionAmount?: number;
}

// Response codes documented in Easypaisa's "REST APIs without RSA Encryption" guide
const RESPONSE_CODES: Record<string, string> = {
  "0000": "SUCCESS",
  "0001": "SYSTEM ERROR",
  "0002": "REQUIRED FIELD MISSING",
  "0003": "INVALID ORDER ID",
  "0004": "INVALID MERCHANT ACCOUNT NUMBER",
  "0005": "MERCHANT ACCOUNT NOT ACTIVE",
  "0006": "INVALID STORE ID",
  "0007": "STORE NOT ACTIVE",
  "0008": "PAYMENT METHOD NOT ENABLED",
  "0010": "INVALID CREDENTIALS",
  "0013": "LOW BALANCE",
  "0014": "ACCOUNT DOES NOT EXIST",
};

function buildCredentialsHeader(): string {
  const raw = `${env.EASYPAISA_USERNAME}:${env.EASYPAISA_PASSWORD}`;
  return Buffer.from(raw, "utf-8").toString("base64");
}

function maskUsername(username: string): string {
  if (username.length <= 2) return "*".repeat(username.length);
  return `${username.slice(0, 2)}${"*".repeat(username.length - 2)}`;
}

class EasypaisaService {
  private client: AxiosInstance;

  constructor() {
    console.log("====================================");
    console.log("EASYPAISA_BASE_URL =", env.EASYPAISA_BASE_URL);
    console.log("TYPE =", typeof env.EASYPAISA_BASE_URL);
    console.log("====================================");

    this.client = axios.create({
      baseURL: env.EASYPAISA_BASE_URL,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
        Credentials: buildCredentialsHeader(),
      },
    });
  }

  describeResponseCode(code: string): string {
    return RESPONSE_CODES[code] ?? "UNKNOWN";
  }

  async initiateMATransaction(params: InitiateMAParams): Promise<InitiateMAResponse> {
    if (env.EASYPAISA_MOCK_MODE) {
      console.log("=== Easypaisa MOCK MODE: Initiating transaction ===", params);
      const mockTxId = `MOCK-TX-${Date.now()}`;
      return {
        responseCode: "0000",
        responseDesc: "SUCCESS",
        orderId: params.orderId,
        storeId: env.EASYPAISA_STORE_ID,
        transactionId: mockTxId,
        transactionDateTime: new Date().toISOString(),
      };
    }

    const payload = {
      orderId: params.orderId,
      storeId: env.EASYPAISA_STORE_ID,
      transactionAmount: String(params.amount),
      transactionType: "MA",
      mobileAccountNo: params.mobileAccountNo,
      emailAddress: params.emailAddress,
    };

    if (env.NODE_ENV !== "production") {
      console.log("=== Easypaisa initiate-ma-transaction request ===");
      console.log("Base URL:", env.EASYPAISA_BASE_URL);
      console.log("Username:", maskUsername(env.EASYPAISA_USERNAME));
      console.log("Store ID:", env.EASYPAISA_STORE_ID, `(type: ${typeof env.EASYPAISA_STORE_ID})`);
      console.log("Payload:", payload);
    }

    try {
      const { data } = await this.client.post<InitiateMAResponse>("/initiate-ma-transaction", payload);

      if (env.NODE_ENV !== "production") {
        console.log("=== Easypaisa response ===", data);
      }

      if (data.responseCode !== "0000") {
        console.warn(
          `Easypaisa rejected the request: [${data.responseCode}] ${this.describeResponseCode(data.responseCode)}`,
        );
      }

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("========== Easypaisa Error ==========");
        console.log("BaseURL:", error.config?.baseURL);
        console.log("URL:", error.config?.url);
        // console.log("Full URI:", error.config?.baseURL + error.config?.url);
        console.error("Status:", error.response?.status);
        console.error("Headers:", error.response?.headers);
        console.error("Body:", error.response?.data);
        console.error("Message:", error.message);
      } else {
        console.error(error);
      }

      throw error;
    }
  }

  async inquireTransactionStatus(params: InquireStatusParams): Promise<InquireStatusResponse> {
    if (env.EASYPAISA_MOCK_MODE) {
      console.log("=== Easypaisa MOCK MODE: Inquiring status ===", params);
      return {
        responseCode: "0000",
        responseDesc: "SUCCESS",
        orderId: params.orderId,
        transactionStatus: "PAID",
      };
    }

    const payload = {
      orderId: params.orderId,
      storeId: env.EASYPAISA_STORE_ID,
      accountNum: env.EASYPAISA_MERCHANT_EWP_ACCOUNT,
    };

    const { data } = await this.client.post<InquireStatusResponse>("/inquire-transaction", payload);
    return data;
  }
}

export const easypaisaService = new EasypaisaService();
