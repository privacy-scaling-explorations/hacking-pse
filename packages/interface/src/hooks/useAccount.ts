import { useState, useEffect } from "react";

export function useAccount() {
  const [accountExists, setAccountExists] = useState(false);

  useEffect(() => {
    const privateKey = localStorage.getItem("ecdsaPrivKey");
    const account = localStorage.getItem("accountAddress");

    if (privateKey && account) {
      setAccountExists(true);
    }
  }, []);

  return accountExists;
}
