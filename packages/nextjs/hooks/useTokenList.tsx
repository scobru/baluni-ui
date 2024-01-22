import { useEffect, useState } from "react";
import fetch from "node-fetch";

const TOKENS_URL = "https://gateway.ipfs.io/ipns/tokens.uniswap.org";

const useTokenList = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(TOKENS_URL);
        const data = await response.json();

        const filteredTokens = data.tokens.filter(token => token.chainId === 137);
        setTokens(filteredTokens);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  return { loading, error, tokens };
};

export default useTokenList;
