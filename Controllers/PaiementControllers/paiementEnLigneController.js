const axios = require("axios");
require("dotenv").config(); 

exports.addPaiEnLigne = async (req, res) => {
    const url = "https://api.konnect.network/api/v2/payments/init-payment";
    const apiKey = process.env.KONNECT_API_TOKEN; 
    const { price } = req.body;
    
    const payload = {
        receiverWalletId: process.env.PORTEFEUILLE_ID,
        token: "TND",
        amount: price,
        type: "immediate",
        description: "payment description",
        acceptedPaymentMethods: [
            "wallet",
            "bank_card",
            "e-DINAR"
        ],
        lifespan: 10,
        checkoutForm: true,
        addPaymentFeesToAmount: false,
        orderId: "1234657",
        webhook: "https://merchant.tech/api/notification_payment",
        silentWebhook: true,
        successUrl: "https://dev.konnect.network/gateway/payment-success",
        failUrl: "https://dev.konnect.network/gateway/payment-failure",
        theme: "light"
    };

    try {
        const result = await axios.post(url, payload, {
            headers: {
                "x-api-key": apiKey, 
                "Content-Type": "application/json"        }
        });
        res.send(result.data);
    } catch (error) {
        console.error("Error making API request:", error.response ? error.response.data : error.message);
        res.status(500).send("Internal Server Error");
    }
};
