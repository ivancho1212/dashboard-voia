import { forwardRef } from "react";

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// Custom styles for SoftInput
import SoftInputRoot from "components/SoftInput/SoftInputRoot";
import SoftInputWithIconRoot from "components/SoftInput/SoftInputWithIconRoot";
import SoftInputIconBoxRoot from "components/SoftInput/SoftInputIconBoxRoot";
import SoftInputIconRoot from "components/SoftInput/SoftInputIconRoot";

// Soft UI Dashboard React contexts
import { useSoftUIController } from "context";

// Soft UI Dashboard React components
import SoftTypography from "components/SoftTypography"; // <--- Import SoftTypography

const SoftInput = forwardRef((props, ref) => {
  const {
    size = "medium",
    icon = { component: false, direction: "none" },
    error = false,
    success = false,
    disabled = false,
    helperText, // <--- Extract helperText here
    ...rest
  } = props;

  const [controller] = useSoftUIController();
  const { direction } = controller;
  const iconDirection = icon?.direction || "none";

  let template;

  if (icon?.component && icon?.direction === "left") {
    template = (
      <SoftInputWithIconRoot ref={ref} ownerState={{ error, success, disabled }}>
        <SoftInputIconBoxRoot ownerState={{ size }}>
          <SoftInputIconRoot fontSize="small" ownerState={{ size }}>
            {icon.component}
          </SoftInputIconRoot>
        </SoftInputIconBoxRoot>
        <SoftInputRoot
          {...rest}
          ownerState={{ size, error, success, iconDirection, direction, disabled }}
        />
        {helperText && ( // <--- Render helperText here
          <SoftTypography variant="caption" color={error ? "error" : "text"} mt={0.5}>
            {helperText}
          </SoftTypography>
        )}
      </SoftInputWithIconRoot>
    );
  } else if (icon?.component && icon?.direction === "right") {
    template = (
      <SoftInputWithIconRoot ref={ref} ownerState={{ error, success, disabled }}>
        <SoftInputRoot
          {...rest}
          ownerState={{ size, error, success, iconDirection, direction, disabled }}
        />
        <SoftInputIconBoxRoot ownerState={{ size }}>
          <SoftInputIconRoot fontSize="small" ownerState={{ size }}>
            {icon.component}
          </SoftInputIconRoot>
        </SoftInputIconBoxRoot>
        {helperText && ( // <--- Render helperText here
          <SoftTypography variant="caption" color={error ? "error" : "text"} mt={0.5}>
            {helperText}
          </SoftTypography>
        )}
      </SoftInputWithIconRoot>
    );
  } else {
    template = (
      <> {/* Use a fragment to wrap the input and helper text */}
        <SoftInputRoot {...rest} ref={ref} ownerState={{ size, error, success, disabled }} />
        {helperText && ( // <--- Render helperText here
          <SoftTypography variant="caption" color={error ? "error" : "text"} mt={0.5}>
            {helperText}
          </SoftTypography>
        )}
      </>
    );
  }

  return template;
});


// Setting default values for the props of SoftInput
SoftInput.defaultProps = {
  size: "medium",
  icon: {
    component: false,
    direction: "none",
  },
  error: false,
  success: false,
  disabled: false,
  helperText: "", // <--- Add default value for helperText
};

// Typechecking props for the SoftInput
SoftInput.propTypes = {
  size: PropTypes.oneOf(["small", "medium", "large"]),
  icon: PropTypes.shape({
    component: PropTypes.oneOfType([PropTypes.node, PropTypes.bool]),
    direction: PropTypes.oneOf(["none", "left", "right"]),
  }),
  error: PropTypes.bool,
  success: PropTypes.bool,
  disabled: PropTypes.bool,
  helperText: PropTypes.string, // <--- Add helperText propType
};

export default SoftInput;