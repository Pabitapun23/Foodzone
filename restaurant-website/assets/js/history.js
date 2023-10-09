const PORT = 8882;

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

    let deliveredList = document.getElementById("deliveredList");
    deliveredList.innerHTML = ``;
    orders = responseJSON.delivered;

    if (orders.length === 0) {
      deliveredList.innerHTML += `<h3>NO RECORD</h3>`;
    } else {
      for (order of orders) {
        deliveredList.innerHTML += `
        <div class="order-card">
          <a href="/orders/${order._id}">
            <h3>Order #${order._id}</h3>
            <p>${order.customer}</p>
            <p>${order.timestamp}</p>
          </a>
        </div>
        <hr />`;
      }
    }
  } catch (err) {
    console.log(err);
  }
};

const getCustomers = () => {
  let customerName = document.getElementById("customerName").value;

  getAPI("GET", `http://localhost:${PORT}/customers/desc/${customerName}`);
};

document
  .getElementById("searchCustomer")
  .addEventListener("click", getCustomers);
