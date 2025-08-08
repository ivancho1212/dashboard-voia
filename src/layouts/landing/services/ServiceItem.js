import React from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const ServiceItem = ({ title, description, image, reverse }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      style={{
        display: "flex",
        flexDirection: reverse ? "row-reverse" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "4rem auto",
        maxWidth: "1200px",
        padding: "0 1.5rem",
        gap: "2rem",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>{title}</h2>
        <p style={{ fontSize: "1.1rem", lineHeight: "1.6", color: "#444" }}>{description}</p>
      </div>
      <div style={{ flex: 1 }}>
        <img
          src={image}
          alt={title}
          style={{
            width: "100%",
            maxWidth: "500px",
            borderRadius: "12px",
            boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
          }}
        />
      </div>
    </motion.div>
  );
};

ServiceItem.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  reverse: PropTypes.bool,
};

export default ServiceItem;
