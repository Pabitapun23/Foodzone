const PORT = 8882;

const buildOrderCards = (orders) => {
  let data = ``;

  if (orders.length === 0) {
    data += `<h3>NO RECORD</h3>`;
  } else {
    for (order of orders) {
      data += `
    <div class="order-card">
      <a href="/orders/${order._id}">
        <h3>${order.customer}</h3>
        <p>Order #${order._id}</p>
        <p>${order.timestamp}</p>
        <ul>`;

      for (item of order.items) {
        data += `
          <li>
            <h4>${item.quantity}</h4>
            <p>&nbsp;x ${item.item.name}</p>
            </p>
          </li>`;
      }

      data += `
        </ul>
      </a>
    </div>
    <hr />`;
    }
  }

  return data;
};

const getAPI = async (method, url) => {
  try {
    const response = await fetch(url, {
      method: method,
      headers: { "Content-type": "application/json" },
    });

    if (response.ok === false) {
      throw Error(`${response.status} - cannot connect to API`);
    }

    const responseJSON = await response.json();

    let receivedList = document.getElementById("receivedList");
    let readyForDeliveryList = document.getElementById("readyForDeliveryList");
    let inTransitList = document.getElementById("inTransitList");

    receivedList.innerHTML =
      `<h2 class="black-white">RECEIVED</h2>` +
      buildOrderCards(responseJSON.received);
    readyForDeliveryList.innerHTML =
      `<h2 class="white-black">READY FOR DELIVERY</h2>` +
      buildOrderCards(responseJSON.readyForDelivery);
    inTransitList.innerHTML =
      `<h2 class="orange-white">IN TRANSIT</h2>` +
      buildOrderCards(responseJSON.inTransit);
  } catch (err) {
    console.log(err);
  }
};

const getCustomers = () => {
  let customerName = document.getElementById("customerName").value;

  getAPI("GET", `http://localhost:${PORT}/customers/asc/${customerName}`);
};

document
  .getElementById("searchCustomer")
  .addEventListener("click", getCustomers);
