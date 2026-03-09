
import SoftBox from "components/SoftBox";

function Footer() {
  return (
    <SoftBox
      width="100%"
      display="flex"
      justifyContent="flex-end"
      alignItems="center"
      px={1.5}
      py={1}
      sx={{ fontSize: "11px", color: "#8c8c8c", gap: "4px" }}
    >
      © {new Date().getFullYear()}{" "}
      <strong style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <img
          src="/VIA.png"
          alt="Logo VIA"
          style={{ width: "20px", height: "20px", objectFit: "contain" }}
        />
      </strong>
      . Todos los derechos reservados.
    </SoftBox>
  );
}

export default Footer;
