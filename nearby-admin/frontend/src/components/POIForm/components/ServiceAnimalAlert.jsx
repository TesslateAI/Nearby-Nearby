import React from 'react';
import { Alert, Text } from '@mantine/core';

export default function ServiceAnimalAlert() {
  return (
    <Alert variant="light" color="blue" title="Service Animals">
      <Text size="sm">
        Service animals are welcome as required by law. If your location has any physical
        limitations or special considerations that may affect service animal access, such as
        stairs, narrow pathways, or terrain challenges, please note them here so visitors can
        plan accordingly. Under the ADA, a service animal is generally a dog that is individually
        trained to do work or perform tasks for a person with a disability. In some cases,
        miniature horses must also be reasonably accommodated under separate ADA rules. Some
        state or local laws may provide broader protections, so please check your applicable laws.
      </Text>
    </Alert>
  );
}

export { ServiceAnimalAlert };
