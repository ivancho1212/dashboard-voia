// BotTable.js (versión opcional si deseas tabla en lugar de tarjetas)
import React from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function BotTable({ bots = [] }) {
  return (
    <SoftBox>
      <table width="100%">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {bots.map((bot, idx) => (
            <tr key={idx}>
              <td>{bot.name}</td>
              <td>{bot.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SoftBox>
  );
}

export default BotTable;