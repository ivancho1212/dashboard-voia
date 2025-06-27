// src/layouts/bot/preview/index.js
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
import MyBotCard from "../components/MyBotCard";

function BotPreview({ templates, onSelectTemplate }) {
  return (
    <Grid container spacing={2}>
      {templates.map((template) => (
        <Grid item xs={12} sm={6} md={4} key={template.id}>
          <MyBotCard 
            template={template} 
            onSelectTemplate={onSelectTemplate} 
          />
        </Grid>
      ))}
    </Grid>
  );
}

BotPreview.propTypes = {
  templates: PropTypes.array.isRequired,
  onSelectTemplate: PropTypes.func.isRequired,
};

export default BotPreview;
