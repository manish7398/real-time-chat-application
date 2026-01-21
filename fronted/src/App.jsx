import { useEffect, useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");

    if (storedToken) {
      setToken(storedToken);
    }

    setLoading(false);
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return token ? (
    <Dashboard setToken={setToken} />
  ) : (
    <Login setToken={setToken} />
  );
}

export default App;
