fetch("https://access-control-001-default-rtdb.firebaseio.com/users.json")
  .then(res => res.json())
  .then(data => {
    console.log("Got data length:", data ? Object.keys(data).length : 0);
  })
  .catch(err => {
    console.error("Fetch failed", err);
  });
