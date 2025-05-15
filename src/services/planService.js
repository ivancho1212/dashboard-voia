import axios from "axios";

export const getMyPlan = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get("http://localhost:5006/api/plans/my-plan", {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
  return response.data;
};
