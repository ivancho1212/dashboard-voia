import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Select from "react-select";
import countryList from "react-select-country-list";
import Flag from "react-country-flag";

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

export default function CountrySelect({ value, onChange }) {
  const options = useMemo(
    () =>
      countryList().getData().map((c) => ({
        value: c.value,
        label: (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Flag countryCode={c.value} svg style={{ width: 20, marginRight: 8 }} />
            {c.label}
          </div>
        ),
        rawLabel: c.label,
      })),
    []
  );

  return (
    <Select
      styles={customSelectStyles}
      options={options}
      value={options.find((opt) => opt.value === value)}
      onChange={(val) => onChange(val.value, val.rawLabel)}
      placeholder="Selecciona un país"
    />
  );
}

CountrySelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
