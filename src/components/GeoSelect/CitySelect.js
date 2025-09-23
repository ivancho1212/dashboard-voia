import React from "react";
import PropTypes from "prop-types";
import Select from "react-select";
import { City } from "country-state-city";

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: "42px",
    borderRadius: "8px",
    borderColor: "#d2d6da",
    fontSize: "0.875rem",
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    boxShadow: "none",
    "&:hover": { borderColor: "#344767" },
  }),
  valueContainer: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    padding: "0 6px",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    fontSize: "0.875rem",
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.875rem",
    backgroundColor: state.isSelected
      ? "#344767"
      : state.isFocused
      ? "#f0f2f5"
      : "#fff",
    color: state.isSelected ? "#fff" : "#495057",
  }),
  singleValue: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "#9e9e9e",
  }),
  input: (provided) => ({
    ...provided,
    fontSize: "0.875rem",
  }),
};

export default function CitySelect({ countryCode, value, onChange }) {
  if (!countryCode) return null; // 👈 ya no muestra texto

  const cities = City.getCitiesOfCountry(countryCode).map((c) => ({
    value: c.name,
    label: c.name,
  }));

  return (
    <Select
      styles={customSelectStyles}
      options={cities}
      value={cities.find((c) => c.value === value)}
      onChange={(val) => onChange(val.value)}
      placeholder="Selecciona una ciudad"
    />
  );
}

CitySelect.propTypes = {
  countryCode: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
