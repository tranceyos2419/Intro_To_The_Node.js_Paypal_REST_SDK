const express = require("express");
const PORT = process.env.NODE || 4321;
const paypal = require("paypal-rest-sdk");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

paypal.configure({
  mode: "sandbox", //sandbox or live
  client_id:
    "ARQeLhuU0SZ0qnOkl0RjIfNSxLwqJZDrsW5-3C7PrHHULSpo3tPqy-302M9kJAf6ayW6i-7OknMxoDhm",
  client_secret:
    "ED03eGuUhS7J4jiyFLxwoglFj1S0XThkjHtxs695jCJoU8ZUUXL2CCxnVzJjZeFFq3M47n8UuiY_QuNj"
});

app.get("/", (req, res) => {
  res.render("index");
});

// transfer a user to paypal with the information of the payment
app.post("/pay", async (req, res) => {
  // create payment json
  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal"
    },
    redirect_urls: {
      //! doing actual payment in the return_url route
      return_url: `http://localhost:${PORT}/success`,
      cancel_url: `http://localhost:${PORT}/cancel`
    },
    // this data comes from front-end
    transactions: [
      {
        item_list: {
          items: [
            {
              name: "Red Shoes",
              sku: "001", // the id of this product
              price: "20.00",
              currency: "USD",
              quantity: 1
            }
          ]
        },
        amount: {
          currency: "USD",
          total: "20.00"
        },
        description: "Hat for the best team ever"
      }
    ]
  };

  // sending the payment information to paypal and get the approved data from paypal API
  paypal.payment.create(create_payment_json, function(error, payment) {
    if (error) {
      throw error;
    } else {
      for (let i = 0; i < payment.links.length; i++) {
        // this is the url we want to transfer our user
        if (payment.links[i].rel === "approval_url") {
          // handling transformation of a user
          res.redirect(payment.links[i].href);
        }
      }
      console.dir(payment, { depth: null });
    }
  });
});

// paypal redirect this route with query parameters
app.get("/success", (req, res) => {
  const { PayerID } = req.query;
  const { paymentId } = req.query;

  // creating pay out json
  const execute_payment_json = {
    payer_id: PayerID,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: "20.00"
        }
      }
    ]
  };

  console.log("query");
  console.dir(req.query, { depth: null });

  // sending checkout info to paypal and getting the executed json from the API
  paypal.payment.execute(paymentId, execute_payment_json, function(
    error,
    payment
  ) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      // store payment info to my database as the receipt
      console.log("payment");
      console.dir(payment, { depth: null });
      res.send("Success");
    }
  });
});

app.get("cancel", (req, res) => {
  res.send("cancelled");
});
app.listen(PORT, console.log("port ", PORT));
