import React from "react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Text,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

const CustomSelect = ({
  name,
  value,
  placeholder,
  options,
  onChange,
  getOptionLabel = (option) => option.name,
  getOptionValue = (option) => option.slug,
}) => {
  const selectedOption = options.find((opt) => getOptionValue(opt) === value);
  const selectedLabel = selectedOption
    ? getOptionLabel(selectedOption)
    : placeholder;

  const handleSelect = (optionValue) => {
    // Mimic the event object structure of a native select
    onChange({
      target: {
        name: name,
        value: optionValue,
      },
    });
  };

  return (
    <Menu autoSelect={false} matchWidth>
      <MenuButton
        as={Button}
        variant="outline"
        w="full"
        textAlign="left"
        fontWeight="normal"
        borderColor="brand.600"
        _hover={{ borderColor: "brand.400" }}
        _expanded={{ bg: "brand.800", borderColor: "brand.accent" }}
        rightIcon={<ChevronDownIcon />}
      >
        <Flex align="center">
          <Text
            isTruncated
            color={selectedOption ? "whiteAlpha.900" : "whiteAlpha.600"}
          >
            {selectedLabel}
          </Text>
        </Flex>
      </MenuButton>
      <MenuList
        bg="background.card"
        borderColor="brand.600"
        maxH="250px"
        overflowY="auto"
      >
        {/* Option to clear selection */}
        <MenuItem
          onClick={() => handleSelect("")}
          _hover={{ bg: "brand.700" }}
          color="whiteAlpha.700"
          fontStyle="italic"
        >
          {placeholder}
        </MenuItem>
        {options.map((option) => (
          <MenuItem
            key={getOptionValue(option)}
            onClick={() => handleSelect(getOptionValue(option))}
            bg={getOptionValue(option) === value ? "brand.700" : "transparent"}
            _hover={{ bg: "brand.800" }}
          >
            {getOptionLabel(option)}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default CustomSelect;
