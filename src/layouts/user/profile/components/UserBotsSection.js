import { useEffect, useState } from "react";
import axios from "axios";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { Card, CardContent } from "@mui/material";

function UserBotsSection() {
  const [bots, setBots] = useState([]);

  useEffect(() => {
    const fetchBots = async () => {
      try {
        const res = await axios.get("http://localhost:5006/api/Users/me", {
          withCredentials: true, // si usas cookies/jwt
        });
        console.log("API Response for /api/Users/me:", res.data); // Add this line
        setBots(res.data.bots || []); // Extract bots from response
      } catch (err) {
        console.error("Error cargando bots:", err);
      }
    };

    fetchBots();
  }, []);

  return (
    <SoftBox mt={4}>
      <SoftTypography variant="h5" fontWeight="bold" mb={2}>
        Mis Bots
      </SoftTypography>

      {bots.length === 0 ? (
        <SoftTypography>No tienes bots asociados.</SoftTypography>
      ) : (
        <SoftBox display="grid" gridTemplateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={2}>
          {bots.map((bot) => (
            <Card key={bot.id}>
              <CardContent>
                <SoftTypography variant="h6">{bot.name}</SoftTypography>
                <SoftTypography variant="body2" color="text">
                  {bot.description || "Sin descripción"}
                </SoftTypography>
              </CardContent>
            </Card>
          ))}
        </SoftBox>
      )}
    </SoftBox>
  );
}

export default UserBotsSection;
