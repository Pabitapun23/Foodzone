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

    console.log(responseJSON);
  } catch (err) {
    console.log(err);
  }
};

const getCustomers = () => {
  let customerName = document.getElementById("customerName").value;
  console.log(customerName);

  if (customerName !== "") {
    getAPI("GET", `http://localhost:${PORT}/customers/${customerName}`);
  } else {
    getAPI("GET", `http://localhost:${PORT}/customers`);
  }
};

document.getElementById("search").addEventListener("click", getCustomers);
