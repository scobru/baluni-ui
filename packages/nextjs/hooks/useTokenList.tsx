import { useEffect, useState } from "react";
import fetch from "node-fetch";

//import { TOKENS_URL } from "baluni-api";
const TOKENS_URL = "https://tokens.uniswap.org";

const useTokenList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(TOKENS_URL);
        const data = await response.json();

        const filteredTokens = data.tokens.filter((token: { chainId: number }) => token.chainId === 137);
        setTokens(filteredTokens);
        setLoading(false);
      } catch (err) {
        setError(String(err));
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  return { loading, error, tokens };
};

export default useTokenList;
