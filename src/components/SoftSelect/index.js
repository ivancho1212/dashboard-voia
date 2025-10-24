import { forwardRef } from "react";
import PropTypes from "prop-types";
import SoftSelectRoot from "./SoftSelectRoot";

const SoftSelect = forwardRef(({ color = "dark", variant = "outlined", children, ...rest }, ref) => {
  return (
    <SoftSelectRoot
      {...rest}
      ref={ref}
      ownerState={{ color, variant }}
    >
      {children}
    </SoftSelectRoot>
  );
});

// Note: defaults handled via parameter defaults above to avoid defaultProps on forwardRef

SoftSelect.propTypes = {
  color: PropTypes.oneOf([
    "inherit",
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
    "text",
    "white",
  ]),
  variant: PropTypes.oneOf(["outlined", "filled", "standard"]),
  children: PropTypes.node.isRequired,
};

export default SoftSelect;
