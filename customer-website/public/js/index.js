// Client Side Script

const getDataFromAPI = async () => {
  //get orderid from input field
  const orderIdFromUI = document.getElementById("orderId").value;

  //Reset error innerHTML
  document.getElementById("errMsgCheckStatus").innerHTML = "";
  document.getElementById("statusContainer").innerHTML = "";

  try {  
    if (orderIdFromUI.length > 0) {
      //Background task
      const response = await fetch(
        `http://localhost:8080/order-item-status/${orderIdFromUI}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(`response: ${JSON.stringify(response)}`);

      // if responser is not OK, show the error with HTTP status code and exit
      if (response.ok === false) {
        console.log(
          `Server response is NOT OK. Response Status: ${response.status}`
        );

        // throw - will force the code to generate the error and jump into the catch block
        throw Error(
          `Cannot connect to API. HTTP Status code: ${response.status}`
        );
      }

      //if response is OK, convert the API data to Javascript Objects

      //background task - after receiving data from URL, convert the response into JSON
      const responseJSON = await response.json();
      console.log(`responseJSON : ${responseJSON}`);
      console.log(
        `JSON.stringify(responseJSON) : ${JSON.stringify(responseJSON)}`
      );

      //generate HTML showing all the information
      document.getElementById(
        "statusContainer"
      ).innerHTML = `<section id="statusCard">
           <h4 style="color: #8d4004; font-size: 23px; margin: 0; padding-bottom: 20px;"> Your Status </h4>
            <p>Order ID: <span>${responseJSON._id}</span></p>
            <p>Status: <span>${getReadableOrderStatus(
              responseJSON.status
            )}</span></p>
          </section>`;
    } else {
      document.getElementById(
        "errMsgCheckStatus"
      ).innerHTML = `<p>Error: Enter order id</p>`;
    }
  } catch (err) {
    console.log(`Unable to get the data from API due to error : ${err}`);
    document.getElementById(
      "statusContainer"
    ).innerHTML = `<section id="statusCard">
          <p style="color: red">Could not find specified order: ${orderIdFromUI}</p>
        </section>`;
  }
};

// creating function for getting readable order status since there are only numbers in db
const getReadableOrderStatus = (status) => {
  console.log(`${status}`);

  if (status === 0) {
    return "RECEIVED";
  } else if (status === 1) {
    return "READY FOR DELIVERY";
  } else if (status === 2) {
    return "IN TRANSIT";
  } else if (status === 3) {
    return "DELIVERED";
  } else {
    return "";
  }
};

document.getElementById("btn-check").addEventListener("click", getDataFromAPI);
