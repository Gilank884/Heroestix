import crypto from 'crypto';

async function testBayarind() {
  const method = "SHOPEEPAY";
  const partner_id = "HEROESPAY01BYRF7756F";
  const channel_id = "1085"; 
  const secret_key = "c438ca42baba01ffa2b9b5748ed897a4";

  const order_id = "be7dc9b5-9a16-42a2-89e6-a34dd0aa7081";
  const amount = 150000;
  
  const external_id = `HRX${crypto.randomUUID().substring(0, 15).toUpperCase().replace(/-/g, "")}`.substring(0, 18);
  
  const customerAccount = "test@example.com";

  const now = new Date();
  const wibOffset = 7 * 60 * 60 * 1000;

  const transactionDate = new Date(now.getTime() + wibOffset).toISOString().replace("T", " ").substring(0, 19);
  const transactionExpire = new Date(now.getTime() + 24 * 60 * 60 * 1000 + wibOffset).toISOString().replace("T", " ").substring(0, 19);

  const authCodePayload = `${external_id}${amount}${partner_id}${secret_key}`;
  const authCode = crypto.createHash("sha256").update(authCodePayload).digest("hex");

  const bayarindPayload = {
    merchantId: partner_id,
    merchantKey: "",
    authCode: authCode,
    channelId: partner_id,
    serviceCode: channel_id,
    transactionNo: external_id,
    transactionAmount: amount.toString(),
    transactionFee: "0",
    transactionDate: transactionDate,
    transactionExpire: transactionExpire,
    currency: "IDR",
    customerName: "Test User",
    customerEmail: "test@example.com",
    customerAccount: customerAccount,
    description: `Payment for Order ${order_id}`.substring(0, 50),
    callbackURL: "https://qftuhnkzyegcxfozdfyz.functions.supabase.co/payment-flag",
    redirectURL: `https://heroestix.com/payment/status/be7dc9b5-9a16-42a2-89e6-a34dd0aa7081`
  };

  const bayarindResponse = await fetch("https://paytest.bayarind.id/PaymentRegister", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bayarindPayload)
  });

  console.log("Status:", bayarindResponse.status);
  console.log("Response:", await bayarindResponse.text());
}

testBayarind();
