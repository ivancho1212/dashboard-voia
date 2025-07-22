import React from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";

const TagChip = ({ tag }) => {
    if (!tag?.label) return null;

    return (
        <Box
            sx={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translate(-50%, -50%) rotate(-90deg)",
                transformOrigin: "left top",
                bgcolor: "#1976d2",
                color: "white",
                px: 2,
                py: 0.5,
                borderRadius: "4px 4px 0 0",
                fontSize: "0.75rem",
                zIndex: 10,
                whiteSpace: "nowrap",
                boxShadow: 1,
            }}
        >
            <Typography variant="caption" fontWeight="bold">
                {tag.label}
            </Typography>
        </Box>
    );
};

// ✅ Validación de props
TagChip.propTypes = {
    tag: PropTypes.shape({
        label: PropTypes.string.isRequired,
    }).isRequired,
};

export default TagChip;
