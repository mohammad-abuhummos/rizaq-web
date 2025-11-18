import { useState } from "react";
import * as transportService from "../services/transportService";

export const useTransport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchData = async (fn: () => Promise<any>) => {
    setLoading(true);
    try {
      const res = await fn();
      setData(res);
    } catch (err) {
      console.error("Transport Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, data, fetchData };
};
