import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";

const TagChip = ({ tag, index, isExpanded, onToggle }) => {
    const [expandDirection, setExpandDirection] = useState("down");
    const tagRef = useRef();

    if (!tag?.label) return null;

    const handleClick = () => {
        onToggle(index);
    };

    useEffect(() => {
        if (tagRef.current) {
            const rect = tagRef.current.getBoundingClientRect();
            setExpandDirection(rect.top < 100 ? "down" : "up");
        }
    }, [isExpanded]);

    return (
        <Box
            ref={tagRef}
            onClick={handleClick}
            sx={{
                cursor: "pointer",
                marginRight: 1,
                marginBottom: 1,
            }}
        >
            <Box
                sx={{
                    bgcolor: "rgb(252, 166, 55)",
                    color: "white !important",
                    px: 0.5,
                    py: 0.5,
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    boxShadow: "-4px 6px 16px rgba(0, 0, 0, 0.15)",
                    clipPath: "polygon(0% 0%, 0% 90px, 50% 100%, 100% 90px, 100% 0%)",
                    width: isExpanded ? 130 : 32,
                    minHeight: 100,
                    transition: "all 0.3s ease",
                    borderTopRightRadius: 5,
                    borderTopLeftRadius: 5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                    marginTop: 8,
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "-4px 10px 20px rgba(0, 0, 0, 0.2)",
                    },
                }}
            >
                {!isExpanded && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%) rotate(-90deg)",
                            transformOrigin: "center",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "90px",
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: "bold",
                                fontSize: "0.8rem",
                                color: "white",
                                px: 1,
                                py: 0,
                                textTransform: "uppercase",
                            }}
                        >
                            {tag.label}
                        </Typography>
                    </Box>
                )}

                {isExpanded && (
                    <Box
                        sx={{
                            px: 0.5,
                            py: 0.5,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            textAlign: "center",
                            height: "100%",
                            width: "100%",
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                whiteSpace: "normal",
                                wordWrap: "break-word",
                                lineHeight: 1.2,
                                fontSize: "0.7rem",
                                fontWeight: 500,
                                textTransform: "uppercase",
                            }}
                        >
                            {tag.label}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

TagChip.propTypes = {
    tag: PropTypes.shape({
        label: PropTypes.string.isRequired,
    }).isRequired,
    index: PropTypes.number.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
};

export default TagChip;
