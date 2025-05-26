import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Grid from "@mui/material/Grid";
import BotCard from "./BotCard";

function BotList({ bots, onViewBot, onEditBot, onCreateBot }) {
  return (
    <SoftBox>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <SoftTypography variant="h5">Lista de Bots</SoftTypography>
      </SoftBox>
      <Grid container spacing={2}>
        {bots.map((bot) => (
          <Grid item xs={12} md={6} lg={4} key={bot.id}>
            <BotCard bot={bot} onView={onViewBot} onEdit={onEditBot} />
          </Grid>
        ))}
      </Grid>
    </SoftBox>
  );
}

BotList.propTypes = {
  bots: PropTypes.array.isRequired,
  onViewBot: PropTypes.func.isRequired,
  onEditBot: PropTypes.func.isRequired,
  onCreateBot: PropTypes.func.isRequired,
};

export default BotList;
